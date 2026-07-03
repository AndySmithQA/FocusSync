import type { WebSocket } from 'ws';
import type { ServerMessage, SessionSummaryMessage } from '@focussync/shared';
import type { Room } from '../rooms/Room';

export function sendMessage(socket: WebSocket, message: ServerMessage): void {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

export function broadcastToRoom(room: Room, message: ServerMessage): void {
  for (const socket of room.getSockets()) {
    sendMessage(socket, message);
  }
}

export function broadcastRoomState(room: Room): void {
  broadcastToRoom(room, {
    type: 'room_state',
    room: room.toSnapshot(),
  });
}

export function broadcastSessionSummary(room: Room, summary: Omit<SessionSummaryMessage, 'type'>): void {
  broadcastToRoom(room, {
    type: 'session_summary',
    ...summary,
  });
}

export function closeRoomSockets(room: Room, reason: string): void {
  for (const socket of room.getSockets()) {
    sendMessage(socket, {
      type: 'error',
      code: 'room_expired',
      message: reason,
    });
    socket.close(1000, reason);
  }
}
