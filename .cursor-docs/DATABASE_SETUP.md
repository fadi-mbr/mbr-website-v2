# Reviews Database Setup Guide

## Overview

The website now uses a lightweight JSON file-based database to store Google reviews over time. This allows us to:
- Build up a collection of reviews (beyond the 5 that Google Places API returns)
- Select the best reviews from a larger pool
- Have reviews available even if Google API is temporarily unavailable

## How It Works

### 1. Database Storage
- **Location:** `data/reviews-database.json`
- **Format:** JSON file with reviews array
- **Max Reviews:** 100 (most recent)
- **Deduplication:** Automatic (by author + timestamp)

### 2. Automatic Fetching
- **Vercel Cron Job:** Runs daily at 2 AM UTC
- **Endpoint:** `/api/cron/fetch-reviews`
- **Action:** Fetches latest reviews from Google and stores them

### 3. Review Selection
- Main API (`/api/google-reviews`) automatically:
  1. Checks database first
  2. If reviews exist, selects best 5 using AI
  3. Falls back to Google API if database is empty
  4. Stores new reviews in database for future use

## Setup Instructions

### Step 1: Initial Database Population

Run the cron job manually to populate the database:

```bash
# Option 1: Via API call (if deployed)
curl https://your-domain.com/api/cron/fetch-reviews?secret=YOUR_SECRET

# Option 2: Via Vercel Dashboard
# Go to your project → Settings → Cron Jobs → Run manually
```

Or trigger it programmatically:
```typescript
// POST to /api/cron/fetch-reviews
```

### Step 2: Configure Vercel Cron (Automatic)

The `vercel.json` file is already configured:
```json
{
  "crons": [{
    "path": "/api/cron/fetch-reviews",
    "schedule": "0 2 * * *"  // Daily at 2 AM UTC
  }]
}
```

**To enable:**
1. Deploy to Vercel
2. Vercel will automatically detect and enable the cron job
3. It will run daily at 2 AM UTC

### Step 3: Optional Security

Add a secret to protect the cron endpoint:

```env
CRON_SECRET=your-secret-key-here
```

Then access with:
```
GET /api/cron/fetch-reviews?secret=your-secret-key-here
```

## API Endpoints

### GET `/api/google-reviews`
**Main endpoint** - Automatically uses database if available
- Checks database first
- Falls back to Google API if needed
- Returns best 5 curated 5-star reviews

### GET `/api/google-reviews/from-database`
**Database-only endpoint** - Only uses stored reviews
- Query params:
  - `count`: Number of reviews (default: 5)
  - `useAI`: Use OpenAI (default: false)

### GET `/api/cron/fetch-reviews`
**Cron job endpoint** - Fetches and stores reviews
- Query param: `secret` (optional, if CRON_SECRET is set)
- Returns stats about fetched/stored reviews

## Database Structure

```json
{
  "reviews": [
    {
      "author_name": "John Doe",
      "author_url": "...",
      "rating": 5,
      "text": "...",
      "time": 1234567890,
      "profile_photo_url": "...",
      "relative_time_description": "2 weeks ago",
      "fetchedAt": "2025-01-15T10:00:00Z",
      "reviewId": "John Doe_1234567890"
    }
  ],
  "lastFetch": "2025-01-15T10:00:00Z",
  "totalFetched": 25,
  "metadata": {
    "placeId": "...",
    "overallRating": 4.8,
    "totalReviews": 883,
    "lastUpdated": "2025-01-15T10:00:00Z"
  }
}
```

## How Reviews Accumulate

1. **Day 1:** Cron fetches 5 reviews → Database has 5
2. **Day 2:** Cron fetches 5 reviews → Database has 10 (if all new)
3. **Day 3:** Cron fetches 5 reviews → Database has 15
4. **...and so on**

Over time, you'll build up a collection of 30+ reviews to select from!

## Migration to Vercel KV (Optional)

If you need more storage or better performance:

1. Enable Vercel KV in your project
2. Update `src/lib/reviews-database.ts` to use KV instead of JSON
3. Same API, better performance

## Monitoring

Check database stats:
```bash
# View the database file
cat data/reviews-database.json

# Or check via API (if you add a stats endpoint)
```

## Troubleshooting

### Database file not created?
- Ensure `data/` directory exists
- Check file permissions
- Verify API has write access

### Cron job not running?
- Check Vercel dashboard → Cron Jobs
- Verify `vercel.json` is committed
- Check cron job logs in Vercel

### No reviews in database?
- Run cron job manually first
- Check Google Places API is working
- Verify environment variables are set

---

*Last updated: January 2025*

