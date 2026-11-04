import { EntityList } from '@/features/entities/components/EntityList';
import { EntityType } from '@/constants/enums';
import { APP_ROUTES } from '@/constants/routes';

export const metadata = {
  title: 'Quản lý Nhân vật lịch sử | HISGO CMS',
};

export default function FiguresPage() {
  return (
    <EntityList
      filterType={EntityType.PERSON}
      title="Nhân vật lịch sử"
      createRoute={APP_ROUTES.FIGURES.CREATE}
      detailRoutePrefix="/figures"
    />
  );
}
