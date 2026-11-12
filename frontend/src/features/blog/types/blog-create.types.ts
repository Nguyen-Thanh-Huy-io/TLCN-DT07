import { StoryBlockTypeEnum } from '@/constants/blog.constant';

export interface StoryBlock {
  id: string;
  type: StoryBlockTypeEnum;
  heading?: string;
  text?: string;
  caption?: string;
  imageUrl?: string;
}

export interface ReferenceItem {
  id: string;
  title: string;
  source: string;
  url: string;
}
