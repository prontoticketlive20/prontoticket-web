export function middleware(req) {
  const userAgent = req.headers.get('user-agent') || '';

  const isBot =
    userAgent.includes('facebookexternalhit') ||
    userAgent.includes('WhatsApp') ||
    userAgent.includes('Twitterbot') ||
    userAgent.includes('LinkedInBot');

  const url = req.nextUrl;

  // 🔥 SOLO INTERCEPTA EVENTOS
  if (isBot && url.pathname.startsWith('/evento/')) {
    const slug = url.pathname.replace('/evento/', '');

    return Response.redirect(
      `https://prontoticket-api-production.up.railway.app/api/events/seo/${slug}`
    );
  }

  return;
}