# Vercel Deployment Guide

## Environment Variables Setup

**YES, you need to upload ALL environment variables to Vercel!**

Your `.env.local` file is NOT deployed to Vercel (it's in `.gitignore`). You must manually add each variable in the Vercel dashboard.

## Required Environment Variables

### 1. Supabase (Required)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Google Service Account (Required for Calendar)
```
GOOGLE_SERVICE_ACCOUNT_CREDENTIALS={"type":"service_account",...}
```
⚠️ **Important**: Paste the entire JSON as a single line. Vercel will handle it correctly.

### 3. NextAuth (Required for Admin)
```
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your_nextauth_secret
```
⚠️ **Important**: Use your production domain for `NEXTAUTH_URL`, not localhost!

### 4. Google OAuth (Required for Admin)
```
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```
⚠️ **Important**: Update OAuth redirect URI in Google Cloud Console:
- Production: `https://yourdomain.com/api/auth/callback/google`

### 5. SMTP (Required for Emails)
```
SMTP_PASSWORD=your_smtp_password
```
⚠️ **Note**: SMTP host, port, username, and from address are in database settings.

### 6. Site URL (Required)
```
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```
⚠️ **Important**: Use your production domain!

### 7. Existing Variables (Keep These)
```
GOOGLE_PLACE_ID=your_google_place_id
GOOGLE_PLACES_API_KEY=your_google_places_api_key
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_measurement_id
```

## How to Add Variables in Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. For each variable:
   - Click **Add New**
   - Enter the **Name** (exactly as shown above)
   - Enter the **Value** (copy from your `.env.local`)
   - Select **Environment**: 
     - ✅ Production
     - ✅ Preview
     - ✅ Development (optional)
   - Click **Save**

## Special Instructions

### Google Service Account JSON
When adding `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS`:
1. Copy the entire JSON from your `.env.local`
2. Paste it as-is (single line with escaped quotes)
3. Vercel will store it correctly

### NextAuth URL
- **Development**: `http://localhost:3000`
- **Production**: `https://yourdomain.com`
- **Preview**: `https://your-project.vercel.app`

Make sure to set the correct value for each environment!

### Google OAuth Redirect URIs
Update in [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
- Production: `https://yourdomain.com/api/auth/callback/google`
- Preview: `https://your-project.vercel.app/api/auth/callback/google`

## Deployment Steps

1. **Push to GitHub**:
   ```bash
   git push origin dev
   ```

2. **Deploy to Vercel**:
   - If connected to GitHub, Vercel will auto-deploy
   - Or manually deploy from Vercel dashboard

3. **Add Environment Variables**:
   - Go to Vercel project settings
   - Add all variables listed above
   - Redeploy if needed

4. **Test Production**:
   - Visit your production URL
   - Test booking flow
   - Check admin login

## Post-Deployment Checklist

- [ ] All environment variables added to Vercel
- [ ] Google OAuth redirect URIs updated
- [ ] NextAuth URL set to production domain
- [ ] Supabase RLS policies allow public access (for bookings)
- [ ] SMTP settings configured in database
- [ ] Google Calendar shared with service account
- [ ] Test booking creation
- [ ] Test email confirmation
- [ ] Test admin login
- [ ] Test calendar event creation

## Troubleshooting

### "Supabase connection failed"
- Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Verify Supabase project is active
- Check RLS policies allow public inserts

### "Admin login fails"
- Verify `NEXTAUTH_URL` matches your domain
- Check OAuth redirect URI is correct
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set

### "Email not sending"
- Check `SMTP_PASSWORD` is set
- Verify SMTP settings in database
- Check SMTP server allows Vercel IPs

### "Calendar events not creating"
- Verify `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` is set correctly
- Check calendar is shared with service account
- Verify calendar ID in database settings

## Security Notes

- ✅ Never commit `.env.local` (it's in `.gitignore`)
- ✅ Use different credentials for dev/prod if possible
- ✅ Rotate secrets regularly
- ✅ Use Vercel's environment variable encryption
- ✅ Limit admin email domains in database settings

