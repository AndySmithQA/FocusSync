import { useEffect, useState } from 'react';
import type { RoomSnapshot, ServerMessage } from '@focussync/shared';

export type RoomTerminalState = 'active' | 'expired';

type SessionSummaryData = {
  durationMs: number;
  participantCount: number;
};

type UseRoomStateResult = {
  room: RoomSnapshot | null;
  terminalState: RoomTerminalState;
  terminalMessage: string | null;
  sessionSummary: SessionSummaryData | null;
  dismissSessionSummary: () => void;
};

export function useRoomState(lastMessage: ServerMessage | null): UseRoomStateResult {
  const [room, setRoom] = useState<RoomSnapshot | null>(null);
  const [terminalState, setTerminalState] = useState<RoomTerminalState>('active');
  const [terminalMessage, setTerminalMessage] = useState<string | null>(null);
  const [sessionSummary, setSessionSummary] = useState<SessionSummaryData | null>(null);

  useEffect(() => {
    if (!lastMessage) {
      return;
    }

    if (lastMessage.type === 'error') {
      if (lastMessage.code === 'room_expired') {
        setTerminalState('expired');
        setTerminalMessage(lastMessage.message);
      }
      return;
    }

    if (lastMessage.type === 'room_state') {
      setRoom(lastMessage.room);
      return;
    }

    if (lastMessage.type === 'session_summary') {
      setSessionSummary({
        durationMs: lastMessage.durationMs,
        participantCount: lastMessage.participantCount,
      });
      return;
    }

    if (lastMessage.type === 'timer_tick') {
      setRoom((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          phase: lastMessage.phase,
          status: lastMessage.status,
          endsAt: lastMessage.endsAt,
          serverTime: lastMessage.serverTime,
        };
      });
    }
  }, [lastMessage]);

  const dismissSessionSummary = () => {
    setSessionSummary(null);
  };

  return {
    room,
    terminalState,
    terminalMessage,
    sessionSummary,
    dismissSessionSummary,
  };
}
