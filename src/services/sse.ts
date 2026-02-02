export type SSEEventHandler<T = unknown> = (payload: T, event: MessageEvent) => void;

export interface SSEClientOptions {
  withCredentials?: boolean;
  maxRetry?: number;
  baseRetryDelayMs?: number;
  maxRetryDelayMs?: number;
  onOpen?: () => void;
  onError?: (error: Event) => void;
  onMessage?: SSEEventHandler;
}

type ListenerRegistration = {
  eventName: string;
  listener: EventListener;
};

const DEFAULT_MAX_RETRY = 8;
const DEFAULT_BASE_RETRY_DELAY_MS = 1000;
const DEFAULT_MAX_RETRY_DELAY_MS = 30000;

function parseEventPayload<T>(event: MessageEvent): T {
  const raw = event.data;
  if (typeof raw !== "string") {
    return raw as T;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as T;
  }
}

export class SSEClient {
  private eventSource: EventSource | null = null;
  private reconnectTimer: number | null = null;
  private retryCount = 0;
  private closedManually = false;
  private listenerRegistrations: ListenerRegistration[] = [];
  private readonly withCredentials: boolean;
  private readonly maxRetry: number;
  private readonly baseRetryDelayMs: number;
  private readonly maxRetryDelayMs: number;

  constructor(
    private readonly urlFactory: () => string,
    private readonly options: SSEClientOptions = {},
  ) {
    this.withCredentials = options.withCredentials ?? true;
    this.maxRetry = options.maxRetry ?? DEFAULT_MAX_RETRY;
    this.baseRetryDelayMs =
      options.baseRetryDelayMs ?? DEFAULT_BASE_RETRY_DELAY_MS;
    this.maxRetryDelayMs =
      options.maxRetryDelayMs ?? DEFAULT_MAX_RETRY_DELAY_MS;
  }

  connect() {
    this.closedManually = false;
    this.clearReconnectTimer();
    this.closeEventSourceOnly();

    const eventSource = new EventSource(this.urlFactory(), {
      withCredentials: this.withCredentials,
    });

    this.eventSource = eventSource;

    eventSource.onopen = () => {
      this.retryCount = 0;
      this.options.onOpen?.();
    };

    eventSource.onmessage = (event) => {
      const payload = parseEventPayload(event);
      this.options.onMessage?.(payload, event);
    };

    eventSource.onerror = (error) => {
      this.options.onError?.(error);
      this.scheduleReconnect();
    };

    this.listenerRegistrations.forEach(({ eventName, listener }) => {
      eventSource.addEventListener(eventName, listener);
    });
  }

  addEventListener<T = unknown>(
    eventName: string,
    handler: SSEEventHandler<T>,
  ): () => void {
    const listener: EventListener = (event) => {
      const messageEvent = event as MessageEvent;
      const payload = parseEventPayload<T>(messageEvent);
      handler(payload, messageEvent);
    };

    this.listenerRegistrations.push({ eventName, listener });
    this.eventSource?.addEventListener(eventName, listener);

    return () => {
      this.listenerRegistrations = this.listenerRegistrations.filter(
        (registration) => registration.listener !== listener,
      );
      this.eventSource?.removeEventListener(eventName, listener);
    };
  }

  close() {
    this.closedManually = true;
    this.retryCount = 0;
    this.clearReconnectTimer();
    this.closeEventSourceOnly();
  }

  private scheduleReconnect() {
    if (this.closedManually || this.reconnectTimer !== null) {
      return;
    }

    if (this.retryCount >= this.maxRetry) {
      return;
    }

    this.closeEventSourceOnly();

    const delay = Math.min(
      this.maxRetryDelayMs,
      this.baseRetryDelayMs * 2 ** this.retryCount,
    );
    this.retryCount += 1;

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private closeEventSourceOnly() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
