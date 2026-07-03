import { useEffect, useState } from 'react';
import type { RoomSnapshot } from '@focussync/shared';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { HostControls } from '../components/HostControls';
import { ParticipantList } from '../components/ParticipantList';
import { RoomCodeBadge } from '../components/RoomCodeBadge';
import { SessionSummary } from '../components/SessionSummary';
import { Timer } from '../components/Timer';
import { useTimerDisplay } from '../hooks/useTimerDisplay';
import type { ConnectionStatus as WsConnectionStatus } from '../lib/wsClient';
import { formatMs } from '../lib/formatTime';

type RoomPageProps = {
  room: RoomSnapshot;
  participantId: string;
  connectionStatus: WsConnectionStatus;
  sessionSummary: { durationMs: number; participantCount: number } | null;
  onDismissSessionSummary: () => void;
  onStartBreak: () => void;
  onStart: () => void;
  onPause: () => void;
  onSkip: () => void;
  onLeave: () => void;
};

export function RoomPage({
  room,
  participantId,
  connectionStatus,
  sessionSummary,
  onDismissSessionSummary,
  onStartBreak,
  onStart,
  onPause,
  onSkip,
  onLeave,
}: RoomPageProps) {
  const timer = useTimerDisplay(room);
  const isHost = participantId === room.hostId;
  const [graceRemaining, setGraceRemaining] = useState(0);

  useEffect(() => {
    if (room.hostPresent || room.hostGraceEndsAt === null) {
      setGraceRemaining(0);
      return;
    }

    const updateGrace = () => {
      setGraceRemaining(Math.max(0, room.hostGraceEndsAt! - Date.now()));
    };

    updateGrace();
    const interval = setInterval(updateGrace, 1000);
    return () => clearInterval(interval);
  }, [room.hostPresent, room.hostGraceEndsAt]);

  return (
    <div style={{ maxWidth: '40rem', margin: '0 auto', display: 'grid', gap: '1.25rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <RoomCodeBadge code={room.code} />
        <ConnectionStatus status={connectionStatus} />
      </div>

      {!room.hostPresent && room.hostGraceEndsAt !== null ? (
        <div
          role="status"
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius)',
            background: 'rgba(255, 159, 10, 0.15)',
            border: '1px solid var(--color-warning)',
            color: 'var(--color-warning)',
            fontSize: '0.875rem',
          }}
        >
          Host disconnected. Room expires in {formatMs(graceRemaining)}.
        </div>
      ) : null}

      <Timer formatted={timer.formatted} phase={timer.phase} status={timer.status} />

      <HostControls
        room={room}
        isHost={isHost}
        onStart={onStart}
        onPause={onPause}
        onSkip={onSkip}
      />

      <ParticipantList participants={room.participants} />

      <button
        type="button"
        onClick={onLeave}
        style={{
          justifySelf: 'center',
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--color-border)',
          background: 'transparent',
          color: 'var(--color-muted)',
        }}
      >
        Leave room
      </button>

      {sessionSummary ? (
        <SessionSummary
          durationMs={sessionSummary.durationMs}
          participantCount={sessionSummary.participantCount}
          isHost={isHost}
          onStartBreak={onStartBreak}
          onDismiss={onDismissSessionSummary}
        />
      ) : null}
    </div>
  );
}
