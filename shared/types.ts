export const FOCUS_MS = 25 * 60 * 1000;
export const BREAK_MS = 5 * 60 * 1000;
export const HOST_GRACE_MS = 10 * 60 * 1000;
export const ROOM_CODE_LENGTH = 6;
export const MAX_PARTICIPANTS = 20;

export type Phase = 'focus' | 'break';
export type RoomStatus = 'idle' | 'running' | 'paused';

export type Participant = {
  id: string;
  name: string;
  isHost: boolean;
};

export type RoomSnapshot = {
  code: string;
  phase: Phase;
  status: RoomStatus;
  endsAt: number | null;
  serverTime: number;
  hostId: string;
  hostPresent: boolean;
  hostGraceEndsAt: number | null;
  participants: Participant[];
};

export type JoinRoomMessage = {
  type: 'join_room';
  intent: 'create' | 'join';
  name: string;
  code?: string;
  participantId?: string;
};

export type HostControlMessage = {
  type: 'host_control';
  action: 'start' | 'pause' | 'skip' | 'reset';
};

export type LeaveRoomMessage = {
  type: 'leave_room';
};

export type ClientMessage = JoinRoomMessage | HostControlMessage | LeaveRoomMessage;

export type RoomStateMessage = {
  type: 'room_state';
  room: RoomSnapshot;
};

export type TimerTickMessage = {
  type: 'timer_tick';
  serverTime: number;
  phase: Phase;
  status: RoomStatus;
  endsAt: number | null;
};

export type ErrorCode =
  | 'invalid_message'
  | 'invalid_code'
  | 'room_not_found'
  | 'room_full'
  | 'not_host'
  | 'host_absent'
  | 'room_expired'
  | 'name_invalid';

export type ErrorMessage = {
  type: 'error';
  code: ErrorCode;
  message: string;
};

export type SessionSummaryMessage = {
  type: 'session_summary';
  durationMs: number;
  participantCount: number;
};

export type ServerMessage =
  | RoomStateMessage
  | TimerTickMessage
  | SessionSummaryMessage
  | ErrorMessage;

export type SessionContext = {
  code: string;
  name: string;
  participantId: string;
  isHost: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isClientMessage(value: unknown): value is ClientMessage {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return false;
  }

  if (value.type === 'join_room') {
    return (
      (value.intent === 'create' || value.intent === 'join') &&
      typeof value.name === 'string' &&
      (value.code === undefined || typeof value.code === 'string') &&
      (value.participantId === undefined || typeof value.participantId === 'string')
    );
  }

  if (value.type === 'host_control') {
    return value.action === 'start' || value.action === 'pause' || value.action === 'skip' || value.action === 'reset';
  }

  if (value.type === 'leave_room') {
    return true;
  }

  return false;
}

export function isServerMessage(value: unknown): value is ServerMessage {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return false;
  }

  if (value.type === 'room_state') {
    return isRecord(value.room) && typeof value.room.code === 'string';
  }

  if (value.type === 'timer_tick') {
    return (
      typeof value.serverTime === 'number' &&
      (value.phase === 'focus' || value.phase === 'break') &&
      (value.status === 'idle' || value.status === 'running' || value.status === 'paused') &&
      (value.endsAt === null || typeof value.endsAt === 'number')
    );
  }

  if (value.type === 'session_summary') {
    return (
      typeof value.durationMs === 'number' &&
      typeof value.participantCount === 'number'
    );
  }

  if (value.type === 'error') {
    return typeof value.code === 'string' && typeof value.message === 'string';
  }

  return false;
}
