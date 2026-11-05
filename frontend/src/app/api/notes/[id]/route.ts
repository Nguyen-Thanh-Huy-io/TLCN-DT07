import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:5001';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const targetUrl = `${BACKEND_URL}/notes/${id}${queryString ? `?${queryString}` : ''}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const authHeader = req.headers.get('authorization');
    if (authHeader) headers['authorization'] = authHeader;
    const guestHeader = req.headers.get('x-guest-id');
    if (guestHeader) headers['x-guest-id'] = guestHeader;

    const res = await fetch(targetUrl, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi cập nhật ghi chú';
    return NextResponse.json(
      { error: 'Không thể cập nhật ghi chú', details: message },
      { status: 502 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const targetUrl = `${BACKEND_URL}/notes/${id}${queryString ? `?${queryString}` : ''}`;

    const headers: Record<string, string> = {};
    const authHeader = req.headers.get('authorization');
    if (authHeader) headers['authorization'] = authHeader;
    const guestHeader = req.headers.get('x-guest-id');
    if (guestHeader) headers['x-guest-id'] = guestHeader;

    const res = await fetch(targetUrl, {
      method: 'DELETE',
      headers,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi xoá ghi chú';
    return NextResponse.json(
      { error: 'Không thể xoá ghi chú', details: message },
      { status: 502 }
    );
  }
}
