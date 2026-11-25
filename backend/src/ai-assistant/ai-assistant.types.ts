import { AssistantEngine, AssistantLinkKind } from './ai-assistant.constant';

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

export interface AiAssistantChatResponse {
  reply: string;
  engine: AssistantEngine;
  contextLabel?: string;
  suggestedLinks: AssistantSuggestedLink[];
  sourceCitations: AssistantSourceCitation[];
  webSources: AssistantWebSource[];
  webSearchQueries: string[];
  quickActions: AssistantQuickAction[];
}

export interface PageContentSnapshot {
  kind: AssistantLinkKind;
  title: string;
  summary: string;
  href: string;
}

export interface UserStudySnapshot {
  totalXp: number;
  currentDayStreak: number;
  dueFlashcards: number;
  mindmapCount: number;
  savedCount: number;
}
