export enum AuthorPublishedContentType {
  ARTICLE = 'ARTICLE',
  LESSON = 'LESSON',
  BLOG = 'BLOG',
}

export const AUTHOR_FOLLOW_EVENTS = {
  CONTENT_PUBLISHED: 'author.content.published',
} as const;

export interface AuthorPublishedPayload {
  authorId: string;
  contentType: AuthorPublishedContentType;
  title: string;
  slug: string;
}
