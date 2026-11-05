import { NextResponse } from 'next/server';

const BACKEND_URL = (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001').replace(
  '://localhost',
  '://127.0.0.1'
);

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/public/lessons`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return NextResponse.json(
        { statusCode: res.status, message: 'Lỗi từ backend' },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API route /api/public/lessons error:', error);
    return NextResponse.json(
      { statusCode: 500, message: 'Không thể kết nối đến backend service' },
      { status: 500 }
    );
  }
}
