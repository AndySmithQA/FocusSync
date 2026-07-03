import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BREAK_MS, FOCUS_MS } from '@focussync/shared';
import type { Room } from '../rooms/Room';
import { startRoom, tickRoom } from './timerEngine';

function createTestRoom(): Pick<Room, 'phase' | 'status' | 'endsAt' | 'pausedRemainingMs'> {
  return {
    phase: 'focus',
    status: 'idle',
    endsAt: null,
    pausedRemainingMs: null,
  };
}

describe('timerEngine', () => {
  it('transitions from focus to break idle when a focus block ends', () => {
    const room = createTestRoom();
    startRoom(room as Room);
    room.endsAt = Date.now() - 1;

    const result = tickRoom(room as Room);

    assert.deepEqual(result, { kind: 'focus_complete', durationMs: FOCUS_MS });
    assert.equal(room.phase, 'break');
    assert.equal(room.status, 'idle');
    assert.equal(room.endsAt, null);
    assert.equal(room.pausedRemainingMs, BREAK_MS);
  });
});
