import { useEffect, useState } from 'react';
import type { RoomSnapshot } from '@focussync/shared';
import { formatMs } from '../lib/formatTime';

type TimerDisplay = {
  remainingMs: number;
  formatted: string;
  phase: RoomSnapshot['phase'];
  status: RoomSnapshot['status'];
};

export function useTimerDisplay(room: RoomSnapshot | null): TimerDisplay {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (!room) {
    return {
      remainingMs: 0,
      formatted: '25:00',
      phase: 'focus',
      status: 'idle',
    };
  }

  let remainingMs = 0;

  if (room.status === 'running' && room.endsAt !== null) {
    const skew = room.serverTime - Date.now();
    remainingMs = Math.max(0, room.endsAt - (now + skew));
  }

  return {
    remainingMs,
    formatted: room.status === 'idle' ? formatMs(room.phase === 'focus' ? 25 * 60 * 1000 : 5 * 60 * 1000) : formatMs(remainingMs),
    phase: room.phase,
    status: room.status,
  };
}
