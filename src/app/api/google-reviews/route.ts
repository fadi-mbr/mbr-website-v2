import { NextRequest, NextResponse } from 'next/server';

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

async function fetchGoogleReviews(): Promise<ReviewsData> {
  if (!PLACE_ID || !API_KEY) {
    throw new Error('Google Places API configuration missing');
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=rating,reviews,user_ratings_total&key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data: GooglePlacesResponse = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    if (!data.result || !data.result.reviews) {
      throw new Error('No reviews data found');
    }

    // Process and format reviews
    const processedReviews: ProcessedReview[] = data.result.reviews.map((review) => ({
      author_name: review.author_name,
      author_url: review.author_url,
      rating: review.rating,
      relative_time_description: review.relative_time_description,
      text: review.text,
      time: review.time,
      profile_photo_url: review.profile_photo_url
    }));

    const reviewsData: ReviewsData = {
      overallRating: data.result.rating,
      totalReviews: data.result.user_ratings_total,
      lastUpdated: new Date().toISOString(),
      reviews: processedReviews
    };

    return reviewsData;
  } catch (error) {
    console.error('Error fetching Google reviews:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
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
export async function POST(request: NextRequest) {
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