import { EVENT_CATEGORY_CODES, EVENT_CATEGORY_LABELS } from '../../../constants/enums';
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
  code: string;
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
    category: string;
    keywords: string[];
  }> = [
    {
      category: EVENT_CATEGORY_CODES.WAR,
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
      category: EVENT_CATEGORY_CODES.BATTLE,
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
      category: EVENT_CATEGORY_CODES.REVOLUTION,
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
      category: EVENT_CATEGORY_CODES.TREATY,
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
      category: EVENT_CATEGORY_CODES.SUMMIT_CONFERENCE,
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
      category: EVENT_CATEGORY_CODES.POLITICAL_EVENT,
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
      category: EVENT_CATEGORY_CODES.CULTURE_SCIENCE,
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
      category: EVENT_CATEGORY_CODES.NATURAL_DISASTER,
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
    string,
    {
      label: string;
      icon: LucideIcon;
      tone: 'danger' | 'warn' | 'purple' | 'emerald' | 'blue' | 'neutral' | 'ok';
    }
  > = {
    [EVENT_CATEGORY_CODES.WAR]: {
      label: 'Chiến tranh / Kháng chiến',
      icon: ShieldAlert,
      tone: 'danger',
    },
    [EVENT_CATEGORY_CODES.BATTLE]: {
      label: 'Trận đánh / Chiến dịch',
      icon: Swords,
      tone: 'warn',
    },
    [EVENT_CATEGORY_CODES.REVOLUTION]: {
      label: 'Cách mạng / Khởi nghĩa',
      icon: Flag,
      tone: 'purple',
    },
    [EVENT_CATEGORY_CODES.TREATY]: {
      label: 'Hiệp ước / Văn kiện',
      icon: Scroll,
      tone: 'emerald',
    },
    [EVENT_CATEGORY_CODES.POLITICAL_EVENT]: {
      label: 'Chính trị / Thể chế',
      icon: Landmark,
      tone: 'blue',
    },
    [EVENT_CATEGORY_CODES.SUMMIT_CONFERENCE]: {
      label: 'Hội nghị / Đại hội',
      icon: Users,
      tone: 'blue',
    },
    [EVENT_CATEGORY_CODES.CULTURE_SCIENCE]: {
      label: 'Văn hóa / Tư tưởng',
      icon: BookOpen,
      tone: 'neutral',
    },
    [EVENT_CATEGORY_CODES.NATURAL_DISASTER]: {
      label: 'Thiên tai / Nạn đói',
      icon: AlertTriangle,
      tone: 'warn',
    },
    [EVENT_CATEGORY_CODES.OTHER]: {
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
    if (directTerm && directTerm.code !== EVENT_CATEGORY_CODES.OTHER) {
      const code = directTerm.code || EVENT_CATEGORY_CODES.OTHER;
      const meta = this.CATEGORY_META[code] || this.CATEGORY_META[EVENT_CATEGORY_CODES.OTHER];
      return {
        code: directTerm.code,
        label: directTerm.label || meta.label,
        icon: meta.icon,
        tone: meta.tone,
        isHeuristic: false,
      };
    }

    // 2. Kiểm tra nếu có mã category enum cũ hợp lệ
    const rawCategory = event.category || EVENT_CATEGORY_CODES.OTHER;
    if (rawCategory !== EVENT_CATEGORY_CODES.OTHER && this.CATEGORY_META[rawCategory]) {
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
    const defaultMeta = this.CATEGORY_META[EVENT_CATEGORY_CODES.OTHER];
    return {
      code: EVENT_CATEGORY_CODES.OTHER,
      label: 'Sự kiện lịch sử',
      icon: defaultMeta.icon,
      tone: defaultMeta.tone,
      isHeuristic: false,
    };
  }
}
