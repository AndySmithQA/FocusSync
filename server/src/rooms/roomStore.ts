import { randomUUID } from 'crypto';
import type { WebSocket } from 'ws';
import { MAX_PARTICIPANTS } from '@focussync/shared';
import { Room } from './Room';
import { generateRoomCode } from './roomCode';

export class RoomStore {
  private readonly rooms = new Map<string, Room>();

  createRoom(hostName: string, hostSocket: WebSocket): Room {
    let code = generateRoomCode();
    let attempts = 0;

    while (this.rooms.has(code) && attempts < 20) {
      code = generateRoomCode();
      attempts += 1;
    }

    if (this.rooms.has(code)) {
      throw new Error('Failed to generate unique room code');
    }

    const room = new Room(code, hostName, hostSocket);
    this.rooms.set(code, room);
    return room;
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  deleteRoom(code: string): void {
    this.rooms.delete(code.toUpperCase());
  }

  getAllRooms(): Room[] {
    return [...this.rooms.values()];
  }

  createParticipantId(): string {
    return randomUUID();
  }

  canJoin(room: Room): boolean {
    return room.getParticipantCount() < MAX_PARTICIPANTS;
  }

  cleanupExpiredRooms(): Room[] {
    const expired: Room[] = [];

    for (const room of this.rooms.values()) {
      if (room.isGraceExpired()) {
        expired.push(room);
        this.deleteRoom(room.code);
      }
    }

    return expired;
  }
}

export const roomStore = new RoomStore();
