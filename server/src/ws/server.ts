import type { Server as HttpServer } from 'http';
import { WebSocketServer } from 'ws';
import { WS_PATH } from '../config';
import { roomStore } from '../rooms/roomStore';
import { tickRoom } from '../timer/timerEngine';
import { broadcastRoomState, broadcastSessionSummary, broadcastToRoom } from './broadcast';
import { expireRooms, handleSocketClose, handleSocketMessage } from './handler';

export function createWebSocketServer(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ server, path: WS_PATH });

  wss.on('connection', (socket) => {
    socket.on('message', (data) => {
      const raw = typeof data === 'string' ? data : data.toString('utf8');
      handleSocketMessage(socket, raw);
    });

    socket.on('close', () => {
      handleSocketClose(socket);
    });
  });

  setInterval(() => {
    expireRooms();

    for (const room of roomStore.getAllRooms()) {
      const tickResult = tickRoom(room);

      if (room.status === 'running') {
        broadcastToRoom(room, {
          type: 'timer_tick',
          serverTime: Date.now(),
          phase: room.phase,
          status: room.status,
          endsAt: room.endsAt,
        });
      }

      if (tickResult.kind === 'focus_complete') {
        broadcastSessionSummary(room, {
          durationMs: tickResult.durationMs,
          participantCount: room.getParticipantCount(),
        });
        broadcastRoomState(room);
      } else if (tickResult.kind === 'break_complete') {
        broadcastRoomState(room);
      }
    }
  }, 1000);

  setInterval(() => {
    expireRooms();
  }, 60_000);

  return wss;
}
