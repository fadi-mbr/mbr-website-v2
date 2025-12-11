/**
 * Lightweight Reviews Database
 * Uses JSON file storage (can be migrated to Vercel KV or other storage later)
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface StoredReview {
  author_name: string;
  author_url: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
  profile_photo_url: string;
  fetchedAt: string; // When we fetched this review
  reviewId: string; // Unique identifier (author_name + time)
}

interface ReviewsDatabase {
  reviews: StoredReview[];
  lastFetch: string;
  totalFetched: number;
  metadata: {
    placeId: string;
    overallRating: number;
    totalReviews: number;
    lastUpdated: string;
  };
}

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'reviews-database.json');
const MAX_REVIEWS_TO_STORE = 100; // Store up to 100 reviews

/**
 * Get unique review ID
 */
function getReviewId(review: { author_name: string; time: number }): string {
  return `${review.author_name}_${review.time}`;
}

/**
 * Load reviews database from file
 */
export async function loadReviewsDatabase(): Promise<ReviewsDatabase> {
  try {
    const fileContent = await fs.readFile(DB_FILE_PATH, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    // If file doesn't exist, return empty database
    return {
      reviews: [],
      lastFetch: new Date(0).toISOString(),
      totalFetched: 0,
      metadata: {
        placeId: '',
        overallRating: 0,
        totalReviews: 0,
        lastUpdated: new Date().toISOString()
      }
    };
  }
}

/**
 * Save reviews database to file
 */
export async function saveReviewsDatabase(data: ReviewsDatabase): Promise<void> {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(DB_FILE_PATH);
    await fs.mkdir(dataDir, { recursive: true });
    
    // Save to file
    await fs.writeFile(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save reviews database:', error);
    throw error;
  }
}

/**
 * Add new reviews to database (deduplicates)
 */
export async function addReviewsToDatabase(
  newReviews: Array<{
    author_name: string;
    author_url: string;
    rating: number;
    relative_time_description: string;
    text: string;
    time: number;
    profile_photo_url: string;
  }>,
  metadata: {
    placeId: string;
    overallRating: number;
    totalReviews: number;
  }
): Promise<{ added: number; total: number }> {
  const db = await loadReviewsDatabase();
  const existingIds = new Set(db.reviews.map(r => r.reviewId));
  
  let added = 0;
  const now = new Date().toISOString();

  // Add new reviews (deduplicate by reviewId)
  for (const review of newReviews) {
    const reviewId = getReviewId(review);
    if (!existingIds.has(reviewId)) {
      db.reviews.push({
        ...review,
        fetchedAt: now,
        reviewId
      });
      existingIds.add(reviewId);
      added++;
    }
  }

  // Sort by time (newest first) and keep only most recent
  db.reviews.sort((a, b) => b.time - a.time);
  if (db.reviews.length > MAX_REVIEWS_TO_STORE) {
    db.reviews = db.reviews.slice(0, MAX_REVIEWS_TO_STORE);
  }

  // Update metadata
  db.lastFetch = now;
  db.totalFetched += added;
  db.metadata = {
    ...metadata,
    lastUpdated: now
  };

  await saveReviewsDatabase(db);

  return {
    added,
    total: db.reviews.length
  };
}

/**
 * Get all 5-star reviews from database
 */
export async function getFiveStarReviews(): Promise<StoredReview[]> {
  const db = await loadReviewsDatabase();
  return db.reviews.filter(r => r.rating === 5);
}

/**
 * Get all reviews from database (regardless of rating)
 */
export async function getAllStoredReviews(): Promise<StoredReview[]> {
  const db = await loadReviewsDatabase();
  return db.reviews;
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{
  totalReviews: number;
  fiveStarCount: number;
  lastFetch: string;
  metadata: ReviewsDatabase['metadata'];
}> {
  const db = await loadReviewsDatabase();
  const fiveStarCount = db.reviews.filter(r => r.rating === 5).length;

  return {
    totalReviews: db.reviews.length,
    fiveStarCount,
    lastFetch: db.lastFetch,
    metadata: db.metadata
  };
}

/**
 * Clear old reviews (older than specified days)
 */
export async function clearOldReviews(olderThanDays: number = 365): Promise<number> {
  const db = await loadReviewsDatabase();
  const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
  
  const beforeCount = db.reviews.length;
  db.reviews = db.reviews.filter(r => r.time * 1000 > cutoffTime);
  const afterCount = db.reviews.length;
  
  await saveReviewsDatabase(db);
  
  return beforeCount - afterCount;
}

