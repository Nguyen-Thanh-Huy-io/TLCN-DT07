import { NextResponse } from 'next/server';
import { INTERNAL_API_BASE_URL } from '@/constants/api-url';

const BACKEND_URL = INTERNAL_API_BASE_URL;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const res = await fetch(`${BACKEND_URL}/public/quizzes/${id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Lỗi khi nộp bài khảo thí:', error);
    return NextResponse.json(
      { statusCode: 500, message: 'Lỗi máy chủ khi nộp bài' },
      { status: 500 }
    );
  }
}
