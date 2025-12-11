# AI Review Selection System

## Overview

The AI Review Selection system automatically analyzes Google reviews and selects the most valuable ones to display on the website. It filters to 5-star reviews and uses intelligent scoring to pick the best 5 reviews.

## Features

### 1. Rule-Based Review Scoring
Automatically scores reviews based on:
- **Detail & Length** (30%): Longer, more detailed reviews score higher
- **Specificity** (30%): Reviews mentioning specific services, vehicles, or staff members
- **Emotional Impact** (20%): Positive sentiment and strong recommendations
- **Authenticity** (20%): Personal experience indicators ("I took my car", "they fixed")
- **Recency Bonus** (10%): Slightly favors newer reviews

### 2. AI-Powered Selection (Optional)
When `OPENAI_API_KEY` is configured, uses GPT-4o-mini to analyze and rank reviews with advanced understanding.

### 3. Automatic Filtering
- Filters to only 5-star reviews
- Selects top N most valuable reviews (default: 5)

## API Endpoints

### GET `/api/google-reviews`
Fetches reviews from Google Places API and automatically selects best 5-star reviews using rule-based scoring.

**Response:**
```json
{
  "success": true,
  "data": {
    "overallRating": 4.8,
    "totalReviews": 883,
    "reviews": [...], // Top 5 curated 5-star reviews
    "lastUpdated": "2025-01-..."
  }
}
```

### POST `/api/google-reviews/workflow`
Complete workflow endpoint for review curation.

**Query Parameters:**
- `useAI` (boolean): Use OpenAI for selection (requires `OPENAI_API_KEY`)
- `count` (number): Number of reviews to select (default: 5)

**Example:**
```
POST /api/google-reviews/workflow?useAI=true&count=5
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overallRating": 4.8,
    "totalReviews": 883,
    "selectedReviews": [...],
    "selectionDetails": [
      {
        "author": "John Doe",
        "score": 0.85,
        "reasons": ["Detailed", "Specific", "Strong recommendation"]
      }
    ],
    "stats": {
      "totalFetched": 5,
      "fiveStarCount": 4,
      "selectedCount": 4,
      "selectionMethod": "AI (OpenAI)"
    }
  }
}
```

### POST `/api/google-reviews/select`
Selects best reviews from a provided array.

**Body:**
```json
{
  "reviews": [...],
  "count": 5,
  "useAI": false
}
```

## Current Limitations

### Google Places API
The Google Places API Details endpoint typically returns **only 5 reviews** maximum. To get more reviews (like the last 30), you would need:

1. **Google My Business API** (requires OAuth and business ownership)
   - Endpoint: `accounts.locations.reviews.list`
   - Can fetch all reviews for your business

2. **Third-Party Services**
   - Outscraper API
   - DumplingAI API
   - Other scraping services

3. **Database Storage**
   - Periodically fetch and store reviews in a database
   - Build up a collection over time
   - Then select from stored reviews

## Implementation Details

### Scoring Algorithm

```typescript
Score = (
  Length Score (0-0.3) +
  Specificity Score (0-0.3) +
  Emotional Impact (0-0.2) +
  Authenticity (0-0.2) +
  Recency Bonus (0-0.1)
)
```

### Review Selection Process

1. Fetch reviews from Google Places API
2. Filter to 5-star reviews only
3. Score each review using rule-based or AI analysis
4. Sort by score (highest first)
5. Select top N reviews
6. Return curated selection

## Environment Variables

```env
# Required
GOOGLE_PLACE_ID=your_place_id
GOOGLE_PLACES_API_KEY=your_api_key

# Optional (for AI-powered selection)
OPENAI_API_KEY=your_openai_key
```

## Future Enhancements

1. **Database Storage**: Store reviews over time to build a larger pool
2. **Scheduled Refresh**: Automatically refresh and reselect reviews daily
3. **Advanced AI**: Use more sophisticated AI models for better selection
4. **Review Analytics**: Track which reviews perform best
5. **A/B Testing**: Test different review selections

## Usage Example

```typescript
// Automatic selection (used by default)
const response = await fetch('/api/google-reviews');
const data = await response.json();
// Returns top 5 curated 5-star reviews

// Manual workflow with AI
const workflow = await fetch('/api/google-reviews/workflow?useAI=true&count=5', {
  method: 'POST'
});
const result = await workflow.json();
// Returns AI-selected reviews with scoring details
```

## Notes

- The system currently works with whatever reviews Google Places API returns (typically 5)
- To get more reviews, implement one of the solutions mentioned above
- The AI selection is optional and falls back to rule-based if OpenAI is not configured
- Reviews are cached for 24 hours to reduce API calls

---

*Last updated: January 2025*

