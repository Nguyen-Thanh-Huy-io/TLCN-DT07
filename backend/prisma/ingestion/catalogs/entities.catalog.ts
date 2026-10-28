import { ContentStatus, HistoricalEntityType } from '@prisma/client';
import { IEntitySeedRecord } from '../interfaces/ingestion.interface';

/**
 * Batch 01 — Thực thể lịch sử (Nhân vật / Địa danh / Lực lượng / Tổ chức /
 * Triều đại / Hiện vật) cho 5 giai đoạn đầu tiên của lịch sử Việt Nam:
 * Hồng Bàng - Văn Lang - Âu Lạc, Bắc thuộc lần I, Trưng Nữ Vương,
 * Bắc thuộc lần II, Nhà Tiền Lý.
 *
 * Batch 02 (nối tiếp batch 01, không tách mảng mới): migrate 14 Entity của
 * giai đoạn "Kháng chiến chống Mỹ, cứu nước (1954-1975)" từ seed.ts cũ sang
 * đúng format ingestion — gán lại periodSlug (seed.ts cũ để periodId = null),
 * bổ sung metadata.sources, tách field Person bị gắn nhầm cho MILITARY_FORCE/
 * ARTIFACT (Đoàn 559, xe tăng 843 & 390) ra metadata.foundedYear/retiredYear
 * thay vì tạo bản ghi Person sai bản chất.
 */
const RAW_ENTITIES: IEntitySeedRecord[] = [
  {
    "slug": "cac-vua-hung",
    "periodSlug": "thoi-hong-bang-xich-quy-van-lang-au-lac",
    "name": "Các vua Hùng",
    "type": "PERSON",
    "tagline": "Các vị vua gắn với truyền thống dựng nước Văn Lang.",
    "description": "Theo truyền thuyết và thư tịch cổ, các vua Hùng nối đời cai quản nước Văn Lang. Niên đại và số đời vua không thể xác minh đầy đủ bằng tư liệu đương thời.",
    "aliases": [
      "Hùng Vương"
    ],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": true,
    "displayOrder": 1,
    "status": "PUBLISHED",
    "person": {
      "birthYear": null,
      "deathYear": null,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "Theo truyền thuyết và thư tịch cổ, các vua Hùng nối đời cai quản nước Văn Lang. Niên đại và số đời vua không thể xác minh đầy đủ bằng tư liệu đương thời. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": "Quân chủ",
      "titles": [
        "Hùng Vương"
      ]
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/H%C3%B9ng_V%C6%B0%C6%A1ng"
      ]
    }
  },
  {
    "slug": "kinh-duong-vuong",
    "periodSlug": "thoi-hong-bang-xich-quy-van-lang-au-lac",
    "name": "Kinh Dương Vương",
    "type": "PERSON",
    "tagline": "Nhân vật thủy tổ trong truyền thuyết Hồng Bàng.",
    "description": "Kinh Dương Vương xuất hiện trong truyền thuyết nguồn gốc dân tộc Việt. Mốc 2879 TCN thuộc hệ thống niên đại truyền thuyết, không phải niên đại lịch sử đã được kiểm chứng.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": true,
    "displayOrder": 2,
    "status": "PUBLISHED",
    "person": {
      "birthYear": null,
      "deathYear": null,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "Kinh Dương Vương xuất hiện trong truyền thuyết nguồn gốc dân tộc Việt. Mốc 2879 TCN thuộc hệ thống niên đại truyền thuyết, không phải niên đại lịch sử đã được kiểm chứng. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": "Vua trong truyền thuyết",
      "titles": [
        "Kinh Dương Vương"
      ]
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/Kinh_D%C6%B0%C6%A1ng_V%C6%B0%C6%A1ng"
      ]
    }
  },
  {
    "slug": "lac-long-quan",
    "periodSlug": "thoi-hong-bang-xich-quy-van-lang-au-lac",
    "name": "Lạc Long Quân",
    "type": "PERSON",
    "tagline": "Nhân vật truyền thuyết gắn với nguồn gốc cộng đồng người Việt.",
    "description": "Lạc Long Quân cùng Âu Cơ xuất hiện trong truyện bọc trăm trứng. Đây là nhân vật huyền thoại, không có niên đại sinh mất được xác thực.",
    "aliases": [
      "Sùng Lãm"
    ],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": true,
    "displayOrder": 3,
    "status": "PUBLISHED",
    "person": {
      "birthYear": null,
      "deathYear": null,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "Lạc Long Quân cùng Âu Cơ xuất hiện trong truyện bọc trăm trứng. Đây là nhân vật huyền thoại, không có niên đại sinh mất được xác thực. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": null,
      "titles": []
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/L%E1%BA%A1c_Long_Qu%C3%A2n"
      ]
    }
  },
  {
    "slug": "au-co",
    "periodSlug": "thoi-hong-bang-xich-quy-van-lang-au-lac",
    "name": "Âu Cơ",
    "type": "PERSON",
    "tagline": "Nhân vật mẹ tổ trong truyền thuyết nguồn gốc người Việt.",
    "description": "Âu Cơ gắn với câu chuyện sinh bọc trăm trứng và chia con lên núi xuống biển. Truyền thuyết thể hiện quan niệm về nguồn gốc chung của cộng đồng.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 4,
    "status": "PUBLISHED",
    "person": {
      "birthYear": null,
      "deathYear": null,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "Âu Cơ gắn với câu chuyện sinh bọc trăm trứng và chia con lên núi xuống biển. Truyền thuyết thể hiện quan niệm về nguồn gốc chung của cộng đồng. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": null,
      "titles": []
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/%C3%82u_C%C6%A1"
      ]
    }
  },
  {
    "slug": "an-duong-vuong",
    "periodSlug": "thoi-hong-bang-xich-quy-van-lang-au-lac",
    "name": "An Dương Vương",
    "type": "PERSON",
    "tagline": "Người đứng đầu nước Âu Lạc theo truyền thống sử Việt.",
    "description": "An Dương Vương, thường được gọi là Thục Phán, gắn với sự hình thành Âu Lạc và kinh đô Cổ Loa. Các chi tiết về cuộc đời ông đan xen giữa truyền thuyết và lịch sử.",
    "aliases": [
      "Thục Phán"
    ],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 5,
    "status": "PUBLISHED",
    "person": {
      "birthYear": null,
      "deathYear": null,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "An Dương Vương, thường được gọi là Thục Phán, gắn với sự hình thành Âu Lạc và kinh đô Cổ Loa. Các chi tiết về cuộc đời ông đan xen giữa truyền thuyết và lịch sử. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": "Vua",
      "titles": [
        "An Dương Vương"
      ]
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/An_D%C6%B0%C6%A1ng_V%C6%B0%C6%A1ng"
      ]
    }
  },
  {
    "slug": "son-tinh",
    "periodSlug": "thoi-hong-bang-xich-quy-van-lang-au-lac",
    "name": "Sơn Tinh",
    "type": "PERSON",
    "tagline": "Nhân vật thần thoại gắn với truyền thuyết thời Hùng Vương.",
    "description": "Sơn Tinh xuất hiện trong chuyện Sơn Tinh – Thủy Tinh, phản ánh cách người xưa hình dung cuộc đấu tranh với lũ lụt. Nhân vật không có niên đại lịch sử xác minh.",
    "aliases": [
      "Tản Viên Sơn Thánh"
    ],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 6,
    "status": "PUBLISHED",
    "person": {
      "birthYear": null,
      "deathYear": null,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "Sơn Tinh xuất hiện trong chuyện Sơn Tinh – Thủy Tinh, phản ánh cách người xưa hình dung cuộc đấu tranh với lũ lụt. Nhân vật không có niên đại lịch sử xác minh. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": "Nhân vật truyền thuyết",
      "titles": []
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/S%C6%A1n_Tinh"
      ]
    }
  },
  {
    "slug": "thanh-co-loa",
    "periodSlug": "thoi-hong-bang-xich-quy-van-lang-au-lac",
    "name": "Thành Cổ Loa",
    "type": "LOCATION",
    "tagline": "Di tích thành lũy gắn với kinh đô Âu Lạc.",
    "description": "Cổ Loa là quần thể thành đất cổ tại Đông Anh, Hà Nội. Di tích gắn với An Dương Vương và truyền thuyết nỏ thần.",
    "aliases": [
      "Loa Thành"
    ],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 7,
    "status": "PUBLISHED",
    "person": null,
    "historicalSite": {
      "siteType": "Kinh đô cổ",
      "address": "Cổ Loa, Đông Anh, Hà Nội",
      "latitude": null,
      "longitude": null,
      "constructionYear": null,
      "constructionLabel": "Khoảng thế kỷ III TCN",
      "preservationStatus": null,
      "recognitionLevel": null,
      "managingAgency": null
    },
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/C%E1%BB%95_Loa"
      ]
    }
  },
  {
    "slug": "den-hung",
    "periodSlug": "thoi-hong-bang-xich-quy-van-lang-au-lac",
    "name": "Đền Hùng",
    "type": "LOCATION",
    "tagline": "Không gian thờ tự các vua Hùng tại Phú Thọ.",
    "description": "Khu di tích Đền Hùng là trung tâm thực hành tín ngưỡng thờ cúng Hùng Vương. Các công trình thờ tự hiện nay hình thành và tu bổ qua nhiều thời kỳ, không đồng nhất với kiến trúc thời Văn Lang.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 8,
    "status": "PUBLISHED",
    "person": null,
    "historicalSite": {
      "siteType": "Khu di tích lịch sử",
      "address": "Núi Nghĩa Lĩnh, Phú Thọ",
      "latitude": null,
      "longitude": null,
      "constructionYear": null,
      "constructionLabel": null,
      "preservationStatus": null,
      "recognitionLevel": null,
      "managingAgency": null
    },
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/%C4%90%E1%BB%81n_H%C3%B9ng"
      ]
    }
  },
  {
    "slug": "di-chi-dong-son",
    "periodSlug": "thoi-hong-bang-xich-quy-van-lang-au-lac",
    "name": "Di chỉ Đông Sơn",
    "type": "LOCATION",
    "tagline": "Di chỉ khảo cổ tiêu biểu của văn hóa Đông Sơn.",
    "description": "Di chỉ Đông Sơn tại Thanh Hóa được phát hiện và nghiên cứu từ đầu thế kỷ XX. Văn hóa Đông Sơn cung cấp chứng cứ vật chất quan trọng về cư dân thời đại kim khí.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 9,
    "status": "PUBLISHED",
    "person": null,
    "historicalSite": {
      "siteType": "Di chỉ khảo cổ",
      "address": "Phường Hàm Rồng, Thanh Hóa",
      "latitude": null,
      "longitude": null,
      "constructionYear": null,
      "constructionLabel": null,
      "preservationStatus": null,
      "recognitionLevel": null,
      "managingAgency": null
    },
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/V%C4%83n_h%C3%B3a_%C4%90%C3%B4ng_S%C6%A1n"
      ]
    }
  },
  {
    "slug": "trong-dong-ngoc-lu",
    "periodSlug": "thoi-hong-bang-xich-quy-van-lang-au-lac",
    "name": "Trống đồng Ngọc Lũ",
    "type": "ARTIFACT",
    "tagline": "Trống đồng Đông Sơn tiêu biểu với hoa văn tinh xảo.",
    "description": "Trống Ngọc Lũ là hiện vật nổi bật của văn hóa Đông Sơn, được phát hiện tại Hà Nam. Hoa văn trên mặt và thân trống phản ánh kỹ thuật đúc đồng và đời sống tinh thần cổ.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 10,
    "status": "PUBLISHED",
    "person": null,
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/Tr%E1%BB%91ng_%C4%91%E1%BB%93ng_Ng%E1%BB%8Dc_L%C5%A9"
      ]
    }
  },
  {
    "slug": "no-than-co-loa",
    "periodSlug": "thoi-hong-bang-xich-quy-van-lang-au-lac",
    "name": "Nỏ thần Cổ Loa",
    "type": "ARTIFACT",
    "tagline": "Biểu tượng truyền thuyết về sức mạnh phòng thủ Âu Lạc.",
    "description": "Nỏ thần thuộc truyền thuyết An Dương Vương và thần Kim Quy. Những phát hiện mũi tên đồng tại Cổ Loa cho thấy hoạt động chế tạo vũ khí, nhưng không chứng minh sự tồn tại của chiếc nỏ thần trong truyện.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 11,
    "status": "PUBLISHED",
    "person": null,
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/w/index.php?search=N%E1%BB%8F%20th%E1%BA%A7n&title=%C4%90%E1%BA%B7c%20bi%E1%BB%87t%3AT%C3%ACm%20ki%E1%BA%BFm"
      ]
    }
  },
  {
    "slug": "trieu-da",
    "periodSlug": "thoi-ky-bac-thuoc-lan-1-208-tcn-39",
    "name": "Triệu Đà",
    "type": "PERSON",
    "tagline": "Người lập nước Nam Việt vào cuối thế kỷ III TCN.",
    "description": "Triệu Đà vốn là quan tướng nhà Tần, sau xây dựng chính quyền Nam Việt tại vùng Lĩnh Nam. Quan hệ giữa Nam Việt và lịch sử Việt Nam được đánh giá khác nhau trong các truyền thống sử học.",
    "aliases": [
      "Triệu Vũ Đế"
    ],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": true,
    "displayOrder": 1,
    "status": "PUBLISHED",
    "person": {
      "birthYear": null,
      "deathYear": -137,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "Triệu Đà vốn là quan tướng nhà Tần, sau xây dựng chính quyền Nam Việt tại vùng Lĩnh Nam. Quan hệ giữa Nam Việt và lịch sử Việt Nam được đánh giá khác nhau trong các truyền thống sử học. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": "Vua",
      "titles": [
        "Nam Việt Vũ Vương"
      ]
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/Tri%E1%BB%87u_%C4%90%C3%A0"
      ]
    }
  },
  {
    "slug": "lu-gia",
    "periodSlug": "thoi-ky-bac-thuoc-lan-1-208-tcn-39",
    "name": "Lữ Gia",
    "type": "PERSON",
    "tagline": "Thừa tướng Nam Việt chống việc sáp nhập trực tiếp vào nhà Hán.",
    "description": "Lữ Gia là đại thần có ảnh hưởng lớn dưới các vua cuối của Nam Việt. Ông chống chủ trương quy phục nhà Hán và bị đánh bại trong cuộc chinh phạt năm 111 TCN.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": true,
    "displayOrder": 2,
    "status": "PUBLISHED",
    "person": {
      "birthYear": null,
      "deathYear": null,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "Lữ Gia là đại thần có ảnh hưởng lớn dưới các vua cuối của Nam Việt. Ông chống chủ trương quy phục nhà Hán và bị đánh bại trong cuộc chinh phạt năm 111 TCN. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": "Thừa tướng",
      "titles": []
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/w/index.php?search=L%E1%BB%AF%20Gia%20%28Nam%20Vi%E1%BB%87t%29&title=%C4%90%E1%BA%B7c%20bi%E1%BB%87t%3AT%C3%ACm%20ki%E1%BA%BFm"
      ]
    }
  },
  {
    "slug": "han-vu-de",
    "periodSlug": "thoi-ky-bac-thuoc-lan-1-208-tcn-39",
    "name": "Hán Vũ Đế",
    "type": "PERSON",
    "tagline": "Hoàng đế nhà Hán ra lệnh chinh phục Nam Việt.",
    "description": "Hán Vũ Đế trị vì từ năm 141 đến 87 TCN. Dưới thời ông, quân Hán tiêu diệt Nam Việt năm 111 TCN và thiết lập hệ thống quận huyện tại khu vực.",
    "aliases": [
      "Lưu Triệt"
    ],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": true,
    "displayOrder": 3,
    "status": "PUBLISHED",
    "person": {
      "birthYear": -156,
      "deathYear": -87,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "Hán Vũ Đế trị vì từ năm 141 đến 87 TCN. Dưới thời ông, quân Hán tiêu diệt Nam Việt năm 111 TCN và thiết lập hệ thống quận huyện tại khu vực. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": "Hoàng đế",
      "titles": [
        "Hán Vũ Đế"
      ]
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/H%C3%A1n_V%C5%A9_%C4%90%E1%BA%BF"
      ]
    }
  },
  {
    "slug": "lo-bac-duc",
    "periodSlug": "thoi-ky-bac-thuoc-lan-1-208-tcn-39",
    "name": "Lộ Bác Đức",
    "type": "PERSON",
    "tagline": "Tướng nhà Hán tham gia cuộc chinh phạt Nam Việt.",
    "description": "Lộ Bác Đức chỉ huy một cánh quân Hán trong chiến dịch đánh Nam Việt năm 111 TCN. Chiến dịch dẫn tới việc triều đình Hán thiết lập bộ máy cai trị tại vùng đất của Nam Việt.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 4,
    "status": "PUBLISHED",
    "person": {
      "birthYear": null,
      "deathYear": null,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "Lộ Bác Đức chỉ huy một cánh quân Hán trong chiến dịch đánh Nam Việt năm 111 TCN. Chiến dịch dẫn tới việc triều đình Hán thiết lập bộ máy cai trị tại vùng đất của Nam Việt. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": "Tướng lĩnh",
      "titles": [
        "Phục Ba tướng quân"
      ]
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/w/index.php?search=L%E1%BB%99%20B%C3%A1c%20%C4%90%E1%BB%A9c&title=%C4%90%E1%BA%B7c%20bi%E1%BB%87t%3AT%C3%ACm%20ki%E1%BA%BFm"
      ]
    }
  },
  {
    "slug": "to-dinh",
    "periodSlug": "thoi-ky-bac-thuoc-lan-1-208-tcn-39",
    "name": "Tô Định",
    "type": "PERSON",
    "tagline": "Thái thú Giao Chỉ gắn với bối cảnh khởi nghĩa Hai Bà Trưng.",
    "description": "Tô Định là viên quan nhà Đông Hán cai trị Giao Chỉ đầu thế kỷ I. Sử liệu truyền thống mô tả chính sách cai trị hà khắc của ông là một nguyên nhân dẫn tới khởi nghĩa năm 40.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 5,
    "status": "PUBLISHED",
    "person": {
      "birthYear": null,
      "deathYear": null,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "Tô Định là viên quan nhà Đông Hán cai trị Giao Chỉ đầu thế kỷ I. Sử liệu truyền thống mô tả chính sách cai trị hà khắc của ông là một nguyên nhân dẫn tới khởi nghĩa năm 40. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": "Thái thú",
      "titles": []
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/T%C3%B4_%C4%90%E1%BB%8Bnh"
      ]
    }
  },
  {
    "slug": "thi-sach",
    "periodSlug": "thoi-ky-bac-thuoc-lan-1-208-tcn-39",
    "name": "Thi Sách",
    "type": "PERSON",
    "tagline": "Nhân vật gắn với Trưng Trắc trong ghi chép về khởi nghĩa.",
    "description": "Thi Sách được truyền thống sử Việt ghi nhận là chồng Trưng Trắc. Các nguồn sử cổ có khác biệt về chi tiết cuộc đời và vai trò của ông.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 6,
    "status": "PUBLISHED",
    "person": {
      "birthYear": null,
      "deathYear": null,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "Thi Sách được truyền thống sử Việt ghi nhận là chồng Trưng Trắc. Các nguồn sử cổ có khác biệt về chi tiết cuộc đời và vai trò của ông. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": null,
      "titles": []
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/Thi_S%C3%A1ch"
      ]
    }
  },
  {
    "slug": "thanh-phien-ngung",
    "periodSlug": "thoi-ky-bac-thuoc-lan-1-208-tcn-39",
    "name": "Thành Phiên Ngung",
    "type": "LOCATION",
    "tagline": "Trung tâm chính trị của nước Nam Việt.",
    "description": "Phiên Ngung, tại khu vực Quảng Châu ngày nay, là kinh đô nước Nam Việt. Di tích đô thị và cung điện thời Nam Việt giúp nghiên cứu lịch sử khu vực Lĩnh Nam.",
    "aliases": [
      "Panyu"
    ],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 7,
    "status": "PUBLISHED",
    "person": null,
    "historicalSite": {
      "siteType": "Kinh đô cổ",
      "address": "Quảng Châu, Quảng Đông, Trung Quốc",
      "latitude": null,
      "longitude": null,
      "constructionYear": null,
      "constructionLabel": null,
      "preservationStatus": null,
      "recognitionLevel": null,
      "managingAgency": null
    },
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/w/index.php?search=Phi%C3%AAn%20Ngung&title=%C4%90%E1%BA%B7c%20bi%E1%BB%87t%3AT%C3%ACm%20ki%E1%BA%BFm"
      ]
    }
  },
  {
    "slug": "luy-lau",
    "periodSlug": "thoi-ky-bac-thuoc-lan-1-208-tcn-39",
    "name": "Luy Lâu",
    "type": "LOCATION",
    "tagline": "Trung tâm hành chính và văn hóa cổ ở vùng Giao Chỉ.",
    "description": "Luy Lâu tại vùng Thuận Thành, Bắc Ninh, là địa điểm quan trọng trong thời Bắc thuộc. Khu vực này tiếp tục giữ vai trò lớn trong những thế kỷ sau.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 8,
    "status": "PUBLISHED",
    "person": null,
    "historicalSite": {
      "siteType": "Thành cổ",
      "address": "Khu vực Thuận Thành, Bắc Ninh",
      "latitude": null,
      "longitude": null,
      "constructionYear": null,
      "constructionLabel": null,
      "preservationStatus": null,
      "recognitionLevel": null,
      "managingAgency": null
    },
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/Luy_L%C3%A2u"
      ]
    }
  },
  {
    "slug": "giao-chi",
    "periodSlug": "thoi-ky-bac-thuoc-lan-1-208-tcn-39",
    "name": "Giao Chỉ",
    "type": "LOCATION",
    "tagline": "Đơn vị hành chính quan trọng dưới thời Hán.",
    "description": "Giao Chỉ là tên quận trong hệ thống cai trị của nhà Hán tại miền Bắc Việt Nam ngày nay. Phạm vi và trị sở thay đổi theo thời kỳ.",
    "aliases": [
      "Giao Chỉ quận"
    ],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 9,
    "status": "PUBLISHED",
    "person": null,
    "historicalSite": {
      "siteType": "Địa vực lịch sử",
      "address": null,
      "latitude": null,
      "longitude": null,
      "constructionYear": null,
      "constructionLabel": null,
      "preservationStatus": null,
      "recognitionLevel": null,
      "managingAgency": null
    },
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/Giao_Ch%E1%BB%89"
      ]
    }
  },
  {
    "slug": "nha-trieu-nam-viet",
    "periodSlug": "thoi-ky-bac-thuoc-lan-1-208-tcn-39",
    "name": "Nhà Triệu Nam Việt",
    "type": "DYNASTY",
    "tagline": "Vương triều cai trị Nam Việt trước cuộc chinh phục của nhà Hán.",
    "description": "Nam Việt tồn tại từ năm 204 đến 111 TCN, với trung tâm ở Phiên Ngung. Phạm vi lãnh thổ bao gồm một phần miền Nam Trung Quốc và miền Bắc Việt Nam ngày nay.",
    "aliases": [
      "Nam Việt"
    ],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 10,
    "status": "PUBLISHED",
    "person": null,
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/Nh%C3%A0_Tri%E1%BB%87u"
      ]
    }
  },
  {
    "slug": "quan-nhat-nam",
    "periodSlug": "thoi-ky-bac-thuoc-lan-1-208-tcn-39",
    "name": "Quận Nhật Nam",
    "type": "LOCATION",
    "tagline": "Quận hành chính được thiết lập trong thời kỳ cai trị Hán.",
    "description": "Nhật Nam là một trong các quận ở vùng phía nam thuộc hệ thống hành chính thời Hán. Ranh giới cụ thể biến đổi theo thời kỳ và còn có những vấn đề nghiên cứu.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 11,
    "status": "PUBLISHED",
    "person": null,
    "historicalSite": {
      "siteType": "Địa vực lịch sử",
      "address": null,
      "latitude": null,
      "longitude": null,
      "constructionYear": null,
      "constructionLabel": null,
      "preservationStatus": null,
      "recognitionLevel": null,
      "managingAgency": null
    },
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/w/index.php?search=Nh%E1%BA%ADt%20Nam&title=%C4%90%E1%BA%B7c%20bi%E1%BB%87t%3AT%C3%ACm%20ki%E1%BA%BFm"
      ]
    }
  },
  {
    "slug": "trung-trac",
    "periodSlug": "giai-doan-trung-nu-vuong-40-43",
    "name": "Trưng Trắc",
    "type": "PERSON",
    "tagline": "Lãnh tụ khởi nghĩa năm 40 và người đứng đầu chính quyền tự chủ.",
    "description": "Trưng Trắc cùng em Trưng Nhị lãnh đạo cuộc nổi dậy chống chính quyền Đông Hán. Bà được truyền thống Việt Nam tôn là Trưng Nữ Vương.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": true,
    "displayOrder": 1,
    "status": "PUBLISHED",
    "person": {
      "birthYear": null,
      "deathYear": 43,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "Trưng Trắc cùng em Trưng Nhị lãnh đạo cuộc nổi dậy chống chính quyền Đông Hán. Bà được truyền thống Việt Nam tôn là Trưng Nữ Vương. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": "Nữ vương",
      "titles": [
        "Trưng Nữ Vương"
      ]
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/Tr%C6%B0ng_Tr%E1%BA%AFc"
      ]
    }
  },
  {
    "slug": "trung-nhi",
    "periodSlug": "giai-doan-trung-nu-vuong-40-43",
    "name": "Trưng Nhị",
    "type": "PERSON",
    "tagline": "Cùng Trưng Trắc lãnh đạo khởi nghĩa chống Đông Hán.",
    "description": "Trưng Nhị là em gái Trưng Trắc và là nhân vật trung tâm trong cuộc khởi nghĩa năm 40. Bà được thờ phụng cùng chị tại nhiều di tích.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": true,
    "displayOrder": 2,
    "status": "PUBLISHED",
    "person": {
      "birthYear": null,
      "deathYear": 43,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "Trưng Nhị là em gái Trưng Trắc và là nhân vật trung tâm trong cuộc khởi nghĩa năm 40. Bà được thờ phụng cùng chị tại nhiều di tích. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": "Lãnh tụ khởi nghĩa",
      "titles": []
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/Tr%C6%B0ng_Nh%E1%BB%8B"
      ]
    }
  },
  {
    "slug": "ma-vien",
    "periodSlug": "giai-doan-trung-nu-vuong-40-43",
    "name": "Mã Viện",
    "type": "PERSON",
    "tagline": "Tướng Đông Hán chỉ huy quân đàn áp khởi nghĩa Hai Bà Trưng.",
    "description": "Mã Viện được triều Đông Hán phái đến Giao Chỉ để tái lập quyền kiểm soát. Cuộc viễn chinh kết thúc chính quyền của Hai Bà Trưng vào năm 43.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": true,
    "displayOrder": 3,
    "status": "PUBLISHED",
    "person": {
      "birthYear": -14,
      "deathYear": 49,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "Mã Viện được triều Đông Hán phái đến Giao Chỉ để tái lập quyền kiểm soát. Cuộc viễn chinh kết thúc chính quyền của Hai Bà Trưng vào năm 43. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": "Tướng lĩnh",
      "titles": [
        "Phục Ba tướng quân"
      ]
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/M%C3%A3_Vi%E1%BB%87n"
      ]
    }
  },
  {
    "slug": "to-dinh-thoi-trung",
    "periodSlug": "giai-doan-trung-nu-vuong-40-43",
    "name": "Tô Định thời Trưng",
    "type": "PERSON",
    "tagline": "Thái thú Đông Hán bị lực lượng khởi nghĩa chống lại.",
    "description": "Tô Định là thái thú Giao Chỉ khi phong trào khởi nghĩa bùng nổ năm 40. Ông phải bỏ chạy khi lực lượng của Trưng Trắc giành quyền kiểm soát khu vực.",
    "aliases": [
      "Tô Định"
    ],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 4,
    "status": "PUBLISHED",
    "person": {
      "birthYear": null,
      "deathYear": null,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "Tô Định là thái thú Giao Chỉ khi phong trào khởi nghĩa bùng nổ năm 40. Ông phải bỏ chạy khi lực lượng của Trưng Trắc giành quyền kiểm soát khu vực. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": "Thái thú",
      "titles": []
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/w/index.php?search=T%C3%B4%20%C4%90%E1%BB%8Bnh&title=%C4%90%E1%BA%B7c%20bi%E1%BB%87t%3AT%C3%ACm%20ki%E1%BA%BFm"
      ]
    }
  },
  {
    "slug": "thi-sach-thoi-trung",
    "periodSlug": "giai-doan-trung-nu-vuong-40-43",
    "name": "Thi Sách thời Trưng",
    "type": "PERSON",
    "tagline": "Nhân vật liên quan đến gia đình Trưng Trắc.",
    "description": "Thi Sách thường được nhắc đến là chồng Trưng Trắc trong truyền thống sử Việt. Chi tiết về số phận của ông không hoàn toàn thống nhất giữa các nguồn.",
    "aliases": [
      "Thi Sách"
    ],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 5,
    "status": "PUBLISHED",
    "person": {
      "birthYear": null,
      "deathYear": null,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "Thi Sách thường được nhắc đến là chồng Trưng Trắc trong truyền thống sử Việt. Chi tiết về số phận của ông không hoàn toàn thống nhất giữa các nguồn. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": null,
      "titles": []
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/w/index.php?search=Thi%20S%C3%A1ch&title=%C4%90%E1%BA%B7c%20bi%E1%BB%87t%3AT%C3%ACm%20ki%E1%BA%BFm"
      ]
    }
  },
  {
    "slug": "thanh-thien",
    "periodSlug": "giai-doan-trung-nu-vuong-40-43",
    "name": "Thánh Thiên",
    "type": "PERSON",
    "tagline": "Nữ tướng trong truyền thống thờ phụng Hai Bà Trưng.",
    "description": "Thánh Thiên được truyền thuyết và thần tích địa phương ghi nhận là nữ tướng tham gia khởi nghĩa. Thông tin về bà chủ yếu dựa vào truyền thống dân gian, chưa có hồ sơ tiểu sử đương thời.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 6,
    "status": "PUBLISHED",
    "person": {
      "birthYear": null,
      "deathYear": null,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "Thánh Thiên được truyền thuyết và thần tích địa phương ghi nhận là nữ tướng tham gia khởi nghĩa. Thông tin về bà chủ yếu dựa vào truyền thống dân gian, chưa có hồ sơ tiểu sử đương thời. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": "Nữ tướng theo truyền thuyết",
      "titles": []
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/w/index.php?search=Th%C3%A1nh%20Thi%C3%AAn&title=%C4%90%E1%BA%B7c%20bi%E1%BB%87t%3AT%C3%ACm%20ki%E1%BA%BFm"
      ]
    }
  },
  {
    "slug": "den-hai-ba-trung-me-linh",
    "periodSlug": "giai-doan-trung-nu-vuong-40-43",
    "name": "Đền Hai Bà Trưng Mê Linh",
    "type": "LOCATION",
    "tagline": "Di tích thờ Trưng Trắc và Trưng Nhị tại Mê Linh.",
    "description": "Đền Hai Bà Trưng ở Mê Linh gắn với quê hương và sự nghiệp của hai nữ anh hùng. Kiến trúc thờ tự hiện hữu thuộc những thời kỳ sau sự kiện thế kỷ I.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 7,
    "status": "PUBLISHED",
    "person": null,
    "historicalSite": {
      "siteType": "Đền thờ lịch sử",
      "address": "Mê Linh, Hà Nội",
      "latitude": null,
      "longitude": null,
      "constructionYear": null,
      "constructionLabel": null,
      "preservationStatus": null,
      "recognitionLevel": null,
      "managingAgency": null
    },
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/w/index.php?search=%C4%90%E1%BB%81n%20Hai%20B%C3%A0%20Tr%C6%B0ng%20%28M%C3%AA%20Linh%29&title=%C4%90%E1%BA%B7c%20bi%E1%BB%87t%3AT%C3%ACm%20ki%E1%BA%BFm"
      ]
    }
  },
  {
    "slug": "den-hai-ba-trung-dong-nhan",
    "periodSlug": "giai-doan-trung-nu-vuong-40-43",
    "name": "Đền Hai Bà Trưng Đồng Nhân",
    "type": "LOCATION",
    "tagline": "Nơi thờ Hai Bà Trưng tại Hà Nội.",
    "description": "Đền Đồng Nhân là một trung tâm tín ngưỡng tưởng niệm Hai Bà Trưng. Địa điểm thờ tự có lịch sử lâu dài và trải qua nhiều lần thay đổi, tu bổ.",
    "aliases": [
      "Đền Đồng Nhân"
    ],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 8,
    "status": "PUBLISHED",
    "person": null,
    "historicalSite": {
      "siteType": "Đền thờ lịch sử",
      "address": "Phường Đồng Nhân, Hà Nội",
      "latitude": null,
      "longitude": null,
      "constructionYear": null,
      "constructionLabel": null,
      "preservationStatus": null,
      "recognitionLevel": null,
      "managingAgency": null
    },
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/w/index.php?search=%C4%90%E1%BB%81n%20Hai%20B%C3%A0%20Tr%C6%B0ng%20%28%C4%90%E1%BB%93ng%20Nh%C3%A2n%29&title=%C4%90%E1%BA%B7c%20bi%E1%BB%87t%3AT%C3%ACm%20ki%E1%BA%BFm"
      ]
    }
  },
  {
    "slug": "hat-mon",
    "periodSlug": "giai-doan-trung-nu-vuong-40-43",
    "name": "Hát Môn",
    "type": "LOCATION",
    "tagline": "Địa danh gắn với truyền thống khởi nghĩa và tưởng niệm Hai Bà Trưng.",
    "description": "Hát Môn tại vùng Phúc Thọ, Hà Nội, có đền thờ Hai Bà Trưng. Những sự kiện cụ thể được kể trong thần tích cần phân biệt với tư liệu lịch sử có thể kiểm chứng.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 9,
    "status": "PUBLISHED",
    "person": null,
    "historicalSite": {
      "siteType": "Địa danh lịch sử",
      "address": "Hát Môn, Phúc Thọ, Hà Nội",
      "latitude": null,
      "longitude": null,
      "constructionYear": null,
      "constructionLabel": null,
      "preservationStatus": null,
      "recognitionLevel": null,
      "managingAgency": null
    },
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/w/index.php?search=H%C3%A1t%20M%C3%B4n&title=%C4%90%E1%BA%B7c%20bi%E1%BB%87t%3AT%C3%ACm%20ki%E1%BA%BFm"
      ]
    }
  },
  {
    "slug": "luc-luong-khoi-nghia-hai-ba-trung",
    "periodSlug": "giai-doan-trung-nu-vuong-40-43",
    "name": "Lực lượng khởi nghĩa Hai Bà Trưng",
    "type": "MILITARY_FORCE",
    "tagline": "Lực lượng nổi dậy chống chính quyền Đông Hán năm 40.",
    "description": "Phong trào do Trưng Trắc và Trưng Nhị lãnh đạo thu hút nhiều thủ lĩnh địa phương. Tư liệu cổ không cho phép xác định chắc chắn quân số và tổ chức biên chế.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 10,
    "status": "PUBLISHED",
    "person": null,
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/Kh%E1%BB%9Fi_ngh%C4%A9a_Hai_B%C3%A0_Tr%C6%B0ng"
      ]
    }
  },
  {
    "slug": "chinh-quyen-trung-nu-vuong",
    "periodSlug": "giai-doan-trung-nu-vuong-40-43",
    "name": "Chính quyền Trưng Nữ Vương",
    "type": "DYNASTY",
    "tagline": "Chính quyền tự chủ tồn tại từ năm 40 đến năm 43.",
    "description": "Sau thắng lợi khởi nghĩa, Trưng Trắc nắm quyền và được truyền thống sử Việt tôn xưng là Trưng Nữ Vương. Chính quyền chấm dứt sau cuộc tiến công của quân Đông Hán.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 11,
    "status": "PUBLISHED",
    "person": null,
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/w/index.php?search=Tr%C6%B0ng%20Tr%E1%BA%AFc&title=%C4%90%E1%BA%B7c%20bi%E1%BB%87t%3AT%C3%ACm%20ki%E1%BA%BFm"
      ]
    }
  },
  {
    "slug": "ba-trieu",
    "periodSlug": "thoi-ky-bac-thuoc-lan-2-43-543",
    "name": "Bà Triệu",
    "type": "PERSON",
    "tagline": "Lãnh tụ cuộc khởi nghĩa chống Đông Ngô năm 248.",
    "description": "Bà Triệu, thường được gọi là Triệu Thị Trinh, gắn với phong trào chống chính quyền Đông Ngô tại Cửu Chân. Tiểu sử của bà có nhiều yếu tố truyền thuyết và không có năm sinh được xác nhận chắc chắn.",
    "aliases": [
      "Triệu Thị Trinh",
      "Triệu Ẩu"
    ],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": true,
    "displayOrder": 1,
    "status": "PUBLISHED",
    "person": {
      "birthYear": null,
      "deathYear": 248,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "Bà Triệu, thường được gọi là Triệu Thị Trinh, gắn với phong trào chống chính quyền Đông Ngô tại Cửu Chân. Tiểu sử của bà có nhiều yếu tố truyền thuyết và không có năm sinh được xác nhận chắc chắn. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": "Lãnh tụ khởi nghĩa",
      "titles": [
        "Bà Triệu"
      ]
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/B%C3%A0_Tri%E1%BB%87u"
      ]
    }
  },
  {
    "slug": "trieu-quoc-dat",
    "periodSlug": "thoi-ky-bac-thuoc-lan-2-43-543",
    "name": "Triệu Quốc Đạt",
    "type": "PERSON",
    "tagline": "Nhân vật được truyền thống ghi nhận trong khởi nghĩa Bà Triệu.",
    "description": "Triệu Quốc Đạt thường được kể là anh trai Bà Triệu và người tham gia khởi nghĩa. Thông tin chi tiết về ông chủ yếu xuất hiện trong truyền thống sử Việt.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": true,
    "displayOrder": 2,
    "status": "PUBLISHED",
    "person": {
      "birthYear": null,
      "deathYear": null,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "Triệu Quốc Đạt thường được kể là anh trai Bà Triệu và người tham gia khởi nghĩa. Thông tin chi tiết về ông chủ yếu xuất hiện trong truyền thống sử Việt. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": "Thủ lĩnh khởi nghĩa",
      "titles": []
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/w/index.php?search=Tri%E1%BB%87u%20Qu%E1%BB%91c%20%C4%90%E1%BA%A1t&title=%C4%90%E1%BA%B7c%20bi%E1%BB%87t%3AT%C3%ACm%20ki%E1%BA%BFm"
      ]
    }
  },
  {
    "slug": "luc-dan",
    "periodSlug": "thoi-ky-bac-thuoc-lan-2-43-543",
    "name": "Lục Dận",
    "type": "PERSON",
    "tagline": "Tướng Đông Ngô được cử đến vùng Giao Châu năm 248.",
    "description": "Lục Dận là quan tướng nhà Đông Ngô được giao nhiệm vụ ổn định Giao Châu. Các ghi chép gắn hoạt động của ông với việc dẹp phong trào nổi dậy trong khu vực.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": true,
    "displayOrder": 3,
    "status": "PUBLISHED",
    "person": {
      "birthYear": null,
      "deathYear": null,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "Lục Dận là quan tướng nhà Đông Ngô được giao nhiệm vụ ổn định Giao Châu. Các ghi chép gắn hoạt động của ông với việc dẹp phong trào nổi dậy trong khu vực. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": "Tướng lĩnh",
      "titles": []
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/w/index.php?search=L%E1%BB%A5c%20D%E1%BA%ADn&title=%C4%90%E1%BA%B7c%20bi%E1%BB%87t%3AT%C3%ACm%20ki%E1%BA%BFm"
      ]
    }
  },
  {
    "slug": "si-nhiep",
    "periodSlug": "thoi-ky-bac-thuoc-lan-2-43-543",
    "name": "Sĩ Nhiếp",
    "type": "PERSON",
    "tagline": "Quan cai trị Giao Chỉ có ảnh hưởng lớn cuối thời Đông Hán.",
    "description": "Sĩ Nhiếp giữ chức thái thú Giao Chỉ và duy trì quyền lực tại địa phương trong giai đoạn Trung Hoa phân liệt. Ông mất năm 226.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 4,
    "status": "PUBLISHED",
    "person": {
      "birthYear": 137,
      "deathYear": 226,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "Sĩ Nhiếp giữ chức thái thú Giao Chỉ và duy trì quyền lực tại địa phương trong giai đoạn Trung Hoa phân liệt. Ông mất năm 226. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": "Thái thú",
      "titles": [
        "Sĩ Vương"
      ]
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/S%C4%A9_Nhi%E1%BA%BFp"
      ]
    }
  },
  {
    "slug": "khuong-tang-hoi",
    "periodSlug": "thoi-ky-bac-thuoc-lan-2-43-543",
    "name": "Khương Tăng Hội",
    "type": "PERSON",
    "tagline": "Nhà sư gắn với lịch sử Phật giáo Giao Châu thế kỷ III.",
    "description": "Khương Tăng Hội hoạt động tại Giao Châu trước khi đến Kiến Nghiệp truyền bá Phật giáo. Ông là nhân vật quan trọng trong lịch sử Phật giáo khu vực.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 5,
    "status": "PUBLISHED",
    "person": {
      "birthYear": null,
      "deathYear": 280,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "Khương Tăng Hội hoạt động tại Giao Châu trước khi đến Kiến Nghiệp truyền bá Phật giáo. Ông là nhân vật quan trọng trong lịch sử Phật giáo khu vực. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": "Thiền sư",
      "titles": []
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/w/index.php?search=Kh%C6%B0%C6%A1ng%20T%C4%83ng%20H%E1%BB%99i&title=%C4%90%E1%BA%B7c%20bi%E1%BB%87t%3AT%C3%ACm%20ki%E1%BA%BFm"
      ]
    }
  },
  {
    "slug": "dao-hoang",
    "periodSlug": "thoi-ky-bac-thuoc-lan-2-43-543",
    "name": "Đào Hoàng",
    "type": "PERSON",
    "tagline": "Tướng và quan cai trị Giao Châu cuối thế kỷ III.",
    "description": "Đào Hoàng phục vụ nhà Đông Ngô rồi nhà Tấn và từng quản lý Giao Châu. Hoạt động của ông phản ánh những biến động quyền lực tại khu vực trong thế kỷ III.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 6,
    "status": "PUBLISHED",
    "person": {
      "birthYear": null,
      "deathYear": 290,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "Đào Hoàng phục vụ nhà Đông Ngô rồi nhà Tấn và từng quản lý Giao Châu. Hoạt động của ông phản ánh những biến động quyền lực tại khu vực trong thế kỷ III. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": "Quan lại, tướng lĩnh",
      "titles": []
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/w/index.php?search=%C4%90%C3%A0o%20Ho%C3%A0ng&title=%C4%90%E1%BA%B7c%20bi%E1%BB%87t%3AT%C3%ACm%20ki%E1%BA%BFm"
      ]
    }
  },
  {
    "slug": "den-ba-trieu",
    "periodSlug": "thoi-ky-bac-thuoc-lan-2-43-543",
    "name": "Đền Bà Triệu",
    "type": "LOCATION",
    "tagline": "Di tích thờ nữ anh hùng khởi nghĩa năm 248.",
    "description": "Đền Bà Triệu ở vùng núi Gai, Thanh Hóa, là nơi tưởng niệm Triệu Thị Trinh. Công trình hiện nay được xây dựng và trùng tu sau thời kỳ diễn ra khởi nghĩa.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 7,
    "status": "PUBLISHED",
    "person": null,
    "historicalSite": {
      "siteType": "Đền thờ lịch sử",
      "address": "Khu vực núi Gai, Thanh Hóa",
      "latitude": null,
      "longitude": null,
      "constructionYear": null,
      "constructionLabel": null,
      "preservationStatus": null,
      "recognitionLevel": null,
      "managingAgency": null
    },
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/w/index.php?search=%C4%90%E1%BB%81n%20B%C3%A0%20Tri%E1%BB%87u&title=%C4%90%E1%BA%B7c%20bi%E1%BB%87t%3AT%C3%ACm%20ki%E1%BA%BFm"
      ]
    }
  },
  {
    "slug": "nui-nua",
    "periodSlug": "thoi-ky-bac-thuoc-lan-2-43-543",
    "name": "Núi Nưa",
    "type": "LOCATION",
    "tagline": "Địa danh gắn với truyền thuyết hoạt động của Bà Triệu.",
    "description": "Núi Nưa thuộc Thanh Hóa, được dân gian gắn với việc tập hợp lực lượng của Bà Triệu. Các chi tiết truyền thuyết cần được phân biệt với chứng cứ lịch sử.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 8,
    "status": "PUBLISHED",
    "person": null,
    "historicalSite": {
      "siteType": "Địa danh lịch sử",
      "address": "Khu vực núi Nưa, Thanh Hóa",
      "latitude": null,
      "longitude": null,
      "constructionYear": null,
      "constructionLabel": null,
      "preservationStatus": null,
      "recognitionLevel": null,
      "managingAgency": null
    },
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/w/index.php?search=N%C3%BAi%20N%C6%B0a&title=%C4%90%E1%BA%B7c%20bi%E1%BB%87t%3AT%C3%ACm%20ki%E1%BA%BFm"
      ]
    }
  },
  {
    "slug": "chua-dau",
    "periodSlug": "thoi-ky-bac-thuoc-lan-2-43-543",
    "name": "Chùa Dâu",
    "type": "LOCATION",
    "tagline": "Trung tâm Phật giáo cổ tại vùng Luy Lâu.",
    "description": "Chùa Dâu ở Bắc Ninh gắn với sự phát triển sớm của Phật giáo tại Giao Châu. Các kiến trúc hiện tồn là kết quả của nhiều giai đoạn xây dựng và tu bổ.",
    "aliases": [
      "Diên Ứng tự"
    ],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 9,
    "status": "PUBLISHED",
    "person": null,
    "historicalSite": {
      "siteType": "Chùa cổ",
      "address": "Khu vực Thuận Thành, Bắc Ninh",
      "latitude": null,
      "longitude": null,
      "constructionYear": null,
      "constructionLabel": null,
      "preservationStatus": null,
      "recognitionLevel": null,
      "managingAgency": null
    },
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/Ch%C3%B9a_D%C3%A2u"
      ]
    }
  },
  {
    "slug": "luc-luong-khoi-nghia-ba-trieu",
    "periodSlug": "thoi-ky-bac-thuoc-lan-2-43-543",
    "name": "Lực lượng khởi nghĩa Bà Triệu",
    "type": "MILITARY_FORCE",
    "tagline": "Lực lượng chống chính quyền Đông Ngô năm 248.",
    "description": "Phong trào nổi dậy tại Cửu Chân gắn với Bà Triệu. Quy mô và thành phần cụ thể không thể khôi phục đầy đủ từ các ghi chép còn lại.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 10,
    "status": "PUBLISHED",
    "person": null,
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/Kh%E1%BB%9Fi_ngh%C4%A9a_B%C3%A0_Tri%E1%BB%87u"
      ]
    }
  },
  {
    "slug": "chinh-quyen-dong-ngo-tai-giao-chau",
    "periodSlug": "thoi-ky-bac-thuoc-lan-2-43-543",
    "name": "Chính quyền Đông Ngô tại Giao Châu",
    "type": "ORGANIZATION",
    "tagline": "Bộ máy cai trị của Đông Ngô tại khu vực Giao Châu.",
    "description": "Trong thời Tam Quốc, Đông Ngô kiểm soát Giao Châu qua các quan chức và lực lượng quân sự. Chính sách cai trị và các cuộc nổi dậy tạo nên nhiều biến động trong thế kỷ III.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 11,
    "status": "PUBLISHED",
    "person": null,
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/%C4%90%C3%B4ng_Ng%C3%B4"
      ]
    }
  },
  {
    "slug": "ly-bi",
    "periodSlug": "thoi-ky-nha-tien-ly-544-602",
    "name": "Lý Bí",
    "type": "PERSON",
    "tagline": "Người lập nước Vạn Xuân và xưng đế năm 544.",
    "description": "Lý Bí lãnh đạo khởi nghĩa chống nhà Lương năm 542 và lập chính quyền độc lập. Ông xưng Lý Nam Đế năm 544, đặt quốc hiệu Vạn Xuân.",
    "aliases": [
      "Lý Bôn"
    ],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": true,
    "displayOrder": 1,
    "status": "PUBLISHED",
    "person": {
      "birthYear": null,
      "deathYear": 548,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "Lý Bí lãnh đạo khởi nghĩa chống nhà Lương năm 542 và lập chính quyền độc lập. Ông xưng Lý Nam Đế năm 544, đặt quốc hiệu Vạn Xuân. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": "Hoàng đế",
      "titles": [
        "Lý Nam Đế"
      ]
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/L%C3%BD_Nam_%C4%90%E1%BA%BF"
      ]
    }
  },
  {
    "slug": "trieu-quang-phuc",
    "periodSlug": "thoi-ky-nha-tien-ly-544-602",
    "name": "Triệu Quang Phục",
    "type": "PERSON",
    "tagline": "Thủ lĩnh kháng chiến chống quân Lương, sau xưng Triệu Việt Vương.",
    "description": "Triệu Quang Phục tiếp tục chống quân Lương sau khi Lý Nam Đế rút lui. Ông gắn với căn cứ Dạ Trạch và nắm quyền trong một giai đoạn của nước Vạn Xuân.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": true,
    "displayOrder": 2,
    "status": "PUBLISHED",
    "person": {
      "birthYear": null,
      "deathYear": 571,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "Triệu Quang Phục tiếp tục chống quân Lương sau khi Lý Nam Đế rút lui. Ông gắn với căn cứ Dạ Trạch và nắm quyền trong một giai đoạn của nước Vạn Xuân. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": "Vua, tướng lĩnh",
      "titles": [
        "Triệu Việt Vương"
      ]
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/Tri%E1%BB%87u_Vi%E1%BB%87t_V%C6%B0%C6%A1ng"
      ]
    }
  },
  {
    "slug": "ly-phat-tu",
    "periodSlug": "thoi-ky-nha-tien-ly-544-602",
    "name": "Lý Phật Tử",
    "type": "PERSON",
    "tagline": "Người cai trị Vạn Xuân cuối thời Tiền Lý.",
    "description": "Lý Phật Tử giành quyền sau cuộc xung đột với Triệu Việt Vương. Năm 602, quân nhà Tùy tiến đánh và ông đầu hàng, chấm dứt chính quyền Vạn Xuân.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": true,
    "displayOrder": 3,
    "status": "PUBLISHED",
    "person": {
      "birthYear": null,
      "deathYear": null,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "Lý Phật Tử giành quyền sau cuộc xung đột với Triệu Việt Vương. Năm 602, quân nhà Tùy tiến đánh và ông đầu hàng, chấm dứt chính quyền Vạn Xuân. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": "Vua",
      "titles": [
        "Hậu Lý Nam Đế"
      ]
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/L%C3%BD_Ph%E1%BA%ADt_T%E1%BB%AD"
      ]
    }
  },
  {
    "slug": "pham-tu",
    "periodSlug": "thoi-ky-nha-tien-ly-544-602",
    "name": "Phạm Tu",
    "type": "PERSON",
    "tagline": "Tướng tham gia khởi nghĩa Lý Bí chống nhà Lương.",
    "description": "Phạm Tu được truyền thống sử Việt ghi nhận là võ tướng có công giúp Lý Bí. Các ghi chép về tiểu sử ông có những điểm chưa thống nhất.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 4,
    "status": "PUBLISHED",
    "person": {
      "birthYear": null,
      "deathYear": 545,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "Phạm Tu được truyền thống sử Việt ghi nhận là võ tướng có công giúp Lý Bí. Các ghi chép về tiểu sử ông có những điểm chưa thống nhất. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": "Tướng lĩnh",
      "titles": []
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/Ph%E1%BA%A1m_Tu"
      ]
    }
  },
  {
    "slug": "tinh-thieu",
    "periodSlug": "thoi-ky-nha-tien-ly-544-602",
    "name": "Tinh Thiều",
    "type": "PERSON",
    "tagline": "Nhân vật tham gia xây dựng chính quyền Lý Bí.",
    "description": "Tinh Thiều được sử Việt ghi nhận là người hỗ trợ Lý Bí trong cuộc khởi nghĩa và việc tổ chức chính quyền. Thông tin tiểu sử còn hạn chế.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 5,
    "status": "PUBLISHED",
    "person": {
      "birthYear": null,
      "deathYear": null,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "Tinh Thiều được sử Việt ghi nhận là người hỗ trợ Lý Bí trong cuộc khởi nghĩa và việc tổ chức chính quyền. Thông tin tiểu sử còn hạn chế. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": "Quan lại",
      "titles": []
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/w/index.php?search=Tinh%20Thi%E1%BB%81u&title=%C4%90%E1%BA%B7c%20bi%E1%BB%87t%3AT%C3%ACm%20ki%E1%BA%BFm"
      ]
    }
  },
  {
    "slug": "tran-ba-tien",
    "periodSlug": "thoi-ky-nha-tien-ly-544-602",
    "name": "Trần Bá Tiên",
    "type": "PERSON",
    "tagline": "Tướng nhà Lương tiến đánh lực lượng Lý Nam Đế.",
    "description": "Trần Bá Tiên chỉ huy chiến dịch của nhà Lương chống chính quyền Vạn Xuân. Sau này ông sáng lập nhà Trần tại Trung Quốc.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 6,
    "status": "PUBLISHED",
    "person": {
      "birthYear": 503,
      "deathYear": 559,
      "birthDateLabel": null,
      "deathDateLabel": null,
      "biography": "Trần Bá Tiên chỉ huy chiến dịch của nhà Lương chống chính quyền Vạn Xuân. Sau này ông sáng lập nhà Trần tại Trung Quốc. Những chi tiết chưa được tư liệu đương thời xác nhận cần được xem xét thận trọng.",
      "occupation": "Tướng lĩnh, hoàng đế",
      "titles": [
        "Trần Vũ Đế"
      ]
    },
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/Tr%E1%BA%A7n_B%C3%A1_Ti%C3%AAn"
      ]
    }
  },
  {
    "slug": "da-trach",
    "periodSlug": "thoi-ky-nha-tien-ly-544-602",
    "name": "Dạ Trạch",
    "type": "LOCATION",
    "tagline": "Vùng đầm lầy gắn với chiến thuật kháng chiến của Triệu Quang Phục.",
    "description": "Dạ Trạch tại Hưng Yên gắn với căn cứ chống quân Lương của Triệu Quang Phục. Vị trí cụ thể của doanh trại cổ không được xác định chính xác.",
    "aliases": [
      "Đầm Dạ Trạch"
    ],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 7,
    "status": "PUBLISHED",
    "person": null,
    "historicalSite": {
      "siteType": "Căn cứ kháng chiến",
      "address": "Khu vực Khoái Châu, Hưng Yên",
      "latitude": null,
      "longitude": null,
      "constructionYear": null,
      "constructionLabel": null,
      "preservationStatus": null,
      "recognitionLevel": null,
      "managingAgency": null
    },
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/w/index.php?search=D%E1%BA%A1%20Tr%E1%BA%A1ch&title=%C4%90%E1%BA%B7c%20bi%E1%BB%87t%3AT%C3%ACm%20ki%E1%BA%BFm"
      ]
    }
  },
  {
    "slug": "chua-tran-quoc",
    "periodSlug": "thoi-ky-nha-tien-ly-544-602",
    "name": "Chùa Trấn Quốc",
    "type": "LOCATION",
    "tagline": "Ngôi chùa gắn theo truyền thống với thời Lý Nam Đế.",
    "description": "Truyền thống ghi nhận tiền thân chùa Trấn Quốc được lập vào thế kỷ VI với tên Khai Quốc. Ngôi chùa hiện nay đã di chuyển địa điểm và trải qua nhiều lần trùng tu.",
    "aliases": [
      "Chùa Khai Quốc"
    ],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 8,
    "status": "PUBLISHED",
    "person": null,
    "historicalSite": {
      "siteType": "Chùa cổ",
      "address": "Hồ Tây, Hà Nội",
      "latitude": null,
      "longitude": null,
      "constructionYear": null,
      "constructionLabel": "Theo truyền thống: thế kỷ VI",
      "preservationStatus": null,
      "recognitionLevel": null,
      "managingAgency": null
    },
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/Ch%C3%B9a_Tr%E1%BA%A5n_Qu%E1%BB%91c"
      ]
    }
  },
  {
    "slug": "thanh-long-bien",
    "periodSlug": "thoi-ky-nha-tien-ly-544-602",
    "name": "Thành Long Biên",
    "type": "LOCATION",
    "tagline": "Châu thành trung tâm chính trị của Giao Châu thời Bắc thuộc và nơi nghĩa quân Lý Bí giải phóng mùa xuân 542.",
    "description": "Thành Long Biên là trị sở của Giao Châu dưới các triều đại đô hộ phương Bắc, đặc biệt là triều Lương thế kỷ VI. Mùa xuân năm 542, nghĩa quân Lý Bí tiến đánh giải phóng thành Long Biên, đuổi Thứ sử Tiêu Tư bỏ chạy về nước, mở đầu trang sử độc lập tự chủ của nhà Tiền Lý.",
    "aliases": [
      "Châu thành Long Biên",
      "Long Biên cổ thành"
    ],
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Long_Bien_Bridge_2019.jpg/800px-Long_Bien_Bridge_2019.jpg",
    "imageCaption": "Khu vực địa vực lịch sử Long Biên bên bờ sông Hồng",
    "isFeatured": true,
    "displayOrder": 8,
    "status": "PUBLISHED",
    "person": null,
    "historicalSite": {
      "siteType": "Thành lũy / Trị sở lịch sử",
      "address": "Vùng tả ngạn sông Hồng (nay thuộc khu vực Bắc Ninh - Hà Nội)",
      "latitude": 21.05,
      "longitude": 105.88,
      "constructionYear": null,
      "constructionLabel": "Thế kỷ VI",
      "preservationStatus": "Địa vực khảo cổ lịch sử",
      "recognitionLevel": "Di tích Lịch sử Đặc biệt",
      "managingAgency": "UBND TP. Hà Nội"
    },
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/Long_Bi%C3%AAn_(th%E1%BB%9Di_B%E1%BA%AFc_thu%E1%BB%99c)"
      ]
    }
  },
  {
    "slug": "cua-song-to-lich",
    "periodSlug": "thoi-ky-nha-tien-ly-544-602",
    "name": "Cửa sông Tô Lịch",
    "type": "LOCATION",
    "tagline": "Địa vực gắn với trung tâm quyền lực Vạn Xuân trong sử liệu.",
    "description": "Khu vực sông Tô Lịch và vùng Hà Nội cổ được nhắc đến trong bối cảnh chính quyền Lý Bí. Không thể đồng nhất chính xác một vị trí hiện đại với toàn bộ trung tâm chính trị thế kỷ VI.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 9,
    "status": "PUBLISHED",
    "person": null,
    "historicalSite": {
      "siteType": "Địa vực lịch sử",
      "address": "Hà Nội",
      "latitude": null,
      "longitude": null,
      "constructionYear": null,
      "constructionLabel": null,
      "preservationStatus": null,
      "recognitionLevel": null,
      "managingAgency": null
    },
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/S%C3%B4ng_T%C3%B4_L%E1%BB%8Bch"
      ]
    }
  },
  {
    "slug": "nha-tien-ly",
    "periodSlug": "thoi-ky-nha-tien-ly-544-602",
    "name": "Nhà Tiền Lý",
    "type": "DYNASTY",
    "tagline": "Chính quyền do Lý Bí khởi lập trong thời kỳ Vạn Xuân.",
    "description": "Lý Bí xưng đế năm 544, đánh dấu việc thiết lập chính quyền Vạn Xuân. Lịch sử giai đoạn này bao gồm sự kế tục và tranh chấp quyền lực giữa các thủ lĩnh.",
    "aliases": [
      "Tiền Lý"
    ],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 10,
    "status": "PUBLISHED",
    "person": null,
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/Nh%C3%A0_Ti%E1%BB%81n_L%C3%BD"
      ]
    }
  },
  {
    "slug": "nuoc-van-xuan",
    "periodSlug": "thoi-ky-nha-tien-ly-544-602",
    "name": "Nước Vạn Xuân",
    "type": "ORGANIZATION",
    "tagline": "Quốc hiệu gắn với chính quyền tự chủ thế kỷ VI.",
    "description": "Vạn Xuân là quốc hiệu được Lý Nam Đế đặt năm 544. Chính quyền trải qua chiến tranh với nhà Lương, biến động nội bộ và kết thúc khi nhà Tùy tiến quân năm 602.",
    "aliases": [],
    "imageUrl": null,
    "imageCaption": null,
    "isFeatured": false,
    "displayOrder": 11,
    "status": "PUBLISHED",
    "person": null,
    "historicalSite": null,
    "metadata": {
      "sources": [
        "https://vi.wikipedia.org/wiki/V%E1%BA%A1n_Xu%C3%A2n"
      ]
    }
  },
{
  "slug": "dinh-doc-lap-hoi-truong-thong-nhat",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "name": "Dinh Độc Lập (Hội trường Thống Nhất)",
  "type": "LOCATION",
  "tagline": "Nơi xe tăng 843 và 390 húc đổ cổng trưa 30/04/1975, đánh dấu thời khắc toàn thắng của Chiến dịch Hồ Chí Minh.",
  "description": "Dinh Độc Lập, nơi xe tăng 843 và 390 húc đổ cổng chính trưa 30/04/1975, đánh dấu thời khắc kết thúc chiến tranh và thống nhất đất nước.",
  "aliases": [
    "Dinh Norodom",
    "Dinh Độc Lập",
    "Hội trường Thống Nhất"
  ],
  "imageUrl": null,
  "imageCaption": null,
  "isFeatured": false,
  "displayOrder": 0,
  "status": "PUBLISHED",
  "person": null,
  "historicalSite": {
    "siteType": "MONUMENT",
    "address": "135 Nam Kỳ Khởi Nghĩa, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh",
    "latitude": 10.777,
    "longitude": 106.6953,
    "constructionYear": null,
    "constructionLabel": null,
    "preservationStatus": null,
    "recognitionLevel": null,
    "managingAgency": null
  },
  "metadata": {
    "sources": [
      "https://vi.wikipedia.org/wiki/Dinh_%C4%90%E1%BB%99c_L%E1%BA%ADp"
    ]
  }
},
{
  "slug": "hoang-thanh-thang-long-ham-chi-huy-tac-chien-t1",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "name": "Hoàng thành Thăng Long - Hầm chỉ huy tác chiến T1",
  "type": "LOCATION",
  "tagline": "Nơi Bộ Chính trị và Quân ủy Trung ương trực tiếp chỉ đạo chống chiến tranh phá hoại miền Bắc và hạ quyết tâm giải phóng miền Nam.",
  "description": "Nhà D67 trong khu di tích Hoàng thành Thăng Long, nơi Bộ Chính trị và Quân ủy Trung ương trực tiếp chỉ đạo cuộc kháng chiến chống Mỹ giai đoạn 1968-1975.",
  "aliases": [
    "Tổng hành dinh Quân đội Nhân dân Việt Nam (Nhà D67)"
  ],
  "imageUrl": null,
  "imageCaption": null,
  "isFeatured": false,
  "displayOrder": 0,
  "status": "PUBLISHED",
  "person": null,
  "historicalSite": {
    "siteType": "ANCIENT_CAPITAL",
    "address": "19C Hoàng Diệu, Quận Ba Đình, TP. Hà Nội",
    "latitude": 21.0347,
    "longitude": 105.8407,
    "constructionYear": null,
    "constructionLabel": null,
    "preservationStatus": null,
    "recognitionLevel": null,
    "managingAgency": null
  },
  "metadata": {
    "sources": [
      "https://vi.wikipedia.org/wiki/Ho%C3%A0ng_th%C3%A0nh_Th%C4%83ng_Long"
    ]
  }
},
{
  "slug": "khu-di-tich-dong-khoi-ben-tre",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "name": "Khu di tích Đồng Khởi Bến Tre",
  "type": "LOCATION",
  "tagline": "Cái nôi của phong trào Đồng Khởi năm 1960 mở bước ngoặt chuyển cách mạng miền Nam từ thế giữ gìn lực lượng sang thế tiến công.",
  "description": "Nơi khởi phát phong trào Đồng Khởi năm 1960 tại xã Định Thủy, huyện Mỏ Cày, Bến Tre, mở đầu cao trào nổi dậy của nhân dân miền Nam.",
  "aliases": [
    "Định Thủy - Mỏ Cày"
  ],
  "imageUrl": null,
  "imageCaption": null,
  "isFeatured": false,
  "displayOrder": 0,
  "status": "PUBLISHED",
  "person": null,
  "historicalSite": {
    "siteType": "MONUMENT",
    "address": "Xã Định Thủy, Huyện Mỏ Cày Nam, Tỉnh Bến Tre",
    "latitude": 10.1235,
    "longitude": 106.3328,
    "constructionYear": null,
    "constructionLabel": null,
    "preservationStatus": null,
    "recognitionLevel": null,
    "managingAgency": null
  },
  "metadata": {
    "sources": [
      "https://vi.wikipedia.org/wiki/%C4%90%E1%BB%93ng_Kh%E1%BB%9Fi"
    ]
  }
},
{
  "slug": "doi-bo-hien-luong-ben-hai-vi-tuyen-17",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "name": "Đôi bờ Hiền Lương - Bến Hải (Vĩ tuyến 17)",
  "type": "LOCATION",
  "tagline": "Chứng nhân lịch sử 21 năm chia cắt hai miền Nam - Bắc và khát vọng thống nhất non sông của dân tộc Việt Nam.",
  "description": "Sông Bến Hải và cầu Hiền Lương tại vĩ tuyến 17 là giới tuyến quân sự tạm thời chia cắt hai miền Nam - Bắc Việt Nam suốt 21 năm (1954-1975).",
  "aliases": [
    "Giới tuyến quân sự tạm thời Vĩ tuyến 17"
  ],
  "imageUrl": null,
  "imageCaption": null,
  "isFeatured": false,
  "displayOrder": 0,
  "status": "PUBLISHED",
  "person": null,
  "historicalSite": {
    "siteType": "MONUMENT",
    "address": "Xã Hiền Thành, Huyện Vĩnh Linh, Tỉnh Quảng Trị",
    "latitude": 17.0044,
    "longitude": 107.0514,
    "constructionYear": null,
    "constructionLabel": null,
    "preservationStatus": null,
    "recognitionLevel": null,
    "managingAgency": null
  },
  "metadata": {
    "sources": [
      "https://vi.wikipedia.org/wiki/C%E1%BA%A7u_Hi%E1%BB%81n_L%C6%B0%C6%A1ng"
    ]
  }
},
{
  "slug": "thanh-co-quang-tri",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "name": "Thành cổ Quảng Trị",
  "type": "LOCATION",
  "tagline": "Biểu tượng bất tử của 81 ngày đêm chiến đấu bảo vệ Thành cổ mùa hè đỏ lửa năm 1972, góp phần quyết định trên bàn đàm phán Paris.",
  "description": "Thành cổ Quảng Trị là nơi diễn ra 81 ngày đêm chiến đấu ác liệt bảo vệ thành năm 1972, góp phần tạo thế mạnh trên bàn đàm phán Paris.",
  "aliases": [
    "Thành Đinh Công Tráng"
  ],
  "imageUrl": null,
  "imageCaption": null,
  "isFeatured": false,
  "displayOrder": 0,
  "status": "PUBLISHED",
  "person": null,
  "historicalSite": {
    "siteType": "CITADEL",
    "address": "Phường 2, Thị xã Quảng Trị, Tỉnh Quảng Trị",
    "latitude": 16.7503,
    "longitude": 107.1872,
    "constructionYear": null,
    "constructionLabel": null,
    "preservationStatus": null,
    "recognitionLevel": null,
    "managingAgency": null
  },
  "metadata": {
    "sources": [
      "https://vi.wikipedia.org/wiki/Th%C3%A0nh_c%E1%BB%95_Qu%E1%BA%A3ng_Tr%E1%BB%8B"
    ]
  }
},
{
  "slug": "khu-di-tich-lich-su-dia-dao-cu-chi",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "name": "Khu di tích lịch sử Địa đạo Củ Chi",
  "type": "LOCATION",
  "tagline": "Hệ thống phòng tuyến ngầm dài hơn 250km kiên cường bám trụ sát nách sào huyệt Sài Gòn suốt thời kỳ kháng chiến chống Mỹ.",
  "description": "Hệ thống địa đạo dài hơn 250km tại Củ Chi, là căn cứ bám trụ và chiến đấu sát nách Sài Gòn suốt thời kỳ kháng chiến chống Mỹ.",
  "aliases": [
    "Đất thép thành đồng Củ Chi"
  ],
  "imageUrl": null,
  "imageCaption": null,
  "isFeatured": false,
  "displayOrder": 0,
  "status": "PUBLISHED",
  "person": null,
  "historicalSite": {
    "siteType": "BATTLEFIELD",
    "address": "Ấp Phú Hiệp, Xã Phú Mỹ Hưng, Huyện Củ Chi, TP. Hồ Chí Minh",
    "latitude": 11.1414,
    "longitude": 106.4625,
    "constructionYear": null,
    "constructionLabel": null,
    "preservationStatus": null,
    "recognitionLevel": null,
    "managingAgency": null
  },
  "metadata": {
    "sources": [
      "https://vi.wikipedia.org/wiki/%C4%90%E1%BB%8Ba_%C4%91%E1%BA%A1o_C%E1%BB%A7_Chi"
    ]
  }
},
{
  "slug": "chu-tich-ho-chi-minh",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "name": "Chủ tịch Hồ Chí Minh",
  "type": "PERSON",
  "tagline": "Lãnh tụ vĩ đại của dân tộc Việt Nam",
  "description": "Chủ tịch Hồ Chí Minh sáng lập và rèn luyện Đảng Cộng sản Việt Nam, khai sinh nước Việt Nam Dân chủ Cộng hòa năm 1945, và trực tiếp lãnh đạo cuộc kháng chiến chống Mỹ cho đến khi qua đời năm 1969.",
  "aliases": [],
  "imageUrl": "/assets/figures/ho-chi-minh.jpg",
  "imageCaption": null,
  "isFeatured": true,
  "displayOrder": 1,
  "status": "PUBLISHED",
  "person": {
    "birthYear": 1890,
    "deathYear": 1969,
    "birthDateLabel": null,
    "deathDateLabel": null,
    "biography": "Người sáng lập, rèn luyện Đảng Cộng sản Việt Nam, khai sinh nước Việt Nam Dân chủ Cộng hòa và lãnh đạo cuộc kháng chiến giải phóng dân tộc.",
    "occupation": null,
    "titles": []
  },
  "historicalSite": null,
  "metadata": {
    "sources": [
      "https://vi.wikipedia.org/wiki/H%E1%BB%93_Ch%C3%AD_Minh"
    ]
  }
},
{
  "slug": "dai-tuong-vo-nguyen-giap",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "name": "Đại tướng Võ Nguyên Giáp",
  "type": "PERSON",
  "tagline": "Tổng tư lệnh tối cao Quân đội Nhân dân Việt Nam",
  "description": "Đại tướng đầu tiên của Quân đội Nhân dân Việt Nam, Tổng tư lệnh tối cao trong suốt hai cuộc kháng chiến, người ra bức điện lịch sử \"Thần tốc, táo bạo, bất ngờ, chắc thắng\" mở màn Chiến dịch Hồ Chí Minh năm 1975.",
  "aliases": [],
  "imageUrl": "/assets/figures/vo-nguyen-giap.jpg",
  "imageCaption": null,
  "isFeatured": true,
  "displayOrder": 2,
  "status": "PUBLISHED",
  "person": {
    "birthYear": 1911,
    "deathYear": 2013,
    "birthDateLabel": null,
    "deathDateLabel": null,
    "biography": "Vị Đại tướng đầu tiên, Tổng tư lệnh Quân đội Nhân dân Việt Nam, người ra bức điện lịch sử \"Thần tốc, táo bạo\" trong Đại thắng mùa Xuân 1975.",
    "occupation": null,
    "titles": []
  },
  "historicalSite": null,
  "metadata": {
    "sources": [
      "https://vi.wikipedia.org/wiki/V%C3%B5_Nguy%C3%AAn_Gi%C3%A1p"
    ]
  }
},
{
  "slug": "nu-tuong-nguyen-thi-dinh",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "name": "Nữ tướng Nguyễn Thị Định",
  "type": "PERSON",
  "tagline": "Linh hồn phong trào Đồng Khởi Bến Tre & Đội quân tóc dài",
  "description": "Nữ tướng đầu tiên của Quân đội Nhân dân Việt Nam, người lãnh đạo trực tiếp phong trào Đồng Khởi tại Bến Tre năm 1960 và giữ chức Phó Tư lệnh Quân giải phóng miền Nam Việt Nam.",
  "aliases": [],
  "imageUrl": "/assets/figures/nguyen-thi-dinh.jpg",
  "imageCaption": null,
  "isFeatured": true,
  "displayOrder": 3,
  "status": "PUBLISHED",
  "person": {
    "birthYear": 1920,
    "deathYear": 1992,
    "birthDateLabel": null,
    "deathDateLabel": null,
    "biography": "Nữ tướng đầu tiên của Quân đội Nhân dân Việt Nam, Phó Tư lệnh Quân giải phóng miền Nam Việt Nam.",
    "occupation": null,
    "titles": []
  },
  "historicalSite": null,
  "metadata": {
    "sources": [
      "https://vi.wikipedia.org/wiki/Nguy%E1%BB%85n_Th%E1%BB%8B_%C4%90%E1%BB%8Bnh"
    ]
  }
},
{
  "slug": "dai-tuong-van-tien-dung",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "name": "Đại tướng Văn Tiến Dũng",
  "type": "PERSON",
  "tagline": "Tư lệnh Chiến dịch Hồ Chí Minh lịch sử (1975)",
  "description": "Tổng Tham mưu trưởng Quân đội Nhân dân Việt Nam, trực tiếp chỉ huy Chiến dịch Tây Nguyên và là Tư lệnh Chiến dịch Hồ Chí Minh lịch sử năm 1975.",
  "aliases": [],
  "imageUrl": "/assets/figures/van-tien-dung.jpg",
  "imageCaption": null,
  "isFeatured": true,
  "displayOrder": 4,
  "status": "PUBLISHED",
  "person": {
    "birthYear": 1917,
    "deathYear": 2002,
    "birthDateLabel": null,
    "deathDateLabel": null,
    "biography": "Tổng Tham mưu trưởng Quân đội Nhân dân Việt Nam, trực tiếp chỉ huy Chiến dịch Tây Nguyên và Chiến dịch Hồ Chí Minh toàn thắng.",
    "occupation": null,
    "titles": []
  },
  "historicalSite": null,
  "metadata": {
    "sources": [
      "https://vi.wikipedia.org/wiki/V%C4%83n_Ti%E1%BA%BFn_D%C5%A9ng"
    ]
  }
},
{
  "slug": "nha-ngoai-giao-nguyen-thi-binh",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "name": "Nhà ngoại giao Nguyễn Thị Bình",
  "type": "PERSON",
  "tagline": "Trưởng phái đoàn đàm phán tại Hội nghị Paris (1968 - 1973)",
  "description": "Bộ trưởng Ngoại giao Chính phủ Cách mạng lâm thời Cộng hòa miền Nam Việt Nam, Trưởng đoàn đàm phán và là người đặt bút ký Hiệp định Paris năm 1973.",
  "aliases": [],
  "imageUrl": "/assets/figures/nguyen-thi-binh.jpg",
  "imageCaption": null,
  "isFeatured": true,
  "displayOrder": 5,
  "status": "PUBLISHED",
  "person": {
    "birthYear": 1927,
    "deathYear": null,
    "birthDateLabel": null,
    "deathDateLabel": null,
    "biography": "Bộ trưởng Ngoại giao Chính phủ Cách mạng lâm thời Cộng hòa miền Nam Việt Nam, đặt bút ký Hiệp định Paris 1973.",
    "occupation": null,
    "titles": []
  },
  "historicalSite": null,
  "metadata": {
    "sources": [
      "https://vi.wikipedia.org/wiki/Nguy%E1%BB%85n_Th%E1%BB%8B_B%C3%ACnh"
    ]
  }
},
{
  "slug": "dai-tuong-nguyen-chi-thanh",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "name": "Đại tướng Nguyễn Chí Thanh",
  "type": "PERSON",
  "tagline": "Chính ủy Quân giải phóng miền Nam Việt Nam",
  "description": "Chính ủy Quân giải phóng miền Nam Việt Nam, người đề ra phương châm \"Nắm thắt lưng địch mà đánh\" trong giai đoạn chống chiến lược Chiến tranh cục bộ của Mỹ.",
  "aliases": [],
  "imageUrl": "/assets/figures/nguyen-chi-thanh.jpg",
  "imageCaption": null,
  "isFeatured": true,
  "displayOrder": 6,
  "status": "PUBLISHED",
  "person": {
    "birthYear": 1914,
    "deathYear": 1967,
    "birthDateLabel": null,
    "deathDateLabel": null,
    "biography": "Người đề ra phương châm \"Nắm thắt lưng địch mà đánh\", góp phần quyết định đánh bại chiến lược Chiến tranh cục bộ của đế quốc Mỹ.",
    "occupation": null,
    "titles": []
  },
  "historicalSite": null,
  "metadata": {
    "sources": [
      "https://vi.wikipedia.org/wiki/Nguy%E1%BB%85n_Ch%C3%AD_Thanh"
    ]
  }
},
{
  "slug": "doan-559-bo-doi-truong-son",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "name": "Đoàn 559 - Bộ đội Trường Sơn",
  "type": "MILITARY_FORCE",
  "tagline": "Lực lượng mở đường và bảo đảm chi viện chiến lược Trường Sơn",
  "description": "Đơn vị vận tải quân sự chiến lược, thành lập ngày 19/05/1959, phụ trách mở và bảo vệ tuyến đường mòn Hồ Chí Minh xuyên Trường Sơn chi viện cho chiến trường miền Nam suốt 16 năm.",
  "aliases": [],
  "imageUrl": null,
  "imageCaption": null,
  "isFeatured": false,
  "displayOrder": 7,
  "status": "PUBLISHED",
  "person": null,
  "historicalSite": null,
  "metadata": {
    "sources": [
      "https://vi.wikipedia.org/wiki/%C4%90o%C3%A0n_559"
    ],
    "foundedYear": 1959,
    "retiredYear": 1975
  }
},
{
  "slug": "xe-tang-t-54b-so-hieu-843-va-390",
  "periodSlug": "khang-chien-chong-my-cuu-nuoc-1954-1975",
  "name": "Xe tăng T-54B số hiệu 843 & 390",
  "type": "ARTIFACT",
  "tagline": "Bảo vật quốc gia húc đổ cổng Dinh Độc Lập trưa 30/04/1975",
  "description": "Hai xe tăng thuộc Lữ đoàn Tăng thiết giáp 203, Quân đoàn 2, dẫn đầu đội hình tiến vào húc đổ cổng Dinh Độc Lập trưa 30/04/1975, hiện được công nhận là Bảo vật quốc gia.",
  "aliases": [],
  "imageUrl": null,
  "imageCaption": null,
  "isFeatured": false,
  "displayOrder": 8,
  "status": "PUBLISHED",
  "person": null,
  "historicalSite": null,
  "metadata": {
    "sources": [
      "https://vi.wikipedia.org/wiki/S%E1%BB%B1_ki%E1%BB%87n_30_th%C3%A1ng_4_n%C4%83m_1975"
    ],
    "foundedYear": 1975,
    "retiredYear": null
  }
}
];

export class EntityCatalogBuilder {
  public static buildCatalog(): IEntitySeedRecord[] {
    return RAW_ENTITIES;
  }
}
