import { NextResponse } from 'next/server';
import { addReviewsToDatabase, getDatabaseStats } from '@/lib/reviews-database';

const PLACE_ID = process.env.GOOGLE_PLACE_ID;
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

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
  try {
    // Optional: Add secret check for security
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && secret !== expectedSecret) {
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
    
    const response = await fetch(url);
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
    const { added, total } = await addReviewsToDatabase(reviews, {
      placeId: PLACE_ID,
      overallRating: data.result.rating,
      totalReviews: data.result.user_ratings_total
    });

    // Get stats
    const stats = await getDatabaseStats();

    return NextResponse.json({
      success: true,
      message: 'Reviews fetched and stored successfully',
      data: {
        fetched: reviews.length,
        added: added,
        totalStored: total,
        stats: stats
      }
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch reviews'
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for manual triggering
 */
export async function POST() {
  return GET(new Request('http://localhost/api/cron/fetch-reviews'));
}

