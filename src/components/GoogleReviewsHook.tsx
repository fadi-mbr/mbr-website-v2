"use client";

import { useState, useEffect } from 'react';

interface GoogleReview {
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
  reviews: GoogleReview[];
}

interface UseGoogleReviewsReturn {
  data: ReviewsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useGoogleReviews(): UseGoogleReviewsReturn {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/google-reviews');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch reviews');
      }

      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'API returned unsuccessful response');
      }
    } catch (err) {
      console.error('Error fetching Google reviews:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');

      // Fallback to static data if API fails
      setData({
        overallRating: 4.8,
        totalReviews: 883,
        lastUpdated: new Date().toISOString(),
        reviews: []
      });
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchReviews();
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  return { data, loading, error, refetch };
}

// Optional: Component wrapper for easy use
interface GoogleReviewsProviderProps {
  children: (props: UseGoogleReviewsReturn) => React.ReactNode;
}

export function GoogleReviewsProvider({ children }: GoogleReviewsProviderProps) {
  const reviewsState = useGoogleReviews();
  return <>{children(reviewsState)}</>;
}