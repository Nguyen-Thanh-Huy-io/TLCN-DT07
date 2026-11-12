import { NextRequest, NextResponse } from 'next/server';
import {
  AUTH_HEADER_NAME,
  GUEST_ID_HEADER_NAME,
  INTERNAL_API_BASE_URL,
} from '@/constants/api-url';

const BACKEND_URL = INTERNAL_API_BASE_URL;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const targetUrl = `${BACKEND_URL}/notes${queryString ? `?${queryString}` : ''}`;

    const headers: Record<string, string> = {};
    const authHeader = req.headers.get(AUTH_HEADER_NAME);
    if (authHeader) headers[AUTH_HEADER_NAME] = authHeader;
    const guestHeader = req.headers.get(GUEST_ID_HEADER_NAME);
    if (guestHeader) headers[GUEST_ID_HEADER_NAME] = guestHeader;

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi proxy API notes';
    return NextResponse.json(
      { error: 'Không thể kết nối đến máy chủ backend', details: message },
      { status: 502 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const authHeader = req.headers.get(AUTH_HEADER_NAME);
    if (authHeader) headers[AUTH_HEADER_NAME] = authHeader;
    const guestHeader = req.headers.get(GUEST_ID_HEADER_NAME);
    if (guestHeader) headers[GUEST_ID_HEADER_NAME] = guestHeader;

    const res = await fetch(`${BACKEND_URL}/notes`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi tạo ghi chú';
    return NextResponse.json(
      { error: 'Không thể tạo ghi chú', details: message },
      { status: 502 }
    );
  }
}
