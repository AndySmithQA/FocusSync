import type { Participant } from '@focussync/shared';

type ParticipantListProps = {
  participants: Participant[];
};

export function ParticipantList({ participants }: ParticipantListProps) {
  return (
    <section
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        padding: '1rem',
      }}
    >
      <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>
        Participants ({participants.length})
      </h2>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.5rem' }}>
        {participants.map((participant) => (
          <li
            key={participant.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 0.75rem',
              background: 'var(--color-bg)',
              borderRadius: '8px',
            }}
          >
            <span>{participant.name}</span>
            {participant.isHost ? (
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-focus)',
                  fontWeight: 600,
                }}
              >
                Host
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
