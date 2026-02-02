import { useEffect, useRef, useState } from "react";
import { AI_SSE_URL } from "@/config";

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
        "您好！我是 AI 助手，您可以输入施工相关问题或调整指令。",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const threadIdRef = useRef<string | null>(null);
  const lastContentRef = useRef<string>("");

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

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const handleSendMessage = async () => {
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

    if (!AI_SSE_URL) {
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          content: "未配置 AI SSE 地址，请联系管理员。",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
      setIsThinking(false);
      return;
    }

    // 生成或复用 thread_id
    if (!threadIdRef.current) {
      threadIdRef.current = `thread-${createMessageId()}`;
    }

    // 取消上一次请求
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    const aiMessageId = createMessageId();
    lastContentRef.current = "";
    setMessages((prev) => [
      ...prev,
      {
        id: aiMessageId,
        content: "",
        sender: "ai",
        timestamp: new Date(),
      },
    ]);

    try {
      const response = await fetch(AI_SSE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          message: trimmed,
          thread_id: threadIdRef.current,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`AI 请求失败 (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      const updateAIMessage = (content: string) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId ? { ...msg, content } : msg,
          ),
        );
      };

      const extractContent = (payload: unknown) => {
        const obj =
          typeof payload === "object" && payload !== null
            ? (payload as Record<string, unknown>)
            : null;
        if (!obj) return null;

        const knowledge = obj.knowledge_query as
          | { messages?: Array<{ content?: string }> }
          | undefined;
        const messages = knowledge?.messages ?? [];
        const last = messages[messages.length - 1];
        if (last?.content) return last.content;

        return null;
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const lines = part
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const data = line.replace(/^data:\s*/, "");
            if (data === "[DONE]") {
              setIsThinking(false);
              return;
            }
            try {
              const payload = JSON.parse(data) as unknown;
              const content = extractContent(payload);
              if (content && content.length >= lastContentRef.current.length) {
                lastContentRef.current = content;
                updateAIMessage(content);
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return;
      }
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                content:
                  "AI 服务连接失败，请检查网络或稍后重试。",
              }
            : msg,
        ),
      );
    } finally {
      setIsThinking(false);
    }
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
