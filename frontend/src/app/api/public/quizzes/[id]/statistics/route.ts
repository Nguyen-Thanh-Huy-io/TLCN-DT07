import { NextResponse } from 'next/server';

const BACKEND_URL = (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000').replace(
  '://localhost',
  '://127.0.0.1'
);

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
