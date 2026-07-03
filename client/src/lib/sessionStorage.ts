import type { SessionContext } from '@focussync/shared';

const STORAGE_KEY = 'focussync_session';

export function saveSession(context: SessionContext): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context));
}

export function loadSession(): SessionContext | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as SessionContext;
    if (
      typeof parsed.code === 'string' &&
      typeof parsed.name === 'string' &&
      typeof parsed.participantId === 'string' &&
      typeof parsed.isHost === 'boolean'
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export function clearSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
