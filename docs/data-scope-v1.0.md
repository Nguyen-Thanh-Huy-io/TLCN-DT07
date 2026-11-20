# DATA SCOPE v1.0 — PHẠM VI DỮ LIỆU DỰ ÁN PILOT

> **Trạng thái:** ĐÃ CHỐT PHẠM VI CHÍNH THỨC  
> **Ngày phê duyệt:** 02/11/2026  
> **Áp dụng cho:** Giai đoạn Pilot Xây dựng Cơ sở Dữ liệu Tri thức Lịch sử (TLCN-DT07)  
> **Quy tắc hiệu lực:** Các bước triển khai tiếp theo bắt buộc phải tuân theo phạm vi này, trừ khi có quyết định điều chỉnh bằng văn bản mới.

---

## 1. Mục tiêu Dự án

Xây dựng tập dữ liệu lịch sử có cấu trúc chuẩn hóa, có khả năng kiểm chứng học thuật và liên kết đa chiều, phục vụ:
1. **Tra cứu thông tin:** Tra cứu thông tin lịch sử Việt Nam và thế giới đa chiều.
2. **Timeline tự động:** Tạo timeline tổng hợp động theo nhân vật, sự kiện và thời kỳ (không lưu cứng timeline).
3. **Knowledge Graph:** Xây dựng đồ thị tri thức lịch sử kết nối các node.
4. **Truy vấn quan hệ:** Khai thác quan hệ giữa nhân vật, tổ chức, quốc gia, sự kiện và địa điểm.
5. **Truy xuất nguồn gốc:** Truy xuất nguồn tham khảo và trích dẫn cụ thể của từng nhận định lịch sử.
6. **Khả năng mở rộng:** Mở rộng dữ liệu mà không làm thay đổi kiến trúc cốt lõi.

> [!IMPORTANT]
> **Định hướng chiến lược:** Xây dựng **Cơ sở dữ liệu Tri thức Lịch sử (Historical Knowledge Base)**, không đơn thuần là cơ sở dữ liệu bài viết hay tin tức lịch sử.

---

## 2. Phạm vi Địa lý

- **Quyết định:** `Both` (Cả Việt Nam và Quốc tế).
- **Phạm vi bao phủ:**
  - Lịch sử Việt Nam.
  - Các quốc gia và khu vực tiêu biểu trên thế giới.
- **Nguyên tắc triển khai:**
  - Ưu tiên xây dựng và kiểm thử bằng tập dữ liệu Việt Nam.
  - Đưa dữ liệu thế giới vào ngay trong Pilot để kiểm chứng tính phổ quát và khả năng thích ứng của schema.
  - **Không** thiết kế schema riêng biệt cho từng quốc gia.
  - Dùng chung chuẩn định danh, quy ước niên đại thiên văn (BCE/CE), mô hình quan hệ Statement và nguồn tham chiếu.

---

## 3. Phạm vi Thời gian (3 Cụm Lịch sử Pilot)

| Cụm | Tên cụm lịch sử | Phạm vi thời gian | Khu vực địa lý |
| :---: | :--- | :---: | :--- |
| **A** | **Nhà Trần và kháng chiến chống Nguyên – Mông** | 1225 – 1400 | Việt Nam |
| **B** | **Cách mạng tháng Tám và thành lập VNDCCH** | 1941 – 1946 | Việt Nam |
| **C** | **Cách mạng Pháp** | 1787 – 1799 | Pháp và thế giới |

> [!NOTE]
> Các mốc thời gian trên là giới hạn nghiên cứu của Pilot, không có nghĩa là mọi sự kiện trong khoảng thời gian đó đều phải thu thập.

### Giới hạn ràng buộc (Out of Scope):
- Không mở rộng thành toàn bộ lịch sử thời Trần.
- Không mở rộng thành toàn bộ lịch sử Việt Nam cận - hiện đại.
- Không mở rộng thành toàn bộ lịch sử nước Pháp.
- Không bắt buộc thu thập liên tục tất cả mọi sự kiện vụn vặt trong từng giai đoạn.

---

## 4. Phạm vi Loại Dữ liệu (6 Nhóm Cốt lõi)

| Nhóm | Model / Thực thể | Phạm vi quản lý |
| :--- | :--- | :--- |
| **Entity** | `HistoricalEntity`, `Person`, `HistoricalSite`... | Nhân vật, quốc gia, triều đại, tổ chức, quân đội, địa danh, di tích, hiện vật... |
| **Event** | `HistoricalEvent` | Chiến tranh, trận đánh, cách mạng, hiệp ước, hòa ước, tuyên ngôn... |
| **Period** | `Period` | Thời đại, triều đại, thời kỳ, giai đoạn lịch sử có phân cấp cha - con. |
| **Statement** | `HistoricalStatement` | Phát biểu tri thức RDF Triplet: `Subject → Predicate → Object/Literal`. |
| **Reference** | `HistoricalReference`, `HistoricalStatementReference` | Nguồn thư tịch cổ, sách sử, công trình nghiên cứu, văn kiện, URL... |
| **Taxonomy** | `TaxonomyGroup`, `TaxonomyTerm` | Danh mục động chuẩn hóa (Predicate, loại di tích, vai trò tham gia, vùng miền...). |

### Nguyên tắc Dữ liệu chi tiết:
- **Entity:**
  - Mỗi thực thể có định danh nội bộ duy nhất (`id` UUID).
  - Có tên chuẩn hóa (`name`) và danh sách định danh thay thế (`aliases`).
  - Tuyệt đối không tạo thực thể trùng lặp chỉ vì dị bản phiên âm hoặc cách viết tên khác nhau.
- **Event:**
  - Có thời gian bắt đầu, kết thúc và độ chính xác niên đại chuẩn (`DatePrecision`).
  - Có khả năng liên kết với nhiều nhân vật, tổ chức, địa điểm và sự kiện khác.
- **Period:**
  - Có khoảng thời gian riêng, có thể bao hàm nhiều sự kiện.
  - Hỗ trợ cấu trúc phân cấp cha - con (`parentId`).
  - Phân biệt rõ `Period` (khoảng thời gian) với `HistoricalEntity` (thể chế, triều đại chính trị hoặc quốc gia).
- **Statement:**
  - Biểu diễn chuẩn `Subject → Predicate → Object`.
  - Hỗ trợ `qualifiers` (JSONB) bổ sung vai trò, ngữ cảnh, chức vụ.
  - Không tạo quan hệ võ đoán nếu không có căn cứ lịch sử.
  - Liên kết với một hoặc nhiều nguồn tham chiếu (`HistoricalReference`).
- **Reference:**
  - Quản lý nguồn độc lập, tránh nhân bản dữ liệu sách.
  - Lưu trữ tác giả, nhà xuất bản, năm, ISBN, DOI.
  - Hỗ trợ định vị trích dẫn theo số trang, chương, đoạn trích (`quote`).
- **Taxonomy:**
  - Quản lý danh mục động qua CMS không can thiệp code.
  - Có mã chuẩn hóa (`code`), nhãn tiếng Việt (`label`), nhãn chiều ngược (`inverseLabel`) và `aliases`.

---

## 5. Quy mô Pilot (Pilot Targets)

### A. Bản ghi Lõi (Mục tiêu: ~100 bản ghi chính)

| Loại bản ghi | Số lượng mục tiêu |
| :--- | :---: |
| **Person** (Nhân vật lịch sử) | 28 |
| **HistoricalEvent** (Sự kiện lịch sử) | 30 |
| **HistoricalEntity khác** (Quốc gia, tổ chức, quân đội, hiện vật) | 24 |
| **HistoricalSite** (Di tích / Địa danh lịch sử) | 13 |
| **Period** (Thời kỳ / Giai đoạn) | 5 |
| **Tổng cộng** | **100** |

### B. Thành phần Bổ trợ

| Thành phần | Số lượng mục tiêu |
| :--- | :---: |
| **HistoricalStatement** (Phát biểu tri thức) | 150 – 250 |
| **HistoricalReference** (Tài liệu / Thư tịch cổ trích dẫn) | 50 – 100 |
| **TaxonomyGroup** (Nhóm danh mục chuẩn hóa) | 10 – 20 |

> [!TIP]
> Đây là mục tiêu định hướng chất lượng, không phải chỉ tiêu số lượng (quota). Tuyệt đối **không tạo dữ liệu giả hoặc dữ liệu rác/trùng lặp** chỉ để đạt số lượng.

---

## 6. Phạm vi Quan hệ & Liên kết Tri thức

Hệ thống bắt buộc phải hỗ trợ tối thiểu các nhóm quan hệ cốt lõi sau:

| Nhóm quan hệ | Ví dụ minh họa trong Pilot |
| :--- | :--- |
| **Nhân vật – Sự kiện** | Tham gia (`PARTICIPATED_IN`), Chỉ huy (`COMMANDED`), Lãnh đạo (`LED`) |
| **Nhân vật – Nhân vật** | Quan hệ gia đình (`PARENT_OF`, `CHILD_OF`, `SPOUSE_OF`), Kế vị (`SUCCESSOR_TO`), Cùng thời (`CONTEMPORARY_OF`) |
| **Nhân vật – Tổ chức** | Thành viên (`MEMBER_OF`), Sáng lập (`FOUNDER_OF`), Lãnh tụ (`LEADER_OF`) |
| **Nhân vật – Quốc gia** | Trị vì (`REIGNED_OVER`), Phụng sự (`SERVED_UNDER`) |
| **Sự kiện – Địa điểm** | Diễn ra tại (`TOOK_PLACE_AT` / `locationId`) |
| **Sự kiện – Sự kiện** | Nguyên nhân (`CAUSES`), Tiền đề (`PRECEDES`), Hệ quả (`FOLLOWS`) |
| **Sự kiện – Thời kỳ** | Thuộc thời kỳ (`BELONGS_TO_PERIOD` / `HistoricalEventPeriod`) |
| **Entity – Period** | Tồn tại trong thời kỳ (`EXISTED_IN_PERIOD`) |

> [!IMPORTANT]
> Ưu tiên thiết lập quan hệ có ngữ nghĩa lịch sử rõ ràng. **Không lạm dụng quan hệ chung chung `RELATED_TO`** để thay thế cho các quan hệ bản chất.

---

## 7. Tiêu chuẩn Chất lượng Dữ liệu (Data Quality Criteria)

Mỗi bản ghi khi đưa vào hệ thống phải vượt qua 8 tiêu chí kiểm định:

| Tiêu chí | Yêu cầu bắt buộc |
| :--- | :--- |
| **1. Identity** | Không trùng lặp định danh nội bộ (Unique UUID/Slug). |
| **2. Naming** | Tên chuẩn hóa, danh sách tên thay thế (aliases) hợp lý, đầy đủ. |
| **3. Classification**| Thuộc đúng nhóm phân loại thực thể và danh mục. |
| **4. Dating** | Niên đại tuân thủ quy ước thiên văn (không năm 0), độ chính xác rõ ràng. |
| **5. Relation** | Subject, Predicate, Object hợp lệ theo domain/range của Taxonomy. |
| **6. Provenance** | Bắt buộc có nguồn tư liệu tham khảo (`HistoricalReference`) đính kèm. |
| **7. Consistency** | Không mâu thuẫn với các dữ liệu chính sử đã được duyệt trước đó. |
| **8. Verification** | Có trạng thái xác minh học thuật minh bạch (`VerificationStatus`). |

**Các trạng thái kiểm chứng sử dụng:**
- `VERIFIED`: Đã xác minh (Đồng thuận chính sử).
- `HYPOTHESIS`: Giả thuyết lịch sử có cơ sở nghiên cứu.
- `DISPUTED`: Còn tranh cãi học thuật giữa các nguồn tài liệu.
- `DRAFT`: Bản nháp đang thu thập / nghiên cứu.

---

## 8. Những Nội dung Chưa Thuộc Pilot (Out of Scope v1.0)

Để đảm bảo tiến độ và độ hội tụ của hệ thống, giai đoạn này **chưa triển khai**:
1. Toàn bộ lịch sử nhân loại hoặc thu thập diện rộng.
2. Tự động cào dữ liệu hàng chục nghìn nhân vật mà không kiểm chứng.
3. Gia phả đầy đủ và đồ sộ của toàn bộ các dòng họ.
4. Bản đồ biến thiên không gian biên giới theo thời gian thực (GIS time-slider chuyên sâu).
5. Hệ thống khảo cổ học và kho hiện vật 3D quy mô lớn.
6. Tự động sinh quan hệ đồ thị bằng AI không qua con người xác minh.
7. Model bảng `Timeline` / `TimelineItem` lưu tĩnh riêng cho từng đối tượng.
8. Tích hợp các graph engine phức tạp như Neo4j hoặc Apache AGE khi chưa vượt ngưỡng quy mô.

---

## 9. Tiêu chí Nghiệm thu Pilot (Acceptance Criteria)

| Bài kiểm thử | Kết quả mong muốn nghiệm thu |
| :--- | :--- |
| **Timeline Nhân vật** | Tổng hợp động mốc sinh, mốc mất và các sự kiện tham gia theo trật tự thời gian. |
| **Timeline Sự kiện** | Hiển thị diễn biến sự kiện theo trình tự niên đại chuẩn xác. |
| **Timeline Thời kỳ** | Hiển thị các sự kiện thuộc một thời kỳ/giai đoạn lịch sử. |
| **Knowledge Graph** | Truy vấn mạng lưới liên kết đa bước (BFS multi-hop traversal) giữa các thực thể. |
| **Path Finding** | Tìm được đường liên kết quan hệ ngắn nhất giữa hai nhân vật bất kỳ. |
| **Reference Tracing** | Nhấp vào một phát biểu truy xuất được ngay nguồn sách, chương, trang và đoạn trích. |
| **Data Integrity** | Không có khóa ngoại mồ côi (orphaned FK), định danh trùng hoặc lỗi niên đại năm 0. |
| **Cross-Region** | Cùng một cấu trúc schema phục vụ trơn tru cho cả sự kiện Việt Nam và quốc tế. |

---

## 10. Các Quyết định Đã Khóa (Locked Decisions)

- [x] **Địa lý:** Cả Việt Nam và Quốc tế dùng chung một schema.
- [x] **Phương pháp:** Xây dựng theo cụm lịch sử có liên kết ngữ nghĩa.
- [x] **3 Cụm Pilot:** Nhà Trần (1225–1400), Cách mạng tháng Tám (1941–1946), Cách mạng Pháp (1787–1799).
- [x] **Loại dữ liệu:** 6 nhóm thống nhất (`Entity`, `Event`, `Period`, `Statement`, `Reference`, `Taxonomy`).
- [x] **Quy mô:** ~100 bản ghi chính, 150–250 statements, 50–100 references.
- [x] **Trục quan hệ:** `HistoricalStatement` là nguồn chân lý duy nhất (Single Source of Truth).
- [x] **Timeline:** Không dùng model DB riêng, tổng hợp động qua `PersonTimelineBuilder`.

---

## 11. Chuyển giao Kế hoạch: Giai đoạn 2 — Taxonomy Specification v1

Bước hành động tiếp theo là chuẩn hóa bộ tài liệu **Taxonomy Specification v1** theo thứ tự ưu tiên:

| Thứ tự | Nhóm danh mục (`TaxonomyGroup`) | Nội dung chi tiết cần thiết kế |
| :---: | :--- | :--- |
| **1** | `ENTITY_TYPE` | Phân loại các loại thực thể lịch sử |
| **2** | `EVENT_TYPE` | Phân loại các nhóm sự kiện lịch sử |
| **3** | `PERIOD_TYPE` | Phân loại các thời kỳ, giai đoạn |
| **4** | `SITE_TYPE` | Phân loại di tích, địa danh lịch sử |
| **5** | `PREDICATE` | Bảng mã các vị ngữ quan hệ lịch sử (kèm `label`, `inverseLabel`, cờ đối xứng `isSymmetric`) |
| **6** | `ROLE_TYPE` | Vai trò của nhân vật trong sự kiện (`qualifiers.roleCode`) |
| **7** | `REGION` | Phân loại khu vực địa lý trong nước và quốc tế |
| **8** | `SOURCE_TYPE` | Phân loại loại nguồn tham khảo (Sử thư chính thống, Tài liệu lưu trữ, Nghiên cứu...) |

> [!NOTE]
> **Quy tắc thiết kế Taxonomy:** Phân định rạch ròi giữa **Taxonomy** (danh mục nghiệp vụ linh hoạt), **Enum** (điều khiển logic hệ thống trong code), **Cột DB thông thường**, và **Quan hệ bảng** để giữ schema luôn tinh gọn và mở rộng linh hoạt (OCP).
