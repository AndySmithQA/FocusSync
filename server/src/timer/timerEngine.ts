import { BREAK_MS, FOCUS_MS } from '@focussync/shared';
import type { Room } from '../rooms/Room';

function durationForPhase(phase: Room['phase']): number {
  return phase === 'focus' ? FOCUS_MS : BREAK_MS;
}

function focusElapsedMs(room: Room): number {
  if (room.status === 'running' && room.endsAt !== null) {
    return FOCUS_MS - Math.max(0, room.endsAt - Date.now());
  }

  if (room.status === 'paused' && room.pausedRemainingMs !== null) {
    return FOCUS_MS - room.pausedRemainingMs;
  }

  return FOCUS_MS;
}

export function completeFocusBlock(room: Room): number {
  const durationMs = focusElapsedMs(room);
  room.phase = 'break';
  room.status = 'idle';
  room.endsAt = null;
  room.pausedRemainingMs = BREAK_MS;
  return durationMs;
}

export function startRoom(room: Room): void {
  const remaining = room.pausedRemainingMs ?? durationForPhase(room.phase);
  room.status = 'running';
  room.endsAt = Date.now() + remaining;
  room.pausedRemainingMs = null;
}

export function pauseRoom(room: Room): void {
  if (room.status !== 'running' || room.endsAt === null) {
    return;
  }

  room.pausedRemainingMs = Math.max(0, room.endsAt - Date.now());
  room.status = 'paused';
  room.endsAt = null;
}

export function skipRoom(room: Room): number | false {
  if (room.phase === 'focus') {
    return completeFocusBlock(room);
  }

  room.phase = 'focus';

  if (room.status === 'running') {
    room.endsAt = Date.now() + durationForPhase(room.phase);
    room.pausedRemainingMs = null;
    return false;
  }

  if (room.status === 'paused') {
    room.pausedRemainingMs = durationForPhase(room.phase);
  }

  return false;
}

export type TickResult =
  | { kind: 'none' }
  | { kind: 'focus_complete'; durationMs: number }
  | { kind: 'break_complete' };

export function tickRoom(room: Room): TickResult {
  if (room.status !== 'running' || room.endsAt === null) {
    return { kind: 'none' };
  }

  if (room.endsAt > Date.now()) {
    return { kind: 'none' };
  }

  if (room.phase === 'focus') {
    return { kind: 'focus_complete', durationMs: completeFocusBlock(room) };
  }

  room.phase = 'focus';
  room.endsAt = Date.now() + durationForPhase(room.phase);
  return { kind: 'break_complete' };
}
