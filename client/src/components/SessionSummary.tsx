import { formatMs } from '../lib/formatTime';

type SessionSummaryProps = {
  durationMs: number;
  participantCount: number;
  isHost: boolean;
  onStartBreak: () => void;
  onDismiss: () => void;
};

export function SessionSummary({
  durationMs,
  participantCount,
  isHost,
  onStartBreak,
  onDismiss,
}: SessionSummaryProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-summary-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 100,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '28rem',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          padding: '1.5rem',
        }}
      >
        <h2 id="session-summary-title" style={{ margin: '0 0 0.5rem' }}>
          Focus block complete
        </h2>
        <p style={{ margin: '0 0 0.75rem', color: 'var(--color-muted)' }}>
          Great work. You focused for {formatMs(durationMs)} with {participantCount}{' '}
          {participantCount === 1 ? 'participant' : 'participants'}.
        </p>
        {isHost ? (
          <button
            type="button"
            onClick={onStartBreak}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius)',
              border: 'none',
              background: 'var(--color-break)',
              color: '#fff',
              fontWeight: 600,
            }}
          >
            Start break
          </button>
        ) : (
          <button
            type="button"
            onClick={onDismiss}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius)',
              border: 'none',
              background: 'var(--color-focus)',
              color: '#fff',
              fontWeight: 600,
            }}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
