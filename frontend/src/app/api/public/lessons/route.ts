import { NextResponse } from 'next/server';
import { INTERNAL_API_BASE_URL } from '@/constants/api-url';

const BACKEND_URL = INTERNAL_API_BASE_URL;

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
