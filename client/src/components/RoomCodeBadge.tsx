import { useState } from 'react';

type RoomCodeBadgeProps = {
  code: string;
};

export function RoomCodeBadge({ code }: RoomCodeBadgeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.5rem 0.875rem',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
      }}
    >
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>Room code</div>
        <div
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            letterSpacing: '0.2em',
          }}
        >
          {code}
        </div>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        style={{
          padding: '0.5rem 0.75rem',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
          color: 'var(--color-text)',
        }}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}
