import { NextResponse } from 'next/server';

export function middleware(req) {
  const userAgent = req.headers.get('user-agent') || '';
  const url = req.nextUrl.clone();

  const isBot =
    userAgent.includes('facebookexternalhit') ||
    userAgent.includes('WhatsApp') ||
    userAgent.includes('Twitterbot') ||
    userAgent.includes('LinkedInBot');

  if (isBot && url.pathname.startsWith('/evento/')) {
    const slug = url.pathname.replace('/evento/', '');

    return NextResponse.rewrite(
      `https://prontoticket-api-production.up.railway.app/api/events/seo/${slug}`
    );
  }

  return NextResponse.next();
}