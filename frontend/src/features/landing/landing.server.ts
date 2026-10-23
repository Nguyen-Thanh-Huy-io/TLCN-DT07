import {
  fetchEvents,
  fetchFigureDirectory,
  fetchLocations,
  fetchPeriods,
  fetchPublicList,
  fetchTaxonomyTerms,
} from '@/services/entities/landing.service';
import type { LearningPathItem } from '@/services/entities/learning-path.service';
import type { LibraryLesson } from '@/services/entities/learner.service';
import { buildLandingData } from './landing.adapter';
import type { LandingData } from './landing.types';

export async function fetchLandingData(): Promise<LandingData> {
  const [periods, events, figures, locations, lessons, paths, regions, figureRoles] = await Promise.all([
    fetchPeriods(),
    fetchEvents(),
    fetchFigureDirectory(),
    fetchLocations(),
    fetchPublicList<LibraryLesson>('/public/lessons'),
    fetchPublicList<LearningPathItem>('/learning-paths'),
    fetchTaxonomyTerms('REGION'),
    fetchTaxonomyTerms('FIGURE_ROLE'),
  ]);
  return buildLandingData({ periods, events, figures, locations, lessons, paths, taxonomy: { regions, figureRoles } });
}
