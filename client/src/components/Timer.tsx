type TimerProps = {
  formatted: string;
  phase: 'focus' | 'break';
  status: 'idle' | 'running' | 'paused';
};

const PHASE_LABELS = {
  focus: 'Focus',
  break: 'Break',
} as const;

const STATUS_LABELS = {
  idle: 'Ready',
  running: 'Running',
  paused: 'Paused',
} as const;

export function Timer({ formatted, phase, status }: TimerProps) {
  const accent = phase === 'focus' ? 'var(--color-focus)' : 'var(--color-break)';

  return (
    <section
      style={{
        textAlign: 'center',
        padding: '2rem 1rem',
        background: 'var(--color-surface)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Phase Label */}
      <div
        style={{
          fontSize: '1rem',
          fontWeight: 700,
          color: accent,
          textTransform: 'uppercase',
          letterSpacing: '0.10em',
          marginBottom: '1rem',
        }}
      >
        {PHASE_LABELS[phase]}
      </div>
      {/* Circular timer area */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 'min(12vw, 9rem)',
            height: 'min(12vw, 9rem)',
            minWidth: '6rem',
            minHeight: '6rem',
            maxWidth: '9rem',
            maxHeight: '9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Accent ring */}
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 0,
            }}
            aria-hidden="true"
            focusable="false"
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke={accent}
              strokeWidth="6"
              fill="none"
              opacity={0.6}
            />
          </svg>
          {/* Timer digits */}
          <div
            aria-live="polite"
            style={{
              position: 'relative',
              zIndex: 1,
              fontSize: 'clamp(3.5rem, 9vw, 5.5rem)',
              fontWeight: 800,
              fontFamily: 'monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              color: 'var(--color-text)',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.03em',
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            {formatted}
          </div>
        </div>
      </div>
      {/* Status Label */}
      <div style={{
        color: 'var(--color-muted)',
        fontSize: '1rem',
        fontWeight: 500,
        marginTop: '1rem',
        letterSpacing: '0.04em'
      }}>
        {STATUS_LABELS[status]}
      </div>
    </section>
  );
}
