// AI Feature Module
// 统一导出所有 AI 相关功能

export { Chat } from "./components/Chat";
export { useChat, type ChatMessage, type ChatState } from "./hooks/useChat";
export {
  useVoice,
  type VoiceRecorderState,
  type VoiceRecorderActions,
  type VoiceRecorderResult,
} from "./hooks/useVoice";

export {
  chatWithAgentStream,
  resumeAgentStream,
  extractChatMessageContent,
} from "./services/ai-service";

export type { AgentResumePayload, AgentChatPayload } from "./types";
