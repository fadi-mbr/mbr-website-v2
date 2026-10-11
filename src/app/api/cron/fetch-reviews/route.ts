import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { isProductionDeployment } from '@/lib/runtime-environment';
import { addReviewsToDatabase, getDatabaseStats } from '@/lib/reviews-database';


interface GoogleReview {
  author_name: string;
  author_url: string;
  language: string;
  original_language: string;
  profile_photo_url: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
  translated: boolean;
}

interface GooglePlacesResponse {
  result: {
    rating: number;
    reviews: GoogleReview[];
    user_ratings_total: number;
  };
  status: string;
}

/**
 * Cron job endpoint to fetch and store reviews
 * 
 * This endpoint should be called by Vercel Cron Jobs
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/fetch-reviews",
 *     "schedule": "0 2 * * *" // Daily at 2 AM
 *   }]
 * }
 * 
 * Or call manually: GET /api/cron/fetch-reviews?secret=YOUR_SECRET
 */
export async function GET(request: Request) {
  const correlationId = randomUUID();
  if (!isProductionDeployment()) {
    return NextResponse.json({ success: false, error: 'staging_delivery_disabled', correlationId }, { status: 403 });
  }
  let stage = 'configuration';
  try {
    const PLACE_ID = process.env.GOOGLE_PLACE_ID;
    const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      return NextResponse.json(
        { success: false, error: 'Server misconfigured: CRON_SECRET not set' },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('authorization') ?? '';
    const headerSecret = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : null;
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get('secret');
    const provided = headerSecret ?? querySecret;

    if (provided !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!PLACE_ID || !API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Google Places API configuration missing' },
        { status: 500 }
      );
    }

    // Fetch reviews from Google Places API
    // Note: Google Places API only returns max 5 reviews per call
    // We accumulate these over time in the database
    // Language parameter can help get reviews in specific language
    const language = 'en'; // Optional: can be made configurable
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=rating,reviews,user_ratings_total&language=${language}&key=${API_KEY}`;
    
    stage = 'google_fetch';
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error('upstream_http_failure');
    const data: GooglePlacesResponse = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    if (!data.result || !data.result.reviews) {
      throw new Error('No reviews data found');
    }

    // Process reviews
    const reviews = data.result.reviews.map((review) => ({
      author_name: review.author_name,
      author_url: review.author_url,
      rating: review.rating,
      relative_time_description: review.relative_time_description,
      text: review.text,
      time: review.time,
      profile_photo_url: review.profile_photo_url
    }));

    // Add to database (deduplicates automatically)
    stage = 'persistence';
    const { added, total } = await addReviewsToDatabase(reviews, {
      placeId: PLACE_ID,
      overallRating: data.result.rating,
      totalReviews: data.result.user_ratings_total
    });

    // Get stats
    const stats = await getDatabaseStats();

    console.info(JSON.stringify({ event: 'reviews_cron_succeeded', correlationId, timestamp: new Date().toISOString() }));
    return NextResponse.json({
      correlationId,
      success: true,
      message: 'Reviews fetched and stored successfully',
      data: {
        fetched: reviews.length,
        added: added,
        totalStored: total,
        stats: stats
      }
    });

  } catch {
    // Never log upstream errors: they may contain API URLs, credentials or review text.
    console.error(JSON.stringify({ event: 'reviews_cron_failed', correlationId, stage, timestamp: new Date().toISOString() }));
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch reviews',
        correlationId
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for manual triggering
 */
export async function POST(request: Request) {
  return GET(request);
}

