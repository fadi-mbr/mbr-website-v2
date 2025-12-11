import { NextResponse } from 'next/server';
import { selectBestReviews, selectBestReviewsWithAI } from '@/lib/ai-review-selector';

/**
 * POST /api/google-reviews/select
 * Selects the best reviews using AI analysis
 * 
 * Body: {
 *   reviews: Review[],
 *   count?: number (default: 5),
 *   useAI?: boolean (default: false)
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reviews, count = 5, useAI = false } = body;

    if (!reviews || !Array.isArray(reviews)) {
      return NextResponse.json(
        { success: false, error: 'Reviews array is required' },
        { status: 400 }
      );
    }

    // Filter to only 5-star reviews first
    interface ReviewInput {
      rating: number;
      author_name?: string;
      text?: string;
      [key: string]: unknown;
    }
    const fiveStarReviews = reviews.filter((review: ReviewInput) => review.rating === 5);

    if (fiveStarReviews.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No 5-star reviews found' },
        { status: 400 }
      );
    }

    // Select best reviews
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const selectedReviews = useAI && openaiApiKey
      ? await selectBestReviewsWithAI(fiveStarReviews, count, openaiApiKey)
      : await selectBestReviews(fiveStarReviews, count);

    return NextResponse.json({
      success: true,
      data: {
        selectedReviews: selectedReviews.map(sr => sr.review),
        scores: selectedReviews.map(sr => ({
          author: sr.review.author_name,
          score: sr.score,
          reasons: sr.reasons
        })),
        totalAnalyzed: fiveStarReviews.length,
        selectedCount: selectedReviews.length
      }
    });

  } catch (error) {
    console.error('Review selection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to select reviews'
      },
      { status: 500 }
    );
  }
}

