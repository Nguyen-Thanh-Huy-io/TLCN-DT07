import api from '@/services/api';
import {
  AI_ASSISTANT_API,
  AssistantChatRole,
  AssistantEngine,
  AssistantLinkKind,
} from '../constants/ai-assistant.constants';

const unwrap = <T,>(res: { data: { data: T } }): T => res.data.data;

export interface AssistantSuggestedLink {
  kind: AssistantLinkKind;
  title: string;
  subtitle?: string;
  href: string;
  external?: boolean;
}

export interface AssistantSourceCitation {
  title: string;
  authorOrPublisher?: string;
  note?: string;
}

export interface AssistantWebSource {
  title: string;
  uri: string;
  domain?: string;
  snippet?: string;
}

export interface AssistantQuickAction {
  label: string;
  href: string;
}

export interface AssistantHistoryItem {
  role: AssistantChatRole;
  content: string;
}

export interface AiAssistantChatResponse {
  reply: string;
  engine: AssistantEngine;
  contextLabel?: string;
  suggestGoogleFallback?: boolean;
  suggestedLinks: AssistantSuggestedLink[];
  sourceCitations?: AssistantSourceCitation[];
  webSources?: AssistantWebSource[];
  webSearchQueries?: string[];
  quickActions: AssistantQuickAction[];
}

export const AiAssistantApiService = {
  async chat(input: {
    message: string;
    currentPath?: string;
    pageContext?: string;
    history?: AssistantHistoryItem[];
    useGoogleSearch?: boolean;
  }): Promise<AiAssistantChatResponse> {
    return unwrap(
      await api.post(AI_ASSISTANT_API.CHAT, input, { timeout: 28000 }),
    );
  },
};
