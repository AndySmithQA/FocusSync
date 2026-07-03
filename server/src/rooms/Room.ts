import { randomUUID } from 'crypto';
import type { WebSocket } from 'ws';
import {
  HOST_GRACE_MS,
  type Participant,
  type Phase,
  type RoomSnapshot,
  type RoomStatus,
} from '@focussync/shared';

type SocketRef = {
  socket: WebSocket;
  participantId: string;
};

export class Room {
  readonly code: string;
  phase: Phase = 'focus';
  status: RoomStatus = 'idle';
  endsAt: number | null = null;
  pausedRemainingMs: number | null = null;

  private readonly hostId: string;
  private hostPresent = true;
  private hostGraceEndsAt: number | null = null;
  private readonly sockets = new Map<string, SocketRef>();
  private readonly participants = new Map<string, Participant>();

  constructor(code: string, hostName: string, hostSocket: WebSocket) {
    this.code = code;
    this.hostId = randomUUID();
    this.addParticipant(hostSocket, hostName, this.hostId, true);
  }

  getHostId(): string {
    return this.hostId;
  }

  isHost(participantId: string): boolean {
    return participantId === this.hostId;
  }

  isHostPresent(): boolean {
    return this.hostPresent;
  }

  getHostGraceEndsAt(): number | null {
    return this.hostGraceEndsAt;
  }

  getParticipantCount(): number {
    return this.participants.size;
  }

  getSockets(): WebSocket[] {
    return [...this.sockets.values()].map((entry) => entry.socket);
  }

  getParticipantIdForSocket(socket: WebSocket): string | null {
    for (const entry of this.sockets.values()) {
      if (entry.socket === socket) {
        return entry.participantId;
      }
    }
    return null;
  }

  hasParticipant(participantId: string): boolean {
    return this.participants.has(participantId);
  }

  addParticipant(
    socket: WebSocket,
    name: string,
    participantId: string,
    isHost = false,
  ): Participant {
    const participant: Participant = {
      id: participantId,
      name,
      isHost,
    };

    this.participants.set(participantId, participant);
    this.sockets.set(participantId, { socket, participantId });
    return participant;
  }

  reconnectParticipant(socket: WebSocket, participantId: string): boolean {
    const participant = this.participants.get(participantId);
    if (!participant) {
      return false;
    }

    this.sockets.set(participantId, { socket, participantId });

    if (participantId === this.hostId) {
      this.markHostReconnected();
    }

    return true;
  }

  removeParticipant(participantId: string): Participant | null {
    const participant = this.participants.get(participantId) ?? null;
    this.sockets.delete(participantId);

    if (participant) {
      this.participants.delete(participantId);

      if (participantId === this.hostId) {
        this.markHostDisconnected();
      }
    }

    return participant;
  }

  markHostDisconnected(): void {
    if (!this.hostPresent) {
      return;
    }

    this.hostPresent = false;
    this.hostGraceEndsAt = Date.now() + HOST_GRACE_MS;
  }

  markHostReconnected(): void {
    this.hostPresent = true;
    this.hostGraceEndsAt = null;
  }

  isGraceExpired(): boolean {
    if (this.hostPresent || this.hostGraceEndsAt === null) {
      return false;
    }

    return Date.now() >= this.hostGraceEndsAt;
  }

  toSnapshot(): RoomSnapshot {
    return {
      code: this.code,
      phase: this.phase,
      status: this.status,
      endsAt: this.endsAt,
      serverTime: Date.now(),
      hostId: this.hostId,
      hostPresent: this.hostPresent,
      hostGraceEndsAt: this.hostGraceEndsAt,
      participants: [...this.participants.values()].sort((a, b) => {
        if (a.isHost) return -1;
        if (b.isHost) return 1;
        return a.name.localeCompare(b.name);
      }),
    };
  }
}
