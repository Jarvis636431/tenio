import { useEffect, useRef } from "react";
import { SSEClient, type SSEClientOptions } from "@/services/sse";

export interface UseSSEOptions
  extends Omit<SSEClientOptions, "onOpen" | "onError" | "onMessage"> {
  enabled?: boolean;
  deps?: unknown[];
  onOpen?: () => void;
  onError?: (error: Event) => void;
  onMessage?: SSEClientOptions["onMessage"];
}

export function useSSE(urlFactory: () => string, options: UseSSEOptions = {}) {
  const {
    enabled = true,
    deps = [],
    onOpen,
    onError,
    onMessage,
    withCredentials,
    maxRetry,
    baseRetryDelayMs,
    maxRetryDelayMs,
  } = options;

  const clientRef = useRef<SSEClient | null>(null);

  useEffect(() => {
    if (!enabled) {
      clientRef.current?.close();
      clientRef.current = null;
      return;
    }

    const client = new SSEClient(urlFactory, {
      withCredentials,
      maxRetry,
      baseRetryDelayMs,
      maxRetryDelayMs,
      onOpen,
      onError,
      onMessage,
    });

    clientRef.current = client;
    client.connect();

    return () => {
      client.close();
      if (clientRef.current === client) {
        clientRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    enabled,
    urlFactory,
    withCredentials,
    maxRetry,
    baseRetryDelayMs,
    maxRetryDelayMs,
    onOpen,
    onError,
    onMessage,
    ...deps,
  ]);

  return clientRef;
}
