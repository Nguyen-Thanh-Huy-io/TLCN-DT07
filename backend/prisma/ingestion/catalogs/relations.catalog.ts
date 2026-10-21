import { EventRelationType, VerificationStatus } from '@prisma/client';
import { IRelationsSeedDataset } from '../interfaces/ingestion.interface';

/**
 * Batch 01 — Quan hệ (Event↔Entity, Entity↔Entity, Event↔Event nhân-quả)
 * CHỈ cho giai đoạn "Kháng chiến chống Mỹ, cứu nước (1954-1975)", vì đây là
 * giai đoạn duy nhất hiện có ĐỦ cả Entity lẫn Event để gắn quan hệ có ý
 * nghĩa. HistoricalEventRelation trước đây có 0 dòng trong DB dù API/UI đã
 * làm xong — batch này lấp đúng khoảng trống đó.
 */
export const RAW_RELATIONS: IRelationsSeedDataset = {
  eventEntityRelations: [
    {
      eventSlug: 'mo-tuyen-duong-van-tai-chien-luoc-truong-son-duong-ho-chi-minh',
      entitySlug: 'doan-559-bo-doi-truong-son',
      role: 'INITIATOR',
      roleLabel: 'Đơn vị được thành lập để mở và vận hành tuyến đường',
      isPrimary: true,
      displayOrder: 1,
      notes: null,
    },
    {
      eventSlug: 'phong-trao-dong-khoi-ben-tre-bung-no',
      entitySlug: 'nu-tuong-nguyen-thi-dinh',
      role: 'LEADER',
      roleLabel: 'Lãnh đạo trực tiếp phong trào Đồng Khởi tại Bến Tre',
      isPrimary: true,
      displayOrder: 1,
      notes: null,
    },
    {
      eventSlug: 'phong-trao-dong-khoi-ben-tre-bung-no',
      entitySlug: 'khu-di-tich-dong-khoi-ben-tre',
      role: 'LOCATION',
      roleLabel: 'Nơi phong trào bùng nổ',
      isPrimary: true,
      displayOrder: 2,
      notes: null,
    },
    {
      eventSlug: 'chien-thang-van-tuong-tran-dung-dau-lich-su-voi-quan-vien-chinh-my',
      entitySlug: 'dai-tuong-nguyen-chi-thanh',
      role: 'COMMANDER',
      roleLabel: 'Chính ủy đề ra phương châm "Nắm thắt lưng địch mà đánh" áp dụng trong trận này',
      isPrimary: false,
      displayOrder: 1,
      notes: null,
    },
    {
      eventSlug: 'cuoc-tong-tien-cong-va-noi-day-tet-mau-than-1968',
      entitySlug: 'dai-tuong-vo-nguyen-giap',
      role: 'COMMANDER',
      roleLabel: 'Tổng tư lệnh Quân đội Nhân dân Việt Nam giai đoạn này',
      isPrimary: true,
      displayOrder: 1,
      notes: null,
    },
    {
      eventSlug: 'chien-thang-dien-bien-phu-tren-khong-12-ngay-dem-ha-noi',
      entitySlug: 'hoang-thanh-thang-long-ham-chi-huy-tac-chien-t1',
      role: 'LOCATION',
      roleLabel: 'Nơi Bộ Chính trị và Quân ủy Trung ương chỉ đạo trận đánh',
      isPrimary: true,
      displayOrder: 1,
      notes: null,
    },
    {
      eventSlug: 'ky-ket-hiep-dinh-paris-ve-cham-dut-chien-tranh-tai-viet-nam',
      entitySlug: 'nha-ngoai-giao-nguyen-thi-binh',
      role: 'SIGNATORY',
      roleLabel: 'Trưởng đoàn đàm phán, người ký Hiệp định Paris',
      isPrimary: true,
      displayOrder: 1,
      notes: null,
    },
    {
      eventSlug: 'dot-pha-khau-buon-ma-thuot-khai-man-chien-dich-tay-nguyen',
      entitySlug: 'dai-tuong-van-tien-dung',
      role: 'COMMANDER',
      roleLabel: 'Trực tiếp chỉ huy Chiến dịch Tây Nguyên',
      isPrimary: true,
      displayOrder: 1,
      notes: null,
    },
    {
      eventSlug: 'dai-thang-chien-dich-ho-chi-minh-giai-phong-hoan-toan-mien-nam',
      entitySlug: 'dai-tuong-van-tien-dung',
      role: 'COMMANDER',
      roleLabel: 'Tư lệnh Chiến dịch Hồ Chí Minh',
      isPrimary: true,
      displayOrder: 1,
      notes: null,
    },
    {
      eventSlug: 'dai-thang-chien-dich-ho-chi-minh-giai-phong-hoan-toan-mien-nam',
      entitySlug: 'dinh-doc-lap-hoi-truong-thong-nhat',
      role: 'LOCATION',
      roleLabel: 'Nơi xe tăng húc đổ cổng, kết thúc chiến dịch',
      isPrimary: true,
      displayOrder: 2,
      notes: null,
    },
    {
      eventSlug: 'dai-thang-chien-dich-ho-chi-minh-giai-phong-hoan-toan-mien-nam',
      entitySlug: 'xe-tang-t-54b-so-hieu-843-va-390',
      role: 'ARTIFACT_USED',
      roleLabel: 'Hai xe tăng dẫn đầu đội hình húc đổ cổng Dinh Độc Lập',
      isPrimary: false,
      displayOrder: 3,
      notes: null,
    },
    {
      eventSlug: 'dai-thang-chien-dich-ho-chi-minh-giai-phong-hoan-toan-mien-nam',
      entitySlug: 'chu-tich-ho-chi-minh',
      role: 'INITIATOR',
      roleLabel: 'Di nguyện thống nhất đất nước được hoàn thành',
      isPrimary: false,
      displayOrder: 4,
      notes: 'Chủ tịch Hồ Chí Minh mất năm 1969, không trực tiếp chứng kiến sự kiện này, nhưng là người khởi xướng mục tiêu thống nhất đất nước.',
    },
  ],

  entityRelations: [
    {
      sourceEntitySlug: 'dai-tuong-van-tien-dung',
      targetEntitySlug: 'dai-tuong-vo-nguyen-giap',
      relationType: 'SUCCESSOR_TO',
      startYear: 1953,
      endYear: null,
      note: 'Văn Tiến Dũng kế nhiệm chức Tổng Tham mưu trưởng Quân đội Nhân dân Việt Nam.',
    },
  ],

  eventCausalRelations: [
    {
      sourceEventSlug: 'phong-trao-dong-khoi-ben-tre-bung-no',
      targetEventSlug: 'thanh-lap-mat-tran-dan-toc-giai-phong-mien-nam-viet-nam',
      relationType: EventRelationType.CAUSES,
      description: 'Thắng lợi của cao trào Đồng Khởi đặt ra yêu cầu phải có 1 tổ chức chính trị công khai quy tụ các tầng lớp yêu nước, dẫn tới việc thành lập Mặt trận.',
      status: VerificationStatus.VERIFIED,
      sourceReference: 'Sách giáo khoa Lịch sử 12, NXB Giáo dục Việt Nam, tr. 140 - 144',
    },
    {
      sourceEventSlug: 'chien-thang-ap-bac-chan-dong',
      targetEventSlug: 'chien-thang-van-tuong-tran-dung-dau-lich-su-voi-quan-vien-chinh-my',
      relationType: EventRelationType.PRECEDES,
      description: 'Ấp Bắc phá sản bước đầu chiến thuật "trực thăng vận" của cố vấn Mỹ; Mỹ sau đó trực tiếp đưa quân viễn chinh vào, dẫn tới trận Vạn Tường.',
      status: VerificationStatus.VERIFIED,
      sourceReference: 'Lịch sử kháng chiến chống Mỹ, cứu nước 1954 - 1975, Tập III',
    },
    {
      sourceEventSlug: 'cuoc-tong-tien-cong-va-noi-day-tet-mau-than-1968',
      targetEventSlug: 'ky-ket-hiep-dinh-paris-ve-cham-dut-chien-tranh-tai-viet-nam',
      relationType: EventRelationType.INFLUENCES,
      description: 'Theo chính dữ liệu sự kiện: Mậu Thân 1968 "buộc Tổng thống Johnson tuyên bố ngừng ném bom miền Bắc và chấp nhận đàm phán" — mở đường cho Hội nghị Paris, dù hiệp định mãi 1973 mới ký.',
      status: VerificationStatus.VERIFIED,
      sourceReference: 'Tổng tiến công và nổi dậy Xuân Mậu Thân 1968, NXB Quân đội Nhân dân',
    },
    {
      sourceEventSlug: 'chien-thang-dien-bien-phu-tren-khong-12-ngay-dem-ha-noi',
      targetEventSlug: 'ky-ket-hiep-dinh-paris-ve-cham-dut-chien-tranh-tai-viet-nam',
      relationType: EventRelationType.CAUSES,
      description: 'Theo chính dữ liệu sự kiện: thất bại của Linebacker II "buộc chính quyền Nixon tuyên bố ngừng ném bom... và ký Hiệp định Paris nguyên vẹn".',
      status: VerificationStatus.VERIFIED,
      sourceReference: 'Lịch sử Quân chủng Phòng không - Không quân Việt Nam',
    },
    {
      sourceEventSlug: 'ky-ket-hiep-dinh-paris-ve-cham-dut-chien-tranh-tai-viet-nam',
      targetEventSlug: 'chien-thang-duong-14-phuoc-long',
      relationType: EventRelationType.PRECEDES,
      description: 'Mỹ rút hết quân viễn chinh sau Hiệp định Paris (1973) tạo điều kiện để Quân giải phóng mở chiến dịch trinh sát chiến lược Phước Long (1974-1975) mà không lo Mỹ can thiệp trở lại.',
      status: VerificationStatus.VERIFIED,
      sourceReference: 'Lịch sử Quân đoàn 4 - Binh đoàn Cửu Long',
    },
    {
      sourceEventSlug: 'chien-thang-duong-14-phuoc-long',
      targetEventSlug: 'dot-pha-khau-buon-ma-thuot-khai-man-chien-dich-tay-nguyen',
      relationType: EventRelationType.CAUSES,
      description: 'Theo chính dữ liệu sự kiện: chiến thắng Phước Long "củng cố quyết tâm chiến lược của Bộ Chính trị giải phóng miền Nam ngay trong năm 1975", trực tiếp dẫn tới việc chọn Buôn Ma Thuột làm điểm đột phá.',
      status: VerificationStatus.VERIFIED,
      sourceReference: 'Tổng hành dinh trong mùa Xuân toàn thắng - Đại tướng Võ Nguyên Giáp',
    },
    {
      sourceEventSlug: 'dot-pha-khau-buon-ma-thuot-khai-man-chien-dich-tay-nguyen',
      targetEventSlug: 'giai-phong-co-do-hue-va-thanh-pho-da-nang',
      relationType: EventRelationType.CAUSES,
      description: 'Theo chính dữ liệu sự kiện: thắng lợi Tây Nguyên "mở toang cánh cửa xuống đồng bằng duyên hải miền Trung", trực tiếp tạo thời cơ giải phóng Huế - Đà Nẵng.',
      status: VerificationStatus.VERIFIED,
      sourceReference: 'Đại thắng mùa Xuân 1975 - Văn Tiến Dũng',
    },
    {
      sourceEventSlug: 'giai-phong-co-do-hue-va-thanh-pho-da-nang',
      targetEventSlug: 'dai-thang-chien-dich-ho-chi-minh-giai-phong-hoan-toan-mien-nam',
      relationType: EventRelationType.PRECEDES,
      description: 'Theo chính dữ liệu sự kiện: giải phóng Huế - Đà Nẵng "tạo bàn đạp trực tiếp cho 5 cánh quân tiến vào Chiến dịch Hồ Chí Minh".',
      status: VerificationStatus.VERIFIED,
      sourceReference: 'Đại thắng mùa Xuân 1975 - Đại tướng Văn Tiến Dũng, NXB Quân đội Nhân dân',
    },
    {
      sourceEventSlug: 'mo-tuyen-duong-van-tai-chien-luoc-truong-son-duong-ho-chi-minh',
      targetEventSlug: 'chien-thang-chien-dich-duong-9-nam-lao',
      relationType: EventRelationType.INFLUENCES,
      description: 'Tuyến đường Trường Sơn là mục tiêu Mỹ - ngụy muốn cắt đứt qua cuộc hành quân Lam Sơn 719 tại Đường 9 - Nam Lào; việc bảo vệ tuyến đường là mục tiêu cốt lõi của chiến dịch phản công này.',
      status: VerificationStatus.VERIFIED,
      sourceReference: 'Chiến dịch phản công Đường 9 - Nam Lào 1971, Viện Lịch sử Quân sự',
    },
  ],
};

export class RelationCatalogBuilder {
  public static buildCatalog(): IRelationsSeedDataset {
    return RAW_RELATIONS;
  }
}
