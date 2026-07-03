import type { CSSProperties } from 'react';
import type { RoomSnapshot } from '@focussync/shared';

type HostControlsProps = {
  room: RoomSnapshot;
  isHost: boolean;
  onStart: () => void;
  onPause: () => void;
  onSkip: () => void;
};

const buttonStyle: CSSProperties = {
  padding: '0.625rem 1rem',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
};

export function HostControls({ room, isHost, onStart, onPause, onSkip }: HostControlsProps) {
  if (!isHost) {
    return (
      <p style={{ textAlign: 'center', color: 'var(--color-muted)', margin: 0 }}>
        Waiting for host to control the timer
      </p>
    );
  }

  const controlsDisabled = !room.hostPresent;
  const canStart = room.status === 'idle' || room.status === 'paused';
  const canPause = room.status === 'running';
  const canSkip = room.status === 'running' || room.status === 'paused';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {controlsDisabled ? (
        <p
          style={{
            margin: 0,
            textAlign: 'center',
            color: 'var(--color-warning)',
            fontSize: '0.875rem',
          }}
        >
          Host disconnected — controls resume when host returns
        </p>
      ) : null}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          style={buttonStyle}
          disabled={controlsDisabled || !canStart}
          onClick={onStart}
        >
          Start
        </button>
        <button
          type="button"
          style={buttonStyle}
          disabled={controlsDisabled || !canPause}
          onClick={onPause}
        >
          Pause
        </button>
        <button
          type="button"
          style={buttonStyle}
          disabled={controlsDisabled || !canSkip}
          onClick={onSkip}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
