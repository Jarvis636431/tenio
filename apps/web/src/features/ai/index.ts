// AI Feature Module
// 统一导出所有 AI 相关功能

export { Chat } from "./components/Chat";
export { useChat, type ChatState } from "./hooks/useChat";
export type { ChatMessage } from "@/stores/chatStore";

export { extractChatMessageContent } from "./services/ai-service";
export {
  createAgentSession,
  sendAgentSessionMessage,
  subscribeAgentStreamSse,
} from "./services/ai-api";
