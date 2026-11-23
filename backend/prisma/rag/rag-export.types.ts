import { ArticleKind, ContentStatus, PostType } from '@prisma/client';

export enum RagDocumentKind {
  EVENT = 'EVENT',
  PERSON = 'PERSON',
  LOCATION = 'LOCATION',
  ARTICLE = 'ARTICLE',
  LESSON = 'LESSON',
  BLOG = 'BLOG',
  TIMELINE_NODE = 'TIMELINE_NODE',
}

export interface CategoryHierarchyNode {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  kind: ArticleKind | null;
}

export interface ExportableArticleLinkRef {
  label: string | null;
  target: {
    slug: string;
    title: string;
    status: ContentStatus;
    categoryId: string | null;
  };
}

export interface ExportableArticleInboundLinkRef {
  label: string | null;
  source: {
    slug: string;
    title: string;
    status: ContentStatus;
    categoryId: string | null;
  };
}

export interface ExportableArticle {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  contentBlocks: unknown;
  metadata: unknown;
  dateText: string | null;
  startYear: number | null;
  endYear: number | null;
  status: ContentStatus;
  categoryId: string | null;
  topic: { name: string; slug: string } | null;
  articleTags: Array<{ tag: { name: string } }>;
  linksOut: ExportableArticleLinkRef[];
  linksIn: ExportableArticleInboundLinkRef[];
}

export interface ExportableLesson {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: unknown;
  contentRichText: string | null;
  difficulty: string;
  sourceReferenceNote: string | null;
  status: ContentStatus;
  topic: { name: string; slug: string } | null;
  lessonTags: Array<{ tag: { name: string } }>;
}

export interface ExportableBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  postType: PostType;
  contentBlocks: unknown;
  status: ContentStatus;
  publishedAt: Date | null;
  author: {
    username: string;
    userProfile: {
      firstName: string | null;
      lastName: string | null;
    } | null;
  };
}

export interface TimelineNodeArticleRef {
  slug: string;
  title: string;
  status: ContentStatus;
  categoryId: string | null;
}

export interface ExportableTimelineNode {
  id: string;
  title: string;
  description: string | null;
  dateText: string | null;
  year: number | null;
  month: number | null;
  day: number | null;
  endYear: number | null;
  displayOrder: number;
  timeline: {
    id: string;
    title: string;
    slug: string;
    status: ContentStatus;
    topic: { name: string; slug: string } | null;
  };
  article: TimelineNodeArticleRef | null;
  articles: Array<{
    article: TimelineNodeArticleRef;
  }>;
}

export interface RagManifestEntry {
  relativePath: string;
  gcsDefaultPath: string;
  kind: RagDocumentKind;
  sourceModel: 'Article' | 'Lesson' | 'BlogPost' | 'TimelineNode';
  sourceId: string;
  slug: string;
  title: string;
  subtitle: string;
  href: string;
  sources: string[];
  aliases: string[];
}

export interface RagExportArtifact {
  relativePath: string;
  markdown: string;
  manifestEntry: RagManifestEntry;
}

export interface RagManifestDocument {
  version: number;
  exportedAt: string;
  includeDrafts: boolean;
  counts: {
    articles: number;
    lessons: number;
    blogs: number;
    timelineNodes: number;
    total: number;
  };
  entries: RagManifestEntry[];
}
