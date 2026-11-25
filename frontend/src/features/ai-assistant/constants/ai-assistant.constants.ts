export const AI_ASSISTANT_API = {
  CHAT: '/ai-assistant/chat',
} as const;

export enum AssistantChatRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export enum AssistantLinkKind {
  EVENT = 'EVENT',
  PERSON = 'PERSON',
  LOCATION = 'LOCATION',
  ARTICLE = 'ARTICLE',
  LESSON = 'LESSON',
  BLOG = 'BLOG',
  TIMELINE = 'TIMELINE',
  WIKIPEDIA = 'WIKIPEDIA',
  ROUTE = 'ROUTE',
}

export enum AssistantEngine {
  VERTEX_RAG = 'VERTEX_RAG',
  GOOGLE_GROUNDED = 'GOOGLE_GROUNDED',
  GEMINI_FLASH = 'GEMINI_FLASH',
  HEURISTIC = 'HEURISTIC',
}

export interface LinkKindBadgeMeta {
  label: string;
  badgeClass: string;
  iconColorClass: string;
}

export const ASSISTANT_LINK_KIND_META: Record<
  AssistantLinkKind,
  LinkKindBadgeMeta
> = {
  [AssistantLinkKind.EVENT]: {
    label: 'Sự kiện',
    badgeClass: 'bg-rose-50 text-[#7A1F24] border-rose-200',
    iconColorClass: 'text-[#7A1F24]',
  },
  [AssistantLinkKind.PERSON]: {
    label: 'Nhân vật',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    iconColorClass: 'text-amber-700',
  },
  [AssistantLinkKind.LOCATION]: {
    label: 'Di tích',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    iconColorClass: 'text-emerald-700',
  },
  [AssistantLinkKind.ARTICLE]: {
    label: 'Bài viết',
    badgeClass: 'bg-stone-100 text-[#7A1F24] border-stone-200',
    iconColorClass: 'text-[#7A1F24]',
  },
  [AssistantLinkKind.LESSON]: {
    label: 'Bài học',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
    iconColorClass: 'text-teal-700',
  },
  [AssistantLinkKind.BLOG]: {
    label: 'Blog',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    iconColorClass: 'text-indigo-700',
  },
  [AssistantLinkKind.TIMELINE]: {
    label: 'Dòng thời gian',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
    iconColorClass: 'text-orange-700',
  },
  [AssistantLinkKind.WIKIPEDIA]: {
    label: 'Wikipedia',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    iconColorClass: 'text-sky-700',
  },
  [AssistantLinkKind.ROUTE]: {
    label: 'Tính năng',
    badgeClass: 'bg-stone-100 text-stone-700 border-stone-200',
    iconColorClass: 'text-stone-600',
  },
};

export const AI_ASSISTANT_WELCOME_MESSAGE =
  'Xin chào! Tôi là **Sử Gia AI — Trợ lý Tra cứu & Điều hướng của HISGO**.\nHỏi tôi về **Sự kiện, Nhân vật, Di tích Lịch sử Việt Nam & Thế giới** để nhận tóm tắt trọng tâm kèm đường dẫn bài viết và nguồn tư liệu chuẩn nhé!';

export interface AssistantQuickPromptItem {
  label: string;
  prompt: string;
}

export const AI_ASSISTANT_QUICK_PROMPTS: ReadonlyArray<AssistantQuickPromptItem> = [
  {
    label: '⚔️ Kháng chiến chống Nguyên – Mông',
    prompt:
      'Tóm tắt 3 lần kháng chiến chống quân Nguyên – Mông thời nhà Trần và đưa đường link sự kiện, nhân vật liên quan',
  },
  {
    label: '🌍 Cách mạng Công nghiệp Thế giới',
    prompt:
      'Tóm tắt Cách mạng Công nghiệp lần thứ nhất và gợi ý bài viết / tư liệu liên quan',
  },
  {
    label: '📜 Tóm tắt trang đang xem',
    prompt: 'Tóm tắt nhanh nội dung trọng tâm của bài viết / trang tôi đang xem',
  },
  {
    label: '📊 Hôm nay tôi cần ôn gì?',
    prompt:
      'Kiểm tra tiến độ học tập, chuỗi Streak và số thẻ Flashcard tôi cần ôn hôm nay',
  },
];

const GUEST_LEARNING_PROMPT: AssistantQuickPromptItem = {
  label: '🧭 Lộ trình cho người mới',
  prompt:
    'Tôi mới bắt đầu học lịch sử trên HISGO, hãy gợi ý lộ trình khám phá và các công cụ học hiệu quả nhất',
};

const AUTH_STUDY_PROMPT: AssistantQuickPromptItem = AI_ASSISTANT_QUICK_PROMPTS[3];

/** Chiến lược chọn 4 câu Gợi ý hỏi nhanh bám sát ngữ cảnh trang hiện tại và trạng thái đăng nhập. */
export function resolveContextQuickPrompts(
  pathname: string | null | undefined,
  isAuthenticated: boolean,
): ReadonlyArray<AssistantQuickPromptItem> {
  const personalPrompt = isAuthenticated ? AUTH_STUDY_PROMPT : GUEST_LEARNING_PROMPT;
  const path = pathname || '/';

  if (path.startsWith('/bai-viet/') && path.length > '/bai-viet/'.length) {
    return [
      {
        label: '📜 Tóm tắt bài viết này',
        prompt: 'Tóm tắt trọng tâm bài viết lịch sử tôi đang đọc thành 3 ý chính dễ nhớ kèm niên đại quan trọng',
      },
      {
        label: '🔗 Nhân vật & sự kiện liên quan',
        prompt: 'Từ bài viết tôi đang đọc, hãy gợi ý các nhân vật, sự kiện hoặc di tích liên quan kèm đường dẫn trên HISGO',
      },
      {
        label: '❓ Tạo 3 câu hỏi ôn nhanh',
        prompt: 'Dựa vào bài viết tôi đang đọc, hãy đặt 3 câu hỏi trắc nghiệm ngắn (kèm đáp án ở cuối) để tôi tự kiểm tra trí nhớ',
      },
      personalPrompt,
    ];
  }

  if (path.startsWith('/dong-thoi-gian')) {
    return [
      {
        label: '⏳ Tóm tắt các thời kỳ chính',
        prompt: 'Khái quát ngắn gọn các thời kỳ lịch sử lớn trên Dòng thời gian HISGO và gợi ý mốc nên bắt đầu',
      },
      AI_ASSISTANT_QUICK_PROMPTS[0],
      {
        label: '🌍 Văn minh cổ đại Thế giới',
        prompt: 'Giới thiệu nhanh các nền văn minh cổ đại tiêu biểu (Lưỡng Hà, Ai Cập, Ấn Độ) và đường dẫn bài viết trên HISGO',
      },
      personalPrompt,
    ];
  }

  return [
    AI_ASSISTANT_QUICK_PROMPTS[0],
    AI_ASSISTANT_QUICK_PROMPTS[1],
    AI_ASSISTANT_QUICK_PROMPTS[2],
    personalPrompt,
  ];
}
