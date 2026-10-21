import { DifficultyLevel } from '@/constants/enums';

export interface TopicOption {
  id: string;
  name: string;
  periodName?: string;
}

export interface LessonHeaderMetaData {
  title: string;
  slug?: string;
  description?: string;
  summary?: string;
  shortDescription?: string;
  topicId?: string;
  thumbnailUrl: string;
  difficulty?: DifficultyLevel;
  tags: string[];
}

export interface LessonHeaderMetaFormProps {
  data: LessonHeaderMetaData;
  onChange: <K extends keyof LessonHeaderMetaData>(field: K, value: LessonHeaderMetaData[K]) => void;
  topics?: TopicOption[];
  onOpenTopicPicker?: () => void;
  disabled?: boolean;
  className?: string;
}
