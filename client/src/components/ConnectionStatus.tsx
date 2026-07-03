import type { ConnectionStatus } from '../lib/wsClient';

type ConnectionStatusProps = {
  status: ConnectionStatus;
};

const LABELS: Record<ConnectionStatus, string> = {
  connecting: 'Connecting',
  connected: 'Connected',
  reconnecting: 'Reconnecting',
  disconnected: 'Disconnected',
};

const COLORS: Record<ConnectionStatus, string> = {
  connecting: 'var(--color-warning)',
  connected: 'var(--color-break)',
  reconnecting: 'var(--color-warning)',
  disconnected: 'var(--color-danger)',
};

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.875rem',
        color: 'var(--color-muted)',
      }}
    >
      <span
        aria-hidden
        style={{
          width: '0.625rem',
          height: '0.625rem',
          borderRadius: '50%',
          background: COLORS[status],
        }}
      />
      <span>{LABELS[status]}</span>
    </div>
  );
}
