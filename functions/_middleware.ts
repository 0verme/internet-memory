const PRIVATE_PATH = /^\/(?:submit|login)(?:\/|$)/;
const API_PATH = /^\/api(?:\/|$)/;

export const onRequest: PagesFunction<Env> = async ({ request, next }) => {
  let pathname: string;
  let isHttps: boolean;
  try {
    const url = new URL(request.url);
    pathname = url.pathname;
    isHttps = url.protocol === 'https:';
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  const response = await next();
  const headers = new Headers(response.headers);

  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: https://pbs.twimg.com; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'",
  );

  if (isHttps) {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  if (PRIVATE_PATH.test(pathname) || API_PATH.test(pathname)) {
    headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
