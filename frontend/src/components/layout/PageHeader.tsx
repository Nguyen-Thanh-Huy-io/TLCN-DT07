'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/constants/routes';

export interface PageHeaderInfo {
  title: string;
  subtitle: string;
  eyebrow?: {
    parentLabel: string;
    parentRoute: string;
    currentText: string;
  };
}

/**
 * Resolver function to determine header info based on the exact path
 * Strictly avoids magic strings and adheres to Single Responsibility Principle.
 */
export function resolvePageHeader(pathname: string): PageHeaderInfo {
  const cleanPath = pathname.replace(/\/$/, '') || '/';

  switch (cleanPath) {
    case APP_ROUTES.DASHBOARD:
      return {
        title: 'Tổng quan',
        subtitle: 'Quản lý nội dung học tập và chỉ số vận hành trên HISGO',
      };

    case APP_ROUTES.CURRICULUM:
      return {
        title: 'Chương trình học',
        subtitle: 'Cấu trúc phân cấp trục kiến thức: Giai đoạn ➔ Chủ đề ➔ Bài học & Quiz',
      };

    case APP_ROUTES.KNOWLEDGE:
      return {
        title: 'Từ điển tri thức',
        subtitle: 'Kho dữ liệu liên kết: Địa danh, Nhân vật, Sự kiện & Thẻ phân loại',
      };

    case APP_ROUTES.PERIODS.LIST:
      return {
        title: 'Giai đoạn lịch sử',
        subtitle: 'Quản lý danh sách các thời kỳ và niên đại lịch sử',
        eyebrow: {
          parentLabel: 'Chương trình học',
          parentRoute: APP_ROUTES.CURRICULUM,
          currentText: 'Giai đoạn',
        },
      };

    case APP_ROUTES.PERIODS.CREATE:
      return {
        title: 'Thêm giai đoạn mới',
        subtitle: 'Thêm thời kỳ lịch sử vào trục thời gian học tập',
        eyebrow: {
          parentLabel: 'Giai đoạn lịch sử',
          parentRoute: APP_ROUTES.PERIODS.LIST,
          currentText: 'Tạo mới',
        },
      };

    case APP_ROUTES.TOPICS.CREATE:
      return {
        title: 'Thêm chủ đề mới',
        subtitle: 'Tạo chuyên đề học tập thuộc giai đoạn lịch sử',
        eyebrow: {
          parentLabel: 'Cây phân cấp Chủ đề',
          parentRoute: APP_ROUTES.CURRICULUM,
          currentText: 'Tạo mới',
        },
      };

    case APP_ROUTES.LESSONS.CREATE:
      return {
        title: 'Tạo bài học mới',
        subtitle: 'Soạn thảo nội dung bài giảng và câu hỏi kiểm tra',
        eyebrow: {
          parentLabel: 'Bài học & Quiz',
          parentRoute: APP_ROUTES.CURRICULUM,
          currentText: 'Tạo mới',
        },
      };

    case APP_ROUTES.LOCATIONS.LIST:
      return {
        title: 'Địa danh lịch sử',
        subtitle: 'Quản lý các địa danh, di tích và kinh đô lịch sử',
        eyebrow: {
          parentLabel: 'Từ điển tri thức',
          parentRoute: `${APP_ROUTES.KNOWLEDGE}?tab=LOCATIONS`,
          currentText: 'Địa danh',
        },
      };

    case APP_ROUTES.ENTITIES.LIST:
      return {
        title: 'Nhân vật lịch sử',
        subtitle: 'Quản lý các nhân vật, danh nhân và triều đại lịch sử',
        eyebrow: {
          parentLabel: 'Từ điển tri thức',
          parentRoute: `${APP_ROUTES.KNOWLEDGE}?tab=ENTITIES`,
          currentText: 'Nhân vật',
        },
      };

    case APP_ROUTES.EVENTS.LIST:
      return {
        title: 'Sự kiện lịch sử',
        subtitle: 'Quản lý các mốc thời gian và diễn biến lịch sử trọng đại',
        eyebrow: {
          parentLabel: 'Từ điển tri thức',
          parentRoute: `${APP_ROUTES.KNOWLEDGE}?tab=EVENTS`,
          currentText: 'Sự kiện',
        },
      };

    case APP_ROUTES.TAGS.LIST:
      return {
        title: 'Thẻ phân loại',
        subtitle: 'Quản lý nhãn phân loại từ khóa nội dung học tập',
        eyebrow: {
          parentLabel: 'Từ điển tri thức',
          parentRoute: `${APP_ROUTES.KNOWLEDGE}?tab=TAGS`,
          currentText: 'Thẻ',
        },
      };

    case APP_ROUTES.REVIEW:
      return {
        title: 'Duyệt bài học',
        subtitle: 'Kiểm duyệt chất lượng và phê duyệt xuất bản bài học',
      };

    case APP_ROUTES.USERS:
      return {
        title: 'Người dùng & Quyền',
        subtitle: 'Quản lý tài khoản biên tập viên và phân quyền hệ thống',
      };

    case APP_ROUTES.TAXONOMIES:
      return {
        title: 'Danh mục dùng chung',
        subtitle: 'Loại di tích, vùng, loại sự kiện, vai trò, quan hệ... dùng cho bộ lọc và hiển thị toàn hệ thống',
      };

    default:
      return (
        resolveDetailHeader(cleanPath) ?? {
          title: 'Quản trị hệ thống',
          subtitle: 'Hệ thống Quản lý Nội dung HISGO',
        }
      );
  }
}

/** Trang tạo mới / chi tiết của tri thức (/events/:id...) — tiêu đề theo loại nội dung thay vì tiêu đề chung. */
const DETAIL_HEADERS = [
  { list: APP_ROUTES.EVENTS.LIST, create: APP_ROUTES.EVENTS.CREATE, noun: 'sự kiện lịch sử', crumb: 'Sự kiện', tab: 'EVENTS' },
  { list: APP_ROUTES.ENTITIES.LIST, create: APP_ROUTES.ENTITIES.CREATE, noun: 'nhân vật / thực thể', crumb: 'Nhân vật', tab: 'ENTITIES' },
  { list: APP_ROUTES.LOCATIONS.LIST, create: APP_ROUTES.LOCATIONS.CREATE, noun: 'địa danh / di tích', crumb: 'Địa danh', tab: 'LOCATIONS' },
] as const;

function resolveDetailHeader(cleanPath: string): PageHeaderInfo | null {
  const match = DETAIL_HEADERS.find((d) => cleanPath.startsWith(`${d.list}/`));
  if (!match) return null;
  const isCreate = cleanPath === match.create;
  return {
    title: isCreate ? `Thêm ${match.noun}` : `Chi tiết & chỉnh sửa ${match.noun}`,
    subtitle: isCreate
      ? 'Điền thông tin theo từng mục; lưu nháp được bất cứ lúc nào'
      : 'Sửa nội dung, liên kết tri thức và trạng thái xuất bản',
    eyebrow: {
      parentLabel: 'Từ điển tri thức',
      parentRoute: `${APP_ROUTES.KNOWLEDGE}?tab=${match.tab}`,
      currentText: match.crumb,
    },
  };
}

export function PageHeader({ pathname }: { pathname: string }) {
  const router = useRouter();
  const cleanPath = pathname.replace(/\/$/, '') || '/';

  // In Curriculum Workspace, Lesson Editor & Topic Editor, omit the large header to maximize vertical editor space
  if (
    cleanPath === APP_ROUTES.CURRICULUM ||
    cleanPath === APP_ROUTES.LESSONS.CREATE ||
    cleanPath.startsWith('/lessons/') ||
    cleanPath === APP_ROUTES.TOPICS.CREATE ||
    cleanPath.startsWith('/topics/')
  ) {
    return null;
  }

  const headerInfo = resolvePageHeader(pathname);

  return (
    <div className="page-title">
      <div>
        {headerInfo.eyebrow && (
          <div className="eyebrow">
            <button
              type="button"
              onClick={() => router.push(headerInfo.eyebrow!.parentRoute)}
            >
              {headerInfo.eyebrow.parentLabel}
            </button>
            <span>/</span>
            <em>{headerInfo.eyebrow.currentText}</em>
          </div>
        )}
        <h1>{headerInfo.title}</h1>
        <p>{headerInfo.subtitle}</p>
      </div>
    </div>
  );
}
