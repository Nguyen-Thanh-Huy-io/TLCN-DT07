'use client';

import { RefObject, useEffect } from 'react';

const YOUTUBE_ID = /(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})/;
/** YouTube trả ảnh xám 120×90 khi video không tồn tại / đã bị gỡ. */
const MISSING_THUMB_WIDTH = 120;

function brokenImageNotice(alt: string): HTMLElement {
  const box = document.createElement('div');
  box.className = 'lesson-media-missing';
  box.setAttribute('role', 'img');
  box.setAttribute('aria-label', alt || 'Hình ảnh không khả dụng');
  box.innerHTML = '<span>Hình ảnh không còn khả dụng tại nguồn</span>';
  if (alt) {
    const small = document.createElement('small');
    small.textContent = alt;
    box.appendChild(small);
  }
  return box;
}

/**
 * Video YouTube dạng "ảnh xem trước → bấm để phát": trang nhẹ hơn (không tải player khi
 * chưa xem) và phát hiện được video đã bị gỡ để báo rõ thay vì khung đen lỗi.
 */
function youtubeFacade(id: string, title: string): HTMLElement {
  const box = document.createElement('div');
  box.className = 'lesson-yt';
  const watchUrl = `https://www.youtube.com/watch?v=${id}`;

  const thumb = document.createElement('img');
  thumb.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  thumb.alt = title || 'Video YouTube';
  thumb.loading = 'lazy';

  const play = document.createElement('button');
  play.type = 'button';
  play.className = 'lesson-yt-play';
  play.setAttribute('aria-label', `Phát video${title ? `: ${title}` : ''}`);
  play.innerHTML = '<span></span>';

  box.append(thumb, play);

  thumb.addEventListener('load', () => {
    if (thumb.naturalWidth > MISSING_THUMB_WIDTH) return;
    box.classList.add('is-missing');
    box.innerHTML = '';
    const msg = document.createElement('div');
    msg.className = 'lesson-yt-missing';
    msg.innerHTML = '<strong>Video không còn khả dụng</strong>';
    const link = document.createElement('a');
    link.href = watchUrl;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = 'Thử mở trên YouTube ↗';
    msg.appendChild(link);
    box.appendChild(msg);
  });

  play.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    iframe.title = title || 'Video YouTube';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    // YouTube từ chối phát (lỗi 153) khi không có referrer.
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    box.replaceChildren(iframe);
  });

  return box;
}

/** Xử lý media trong HTML bài học sau khi render: ảnh hỏng → khung thông báo, YouTube → facade. */
export function useLessonMedia(container: RefObject<HTMLElement | null>, html: string) {
  useEffect(() => {
    const root = container.current;
    if (!root) return;

    for (const iframe of Array.from(root.querySelectorAll('iframe'))) {
      const id = iframe.getAttribute('src')?.match(YOUTUBE_ID)?.[1];
      if (id) iframe.replaceWith(youtubeFacade(id, iframe.getAttribute('title') || ''));
    }

    const swap = (img: HTMLImageElement) => img.replaceWith(brokenImageNotice(img.alt));
    const cleanups: Array<() => void> = [];
    for (const img of Array.from(root.querySelectorAll('img'))) {
      if (img.closest('.lesson-yt')) continue;
      if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) {
        swap(img);
        continue;
      }
      const onError = () => swap(img);
      img.addEventListener('error', onError, { once: true });
      cleanups.push(() => img.removeEventListener('error', onError));
    }
    return () => cleanups.forEach((fn) => fn());
  }, [container, html]);
}
