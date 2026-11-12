import { useState, useCallback } from 'react';
import {
  EntitySourceType,
  IEntityDetailPreview,
  IEntitySearchResult,
} from '../../../types/entity-source.types';
import { EntitySourceStrategyFactory } from '../../../factories/entity-source-strategy.factory';

export function useWikipediaDetailPicker() {
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);
  const [previewDetail, setPreviewDetail] = useState<IEntityDetailPreview | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [editPrimary, setEditPrimary] = useState('');
  const [editSecondary, setEditSecondary] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editImage, setEditImage] = useState('');

  const resetPreview = useCallback(() => {
    setPreviewDetail(null);
    setSelectedItemKey(null);
  }, []);

  const loadDetail = useCallback(
    async (identifier: string, sourceType: EntitySourceType = EntitySourceType.WIKIPEDIA) => {
      try {
        setLoadingDetail(true);
        const strategy = EntitySourceStrategyFactory.getStrategy(sourceType);
        const detail = await strategy.getDetail(identifier);
        if (detail) {
          setPreviewDetail(detail);
          setEditPrimary(detail.name);
          setEditSecondary(detail.years);
          setEditSummary(detail.summary);
          setEditImage(detail.avatarUrl);
        }
      } catch (err) {
        console.error('Lỗi khi tải chi tiết thực thể/sự kiện:', err);
      } finally {
        setLoadingDetail(false);
      }
    },
    [],
  );

  const selectFirstWikiItemIfAny = useCallback(
    (items: IEntitySearchResult[], sourceType: EntitySourceType = EntitySourceType.WIKIPEDIA) => {
      if (items.length > 0) {
        const first = items[0];
        setSelectedItemKey(first.title);
        loadDetail(first.title, sourceType);
      } else {
        resetPreview();
      }
    },
    [loadDetail, resetPreview],
  );

  return {
    selectedItemKey,
    setSelectedItemKey,
    previewDetail,
    setPreviewDetail,
    loadingDetail,
    editPrimary,
    setEditPrimary,
    editSecondary,
    setEditSecondary,
    editSummary,
    setEditSummary,
    editImage,
    setEditImage,
    resetPreview,
    loadDetail,
    selectFirstWikiItemIfAny,
  };
}
