# Sequence Diagram: Theo dõi (Follow) Người viết bài & Thông báo bài mới

Tính năng thống nhất mạng lưới theo dõi `UserFollow` từ Blog Cộng đồng sang **Bài viết lịch sử** (`/bai-viet/[slug]`), **Bài học** (`/bai-hoc/[slug]`), **Blog chuyên khảo** (`/blog/[slug]`) và **Hồ sơ tác giả** (`/cong-dong/thanh-vien/[username]`).

```mermaid
sequenceDiagram
    autonumber
    actor Reader as Độc giả / Người học
    participant Button as AuthorFollowButton (Client)
    participant Auth as Auth Session / Login
    participant BlogAPI as BlogController (/posts/users/:id/*)
    participant DB as PostgreSQL (UserFollow, Article, Lesson)
    participant CMS as Article / Lesson / BlogService
    participant Events as EventEmitter2 + AuthorPublishListener
    participant Notif as NotificationService + Socket

    Note over Reader,DB: Luồng 1: Xem & Theo dõi tác giả từ Bài viết / Bài học / Blog
    Reader->>Button: Mở /bai-viet/[slug], /bai-hoc/[slug] hoặc /blog/[slug]
    Button->>BlogAPI: GET /posts/users/:identifier/follow-status (OptionalAuthGuard)
    BlogAPI->>DB: Đếm UserFollow & kiểm tra followerId=viewerId
    DB-->>BlogAPI: { targetUserId, targetUsername, followerCount, following, isMe }
    BlogAPI-->>Button: Trạng thái theo dõi + số người theo dõi
    Reader->>Button: Nhấn nút "Theo dõi" / "Đang theo dõi"
    alt Chưa đăng nhập
        Button->>Auth: Chuyển tới /login?redirect=<currentPath>
    else Đã đăng nhập
        Button->>BlogAPI: POST /posts/users/:identifier/follow (AuthGuard)
        BlogAPI->>DB: Toggle bản ghi UserFollow + đếm lại followerCount
        BlogAPI->>Notif: Gửi Notification NEW_FOLLOWER & emit user:follow-updated
        BlogAPI-->>Button: { following, followerCount } -> cập nhật UI ngay
    end

    Note over CMS,Notif: Luồng 2: Thông báo tự động khi tác giả xuất bản nội dung mới
    CMS->>DB: Duyệt / xuất bản Bài viết, Bài học hoặc Blog mới (PUBLISHED)
    CMS->>Events: emit("author.content.published", { authorId, contentType, title, slug })
    Events->>DB: Truy vấn danh sách followerId từ user_follows
    DB-->>Events: Danh sách followerIds
    Events->>Notif: Gửi Notification CONTENT_APPROVED kèm link (/bai-viet/..., /bai-hoc/..., /blog/...)

    Note over Reader,DB: Luồng 3: Xem hồ sơ & danh mục tác phẩm của tác giả
    Reader->>BlogAPI: GET /posts/users/:username/profile
    BlogAPI->>DB: Truy vấn BlogPost + Article + Lesson PUBLISHED của tác giả
    DB-->>BlogAPI: Hồ sơ kèm bài cộng đồng, bài viết & bài học đã biên soạn
```
