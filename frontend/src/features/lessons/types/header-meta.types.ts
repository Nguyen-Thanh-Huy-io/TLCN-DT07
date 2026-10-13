import { DifficultyLevel } from '@/constants/enums';

export interface TopicOption {
  id: string;
  name: string;
  periodName?: string;
}

export interface LessonHeaderMetaData {
  title: string;
  topicId: string;
  shortDescription: string;
  thumbnailUrl: string;
  difficulty: DifficultyLevel;
  tags: string[];
  startDate: string;
  endDate: string;
}

export interface LessonHeaderMetaFormProps {
  data: LessonHeaderMetaData;
  onChange: <K extends keyof LessonHeaderMetaData>(field: K, value: LessonHeaderMetaData[K]) => void;
  topics: TopicOption[];
  onOpenTopicPicker?: () => void;
  disabled?: boolean;
  className?: string;
}
