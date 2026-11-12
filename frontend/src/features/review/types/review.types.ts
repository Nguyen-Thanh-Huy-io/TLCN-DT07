import { ContentStatus } from '@/constants/enums';
import type { ReviewTabState } from '../constants/review.constant';

export interface ReviewPost {
  id: string;
  title: string;
  summary: string;
  author: string;
  createdAt: string;
  status: ReviewTabState;
  rawStatus: string;
  rejectionReason?: string | null;
}

export interface ContentBlockData {
  id?: string;
  type?: string;
  kind?: string;
  heading?: string;
  text?: string;
  caption?: string;
  imageUrl?: string;
}

export interface ArticleReferenceData {
  id?: string;
  title?: string;
  source?: string;
  url?: string;
}

export interface ReviewConfirmAction {
  type: ContentStatus.PUBLISHED | ContentStatus.REJECTED;
  item: ReviewPost;
}
