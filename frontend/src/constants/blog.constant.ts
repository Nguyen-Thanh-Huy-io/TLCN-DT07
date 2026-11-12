/**
 * HISGO Digital Museum - Blog Constants
 * Định nghĩa các enum và hằng số tập trung cho phân hệ Blog để tuân thủ SOLID (OCP) và khử Magic String.
 */

export enum BlogPostTypeEnum {
  LONG_FORM = 'LONG_FORM',
  QUICK_POST = 'QUICK_POST',
}

export enum StoryBlockTypeEnum {
  PARAGRAPH = 'paragraph',
  IMAGE = 'image',
}

export enum BlogStatusEnum {
  PENDING_REVIEW = 'PENDING_REVIEW',
  PUBLISHED = 'PUBLISHED',
  DRAFT = 'DRAFT',
  REJECTED = 'REJECTED',
}

export const BLOG_URL_PLACEHOLDER = 'https://...';
