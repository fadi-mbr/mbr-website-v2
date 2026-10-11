'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

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
  const request = useRef<AbortController | null>(null);

  const fetchReviews = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    try {
      const response = await fetch('/api/google-reviews', { signal: controller.signal });
      const result = await response.json();
      if (!response.ok || !result.success || !Array.isArray(result.data?.reviews)) {
        throw new Error('Reviews are temporarily unavailable');
      }
      if (!controller.signal.aborted) {
        setData(result.data);
        setError(null);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Reviews are temporarily unavailable');
        setData(null);
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Start on a microtask; even synchronous fetch errors update state after the effect.
    let active = true;
    void Promise.resolve().then(() => { if (active) return fetchReviews(); });
    return () => { active = false; request.current?.abort(); };
  }, [fetchReviews]);

  const refetch = async () => {
    setLoading(true);
    await fetchReviews();
  };
  return { data, loading, error, refetch };
}

export function GoogleReviewsProvider({ children }: { children: (props: UseGoogleReviewsReturn) => React.ReactNode }) {
  return <>{children(useGoogleReviews())}</>;
}
