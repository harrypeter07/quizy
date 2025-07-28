export function middleware(req) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/api/admin')) {
    const token = req.headers.get('authorization');
    if (!token || token !== `Bearer ${process.env.ADMIN_TOKEN}`) {
      return new Response('Unauthorized', { status: 401 });
    }
  }
  return null; // Continue
}

export const config = {
  matcher: ['/api/admin/:path*'],
}; 