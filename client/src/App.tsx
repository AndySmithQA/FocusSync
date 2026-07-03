import { useEffect, useRef, useState } from 'react';
import { useRoomState } from './hooks/useRoomState';
import { useWebSocket } from './hooks/useWebSocket';
import { LandingPage, buildJoinMessage } from './pages/LandingPage';
import { RoomPage } from './pages/RoomPage';
import { clearSession, loadSession, saveSession } from './lib/sessionStorage';

type Page = 'landing' | 'room';

type PendingIdentity = {
  name: string;
  intent: 'create' | 'join';
};

function resolveParticipantId(
  hostId: string,
  participants: { id: string; name: string }[],
  sessionParticipantId: string | null,
  pendingIdentity: PendingIdentity | null,
): string | null {
  if (sessionParticipantId && participants.some((p) => p.id === sessionParticipantId)) {
    return sessionParticipantId;
  }

  if (pendingIdentity?.intent === 'create') {
    return hostId;
  }

  if (pendingIdentity) {
    const match = participants.find((p) => p.name === pendingIdentity.name);
    return match?.id ?? null;
  }

  return null;
}

export default function App() {
  const { connectionStatus, lastMessage, send, setPendingJoin } = useWebSocket();
  const {
    room,
    terminalState,
    terminalMessage,
    sessionSummary,
    dismissSessionSummary,
  } = useRoomState(lastMessage);

  const [page, setPage] = useState<Page>('landing');
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasAttemptedReconnect, setHasAttemptedReconnect] = useState(false);
  const pendingIdentityRef = useRef<PendingIdentity | null>(null);

  useEffect(() => {
    if (!lastMessage) {
      return;
    }

    if (lastMessage.type === 'error' && lastMessage.code !== 'room_expired') {
      setErrorMessage(lastMessage.message);
    }

    if (lastMessage.type === 'room_state') {
      setErrorMessage(null);
      const snapshot = lastMessage.room;
      const session = loadSession();

      const resolvedParticipantId = resolveParticipantId(
        snapshot.hostId,
        snapshot.participants,
        session?.code === snapshot.code ? session.participantId : participantId,
        pendingIdentityRef.current,
      );

      if (resolvedParticipantId) {
        setParticipantId(resolvedParticipantId);
        const selfParticipant = snapshot.participants.find((p) => p.id === resolvedParticipantId);
        if (selfParticipant) {
          saveSession({
            code: snapshot.code,
            name: selfParticipant.name,
            participantId: resolvedParticipantId,
            isHost: selfParticipant.isHost,
          });
        }
        pendingIdentityRef.current = null;
      }

      setPage('room');
    }
  }, [lastMessage, participantId]);

  useEffect(() => {
    if (terminalState === 'expired') {
      clearSession();
      setPage('landing');
      setParticipantId(null);
      setErrorMessage(terminalMessage ?? 'Room expired.');
      pendingIdentityRef.current = null;
    }
  }, [terminalState, terminalMessage]);

  useEffect(() => {
    if (hasAttemptedReconnect || connectionStatus !== 'connected') {
      return;
    }

    const session = loadSession();
    if (!session) {
      setHasAttemptedReconnect(true);
      return;
    }

    setHasAttemptedReconnect(true);
    setParticipantId(session.participantId);

    const message = buildJoinMessage(
      session.isHost
        ? { kind: 'create', name: session.name }
        : { kind: 'join', name: session.name, code: session.code },
      session.participantId,
      session.code,
    );

    setPendingJoin(message);
    send(message);
  }, [connectionStatus, hasAttemptedReconnect, send, setPendingJoin]);

  const handleCreateRoom = (name: string) => {
    const session = loadSession();
    pendingIdentityRef.current = { name, intent: 'create' };
    const message = buildJoinMessage(
      { kind: 'create', name },
      session?.isHost ? session.participantId : undefined,
      session?.isHost ? session.code : undefined,
    );
    setPendingJoin(message);
    send(message);
  };

  const handleJoinRoom = (code: string, name: string) => {
    const session = loadSession();
    pendingIdentityRef.current = { name, intent: 'join' };
    const message = buildJoinMessage(
      { kind: 'join', name, code },
      session && !session.isHost && session.code === code ? session.participantId : undefined,
    );
    setPendingJoin(message);
    send(message);
  };

  const handleStartBreak = () => {
    dismissSessionSummary();
    send({ type: 'host_control', action: 'start' });
  };

  const handleLeave = () => {
    clearSession();
    setParticipantId(null);
    setPage('landing');
    setErrorMessage(null);
    pendingIdentityRef.current = null;
  };

  return (
    <div className="app">
      <header style={{ padding: '1.5rem', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem' }}>FocusSync</h1>
        <p style={{ margin: '0.5rem 0 0', color: 'var(--color-muted)' }}>
          Shared focus timer for remote teams
        </p>
      </header>
      <main style={{ padding: '1rem 1rem 2rem' }}>
        {page === 'landing' || !room || !participantId ? (
          <LandingPage
            connectionStatus={connectionStatus}
            errorMessage={errorMessage}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
          />
        ) : (
          <RoomPage
            room={room}
            participantId={participantId}
            connectionStatus={connectionStatus}
            sessionSummary={sessionSummary}
            onDismissSessionSummary={dismissSessionSummary}
            onStartBreak={handleStartBreak}
            onStart={() => send({ type: 'host_control', action: 'start' })}
            onPause={() => send({ type: 'host_control', action: 'pause' })}
            onSkip={() => send({ type: 'host_control', action: 'skip' })}
            onLeave={handleLeave}
          />
        )}
      </main>
    </div>
  );
}
