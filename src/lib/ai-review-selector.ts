/**
 * AI Review Selector
 * Uses AI to analyze and select the most valuable reviews to display
 */

interface Review {
  author_name: string;
  author_url: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
  profile_photo_url: string;
}

interface ReviewScore {
  review: Review;
  score: number;
  reasons: string[];
}

/**
 * Analyze review value using AI
 * This function scores reviews based on:
 * - Detail and specificity
 * - Mention of specific services/products
 * - Emotional impact and authenticity
 * - Length and comprehensiveness
 * - Recency (newer reviews slightly favored)
 */
export async function analyzeReviewValue(review: Review): Promise<number> {
  // Score components (0-1 each)
  let score = 0;
  const reasons: string[] = [];

  // 1. Length score (detailed reviews are more valuable)
  const textLength = review.text.length;
  if (textLength > 200) {
    score += 0.3;
    reasons.push('Detailed review');
  } else if (textLength > 100) {
    score += 0.2;
    reasons.push('Moderate detail');
  } else {
    score += 0.1;
  }

  // 2. Specificity score (mentions specific services, staff, or details)
  const specificKeywords = [
    'bmw', 'mercedes', 'audi', 'porsche', 'range rover', 'lexus',
    'engine', 'transmission', 'brake', 'suspension', 'electrical',
    'michael', 'basel', 'technician', 'mechanic',
    'diagnostic', 'repair', 'service', 'maintenance',
    'honest', 'professional', 'trustworthy', 'expert'
  ];
  
  const lowerText = review.text.toLowerCase();
  const keywordMatches = specificKeywords.filter(keyword => 
    lowerText.includes(keyword)
  ).length;
  
  if (keywordMatches >= 3) {
    score += 0.3;
    reasons.push('Highly specific');
  } else if (keywordMatches >= 2) {
    score += 0.2;
    reasons.push('Specific details');
  } else if (keywordMatches >= 1) {
    score += 0.1;
    reasons.push('Some specifics');
  }

  // 3. Emotional impact score (positive sentiment indicators)
  const positiveWords = [
    'excellent', 'outstanding', 'amazing', 'exceptional', 'perfect',
    'highly recommend', 'best', 'great', 'wonderful', 'fantastic',
    'impressed', 'satisfied', 'trust', 'quality', 'professional'
  ];
  
  const positiveMatches = positiveWords.filter(word => 
    lowerText.includes(word)
  ).length;
  
  if (positiveMatches >= 3) {
    score += 0.2;
    reasons.push('Strong positive sentiment');
  } else if (positiveMatches >= 2) {
    score += 0.15;
    reasons.push('Positive sentiment');
  } else if (positiveMatches >= 1) {
    score += 0.1;
  }

  // 4. Authenticity score (personal experience indicators)
  const authenticityIndicators = [
    'i took', 'my car', 'my vehicle', 'i brought', 'i visited',
    'they fixed', 'they diagnosed', 'they repaired', 'they explained',
    'will return', 'definitely', 'absolutely'
  ];
  
  const authenticityMatches = authenticityIndicators.filter(indicator => 
    lowerText.includes(indicator)
  ).length;
  
  if (authenticityMatches >= 2) {
    score += 0.2;
    reasons.push('Personal experience');
  } else if (authenticityMatches >= 1) {
    score += 0.1;
    reasons.push('First-hand account');
  }

  // 5. Recency bonus (slightly favor newer reviews)
  const reviewAge = Date.now() - (review.time * 1000);
  const daysAgo = reviewAge / (1000 * 60 * 60 * 24);
  
  if (daysAgo < 30) {
    score += 0.1;
    reasons.push('Recent review');
  } else if (daysAgo < 90) {
    score += 0.05;
  }

  return Math.min(score, 1.0); // Cap at 1.0
}

/**
 * Select top N reviews using AI analysis
 */
export async function selectBestReviews(
  reviews: Review[],
  count: number = 5
): Promise<ReviewScore[]> {
  // Score all reviews
  const scoredReviews: ReviewScore[] = await Promise.all(
    reviews.map(async (review) => {
      const score = await analyzeReviewValue(review);
      const reasons: string[] = [];
      
      // Get reasons (simplified - in production, this would come from AI)
      const textLength = review.text.length;
      if (textLength > 200) reasons.push('Detailed');
      if (review.text.toLowerCase().includes('bmw') || 
          review.text.toLowerCase().includes('mercedes')) {
        reasons.push('Brand-specific');
      }
      if (review.text.toLowerCase().includes('highly recommend')) {
        reasons.push('Strong recommendation');
      }
      
      return {
        review,
        score,
        reasons: reasons.length > 0 ? reasons : ['Quality review']
      };
    })
  );

  // Sort by score (highest first)
  scoredReviews.sort((a, b) => b.score - a.score);

  // Return top N
  return scoredReviews.slice(0, count);
}

/**
 * Enhanced AI selection using OpenAI API (if available)
 */
export async function selectBestReviewsWithAI(
  reviews: Review[],
  count: number = 5,
  openaiApiKey?: string
): Promise<ReviewScore[]> {
  // If no OpenAI API key, fall back to rule-based selection
  if (!openaiApiKey) {
    return selectBestReviews(reviews, count);
  }

  try {
    // Use OpenAI to analyze and rank reviews
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at analyzing customer reviews for an automotive service business. 
            Rate each review on a scale of 0-1 based on:
            1. Detail and specificity (mentions specific services, vehicles, or staff)
            2. Authenticity and personal experience
            3. Positive sentiment and recommendation strength
            4. Comprehensiveness and helpfulness
            
            Return a JSON array with scores for each review.`
          },
          {
            role: 'user',
            content: `Analyze these ${reviews.length} reviews and score them (0-1). Return JSON:
            ${JSON.stringify(reviews.map((r, i) => ({
              index: i,
              text: r.text,
              rating: r.rating,
              time: r.relative_time_description
            })))}`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error('OpenAI API error');
    }

    const data = await response.json();
    const scores = JSON.parse(data.choices[0].message.content);

    // Map scores to reviews
    const scoredReviews: ReviewScore[] = reviews.map((review, index) => ({
      review,
      score: scores[`review_${index}`]?.score || 0.5,
      reasons: scores[`review_${index}`]?.reasons || ['AI analyzed']
    }));

    // Sort and return top N
    scoredReviews.sort((a, b) => b.score - a.score);
    return scoredReviews.slice(0, count);

  } catch (error) {
    console.error('AI review selection failed, using fallback:', error);
    return selectBestReviews(reviews, count);
  }
}

