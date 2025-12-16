# Google Calendar Setup - Organization Restrictions

If you're getting an error about organization restrictions when sharing your calendar, here are solutions:

## Solution 1: Create a New Calendar for Bookings (Recommended)

1. Go to [Google Calendar](https://calendar.google.com)
2. On the left sidebar, click the **+** next to "Other calendars"
3. Select **Create new calendar**
4. Name it: "MBR Bookings" (or similar)
5. Click **Create calendar**
6. Go to **Settings** for this new calendar
7. Scroll down to **Share with specific people**
8. Click **Add people**
9. Enter: `website-booking-system@gen-lang-client-0151249415.iam.gserviceaccount.com`
10. Select permission: **Make changes to events**
11. Click **Send**

**Why this works**: New calendars often have fewer restrictions than your primary calendar.

## Solution 2: Use OAuth Instead of Service Account

If Solution 1 doesn't work, we can switch to OAuth-based calendar access. This requires:
- A Google account (can be a dedicated account for bookings)
- OAuth consent screen configuration
- User authorization flow

Let me know if you want to implement this approach.

## Solution 3: Contact Your Google Workspace Admin

If you're using Google Workspace:
1. Contact your organization's Google Workspace admin
2. Request they allow calendar sharing with service accounts
3. Or request they create a service account within your organization

## Solution 4: Use a Personal Google Account

If the calendar is for personal use:
1. Use a personal Gmail account (not Workspace)
2. Create the calendar there
3. Share with the service account

## After Setting Up

Once the calendar is shared:
1. Get the Calendar ID:
   - Go to Calendar Settings
   - Scroll to "Integrate calendar"
   - Copy the **Calendar ID** (usually your email or a long string)
2. Update the database settings:
   - In Supabase, go to `settings` table
   - Update `google_calendar_id` with your Calendar ID
   - Or use the admin UI (once implemented)

## Testing Calendar Access

After sharing, test if the service account can access the calendar by running:

```bash
npm run dev
# Then create a test booking and confirm it
```

If you see errors about calendar access, the sharing didn't work and you'll need to try another solution.

