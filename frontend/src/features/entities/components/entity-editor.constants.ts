import { EntityType } from '@/constants/enums';

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  [EntityType.PERSON]: 'Nhân vật lịch sử',
  [EntityType.DYNASTY]: 'Triều đại / Quốc gia / Chính thể',
  [EntityType.ORGANIZATION]: 'Tổ chức / Đảng phái / Liên minh',
  [EntityType.MILITARY_FORCE]: 'Lực lượng quân sự / Binh đoàn',
  [EntityType.ARTIFACT]: 'Hiện vật / Bảo vật quốc gia',
  [EntityType.LOCATION]: 'Địa danh / Di tích lịch sử',
  [EntityType.OTHER]: 'Khác',
};

export interface RelationDraft {
  id?: string;
  targetEntityId: string;
  relationType: string;
  startYear?: number | '';
  endYear?: number | '';
  note?: string;
}

export interface TimeLabels {
  startYear: string;
  endYear: string;
  startDateLabel: string;
  endDateLabel: string;
  startPlaceholder: string;
  endPlaceholder: string;
  startDatePlaceholder: string;
  endDatePlaceholder: string;
  taglinePlaceholder: string;
}

/** Nhãn cụm Niên đại đổi theo loại thực thể — "Năm sinh/mất" chỉ hợp với Nhân vật. */
export function getTimeLabels(type: EntityType): TimeLabels {
  switch (type) {
    case EntityType.PERSON:
      return {
        startYear: 'Năm sinh',
        endYear: 'Năm mất',
        startDateLabel: 'Ngày sinh cụ thể (dạng chữ)',
        endDateLabel: 'Ngày mất cụ thể (dạng chữ)',
        startPlaceholder: '1228',
        endPlaceholder: '1300',
        startDatePlaceholder: 'Khoảng năm 1228, Đầu thế kỷ XIII...',
        endDatePlaceholder: 'Mùa thu năm Canh Tý (1300)...',
        taglinePlaceholder: 'Ví dụ: Quốc công Tiết chế, danh tướng nhà Trần...',
      };
    case EntityType.DYNASTY:
      return {
        startYear: 'Năm thành lập / khởi lập',
        endYear: 'Năm kết thúc / giải thể',
        startDateLabel: 'Thời điểm khởi lập (dạng chữ)',
        endDateLabel: 'Thời điểm kết thúc (dạng chữ)',
        startPlaceholder: '1225',
        endPlaceholder: '1400',
        startDatePlaceholder: 'Tháng 12 năm Ất Dậu (1225)...',
        endDatePlaceholder: 'Năm Canh Thìn (1400)...',
        taglinePlaceholder: 'Ví dụ: Nhà nước Liên bang Xô viết (1922–1991), Triều đại quân chủ dài nhất Việt Nam...',
      };
    case EntityType.ORGANIZATION:
    case EntityType.MILITARY_FORCE:
      return {
        startYear: 'Năm thành lập / Ra đời',
        endYear: 'Năm giải thể / Hợp nhất',
        startDateLabel: 'Ngày thành lập (dạng chữ)',
        endDateLabel: 'Ngày kết thúc (dạng chữ)',
        startPlaceholder: '1944',
        endPlaceholder: '',
        startDatePlaceholder: 'Ngày 22 tháng 12 năm 1944...',
        endDatePlaceholder: 'Còn hoạt động đến nay...',
        taglinePlaceholder: 'Ví dụ: Lực lượng vũ trang nòng cốt của nhân dân Việt Nam...',
      };
    case EntityType.ARTIFACT:
      return {
        startYear: 'Niên đại chế tác / Xuất hiện',
        endYear: 'Niên đại thất lạc / Kết thúc',
        startDateLabel: 'Thời điểm chế tác (dạng chữ)',
        endDateLabel: 'Thời điểm phát hiện / Khảo cổ (dạng chữ)',
        startPlaceholder: '-500',
        endPlaceholder: '-200',
        startDatePlaceholder: 'Thế kỷ V - II TCN...',
        endDatePlaceholder: 'Phát hiện năm 1924 tại Đông Sơn, Thanh Hóa...',
        taglinePlaceholder: 'Ví dụ: Bảo vật quốc gia thời kỳ Văn hóa Đông Sơn...',
      };
    default:
      return {
        startYear: 'Năm bắt đầu',
        endYear: 'Năm kết thúc',
        startDateLabel: 'Thời điểm bắt đầu (dạng chữ)',
        endDateLabel: 'Thời điểm kết thúc (dạng chữ)',
        startPlaceholder: 'Năm bắt đầu',
        endPlaceholder: 'Năm kết thúc',
        startDatePlaceholder: 'Thời điểm bắt đầu...',
        endDatePlaceholder: 'Thời điểm kết thúc...',
        taglinePlaceholder: 'Ví dụ: Giới thiệu hoặc danh xưng ngắn nhận diện...',
      };
  }
}
