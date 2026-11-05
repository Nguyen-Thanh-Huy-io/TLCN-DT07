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
        subtitle: 'Cấu trúc phân cấp: Chủ đề ➔ Bài học & Quiz, và Lộ trình ➔ Chương ➔ Bài học',
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

    case APP_ROUTES.ARTICLES.LIST:
      return {
        title: 'Bài viết',
        subtitle: 'Nhân vật, sự kiện, di tích, triều đại… — mỗi bài thuộc 1 chuyên mục, gắn nhiều tag',
      };

    case APP_ROUTES.TIMELINES.LIST:
      return {
        title: 'Dòng thời gian',
        subtitle: 'Dựng trình tự các mốc lịch sử; mốc có thể trỏ tới bài viết',
      };

    case APP_ROUTES.CATEGORIES:
      return {
        title: 'Chuyên mục',
        subtitle: 'Bài viết thuộc loại gì — quyết định trang công khai hiển thị bài (/chuyen-muc/…)',
      };

    case APP_ROUTES.TAGS.LIST:
      return {
        title: 'Tag',
        subtitle: 'Nhãn gom bài viết và bài học theo chủ đề (Nhà Trần, Kháng chiến…)',
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

    case APP_ROUTES.MEDIA:
      return {
        title: 'Quản lý nguồn tư liệu và media',
        subtitle: 'Kho lưu trữ hình ảnh, video và tài liệu minh họa bài giảng lịch sử',
      };

    case APP_ROUTES.QUESTIONS:
      return {
        title: 'Ngân hàng câu hỏi',
        subtitle: 'Kho câu hỏi đánh giá theo bài học, dạng trắc nghiệm và độ khó',
      };

    case APP_ROUTES.QUIZZES:
      return {
        title: 'Quản lý bộ Quiz',
        subtitle: 'Quản lý bộ đề ôn tập, thời lượng và tiêu chuẩn đạt của bài học',
      };

    case APP_ROUTES.ANALYTICS:
      return {
        title: 'Thống kê học tập và hoạt động',
        subtitle: 'Báo cáo chỉ số người học, tỷ lệ hoàn thành và nhật ký vận hành',
      };

    case APP_ROUTES.SETTINGS:
      return {
        title: 'Cài đặt hệ thống',
        subtitle: 'Quản lý danh mục taxonomy và các tham số cấu hình chung',
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

/** Trang tạo mới / chi tiết — tiêu đề theo loại nội dung. */
const DETAIL_HEADERS = [
  { list: APP_ROUTES.ARTICLES.LIST, create: APP_ROUTES.ARTICLES.CREATE, noun: 'bài viết', crumb: 'Bài viết' },
  { list: APP_ROUTES.TIMELINES.LIST, create: APP_ROUTES.TIMELINES.CREATE, noun: 'dòng thời gian', crumb: 'Dòng thời gian' },
] as const;

function resolveDetailHeader(cleanPath: string): PageHeaderInfo | null {
  const match = DETAIL_HEADERS.find((d) => cleanPath.startsWith(`${d.list}/`));
  if (!match) return null;
  const isCreate = cleanPath === match.create;
  return {
    title: isCreate ? `Thêm ${match.noun}` : `Chỉnh sửa ${match.noun}`,
    subtitle: isCreate ? 'Lưu nháp được bất cứ lúc nào' : 'Sửa nội dung và trạng thái xuất bản',
    eyebrow: { parentLabel: match.crumb, parentRoute: match.list, currentText: isCreate ? 'Tạo mới' : 'Chỉnh sửa' },
  };
}

export function PageHeader({ pathname }: { pathname: string }) {
  const router = useRouter();
  const cleanPath = pathname.replace(/\/$/, '') || '/';

  // In Curriculum Workspace, Lesson Editor & Topic Editor, omit the large header to maximize vertical editor space
  // Also omit for the article editor (full-screen block editor with its own toolbar).
  if (
    cleanPath === APP_ROUTES.CURRICULUM ||
    cleanPath === APP_ROUTES.LESSONS.CREATE ||
    cleanPath.startsWith('/lessons/') ||
    cleanPath === APP_ROUTES.TOPICS.CREATE ||
    cleanPath.startsWith('/topics/') ||
    cleanPath === APP_ROUTES.ARTICLES.CREATE ||
    cleanPath.startsWith('/articles/')
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
