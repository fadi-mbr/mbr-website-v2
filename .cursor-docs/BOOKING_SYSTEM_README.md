# MBR Auto Services - Online Booking System

High-conversion, mobile-first online booking system for auto services in the UAE.

## Features

- **Fast Booking Flow**: Complete booking in under 60 seconds
- **No Account Required**: Direct booking without registration
- **Double Opt-In**: Email confirmation required before calendar event creation
- **Google Calendar Integration**: Automatic event creation after confirmation
- **ICS Calendar Attachments**: Email includes downloadable calendar file
- **Capacity Management**: Real-time slot availability with capacity tracking
- **Admin Dashboard**: Secure admin area with Google OAuth
- **Mobile-First Design**: Optimized for mobile devices
- **UAE Phone Validation**: Strict +971XXXXXXXXX format validation
- **Anti-Abuse**: CAPTCHA and rate limiting

## Tech Stack

- **Next.js 15** (App Router, React 19)
- **TypeScript**
- **Supabase** (PostgreSQL database)
- **NextAuth.js v5** (Google OAuth for admin)
- **Nodemailer** (SMTP email)
- **Google Calendar API** (Service Account)
- **Luxon** (Timezone handling)
- **Zod** (Validation)
- **Tailwind CSS** (Styling)

## Setup Instructions

### 1. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Run the schema SQL file:
   ```bash
   # In Supabase SQL Editor, run:
   .cursor-docs/supabase-schema.sql
   ```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

**Required Variables:**
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `SMTP_PASSWORD`: Your SMTP password
- `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS`: Google Service Account JSON (for Calendar)
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID`: Google OAuth client ID (for admin)
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret (for admin)

### 3. Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google Calendar API**
4. Create a **Service Account**:
   - Go to "IAM & Admin" > "Service Accounts"
   - Create new service account
   - Download JSON key file
   - Copy entire JSON content to `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS`
5. Share your calendar with the service account email:
   - Open Google Calendar
   - Settings > Share with specific people
   - Add service account email with "Make changes to events" permission

### 4. Google OAuth Setup (Admin)

1. In Google Cloud Console, go to "APIs & Services" > "Credentials"
2. Create **OAuth 2.0 Client ID**:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google` (dev)
   - Authorized redirect URIs: `https://yourdomain.com/api/auth/callback/google` (prod)
3. Copy Client ID and Secret to `.env.local`

### 5. SMTP Setup

Configure your SMTP server settings in the admin panel or via Supabase settings table:

- `smtp_host`: Your SMTP host (e.g., `smtp.gmail.com`)
- `smtp_port`: SMTP port (usually 587 for TLS)
- `smtp_username`: Your SMTP username
- `smtp_from`: From email address
- `SMTP_PASSWORD`: Set in `.env.local` (not in database)

### 6. Install Dependencies

```bash
npm install
```

### 7. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000/book` to test the booking flow.

## Admin Access

1. Navigate to `/admin`
2. Sign in with Google OAuth
3. Only emails ending with `@mbrme.com` are allowed (configurable in settings)

## Database Schema

### Tables

- **bookings**: Main booking records
- **confirmation_tokens**: Email confirmation tokens (hashed)
- **booking_logs**: Audit trail for all booking actions
- **blocked_slots**: Admin-blocked time slots
- **settings**: Admin-configurable settings (JSONB)

### Key Features

- Row Level Security (RLS) enabled on all tables
- Automatic audit logging via triggers
- Token hashing with bcrypt
- Capacity enforcement with transactions

## API Routes

### Public Routes

- `GET /api/bookings/services` - Get available service types
- `GET /api/bookings/slots` - Get available time slots
- `POST /api/bookings/create` - Create new booking
- `GET /api/bookings/confirm` - Confirm booking via token

### Admin Routes (Protected)

- `GET /api/admin/bookings` - List all bookings
- `GET /api/admin/bookings/[id]` - Get booking details
- `PUT /api/admin/bookings/[id]` - Update booking
- `GET /api/admin/settings` - Get settings
- `PUT /api/admin/settings` - Update settings

## Booking Flow

1. **Select Service**: Customer chooses service type
2. **Select Date & Time**: Customer picks available slot
3. **Enter Details**: Customer provides name, email, phone, notes
4. **Review & Submit**: Customer reviews and solves CAPTCHA
5. **Email Sent**: Confirmation email sent with token link
6. **Email Confirmation**: Customer clicks link to confirm
7. **Calendar Event**: Google Calendar event created
8. **Final Email**: Confirmation email with ICS attachment sent

## Configuration

All settings are stored in the `settings` table and can be edited via admin UI:

- Business information (name, address, timezone)
- Working hours (per weekday)
- Slot duration and capacity
- Lead time and booking window
- Email preferences (ICS, Google Calendar link, Maps link)
- SMTP settings
- Google Calendar settings

## Security Features

- **Rate Limiting**: 5 requests per minute per IP
- **CAPTCHA**: Math addition challenge
- **Token Hashing**: bcrypt with salt
- **Input Validation**: Zod schemas on all inputs
- **UAE Phone Validation**: Strict +971 format
- **RLS Policies**: Database-level access control
- **Admin OAuth**: Google OAuth with email allowlist

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add all environment variables
4. Deploy

### Environment Variables for Production

Ensure all variables from `.env.example` are set in Vercel dashboard.

## Testing

Basic tests included:

```bash
npm test
```

Tests cover:
- Capacity enforcement
- Token expiry
- ICS generation
- Slot availability

## Troubleshooting

### Email Not Sending

- Check SMTP credentials in settings
- Verify `SMTP_PASSWORD` in `.env.local`
- Check SMTP server logs

### Calendar Events Not Creating

- Verify service account has calendar access
- Check `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` format
- Ensure calendar ID is correct in settings

### Admin Access Denied

- Verify email ends with `@mbrme.com` (or configured domain)
- Check Google OAuth credentials
- Verify `NEXTAUTH_SECRET` is set

## Support

For issues or questions, contact the development team.

