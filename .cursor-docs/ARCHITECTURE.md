# Booking System Architecture

## Overview

The MBR Auto Services booking system is a high-conversion, mobile-first online booking platform built with Next.js 15, Supabase, and Google Calendar integration.

## System Components

### 1. Frontend (Next.js App Router)

#### Booking Flow (`/book`)
- **Step 1**: Service selection (dropdown of 6 configurable services)
- **Step 2**: Date & time selection (30-minute slot granularity)
- **Step 3**: Customer details (name, email, phone, notes)
- **Step 4**: Review & submit (with CAPTCHA)

#### Pages
- `/book` - Main booking wizard
- `/book/success` - Post-submission success page
- `/book/confirm` - Email confirmation handler

#### Admin Area (`/admin`)
- Google OAuth authentication
- Bookings dashboard with filters
- Booking detail view with audit log
- Settings configuration UI

### 2. Backend API Routes

#### Public Routes
- `POST /api/bookings/create` - Create booking (PENDING status)
- `GET /api/bookings/slots` - Get available time slots
- `GET /api/bookings/services` - Get service types
- `GET /api/bookings/confirm` - Confirm booking via token

#### Admin Routes (Protected)
- `GET /api/admin/bookings` - List bookings with filters
- `GET /api/admin/bookings/[id]` - Get booking details
- `PUT /api/admin/bookings/[id]` - Update booking
- `GET /api/admin/settings` - Get settings
- `PUT /api/admin/settings` - Update settings

### 3. Database (Supabase PostgreSQL)

#### Tables

**bookings**
- Stores all booking records
- Status: PENDING → CONFIRMED → (CANCELLED/EXPIRED)
- Includes customer info, service details, slot times

**confirmation_tokens**
- Hashed tokens for email confirmation
- Single-use, time-limited (30 min default)
- Links to booking_id

**booking_logs**
- Audit trail for all booking actions
- Automatic via database triggers
- Tracks status changes, email sends, etc.

**blocked_slots**
- Admin-blocked time ranges
- Used in slot availability calculation

**settings**
- JSONB key-value store
- Business config, working hours, SMTP, Calendar settings
- Editable via admin UI

#### Row Level Security (RLS)
- Public can INSERT bookings
- Public can SELECT confirmation_tokens (for validation)
- Admins can SELECT/UPDATE bookings, logs, settings
- Email-based admin check (@mbrme.com domain)

### 4. Email System (Nodemailer + SMTP)

#### Email Types

**Confirmation Email (Pending)**
- Sent immediately after booking creation
- Contains confirmation link with token
- Expiry notice (30 minutes)
- HTML + plain text

**Confirmed Email (After Confirmation)**
- Sent after customer clicks confirmation link
- Includes ICS calendar attachment
- Google Calendar link (if enabled)
- Google Maps link (if enabled)
- HTML + plain text

#### ICS Generation
- Server-side .ics file generation
- Includes booking details, location, timezone
- Attached to confirmation email
- UID: `booking-{id}@mbrme.com`

### 5. Google Calendar Integration

#### Service Account Authentication
- Uses Google Service Account (not OAuth)
- JSON credentials stored in environment variable
- Calendar shared with service account email

#### Event Creation
- Only after booking confirmation
- Title: "MBR Booking – {ServiceType}"
- Description: Booking ID + customer contact
- Timezone: Asia/Dubai
- Location: Business address
- Stores `google_event_id` in booking record

#### Conflict Checking (Optional)
- Uses Google Calendar FreeBusy API
- Checks for existing events in time slot
- Prevents double-booking if enabled

### 6. Slot Availability System

#### Slot Generation Logic
1. **Date Range**: Start date to end date
2. **Working Hours**: Per weekday from settings
3. **Lead Time**: Minimum hours before booking (default 2)
4. **Max Future**: Maximum days ahead (default 90)
5. **Blocked Slots**: Exclude admin-blocked ranges
6. **Capacity**: Check existing bookings per slot
7. **Status**: available / limited / full

#### Capacity Enforcement
- Transaction-based booking creation
- Prevents race conditions
- Real-time availability calculation
- Per-service capacity override

### 7. Security Features

#### Rate Limiting
- In-memory store (5 requests/minute per IP)
- Production: Use Redis
- Applied to booking creation endpoint

#### CAPTCHA
- Simple math addition (e.g., "8 + 5 = ?")
- Client-side generation (improve with session storage)
- Server-side validation

#### Input Validation
- Zod schemas on all inputs
- UAE phone: Strict +971XXXXXXXXX format
- Email validation
- Sanitization

#### Token Security
- bcrypt hashing (10 rounds)
- Single-use tokens
- Time-limited expiry
- Stored hashed, never plaintext

### 8. Admin Authentication (NextAuth.js)

#### Google OAuth Flow
1. User clicks "Sign in with Google"
2. Redirects to Google OAuth
3. Callback: Check email domain (@mbrme.com)
4. Create session if allowed
5. Redirect to `/admin`

#### Session Management
- JWT-based sessions
- Stored in HTTP-only cookies
- Expires after inactivity

## Data Flow

### Booking Creation Flow

```
1. Customer selects service → Step 1
2. Customer selects date/time → Step 2
3. Customer enters details → Step 3
4. Customer reviews & solves CAPTCHA → Step 4
5. POST /api/bookings/create
   - Validate input (Zod)
   - Check slot availability
   - Create booking (PENDING)
   - Generate confirmation token (hashed)
   - Send confirmation email
6. Redirect to /book/success
7. Customer receives email
8. Customer clicks confirmation link
9. GET /api/bookings/confirm?token=...
   - Validate token (bcrypt compare)
   - Check expiry
   - Update booking (CONFIRMED)
   - Create Google Calendar event
   - Send confirmed email (with ICS)
10. Redirect to /book/confirm (success)
```

### Slot Availability Flow

```
1. GET /api/bookings/slots?start=...&end=...&service_type=...
2. Load settings (working hours, capacity, etc.)
3. Generate date range slots
4. Filter by:
   - Working hours
   - Lead time
   - Max future date
   - Blocked slots
5. Check existing bookings for capacity
6. Return available slots with status
```

## Configuration

All configuration stored in `settings` table:

- **Business Info**: name, address, timezone, maps link
- **Working Hours**: Per weekday (open/close/enabled)
- **Slot Settings**: duration, capacity, lead time, max future
- **Email Settings**: SMTP config, include ICS/Calendar/Maps links
- **Calendar Settings**: Calendar ID, conflict checking
- **Service Types**: Array of services with duration/capacity

## Deployment Considerations

### Environment Variables
- Supabase credentials
- SMTP password
- Google Service Account JSON
- NextAuth secret
- Google OAuth credentials

### Database Migrations
- Run schema SQL in Supabase SQL Editor
- Seed initial settings
- Configure RLS policies

### Production Optimizations
- Replace in-memory rate limiting with Redis
- Implement proper CAPTCHA with session storage
- Add monitoring/logging
- Set up error tracking (Sentry, etc.)
- Configure CDN for static assets

## Testing

### Unit Tests
- Slot generation logic
- Token validation
- ICS generation
- Capacity calculation

### Integration Tests
- Booking creation flow
- Email sending
- Calendar event creation
- Admin authentication

## Future Enhancements

- Multi-slot services
- WhatsApp notifications
- ICS cancellation updates
- Admin CSV export
- SMS notifications
- Recurring bookings
- Customer portal (view/edit bookings)

