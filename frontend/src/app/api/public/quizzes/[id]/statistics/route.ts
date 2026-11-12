import { NextResponse } from 'next/server';
import { INTERNAL_API_BASE_URL } from '@/constants/api-url';

const BACKEND_URL = INTERNAL_API_BASE_URL;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await fetch(`${BACKEND_URL}/public/quizzes/${id}/statistics`, {
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê khảo thí:', error);
    return NextResponse.json(
      { statusCode: 500, message: 'Lỗi máy chủ khi lấy thống kê' },
      { status: 500 }
    );
  }
}
