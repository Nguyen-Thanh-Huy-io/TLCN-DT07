import type { ImgHTMLAttributes } from 'react';

type RemoteImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
  src: string;
  alt: string;
};

/**
 * Ảnh lấy từ CMS / nguồn ngoài: không biết trước kích thước, khung hiển thị do CSS của từng nơi quyết định.
 * `next/image` bắt buộc `width`/`height` hoặc `fill` (cần khung `position: relative` có kích thước) —
 * áp vào các bố cục đang dựa trên CSS sẵn có sẽ làm méo/vỡ ảnh, nên ngoại lệ được gom về đúng một chỗ này.
 */
export function RemoteImage({ src, alt, ...rest }: RemoteImageProps) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} {...rest} />;
}
