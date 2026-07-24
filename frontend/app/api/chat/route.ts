import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api/v1';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    const headers: Record<string, string> = {
      'Content-Type': req.headers.get('content-type') || 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['Cookie'] = `token=${token}`;
    }

    const body = await req.text();

    const backendRes = await fetch(`${BACKEND_URL}/chat`, {
      method: 'POST',
      headers,
      body,
    });

    if (!backendRes.ok) {
      const errorText = await backendRes.text();
      return new NextResponse(errorText, {
        status: backendRes.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const resHeaders = new Headers();
    resHeaders.set('Content-Type', backendRes.headers.get('content-type') || 'text/event-stream');
    
    const xChatId = backendRes.headers.get('x-chat-id');
    if (xChatId) {
      resHeaders.set('x-chat-id', xChatId);
      resHeaders.set('Access-Control-Expose-Headers', 'x-chat-id');
    }

    return new NextResponse(backendRes.body, {
      status: 200,
      headers: resHeaders,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
