import { NextResponse } from 'next/server';

export function middleware(req) {
  const userAgent = req.headers.get('user-agent') || '';

  const isBot =
    /facebookexternalhit|WhatsApp|Twitterbot|LinkedInBot|Googlebot|bingbot/i.test(userAgent);

  const url = req.nextUrl.clone();

  // 🔥 SOLO interceptar páginas de eventos
  if (isBot && url.pathname.startsWith('/evento/')) {
    const slug = url.pathname.replace('/evento/', '');

    return NextResponse.redirect(
      `https://prontoticket-api-production.up.railway.app/api/events/seo/${slug}`,
      302
    );
  }

  return NextResponse.next();
}