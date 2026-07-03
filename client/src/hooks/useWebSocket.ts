import { useEffect, useRef, useState } from 'react';
import { WsClient, type ConnectionStatus } from '../lib/wsClient';
import type { ClientMessage, JoinRoomMessage, ServerMessage } from '@focussync/shared';

export function useWebSocket() {
  const clientRef = useRef<WsClient | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<ServerMessage | null>(null);

  useEffect(() => {
    const client = new WsClient();
    clientRef.current = client;

    client.onStatus(setConnectionStatus);
    client.onMessage((message) => {
      setLastMessage(message);
    });

    client.connect();

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, []);

  const send = (message: ClientMessage) => {
    clientRef.current?.send(message);
  };

  const setPendingJoin = (message: JoinRoomMessage) => {
    clientRef.current?.setPendingJoin(message);
  };

  return {
    connectionStatus,
    lastMessage,
    send,
    setPendingJoin,
  };
}
