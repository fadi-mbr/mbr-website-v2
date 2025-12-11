import { NextResponse } from 'next/server';
import { getFiveStarReviews, getDatabaseStats } from '@/lib/reviews-database';
import { selectBestReviews } from '@/lib/ai-review-selector';

/**
 * GET /api/google-reviews/from-database
 * Get curated reviews from stored database
 * 
 * Query params:
 * - count: number of reviews to return (default: 5)
 * - useAI: boolean (use OpenAI, default: false)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count') || '5', 10);
    const useAI = searchParams.get('useAI') === 'true';

    // Get all 5-star reviews from database
    const fiveStarReviews = await getFiveStarReviews();
    const stats = await getDatabaseStats();

    if (fiveStarReviews.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No reviews in database. Run /api/cron/fetch-reviews first.',
        stats
      }, { status: 404 });
    }

    // Select best reviews using AI
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const selectedReviews = useAI && openaiApiKey
      ? await import('@/lib/ai-review-selector').then(m => 
          m.selectBestReviewsWithAI(fiveStarReviews, count, openaiApiKey)
        )
      : await selectBestReviews(fiveStarReviews, count);

    // Format response
    const reviews = selectedReviews.map(sr => ({
      author_name: sr.review.author_name,
      author_url: sr.review.author_url,
      rating: sr.review.rating,
      relative_time_description: sr.review.relative_time_description,
      text: sr.review.text,
      time: sr.review.time,
      profile_photo_url: sr.review.profile_photo_url
    }));

    return NextResponse.json({
      success: true,
      data: {
        overallRating: stats.metadata.overallRating,
        totalReviews: stats.metadata.totalReviews,
        reviews: reviews,
        selectionDetails: selectedReviews.map(sr => ({
          author: sr.review.author_name,
          score: sr.score,
          reasons: sr.reasons
        })),
        stats: {
          totalInDatabase: stats.totalReviews,
          fiveStarInDatabase: stats.fiveStarCount,
          selectedCount: reviews.length,
          selectionMethod: useAI && openaiApiKey ? 'AI (OpenAI)' : 'Rule-based'
        },
        lastUpdated: stats.metadata.lastUpdated
      }
    });

  } catch (error) {
    console.error('Database reviews error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get reviews from database'
      },
      { status: 500 }
    );
  }
}

