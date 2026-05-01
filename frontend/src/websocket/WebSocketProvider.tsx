import useWebSocket, { ReadyState } from "react-use-websocket";
import {
  WebSocketContext,
  webSocketIncomingMessageSchema,
  type WebSocketIncomingMessageSchema,
} from "./WebSocketContext";
import type React from "react";
import { useCallback, useEffect, useState } from "react";

export const WebSocketContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [webSocketClientId, setWebSocketClientId] = useState<
    string | undefined
  >(undefined);
  const [messageHandlers, setMessageHandlers] = useState<
    Set<(message: WebSocketIncomingMessageSchema) => void>
  >(new Set());

  const {
    lastMessage,
    readyState,
    sendMessage: rawSendMessage,
  } = useWebSocket(import.meta.env.VITE_WEBSOCKET_URL, {
    reconnectInterval: (lastAttemptNumber: number) =>
      Math.min(1000 * 2 ** lastAttemptNumber, 5000),
    shouldReconnect: () => true,
    retryOnError: true,
    protocols: [],
  });

  const sendMessage = (message: string) => {
    if (readyState !== ReadyState.OPEN) {
      console.error("WebSocket is not open");
      return;
    }
    rawSendMessage(message);
  };

  useEffect(() => {
    if (lastMessage !== null) {
      const parsedMessage = webSocketIncomingMessageSchema.safeParse(
        JSON.parse(lastMessage.data),
      );
      if (parsedMessage.success) {
        const { type } = parsedMessage.data;
        if (type === "connected") {
          const { id } = parsedMessage.data;
          setWebSocketClientId(id);
        } else {
          messageHandlers.forEach((handler) => handler(parsedMessage.data));
        }
      } else {
        console.error(
          "Failed to parse WebSocket message:",
          parsedMessage.error,
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage]);

  const registerMessageHandler = useCallback(
    (handler: (message: WebSocketIncomingMessageSchema) => void) => {
      setMessageHandlers((prev) => new Set(prev).add(handler));
    },
    [],
  );

  const unregisterMessageHandler = useCallback(
    (handler: (message: WebSocketIncomingMessageSchema) => void) => {
      setMessageHandlers((prev) => {
        const updated = new Set(prev);
        updated.delete(handler);
        return updated;
      });
    },
    [],
  );

  return (
    <WebSocketContext.Provider
      value={{
        sendMessage,
        webSocketClientId,
        registerMessageHandler,
        unregisterMessageHandler,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
