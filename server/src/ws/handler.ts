import type { WebSocket } from 'ws';
import {
  isClientMessage,
  MAX_PARTICIPANTS,
  type ClientMessage,
  type ErrorCode,
} from '@focussync/shared';
import type { Room } from '../rooms/Room';
import { isValidRoomCode } from '../rooms/roomCode';
import { roomStore } from '../rooms/roomStore';
import { pauseRoom, skipRoom, startRoom } from '../timer/timerEngine';
import { broadcastRoomState, broadcastSessionSummary, closeRoomSockets, sendMessage } from './broadcast';

type SocketMeta = {
  roomCode: string | null;
  participantId: string | null;
};

const socketMeta = new WeakMap<WebSocket, SocketMeta>();

function getMeta(socket: WebSocket): SocketMeta {
  const existing = socketMeta.get(socket);
  if (existing) {
    return existing;
  }

  const meta: SocketMeta = {
    roomCode: null,
    participantId: null,
  };
  socketMeta.set(socket, meta);
  return meta;
}

function sendError(socket: WebSocket, code: ErrorCode, message: string): void {
  sendMessage(socket, { type: 'error', code, message });
}

function attachToRoom(socket: WebSocket, room: Room, participantId: string): void {
  const meta = getMeta(socket);
  meta.roomCode = room.code;
  meta.participantId = participantId;
}

function detachSocket(socket: WebSocket): { room: Room; participantId: string } | null {
  const meta = getMeta(socket);
  if (!meta.roomCode || !meta.participantId) {
    return null;
  }

  const room = roomStore.getRoom(meta.roomCode);
  if (!room) {
    meta.roomCode = null;
    meta.participantId = null;
    return null;
  }

  const participantId = meta.participantId;
  meta.roomCode = null;
  meta.participantId = null;
  return { room, participantId };
}

function validateName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= 24;
}

function handleJoinRoom(socket: WebSocket, message: ClientMessage & { type: 'join_room' }): void {
  const name = message.name.trim();

  if (!validateName(name)) {
    sendError(socket, 'name_invalid', 'Name must be between 1 and 24 characters.');
    return;
  }

  if (message.intent === 'create') {
    if (message.participantId && message.code) {
      const existingRoom = roomStore.getRoom(message.code);
      if (existingRoom && existingRoom.hasParticipant(message.participantId)) {
        if (!existingRoom.reconnectParticipant(socket, message.participantId)) {
          sendError(socket, 'room_not_found', 'Unable to reconnect to room.');
          return;
        }
        attachToRoom(socket, existingRoom, message.participantId);
        broadcastRoomState(existingRoom);
        return;
      }
    }

    const room = roomStore.createRoom(name, socket);
    const hostId = room.getHostId();
    attachToRoom(socket, room, hostId);
    broadcastRoomState(room);
    return;
  }

  const code = message.code?.toUpperCase();
  if (!code || !isValidRoomCode(code)) {
    sendError(socket, 'invalid_code', 'Room code must be 6 characters.');
    return;
  }

  const room = roomStore.getRoom(code);
  if (!room) {
    sendError(socket, 'room_not_found', 'Room not found.');
    return;
  }

  if (room.isGraceExpired()) {
    roomStore.deleteRoom(room.code);
    sendError(socket, 'room_expired', 'This room has expired.');
    return;
  }

  if (message.participantId && room.hasParticipant(message.participantId)) {
    if (!room.reconnectParticipant(socket, message.participantId)) {
      sendError(socket, 'room_not_found', 'Unable to reconnect to room.');
      return;
    }
    attachToRoom(socket, room, message.participantId);
    broadcastRoomState(room);
    return;
  }

  if (!roomStore.canJoin(room)) {
    sendError(socket, 'room_full', `Room is full (max ${MAX_PARTICIPANTS} participants).`);
    return;
  }

  const participantId = roomStore.createParticipantId();
  room.addParticipant(socket, name, participantId, false);
  attachToRoom(socket, room, participantId);
  broadcastRoomState(room);
}

function handleHostControl(
  socket: WebSocket,
  message: ClientMessage & { type: 'host_control' },
): void {
  const meta = getMeta(socket);
  if (!meta.roomCode || !meta.participantId) {
    sendError(socket, 'invalid_message', 'Join a room before sending controls.');
    return;
  }

  const room = roomStore.getRoom(meta.roomCode);
  if (!room) {
    sendError(socket, 'room_not_found', 'Room not found.');
    return;
  }

  if (!room.isHost(meta.participantId)) {
    sendError(socket, 'not_host', 'Only the host can control the timer.');
    return;
  }

  if (!room.isHostPresent()) {
    sendError(socket, 'host_absent', 'Host is disconnected. Controls resume when host returns.');
    return;
  }

  switch (message.action) {
    case 'start':
      startRoom(room);
      break;
    case 'pause':
      pauseRoom(room);
      break;
    case 'skip': {
      const focusDurationMs = skipRoom(room);
      if (focusDurationMs !== false) {
        broadcastSessionSummary(room, {
          durationMs: focusDurationMs,
          participantCount: room.getParticipantCount(),
        });
      }
      break;
    }
    default:
      sendError(socket, 'invalid_message', 'Unknown host control action.');
      return;
  }

  broadcastRoomState(room);
}

export function handleSocketMessage(socket: WebSocket, raw: string): void {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    sendError(socket, 'invalid_message', 'Invalid JSON message.');
    return;
  }

  if (!isClientMessage(parsed)) {
    sendError(socket, 'invalid_message', 'Unrecognized message format.');
    return;
  }

  switch (parsed.type) {
    case 'join_room':
      handleJoinRoom(socket, parsed);
      break;
    case 'host_control':
      handleHostControl(socket, parsed);
      break;
    default:
      sendError(socket, 'invalid_message', 'Unsupported message type.');
  }
}

export function handleSocketClose(socket: WebSocket): void {
  const detached = detachSocket(socket);
  if (!detached) {
    return;
  }

  const { room, participantId } = detached;
  room.removeParticipant(participantId);

  if (room.getParticipantCount() === 0) {
    roomStore.deleteRoom(room.code);
    return;
  }

  broadcastRoomState(room);
}

export function expireRooms(): void {
  const expiredRooms = roomStore.cleanupExpiredRooms();
  for (const room of expiredRooms) {
    closeRoomSockets(room, 'Room expired after host disconnect.');
  }
}
