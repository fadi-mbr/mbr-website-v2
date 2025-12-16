# Environment Variables Setup Guide

## Quick Setup Checklist

Your `.env.local` file now has all the required variables with placeholder values. Follow these steps to configure them:

### ✅ 1. Supabase Setup (Required)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project or select existing
3. Go to **Settings** > **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Run the database schema:
   - Go to **SQL Editor**
   - Run `.cursor-docs/supabase-schema.sql`

### ✅ 2. NextAuth Secret (Required)

Generate a random secret:

```bash
openssl rand -base64 32
```

Copy the output to `NEXTAUTH_SECRET`

### ✅ 3. Google Calendar Service Account (Required for Calendar Events)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create/select a project
3. Enable **Google Calendar API**
4. Go to **IAM & Admin** > **Service Accounts**
5. Click **Create Service Account**
6. Download JSON key file
7. Open the JSON file and copy the entire content
8. Convert to single line (replace newlines with `\n` and escape quotes)
9. Paste into `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS`
10. **Important**: Share your Google Calendar with the service account email:
    - Open Google Calendar
    - Settings > Share with specific people
    - Add the service account email (from the JSON, `client_email` field)
    - Permission: **Make changes to events**

### ✅ 4. Google OAuth (Required for Admin Login)

1. In Google Cloud Console, go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Add **Authorized redirect URIs**:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
5. Copy:
   - **Client ID** → `GOOGLE_CLIENT_ID`
   - **Client secret** → `GOOGLE_CLIENT_SECRET`

### ✅ 5. SMTP Configuration (Required for Emails)

**Option A: Gmail**
- `SMTP_PASSWORD`: Use an [App Password](https://support.google.com/accounts/answer/185833)
- Then configure in database settings:
  - `smtp_host`: `smtp.gmail.com`
  - `smtp_port`: `587`
  - `smtp_username`: Your Gmail address
  - `smtp_from`: Your Gmail address

**Option B: Other SMTP Provider**
- Get SMTP credentials from your email provider
- Set `SMTP_PASSWORD` in `.env.local`
- Configure other SMTP settings in database `settings` table:
  - `smtp_host`: Your SMTP host
  - `smtp_port`: Usually 587 (TLS) or 465 (SSL)
  - `smtp_username`: Your SMTP username
  - `smtp_from`: From email address

### ✅ 6. Site URL

- Development: `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
- Production: `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`

## Variable Reference

| Variable | Required | Description |
|----------|----------|------------|
| `NEXT_PUBLIC_SITE_URL` | ✅ | Your site URL (for email links) |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SMTP_PASSWORD` | ✅ | SMTP authentication password |
| `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` | ✅ | Google Service Account JSON |
| `NEXTAUTH_URL` | ✅ | NextAuth callback URL |
| `NEXTAUTH_SECRET` | ✅ | NextAuth secret (generate random) |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth Client Secret |

## Testing Your Configuration

After setting up all variables:

1. **Test Supabase Connection**:
   ```bash
   npm run dev
   # Visit http://localhost:3000/book
   # Check browser console for Supabase connection errors
   ```

2. **Test Admin Login**:
   - Visit `http://localhost:3000/admin`
   - Try signing in with Google (@mbrme.com email)

3. **Test Booking Flow**:
   - Complete a test booking
   - Check email for confirmation link
   - Verify calendar event creation

## Troubleshooting

### "Supabase connection failed"
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Check Supabase project is active
- Verify RLS policies are set up

### "Email not sending"
- Check `SMTP_PASSWORD` is correct
- Verify SMTP settings in database `settings` table
- Test SMTP credentials with a simple email client

### "Calendar events not creating"
- Verify `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` JSON format
- Check service account has calendar access
- Verify calendar ID in database settings

### "Admin login fails"
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Check redirect URI matches exactly
- Verify email ends with `@mbrme.com` (or configured domain)

## Security Notes

- ⚠️ **Never commit `.env.local` to git** (it's in `.gitignore`)
- ✅ Use `env.template` as a reference (safe to commit)
- ✅ Use different credentials for development and production
- ✅ Rotate secrets regularly in production

