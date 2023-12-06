import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!Array.isArray(body.fontNames)) return new Response('Invalid body', { status: 400 });
  const fonts = await fetch('https://video.anibel.net/api/fonts/get', {
    method: 'POST',
    body: JSON.stringify({ fontNames: body.fontNames }),
    headers: { 'Content-Type': 'application/json' },
  })
    .then(r => r.json() as Promise<string[]>)
    .catch(() => null);
  return new Response(JSON.stringify(fonts), { status: 200 });
}
