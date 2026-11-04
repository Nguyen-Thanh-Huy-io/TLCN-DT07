import { EventCategory, EVENT_CATEGORY_LABELS } from '../../../constants/enums';
import type { TaxonomyTermItem } from '../../../services/entities/taxonomy.service';
import {
  Swords,
  ShieldAlert,
  Flag,
  Scroll,
  Landmark,
  Users,
  BookOpen,
  AlertTriangle,
  HelpCircle,
  LucideIcon,
} from 'lucide-react';

export interface EventClassificationResult {
  code: EventCategory | string;
  label: string;
  icon: LucideIcon;
  tone: 'danger' | 'warn' | 'purple' | 'emerald' | 'blue' | 'neutral' | 'ok';
  isHeuristic: boolean; // Đánh dấu nếu được suy luận thông minh từ ngữ cảnh thay vì nhãn mặc định
}

interface EventClassifierInput {
  title: string;
  category?: string | null;
  categoryIds?: string[] | null;
  summary?: string | null;
  description?: string | null;
}

export class SmartEventClassifier {
  /**
   * Bộ quy tắc suy luận thông minh (Heuristic Pattern Rules) dựa trên từ khóa Lịch sử
   */
  private static readonly HEURISTIC_PATTERNS: Array<{
    category: EventCategory;
    keywords: string[];
  }> = [
    {
      category: EventCategory.WAR,
      keywords: [
        'chiến tranh',
        'kháng chiến',
        'chiến dịch',
        'xung đột',
        'chinh phạt',
        'viễn chinh',
        'xâm lược',
        'phản công',
      ],
    },
    {
      category: EventCategory.BATTLE,
      keywords: [
        'trận',
        'trận đánh',
        'hải chiến',
        'không chiến',
        'tập kích',
        'phục kích',
        'vây hãm',
        'công thành',
        'phá vây',
      ],
    },
    {
      category: EventCategory.REVOLUTION,
      keywords: [
        'khởi nghĩa',
        'cách mạng',
        'nổi dậy',
        'binh biến',
        'phong trào',
        'bãi công',
        'khởi nghĩa nông dân',
      ],
    },
    {
      category: EventCategory.TREATY,
      keywords: [
        'hiệp định',
        'hiệp ước',
        'hòa ước',
        'tuyên ngôn',
        'sắc lệnh',
        'chiếu dời đô',
        'hịch',
        'thỏa ước',
        'hiến chương',
      ],
    },
    {
      category: EventCategory.SUMMIT_CONFERENCE,
      keywords: [
        'hội nghị',
        'đại hội',
        'hội thề',
        'thượng đỉnh',
        'hội nghị bàn tròn',
        'đàm phán',
      ],
    },
    {
      category: EventCategory.POLITICAL_EVENT,
      keywords: [
        'cải cách',
        'đảo chính',
        'lên ngôi',
        'thoái vị',
        'sáp nhập',
        'thành lập',
        'đổi quốc hiệu',
        'ban hành hiến pháp',
        'cải tổ',
      ],
    },
    {
      category: EventCategory.CULTURE_SCIENCE,
      keywords: [
        'văn hóa',
        'khoa học',
        'khảo cổ',
        'dựng bia',
        'khoa thi',
        'quốc tử giám',
        'ấn loát',
        'dịch thuật',
        'bách khoa',
      ],
    },
    {
      category: EventCategory.NATURAL_DISASTER,
      keywords: [
        'nạn đói',
        'đại dịch',
        'thiên tai',
        'vỡ đê',
        'hạn hán',
        'lũ lụt',
        'động đất',
      ],
    },
  ];

  private static readonly CATEGORY_META: Record<
    EventCategory,
    {
      label: string;
      icon: LucideIcon;
      tone: 'danger' | 'warn' | 'purple' | 'emerald' | 'blue' | 'neutral' | 'ok';
    }
  > = {
    [EventCategory.WAR]: {
      label: 'Chiến tranh / Kháng chiến',
      icon: ShieldAlert,
      tone: 'danger',
    },
    [EventCategory.BATTLE]: {
      label: 'Trận đánh / Chiến dịch',
      icon: Swords,
      tone: 'warn',
    },
    [EventCategory.REVOLUTION]: {
      label: 'Cách mạng / Khởi nghĩa',
      icon: Flag,
      tone: 'purple',
    },
    [EventCategory.TREATY]: {
      label: 'Hiệp ước / Văn kiện',
      icon: Scroll,
      tone: 'emerald',
    },
    [EventCategory.POLITICAL_EVENT]: {
      label: 'Chính trị / Thể chế',
      icon: Landmark,
      tone: 'blue',
    },
    [EventCategory.SUMMIT_CONFERENCE]: {
      label: 'Hội nghị / Đại hội',
      icon: Users,
      tone: 'blue',
    },
    [EventCategory.CULTURE_SCIENCE]: {
      label: 'Văn hóa / Tư tưởng',
      icon: BookOpen,
      tone: 'neutral',
    },
    [EventCategory.NATURAL_DISASTER]: {
      label: 'Thiên tai / Nạn đói',
      icon: AlertTriangle,
      tone: 'warn',
    },
    [EventCategory.OTHER]: {
      label: 'Sự kiện lịch sử',
      icon: HelpCircle,
      tone: 'neutral',
    },
  };

  /**
   * Phân loại sự kiện thông minh:
   * 1. Ưu tiên khớp taxonomy term hoặc category đã chọn nếu hợp lệ và khác OTHER.
   * 2. Nếu là OTHER hoặc rỗng, áp dụng Heuristic Matching theo ngữ nghĩa tiêu đề.
   */
  public static classify(
    terms: TaxonomyTermItem[],
    event: EventClassifierInput,
  ): EventClassificationResult {
    // 1. Kiểm tra nếu có taxonomy term hợp lệ
    const termId = event.categoryIds?.[0];
    const directTerm = termId ? terms.find((t) => t.id === termId) : undefined;
    if (directTerm && directTerm.code !== EventCategory.OTHER) {
      const code = (directTerm.code as EventCategory) || EventCategory.OTHER;
      const meta = this.CATEGORY_META[code] || this.CATEGORY_META[EventCategory.OTHER];
      return {
        code: directTerm.code,
        label: directTerm.label || meta.label,
        icon: meta.icon,
        tone: meta.tone,
        isHeuristic: false,
      };
    }

    // 2. Kiểm tra nếu có mã category enum cũ hợp lệ
    const rawCategory = (event.category as EventCategory) || EventCategory.OTHER;
    if (rawCategory !== EventCategory.OTHER && this.CATEGORY_META[rawCategory]) {
      const meta = this.CATEGORY_META[rawCategory];
      return {
        code: rawCategory,
        label: meta.label,
        icon: meta.icon,
        tone: meta.tone,
        isHeuristic: false,
      };
    }

    // 3. Heuristic matching dựa trên Tiêu đề sự kiện (Tối quan trọng cho dữ liệu hiện có)
    const titleLower = (event.title || '').toLowerCase();
    const contentText = `${titleLower} ${(event.summary || '').toLowerCase()}`;

    for (const rule of this.HEURISTIC_PATTERNS) {
      const isMatch = rule.keywords.some((kw) => {
        // Khớp từ khóa độc lập
        const regex = new RegExp(`(^|\\s|[-–—])${kw}($|\\s|[-–—])`, 'i');
        return regex.test(titleLower) || titleLower.startsWith(kw);
      });

      if (isMatch) {
        const meta = this.CATEGORY_META[rule.category];
        return {
          code: rule.category,
          label: meta.label,
          icon: meta.icon,
          tone: meta.tone,
          isHeuristic: true,
        };
      }
    }

    // Fallback mặc định
    const defaultMeta = this.CATEGORY_META[EventCategory.OTHER];
    return {
      code: EventCategory.OTHER,
      label: 'Sự kiện lịch sử',
      icon: defaultMeta.icon,
      tone: defaultMeta.tone,
      isHeuristic: false,
    };
  }
}
