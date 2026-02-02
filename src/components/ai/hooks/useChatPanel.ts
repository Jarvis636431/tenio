import { useEffect, useRef, useState } from "react";

export interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export type ChatPanelPlacement =
  | "top-start"
  | "top-end"
  | "bottom-start"
  | "bottom-end";

export interface ChatAnchorRect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface OpenChatPanelDetail {
  anchorRect?: ChatAnchorRect;
  placement?: ChatPanelPlacement;
  offset?: number;
}

export const CHAT_PANEL_OPEN_EVENT = "chat-panel:open";
const PANEL_WIDTH = 384;
const PANEL_HEIGHT = 512;
const VIEWPORT_PADDING = 12;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function computePanelPosition(
  anchorRect: ChatAnchorRect,
  placement: ChatPanelPlacement,
  offset: number,
) {
  let top = 0;
  let left = 0;

  if (placement === "top-start") {
    top = anchorRect.top - PANEL_HEIGHT - offset;
    left = anchorRect.left;
  } else if (placement === "top-end") {
    top = anchorRect.top - PANEL_HEIGHT - offset;
    left = anchorRect.right - PANEL_WIDTH;
  } else if (placement === "bottom-start") {
    top = anchorRect.bottom + offset;
    left = anchorRect.left;
  } else {
    top = anchorRect.bottom + offset;
    left = anchorRect.right - PANEL_WIDTH;
  }

  // 超出视口时做最小纠偏，保持面板尽量贴近锚点
  if (top < VIEWPORT_PADDING) {
    top = anchorRect.bottom + offset;
  }
  if (top + PANEL_HEIGHT > window.innerHeight - VIEWPORT_PADDING) {
    top = anchorRect.top - PANEL_HEIGHT - offset;
  }

  top = clamp(
    top,
    VIEWPORT_PADDING,
    window.innerHeight - PANEL_HEIGHT - VIEWPORT_PADDING,
  );
  left = clamp(
    left,
    VIEWPORT_PADDING,
    window.innerWidth - PANEL_WIDTH - VIEWPORT_PADDING,
  );

  return { top, left };
}

export function openChatPanel(detail: OpenChatPanelDetail = {}) {
  window.dispatchEvent(new CustomEvent<OpenChatPanelDetail>(CHAT_PANEL_OPEN_EVENT, { detail }));
}

function createMessageId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ top: 24, left: 24 });
  const anchorRectRef = useRef<ChatAnchorRect | null>(null);
  const placementRef = useRef<ChatPanelPlacement>("top-end");
  const offsetRef = useRef(12);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createMessageId(),
      content:
        "您好！AI 实时通道正在升级中（WebSocket 已移除，等待 SSE 接入）。您可以先记录调整指令草稿。",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scrollAreaRef.current) return;
    scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
  }, [messages, isThinking]);

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const customEvent = event as CustomEvent<OpenChatPanelDetail>;
      const detail = customEvent.detail;
      if (detail?.anchorRect) {
        anchorRectRef.current = detail.anchorRect;
      }
      placementRef.current = detail?.placement ?? "top-end";
      offsetRef.current = detail?.offset ?? 12;

      const anchor = anchorRectRef.current;
      if (anchor) {
        setPanelPosition(
          computePanelPosition(anchor, placementRef.current, offsetRef.current),
        );
      }
      setIsOpen(true);
    };
    window.addEventListener(CHAT_PANEL_OPEN_EVENT, handleOpen);
    return () => {
      window.removeEventListener(CHAT_PANEL_OPEN_EVENT, handleOpen);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const anchor = anchorRectRef.current;
      if (!anchor) return;
      setPanelPosition(
        computePanelPosition(anchor, placementRef.current, offsetRef.current),
      );
    };

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  const handleSendMessage = () => {
    const trimmed = inputMessage.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: createMessageId(),
      content: trimmed,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsThinking(true);

    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          content:
            "已记录该指令草稿。下一步接入 SSE 后，我会按实时流式结果返回分析与执行反馈。",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
      setIsThinking(false);
    }, 400);
  };

  const handleInputEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return {
    isOpen,
    close: () => setIsOpen(false),
    panelPosition,
    messages,
    inputMessage,
    setInputMessage,
    isThinking,
    handleSendMessage,
    handleInputEnter,
    scrollAreaRef,
  };
}

export type ChatPanelState = ReturnType<typeof useChatPanel>;
