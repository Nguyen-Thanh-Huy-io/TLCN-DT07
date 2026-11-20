export const SAVED_MATERIAL_API = {
  ROOT: '/saved-materials',
  TOGGLE: '/saved-materials/toggle',
  BY_KIND_AND_TARGET: (kind: string, targetId: string) =>
    `/saved-materials/${encodeURIComponent(kind)}/${encodeURIComponent(targetId)}`,
} as const;

export const SAVED_MATERIAL_CHANGE_EVENT = 'hisgo:saved-change';

export enum SavedMaterialKind {
  ARTICLE = 'ARTICLE',
  LESSON = 'LESSON',
  TIMELINE_NODE = 'TIMELINE_NODE',
}

export type SavableMaterialKind = SavedMaterialKind.ARTICLE | SavedMaterialKind.LESSON;
