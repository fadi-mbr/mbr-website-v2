import { NextResponse } from 'next/server';
import { selectBestReviewsWithSmartAI } from '@/lib/ai-review-selector';
import { getFiveStarReviews, getDatabaseStats, addReviewsToDatabase } from '@/lib/reviews-database';

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

interface ProcessedReview {
  author_name: string;
  author_url: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
  profile_photo_url: string;
}

interface ReviewsData {
  overallRating: number;
  totalReviews: number;
  lastUpdated: string;
  reviews: ProcessedReview[];
}

const PLACE_ID = process.env.GOOGLE_PLACE_ID;
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Cache for reviews data
let cachedReviews: ReviewsData | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

async function fetchGoogleReviews(useDatabase: boolean = true): Promise<ReviewsData> {
  if (!PLACE_ID || !API_KEY) {
    throw new Error('Google Places API configuration missing');
  }

  // Try to use database first if available
  if (useDatabase) {
    try {
      const dbStats = await getDatabaseStats();
      const dbFiveStarReviews = await getFiveStarReviews();
      
      // If we have reviews in database, use them
      if (dbFiveStarReviews.length > 0) {
        // Select best reviews from database using AI (Gemini preferred)
        const geminiApiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
        const openaiApiKey = process.env.OPENAI_API_KEY;
        
        const selectedReviews = await selectBestReviewsWithSmartAI(
          dbFiveStarReviews.map(r => ({
            author_name: r.author_name,
            author_url: r.author_url,
            rating: r.rating,
            relative_time_description: r.relative_time_description,
            text: r.text,
            time: r.time,
            profile_photo_url: r.profile_photo_url
          })),
          5,
          geminiApiKey,
          openaiApiKey
        );

        return {
          overallRating: dbStats.metadata.overallRating || 4.8,
          totalReviews: dbStats.metadata.totalReviews || 883,
          lastUpdated: dbStats.metadata.lastUpdated,
          reviews: selectedReviews.map(sr => sr.review)
        };
      }
    } catch (error) {
      console.warn('Database not available, fetching from Google:', error);
      // Fall through to fetch from Google
    }
  }

  // Fetch from Google Places API
  // Note: Google Places API only returns max 5 reviews per call
  // We use the database to accumulate more reviews over time
  // Optional: Add language parameter to get reviews in specific language
  const language = 'en'; // Optional: can be made configurable
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=rating,reviews,user_ratings_total&language=${language}&key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data: GooglePlacesResponse = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    if (!data.result || !data.result.reviews) {
      throw new Error('No reviews data found');
    }

    // Process and format all reviews
    const allReviews: ProcessedReview[] = data.result.reviews.map((review) => ({
      author_name: review.author_name,
      author_url: review.author_url,
      rating: review.rating,
      relative_time_description: review.relative_time_description,
      text: review.text,
      time: review.time,
      profile_photo_url: review.profile_photo_url
    }));

    // Store in database (async, don't wait)
    addReviewsToDatabase(allReviews, {
      placeId: PLACE_ID,
      overallRating: data.result.rating,
      totalReviews: data.result.user_ratings_total
    }).catch(err => console.error('Failed to store reviews:', err));

    // Filter to 5-star reviews
    const fiveStarReviews = allReviews.filter((review) => review.rating === 5);

    // Use AI to select the best 5 reviews from 5-star reviews
    // The selection algorithm ensures variety by avoiding duplicate authors
    let selectedReviews: ProcessedReview[];
    if (fiveStarReviews.length > 5) {
      const geminiApiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
      const openaiApiKey = process.env.OPENAI_API_KEY;
      
      // Get previously selected reviews from cache to avoid showing same ones
      const previousReviewIds = cachedReviews?.reviews 
        ? new Set(cachedReviews.reviews.map(r => `${r.author_name}_${r.time}`))
        : undefined;
      
      const scoredReviews = await selectBestReviewsWithSmartAI(
        fiveStarReviews,
        5,
        geminiApiKey,
        openaiApiKey,
        previousReviewIds
      );
      selectedReviews = scoredReviews.map((sr: { review: ProcessedReview }) => sr.review);
    } else {
      selectedReviews = fiveStarReviews;
    }

    const reviewsData: ReviewsData = {
      overallRating: data.result.rating,
      totalReviews: data.result.user_ratings_total,
      lastUpdated: new Date().toISOString(),
      reviews: selectedReviews
    };

    return reviewsData;
  } catch (error) {
    console.error('Error fetching Google reviews:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const currentTime = Date.now();

    // Check if we have cached data and it's still valid
    if (cachedReviews && (currentTime - lastFetchTime) < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: cachedReviews,
        cached: true,
        cacheAge: Math.floor((currentTime - lastFetchTime) / 1000 / 60) // Age in minutes
      });
    }

    // Fetch fresh data
    const reviewsData = await fetchGoogleReviews();

    // Update cache
    cachedReviews = reviewsData;
    lastFetchTime = currentTime;

    return NextResponse.json({
      success: true,
      data: reviewsData,
      cached: false,
      message: 'Reviews fetched successfully'
    });

  } catch (error) {
    console.error('Google Reviews API error:', error);

    // If we have cached data, return it even if it's stale
    if (cachedReviews) {
      return NextResponse.json({
        success: true,
        data: cachedReviews,
        cached: true,
        warning: 'Returned cached data due to API error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch reviews',
      message: 'Unable to fetch Google reviews'
    }, { status: 500 });
  }
}

// Optional: POST endpoint to force refresh
export async function POST() {
  try {
    const reviewsData = await fetchGoogleReviews();

    // Update cache
    cachedReviews = reviewsData;
    lastFetchTime = Date.now();

    return NextResponse.json({
      success: true,
      data: reviewsData,
      message: 'Reviews refreshed successfully'
    });

  } catch (error) {
    console.error('Force refresh error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh reviews'
    }, { status: 500 });
  }
}