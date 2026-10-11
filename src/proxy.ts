import { NextRequest, NextResponse } from 'next/server';
import { isProductionDeployment } from './lib/runtime-environment';

/** Preview APIs never call production providers, even if credentials are copied. */
export function proxy(request: NextRequest) {
  if (isProductionDeployment()) return NextResponse.next();

  const path = request.nextUrl.pathname;
  const headers = { 'Cache-Control': 'no-store', 'X-MBR-Data-Source': 'staging-fixture' };
  if (request.method === 'GET' && path === '/api/google-reviews') {
    return NextResponse.json({
      success: true,
      fixture: true,
      data: {
        overallRating: 5,
        totalReviews: 1,
        lastUpdated: '2026-10-10T00:00:00.000Z',
        reviews: [{
          author_name: 'Staging test customer', author_url: '', rating: 5,
          relative_time_description: 'Test data', text: 'Synthetic review for website testing.',
          time: 1791590400, profile_photo_url: '',
        }],
      },
    }, { headers });
  }
  if (request.method === 'GET' && path === '/api/location') {
    return NextResponse.json({
      success: true, fixture: true,
      data: {
        name: 'MBR Auto Services', address: '16 8 St Al Quoz - Dubai',
        coordinates: { lat: 25.1389859, lng: 55.2250031 },
        placeId: '', googleMapsUrl: 'https://maps.app.goo.gl/gj9EXG4uchRBtZcE6', embedUrl: '',
      },
    }, { headers });
  }
  return NextResponse.json({ error: 'Integration disabled outside production' }, { status: 403, headers });
}

export const config = {
  matcher: ['/api/google-reviews/:path*', '/api/location', '/api/cron/:path*'],
};
