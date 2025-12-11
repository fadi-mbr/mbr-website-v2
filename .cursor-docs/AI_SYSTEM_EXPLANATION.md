# AI Review Selection System - How It Works

## Current AI Implementation

### 1. Rule-Based AI (Default - No External API Required)

**How it works:**
- Uses a **rule-based scoring algorithm** (no external AI model)
- Scores reviews based on multiple factors
- **No API calls, no costs, works immediately**

**Scoring Factors:**
1. **Detail & Length (30%)**
   - Reviews > 200 chars: +0.3 points
   - Reviews > 100 chars: +0.2 points
   - Shorter: +0.1 points

2. **Specificity (30%)**
   - Checks for mentions of:
     - Vehicle brands: BMW, Mercedes, Audi, Porsche, Range Rover, Lexus
     - Services: engine, transmission, brake, suspension, electrical
     - Staff names: Michael, Basel
     - Technical terms: diagnostic, repair, service
   - 3+ matches: +0.3 points
   - 2 matches: +0.2 points
   - 1 match: +0.1 points

3. **Emotional Impact (20%)**
   - Positive words: excellent, outstanding, amazing, exceptional, perfect, highly recommend, best, great
   - 3+ matches: +0.2 points
   - 2 matches: +0.15 points
   - 1 match: +0.1 points

4. **Authenticity (20%)**
   - Personal experience indicators: "I took", "my car", "they fixed", "will return"
   - 2+ matches: +0.2 points
   - 1 match: +0.1 points

5. **Recency Bonus (10%)**
   - Reviews < 30 days: +0.1 points
   - Reviews < 90 days: +0.05 points

**Total Score:** Sum of all factors (capped at 1.0)

### 2. OpenAI Integration (Optional - Requires API Key)

**Model Used:** `gpt-4o-mini`
- **Cost:** ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **Why this model:** Fast, cost-effective, good for structured tasks
- **Temperature:** 0.3 (low randomness, more consistent)

**How it works:**
1. Sends all reviews to OpenAI API
2. AI analyzes each review for:
   - Detail and specificity
   - Authenticity and personal experience
   - Positive sentiment and recommendation strength
   - Comprehensiveness and helpfulness
3. Returns scores (0-1) for each review
4. Falls back to rule-based if API fails

**When to use:**
- Set `OPENAI_API_KEY` environment variable
- Call with `useAI=true` parameter
- Better understanding of context and nuance
- Costs money per API call

**Current Status:**
- Rule-based is **active by default** (no setup needed)
- OpenAI is **optional** (requires API key)

---

## Database Storage Solution

### Option 1: JSON File Storage (Simplest - No Infrastructure)

**Pros:**
- ✅ No external services
- ✅ Works on Vercel
- ✅ Free
- ✅ Simple to implement

**Cons:**
- ⚠️ File size limits on Vercel
- ⚠️ Not ideal for very large datasets

### Option 2: Vercel KV (Recommended for Production)

**Pros:**
- ✅ Built into Vercel
- ✅ Free tier: 256 MB storage
- ✅ Fast Redis-based
- ✅ No infrastructure setup

**Cons:**
- ⚠️ Requires Vercel account
- ⚠️ Free tier has limits

**Implementation:** We'll use JSON file storage first, with easy migration to Vercel KV later.

---

## Scheduled Review Fetching

**Vercel Cron Jobs:**
- Runs automatically on Vercel
- No server needed
- Free tier: 1 cron job
- Can run daily, weekly, etc.

**Implementation:**
- Create `/api/cron/fetch-reviews` endpoint
- Configure in `vercel.json`
- Fetches reviews daily and stores in database
- Selects best 5 using AI

---

*Last updated: January 2025*

