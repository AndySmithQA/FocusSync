import { useState, type CSSProperties } from 'react';
import { ROOM_CODE_LENGTH } from '@focussync/shared';
import type { JoinRoomMessage } from '@focussync/shared';

type LandingPageProps = {
  connectionStatus: string;
  errorMessage: string | null;
  onCreateRoom: (name: string) => void;
  onJoinRoom: (code: string, name: string) => void;
};

export function LandingPage({
  connectionStatus,
  errorMessage,
  onCreateRoom,
  onJoinRoom,
}: LandingPageProps) {
  const [createName, setCreateName] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const validateName = (name: string): string | null => {
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 24) {
      return 'Name must be between 1 and 24 characters.';
    }
    return null;
  };

  const handleCreate = () => {
    const nameError = validateName(createName);
    if (nameError) {
      setLocalError(nameError);
      return;
    }

    if (connectionStatus !== 'connected') {
      setLocalError('Waiting for connection. Please try again in a moment.');
      return;
    }

    setLocalError(null);
    onCreateRoom(createName.trim());
  };

  const handleJoin = () => {
    const nameError = validateName(joinName);
    if (nameError) {
      setLocalError(nameError);
      return;
    }

    const code = joinCode.trim().toUpperCase();
    if (code.length !== ROOM_CODE_LENGTH) {
      setLocalError(`Room code must be ${ROOM_CODE_LENGTH} characters.`);
      return;
    }

    if (connectionStatus !== 'connected') {
      setLocalError('Waiting for connection. Please try again in a moment.');
      return;
    }

    setLocalError(null);
    onJoinRoom(code, joinName.trim());
  };

  const displayError = localError ?? errorMessage;

  const cardStyle: CSSProperties = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    padding: '1.25rem',
    display: 'grid',
    gap: '0.75rem',
  };

  const actionButtonStyle: CSSProperties = {
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius)',
    border: 'none',
    background: 'var(--color-focus)',
    color: '#fff',
    fontWeight: 600,
  };

  return (
    <div
      style={{
        maxWidth: '48rem',
        margin: '0 auto',
        display: 'grid',
        gap: '1.25rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))',
      }}
    >
      <section style={cardStyle}>
        <h2 style={{ margin: 0, fontSize: '1.125rem' }}>Create a room</h2>
        <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: '0.875rem' }}>
          Start a focus session and share the code with your team.
        </p>
        <label style={{ display: 'grid', gap: '0.375rem', fontSize: '0.875rem' }}>
          Display name
          <input
            value={createName}
            onChange={(event) => setCreateName(event.target.value)}
            placeholder="Alex"
            maxLength={24}
          />
        </label>
        <button type="button" style={actionButtonStyle} onClick={handleCreate}>
          Create room
        </button>
      </section>

      <section style={cardStyle}>
        <h2 style={{ margin: 0, fontSize: '1.125rem' }}>Join a room</h2>
        <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: '0.875rem' }}>
          Enter the 6-character code from your host.
        </p>
        <label style={{ display: 'grid', gap: '0.375rem', fontSize: '0.875rem' }}>
          Room code
          <input
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={ROOM_CODE_LENGTH}
          />
        </label>
        <label style={{ display: 'grid', gap: '0.375rem', fontSize: '0.875rem' }}>
          Display name
          <input
            value={joinName}
            onChange={(event) => setJoinName(event.target.value)}
            placeholder="Jordan"
            maxLength={24}
          />
        </label>
        <button type="button" style={actionButtonStyle} onClick={handleJoin}>
          Join room
        </button>
      </section>

      {displayError ? (
        <p
          role="alert"
          style={{
            gridColumn: '1 / -1',
            margin: 0,
            color: 'var(--color-danger)',
            textAlign: 'center',
          }}
        >
          {displayError}
        </p>
      ) : null}
    </div>
  );
}

export type JoinIntent =
  | { kind: 'create'; name: string }
  | { kind: 'join'; name: string; code: string };

export function buildJoinMessage(
  intent: JoinIntent,
  participantId?: string,
  code?: string,
): JoinRoomMessage {
  if (intent.kind === 'create') {
    return {
      type: 'join_room',
      intent: 'create',
      name: intent.name,
      participantId,
      code,
    };
  }

  return {
    type: 'join_room',
    intent: 'join',
    name: intent.name,
    code: intent.code,
    participantId,
  };
}
