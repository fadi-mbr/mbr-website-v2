# Google AI Studio (Gemini) Integration

## Overview

The review selection system now supports Google AI Studio (Gemini) API for intelligent review curation. The system uses a smart fallback strategy:

1. **Google Gemini** (preferred) - Uses `gemini-1.5-flash` model
2. **OpenAI** (fallback) - Uses `gpt-4o-mini` model
3. **Rule-based** (final fallback) - No API required, free

## API Key Configuration

Add your Google AI Studio API key to your environment variables:

```bash
GOOGLE_AI_STUDIO_API_KEY=your_api_key_here
```

### For Local Development

Create or update `.env.local`:

```env
GOOGLE_AI_STUDIO_API_KEY=your_api_key_here
```

⚠️ **IMPORTANT:** Never commit API keys to the repository. Always use environment variables.

### For Vercel Deployment

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add:
   - **Name:** `GOOGLE_AI_STUDIO_API_KEY`
   - **Value:** Your API key from Google AI Studio
   - **Environment:** Production, Preview, Development (select all)

## How It Works

### Smart AI Selection

The `selectBestReviewsWithSmartAI()` function automatically:

1. **Tries Gemini first** - If `GOOGLE_AI_STUDIO_API_KEY` is set
2. **Falls back to OpenAI** - If Gemini fails and `OPENAI_API_KEY` is set
3. **Uses rule-based** - If both APIs fail or are unavailable

### Gemini API Details

- **Model:** `gemini-1.5-flash` (fast, cost-effective)
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
- **Temperature:** 0.3 (consistent, focused responses)
- **Response Format:** JSON (structured output)

### Review Analysis Criteria

Gemini analyzes reviews based on:

1. **Detail and Specificity** - Mentions specific services, vehicles, or staff
2. **Authenticity** - Personal experience indicators
3. **Positive Sentiment** - Recommendation strength
4. **Comprehensiveness** - Helpfulness and completeness

## API Endpoints

All review endpoints now use smart AI selection:

- `GET /api/google-reviews` - Main endpoint (uses Gemini if available)
- `GET /api/google-reviews/from-database` - Database-only endpoint
- `POST /api/google-reviews/workflow` - Complete workflow endpoint

## Benefits of Gemini

1. **Cost-Effective** - Google AI Studio offers generous free tier
2. **Fast** - `gemini-1.5-flash` is optimized for speed
3. **Reliable** - Google's infrastructure ensures high availability
4. **Smart Fallback** - Automatic fallback to OpenAI or rule-based if needed

## Testing

To test the Gemini integration:

```bash
# Test with Gemini
curl -X GET "http://localhost:3000/api/google-reviews?useAI=true"

# Check which AI was used in response
# Response includes: "selectionMethod": "AI (Google Gemini)"
```

## Monitoring

The system logs which AI method was used:
- `AI (Google Gemini)` - Gemini API successful
- `AI (OpenAI)` - OpenAI API used (Gemini unavailable)
- `Rule-based` - No AI APIs available

Check your server logs to see which method is being used.

