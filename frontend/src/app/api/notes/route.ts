import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:5000';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const targetUrl = `${BACKEND_URL}/notes${queryString ? `?${queryString}` : ''}`;

    const headers: Record<string, string> = {};
    const authHeader = req.headers.get('authorization');
    if (authHeader) headers['authorization'] = authHeader;
    const guestHeader = req.headers.get('x-guest-id');
    if (guestHeader) headers['x-guest-id'] = guestHeader;

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
    const authHeader = req.headers.get('authorization');
    if (authHeader) headers['authorization'] = authHeader;
    const guestHeader = req.headers.get('x-guest-id');
    if (guestHeader) headers['x-guest-id'] = guestHeader;

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
