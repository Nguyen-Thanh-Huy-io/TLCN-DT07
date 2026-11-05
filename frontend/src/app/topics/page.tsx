import { redirect } from 'next/navigation';

/**
 * Trang /topics tự động chuyển hướng tới Lộ trình & Cây phân cấp Chủ đề /curriculum
 */
export default function TopicsPage() {
  redirect('/curriculum');
}
