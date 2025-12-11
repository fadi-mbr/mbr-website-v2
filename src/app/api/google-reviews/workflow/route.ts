import { NextResponse } from 'next/server';
import { selectBestReviews, selectBestReviewsWithSmartAI } from '@/lib/ai-review-selector';

const PLACE_ID = process.env.GOOGLE_PLACE_ID;
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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
 * POST /api/google-reviews/workflow
 * Complete workflow to:
 * 1. Fetch reviews from Google Places API
 * 2. Filter to 5-star reviews
 * 3. Use AI to select the best 5 reviews
 * 4. Return curated selection
 * 
 * Query params:
 * - useAI: boolean (use OpenAI for selection, default: false)
 * - count: number (number of reviews to select, default: 5)
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const useAI = searchParams.get('useAI') === 'true';
    const count = parseInt(searchParams.get('count') || '5', 10);

    if (!PLACE_ID || !API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Google Places API configuration missing' },
        { status: 500 }
      );
    }

    // Step 1: Fetch reviews from Google Places API
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=rating,reviews,user_ratings_total&key=${API_KEY}`;
    
    const response = await fetch(url);
    const data: GooglePlacesResponse = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    if (!data.result || !data.result.reviews) {
      throw new Error('No reviews data found');
    }

    // Step 2: Process and filter to 5-star reviews
    const allReviews = data.result.reviews.map((review) => ({
      author_name: review.author_name,
      author_url: review.author_url,
      rating: review.rating,
      relative_time_description: review.relative_time_description,
      text: review.text,
      time: review.time,
      profile_photo_url: review.profile_photo_url
    }));

    const fiveStarReviews = allReviews.filter((review) => review.rating === 5);

    if (fiveStarReviews.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No 5-star reviews found',
        stats: {
          totalReviews: allReviews.length,
          fiveStarCount: 0
        }
      }, { status: 400 });
    }

    // Step 3: Use AI to select the best reviews
    const GEMINI_API_KEY = process.env.GOOGLE_AI_STUDIO_API_KEY;
    const selectedReviews = useAI
      ? await selectBestReviewsWithSmartAI(
          fiveStarReviews,
          count,
          GEMINI_API_KEY,
          OPENAI_API_KEY
        )
      : await selectBestReviews(fiveStarReviews, count);

    // Step 4: Return curated selection
    return NextResponse.json({
      success: true,
      data: {
        overallRating: data.result.rating,
        totalReviews: data.result.user_ratings_total,
        selectedReviews: selectedReviews.map(sr => sr.review),
        selectionDetails: selectedReviews.map(sr => ({
          author: sr.review.author_name,
          score: sr.score,
          reasons: sr.reasons
        })),
        stats: {
          totalFetched: allReviews.length,
          fiveStarCount: fiveStarReviews.length,
          selectedCount: selectedReviews.length,
          selectionMethod: useAI 
            ? (process.env.GOOGLE_AI_STUDIO_API_KEY ? 'AI (Google Gemini)' : 
               OPENAI_API_KEY ? 'AI (OpenAI)' : 'Rule-based')
            : 'Rule-based'
        },
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Review workflow error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process reviews'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/google-reviews/workflow
 * Get workflow status and information
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    info: {
      description: 'Review curation workflow endpoint',
      steps: [
        '1. Fetch reviews from Google Places API',
        '2. Filter to 5-star reviews only',
        '3. Use AI to analyze and score reviews',
        '4. Select top N most valuable reviews',
        '5. Return curated selection'
      ],
      usage: {
        method: 'POST',
        queryParams: {
          useAI: 'boolean - Use OpenAI for selection (requires OPENAI_API_KEY)',
          count: 'number - Number of reviews to select (default: 5)'
        },
        example: '/api/google-reviews/workflow?useAI=true&count=5'
      },
      features: {
        ruleBased: 'Automatic scoring based on detail, specificity, sentiment',
        aiPowered: 'OpenAI integration for advanced review analysis (optional)',
        filtering: 'Automatic 5-star review filtering',
        scoring: 'Multi-factor review value scoring'
      }
    }
  });
}

