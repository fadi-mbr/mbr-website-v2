# Google Reviews Variety Improvements

## Overview

The Google Places API has a limitation: it only returns a maximum of **5 reviews per API call**, and there are no parameters to control which 5 reviews are returned or to paginate through more reviews. However, we've implemented several strategies to ensure variety in the reviews displayed.

## Current Limitations

### Google Places API Constraints
- **Maximum reviews per call**: 5 reviews
- **No pagination**: Cannot fetch additional pages
- **No sorting parameters**: Google determines which reviews to return
- **No filtering parameters**: Cannot request specific reviews

### What We Can Control
- **Language parameter**: Added `language=en` to get reviews in English
- **Database accumulation**: Store reviews over time to build a larger pool
- **AI selection**: Use AI to select diverse reviews from the accumulated pool

## Implemented Solutions

### 1. Database Accumulation
- **Daily cron job** fetches 5 new reviews from Google
- **Deduplication**: Automatically avoids storing duplicate reviews
- **Storage limit**: Up to 100 reviews stored in database
- **Result**: Over time, you'll have a much larger pool of reviews to choose from

### 2. Variety Algorithm
The AI selection now includes a **variety algorithm** that:
- **Prioritizes different authors**: Avoids showing multiple reviews from the same person
- **Excludes previous selections**: Tracks recently shown reviews to avoid repetition
- **Two-pass selection**:
  1. First pass: Select reviews from different authors (60% of slots)
  2. Second pass: Fill remaining slots with highest-scored reviews

### 3. Review Exclusion System
- **Tracks recently shown reviews**: Remembers which reviews were last displayed
- **Excludes from next selection**: Ensures different reviews are shown on subsequent calls
- **Fallback logic**: If too few reviews remain after exclusion, uses all available

### 4. Language Parameter
- Added `language=en` parameter to API calls
- Helps ensure reviews are in the preferred language
- Can be configured if needed

## How It Works

### Initial State (No Database)
1. Fetches 5 reviews from Google Places API
2. Filters to 5-star reviews
3. Uses AI to select best 5 (or all if fewer than 5)
4. Stores in database for future use

### After Daily Cron Job Runs
1. Fetches 5 new reviews from Google
2. Adds to database (deduplicates)
3. Database now contains accumulated reviews (up to 100)
4. AI selection chooses from larger pool

### On Each API Call
1. Checks database first (if available)
2. Filters to 5-star reviews
3. Excludes recently shown reviews (if any)
4. Uses AI to select diverse reviews
5. Ensures variety (different authors)
6. Returns 5 different reviews

## Configuration

### Language Parameter
Currently set to `en` (English). To change:
- Edit `src/app/api/google-reviews/route.ts` line 99
- Edit `src/app/api/cron/fetch-reviews/route.ts` line 66

### Database Size
Currently set to 100 reviews max. To change:
- Edit `src/lib/reviews-database.ts` line 34: `MAX_REVIEWS_TO_STORE`

### Selection Count
Currently selects 5 reviews. To change:
- Edit the `count` parameter in `selectBestReviewsWithSmartAI()` calls

## Testing

To test variety:
1. Call the API multiple times: `GET /api/google-reviews`
2. Check if different reviews are returned
3. Verify reviews are from different authors
4. Check that previously shown reviews are excluded

## Future Improvements

### Potential Enhancements
1. **Time-based rotation**: Show older reviews after a certain period
2. **Randomization**: Add slight randomness to selection
3. **Review freshness**: Balance between recent and older reviews
4. **Third-party APIs**: Consider using services like SerpApi for more reviews (costs apply)

### Third-Party Options
If you need more than 5 reviews per call:
- **SerpApi**: Up to 20 reviews per request, supports pagination
- **Outscraper**: Can fetch all reviews from Google Maps
- **HasData**: Google Maps Reviews API with structured output

Note: These services have costs and require compliance with their terms of service.

## Summary

While Google Places API limits us to 5 reviews per call, our system:
- ✅ Accumulates reviews over time (up to 100)
- ✅ Ensures variety by avoiding duplicate authors
- ✅ Excludes recently shown reviews
- ✅ Uses AI to select the best diverse reviews
- ✅ Provides different reviews on each call

The system will automatically improve as the database accumulates more reviews from daily cron jobs.

