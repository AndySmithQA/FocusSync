import {
  isServerMessage,
  type ClientMessage,
  type JoinRoomMessage,
  type ServerMessage,
} from '@focussync/shared';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

type MessageHandler = (message: ServerMessage) => void;
type StatusHandler = (status: ConnectionStatus) => void;

function getWebSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

export class WsClient {
  private socket: WebSocket | null = null;
  private messageHandler: MessageHandler | null = null;
  private statusHandler: StatusHandler | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private shouldReconnect = true;
  private pendingJoin: JoinRoomMessage | null = null;

  connect(): void {
    this.shouldReconnect = true;
    this.openSocket();
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.clearReconnectTimer();
    this.socket?.close();
    this.socket = null;
    this.setStatus('disconnected');
  }

  send(message: ClientMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      return;
    }

    if (message.type === 'join_room') {
      this.pendingJoin = message;
    }
  }

  setPendingJoin(message: JoinRoomMessage): void {
    this.pendingJoin = message;
  }

  onMessage(handler: MessageHandler): void {
    this.messageHandler = handler;
  }

  onStatus(handler: StatusHandler): void {
    this.statusHandler = handler;
  }

  private openSocket(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus(this.reconnectAttempt > 0 ? 'reconnecting' : 'connecting');
    this.socket = new WebSocket(getWebSocketUrl());

    this.socket.addEventListener('open', () => {
      this.reconnectAttempt = 0;
      this.setStatus('connected');

      if (this.pendingJoin) {
        this.socket?.send(JSON.stringify(this.pendingJoin));
      }
    });

    this.socket.addEventListener('message', (event) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(String(event.data)) as unknown;
      } catch {
        return;
      }

      if (isServerMessage(parsed)) {
        this.messageHandler?.(parsed);
      }
    });

    this.socket.addEventListener('close', () => {
      this.socket = null;
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      } else {
        this.setStatus('disconnected');
      }
    });

    this.socket.addEventListener('error', () => {
      this.socket?.close();
    });
  }

  private scheduleReconnect(): void {
    this.setStatus('reconnecting');
    this.clearReconnectTimer();
    const delay = Math.min(1000 * 2 ** this.reconnectAttempt, 10_000);
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.openSocket();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private setStatus(status: ConnectionStatus): void {
    this.statusHandler?.(status);
  }
}
