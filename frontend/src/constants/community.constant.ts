/**
 * Community Domain Enums and Constants
 * Chuẩn hóa các tab, chế độ soạn thảo và sắp xếp bài đăng mạng xã hội / cộng đồng.
 * Tuân thủ tuyệt đối quy tắc cấm Magic Strings (OCP - SOLID).
 */

export enum CommunityTabKey {
  ALL = 'all',
  FOLLOWING = 'following',
  TRENDING = 'trending',
  SHARED_BLOG = 'shared_blog',
  SAVED = 'saved',
}

export enum BlogPostType {
  LONG_FORM = 'LONG_FORM',
  QUICK_POST = 'QUICK_POST',
}

export enum ComposerMode {
  QUESTION = 'question',
  SHARE_BLOG = 'share_blog',
}

export enum CommunitySortMode {
  LATEST = 'latest',
  TRENDING = 'trending',
}

export const COMMUNITY_TAB_LABELS: Record<CommunityTabKey, string> = {
  [CommunityTabKey.ALL]: 'Tất cả thảo luận',
  [CommunityTabKey.FOLLOWING]: 'Đang theo dõi',
  [CommunityTabKey.TRENDING]: 'Sôi nổi',
  [CommunityTabKey.SHARED_BLOG]: 'Bài Blog chia sẻ',
  [CommunityTabKey.SAVED]: 'Đã lưu',
};
