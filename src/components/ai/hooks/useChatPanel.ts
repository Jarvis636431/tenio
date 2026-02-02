import { useEffect, useRef, useState } from "react";

export interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export const CHAT_PANEL_OPEN_EVENT = "chat-panel:open";

export function openChatPanel() {
  window.dispatchEvent(new CustomEvent(CHAT_PANEL_OPEN_EVENT));
}

function createMessageId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
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
    const handleOpen = () => {
      setIsOpen(true);
    };
    window.addEventListener(CHAT_PANEL_OPEN_EVENT, handleOpen);
    return () => {
      window.removeEventListener(CHAT_PANEL_OPEN_EVENT, handleOpen);
    };
  }, []);

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
