/** Server-side deployment boundary. NODE_ENV=production also means preview builds. */
export function isProductionDeployment(env: Partial<NodeJS.ProcessEnv> = process.env): boolean {
  if (env.VERCEL_ENV) return env.VERCEL_ENV === 'production';
  return env.MBR_RUNTIME_ENV === 'production';
}

export function bookingSigningSecret(): string | undefined {
  if (isProductionDeployment()) return process.env.BOOKING_TOKEN_SECRET;
  const testSecret = process.env.BOOKING_TEST_TOKEN_SECRET;
  return testSecret && testSecret !== process.env.BOOKING_TOKEN_SECRET ? testSecret : undefined;
}

export function bookingSiteOrigin(): string {
  if (isProductionDeployment()) {
    return (process.env.NEXT_PUBLIC_SITE_URL || 'https://mbrme.com').replace(/\/+$/, '');
  }
  // Never trust a copied public-site variable or a request Host header in previews.
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3005';
}

/** Local fixtures only: no network transport and no customer data. */
export function mockArcResponse(path: string): Response {
  if (path === '/public/appointment/services') {
    return Response.json([{ id: 900001, title: 'Staging inspection', type: 'service', duration: 1, price: 0 }]);
  }
  if (path === '/public/shop/timetable') return Response.json({});
  if (path === '/auth/worker/login') return Response.json({ token: 'staging-fixture' });
  if (path === '/appointment/week/workers') return Response.json({ workerWeek: [] });
  if (path === '/public/appointment') return new Response(null, { status: 200 });
  throw new Error('Unsupported staging ARC operation');
}
