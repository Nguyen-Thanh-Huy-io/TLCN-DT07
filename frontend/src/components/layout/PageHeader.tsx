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

    case APP_ROUTES.TOPICS.LIST:
      return {
        title: 'Chủ đề học tập',
        subtitle: 'Quản lý các chuyên đề lịch sử theo từng giai đoạn',
        eyebrow: {
          parentLabel: 'Chương trình học',
          parentRoute: APP_ROUTES.CURRICULUM,
          currentText: 'Chủ đề',
        },
      };

    case APP_ROUTES.TOPICS.CREATE:
      return {
        title: 'Thêm chủ đề mới',
        subtitle: 'Tạo chuyên đề học tập thuộc giai đoạn lịch sử',
        eyebrow: {
          parentLabel: 'Chủ đề học tập',
          parentRoute: APP_ROUTES.TOPICS.LIST,
          currentText: 'Tạo mới',
        },
      };

    case APP_ROUTES.LESSONS.LIST:
      return {
        title: 'Bài học & Quiz',
        subtitle: 'Quản lý nội dung bài học và ngân hàng trắc nghiệm',
        eyebrow: {
          parentLabel: 'Chương trình học',
          parentRoute: APP_ROUTES.CURRICULUM,
          currentText: 'Bài học',
        },
      };

    case APP_ROUTES.LESSONS.CREATE:
      return {
        title: 'Tạo bài học mới',
        subtitle: 'Soạn thảo nội dung bài giảng và câu hỏi kiểm tra',
        eyebrow: {
          parentLabel: 'Bài học',
          parentRoute: APP_ROUTES.LESSONS.LIST,
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

    default:
      return {
        title: 'Quản trị hệ thống',
        subtitle: 'Hệ thống Quản lý Nội dung HISGO',
      };
  }
}

export function PageHeader({ pathname }: { pathname: string }) {
  const router = useRouter();
  const cleanPath = pathname.replace(/\/$/, '') || '/';

  // In Curriculum Workspace & Lesson Editor, omit the large header to maximize vertical editor space
  if (
    cleanPath === APP_ROUTES.CURRICULUM ||
    cleanPath === APP_ROUTES.LESSONS.CREATE ||
    cleanPath.startsWith('/lessons/')
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
