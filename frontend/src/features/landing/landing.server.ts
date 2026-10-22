import {
  fetchEvents,
  fetchFigureDirectory,
  fetchLocations,
  fetchPeriods,
  fetchPublicList,
} from '@/services/entities/landing.service';
import type { LearningPathItem } from '@/services/entities/learning-path.service';
import type { LibraryLesson } from '@/services/entities/learner.service';
import { buildLandingData } from './landing.adapter';
import type { LandingData } from './landing.types';

export async function fetchLandingData(): Promise<LandingData> {
  const [periods, events, figures, locations, lessons, paths] = await Promise.all([
    fetchPeriods(),
    fetchEvents(),
    fetchFigureDirectory(),
    fetchLocations(),
    fetchPublicList<LibraryLesson>('/public/lessons'),
    fetchPublicList<LearningPathItem>('/learning-paths'),
  ]);
  return buildLandingData({ periods, events, figures, locations, lessons, paths });
}
