# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MBR Auto Services v2 is a luxury automotive service website built with Next.js 15.3.1. The project focuses on premium car care services in Dubai with a sophisticated design system featuring black/red/white colors with gold/silver/platinum luxury accents.

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production with Turbopack
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

The development server runs on http://localhost:3005 (not the default 3000).

## Architecture & Key Features

### Google Reviews Integration
- **API Route**: `/src/app/api/google-reviews/route.ts` - Server-side API with 24-hour caching
- **Custom Hook**: `/src/components/GoogleReviewsHook.tsx` - Client-side hook with fallback data
- **Environment Variables**: Requires `GOOGLE_PLACE_ID` and `GOOGLE_PLACES_API_KEY`
- **Caching Strategy**: 24-hour server-side cache with stale-while-revalidate fallback

### Design System
- **Luxury Color Palette**: Gold (#D4AF37), Silver (#C0C0C0), Platinum (#E5E4E2)
- **Typography**: Geist Sans and Geist Mono fonts
- **Framework**: Tailwind CSS 4.x with CSS-in-JS approach
- **Animations**: Framer Motion for luxury transitions

### Component Architecture
Components follow a luxury theme naming convention:
- `LuxuryHero` - Main hero section with video showcase
- `LuxuryNavigation` - Elegant navigation with service descriptions
- `SophisticatedHero`, `SophisticatedServices`, etc. - Alternative design implementations
- Components are organized by design theme (Luxury, Sophisticated, etc.)

### Technology Stack
- **Framework**: Next.js 15.3.1 with App Router
- **TypeScript**: Strict mode enabled with path mapping (`@/*` → `./src/*`)
- **Styling**: Tailwind CSS 4.x with PostCSS
- **Animations**: Framer Motion 12.x
- **Icons**: React Icons 5.x
- **Email**: SendGrid integration for contact forms
- **Analytics**: Google Analytics 4 (G-C3F0YSMRPM) via @next/third-parties

## Project Structure

```
src/
├── app/
│   ├── api/google-reviews/     # Google Places API integration
│   ├── globals.css             # Global styles and Tailwind base
│   ├── layout.tsx              # Root layout with SEO metadata
│   └── page.tsx                # Main page composition
└── components/
    ├── GoogleReviewsHook.tsx   # Reviews data fetching hook
    ├── Luxury*.tsx             # Luxury-themed components
    ├── Sophisticated*.tsx      # Alternative sophisticated theme
    ├── Dashboard*.tsx          # Dashboard-style components
    └── Minimal*.tsx            # Minimal design components
```

## Development Phase System

The project follows a structured 5-phase development approach documented in `PHASE_TRACKING.md`:

1. **Phase 1** (✅ Complete): Foundation & Luxury Hero with Google Reviews integration
2. **Phase 2** (Planned): Luxury Services Center
3. **Phase 3** (Planned): Excellence & Trust sections
4. **Phase 4** (Planned): Team & Location features
5. **Phase 5** (Planned): Polish & Performance optimization

## Key Implementation Details

### SEO Configuration
Comprehensive metadata setup in `layout.tsx` including OpenGraph and Twitter cards targeting Dubai automotive services.

### Google Reviews System
- Fetches live reviews from Google Places API
- Implements robust caching (24 hours) and error handling
- Falls back to static data if API fails
- Supports both GET (cached) and POST (force refresh) endpoints

### Design Philosophy
The project underwent a major redesign from performance/arcade theme to luxury automotive focus, emphasizing:
- Video prominence without overlays
- Elegant dashboard elements surrounding content
- Luxury typography and spacing
- Gold accent integration throughout

## Environment Variables Required

```
GOOGLE_PLACE_ID=your_google_place_id
GOOGLE_PLACES_API_KEY=your_google_places_api_key
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_google_analytics_measurement_id
```

## Important Notes

- Uses Turbopack for faster development and builds
- ESLint configured with Next.js and TypeScript rules
- All components follow luxury automotive theme conventions
- Video showcase is central to the design (no overlays)
- Live Google Reviews integration with comprehensive fallback system