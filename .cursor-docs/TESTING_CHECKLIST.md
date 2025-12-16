# Booking System Testing Checklist

## ✅ Pre-Testing Setup

### 1. Environment Variables
- [x] Google Service Account credentials configured
- [x] NextAuth secret configured
- [ ] Supabase URL and anon key configured
- [ ] SMTP password configured
- [ ] Google OAuth credentials (for admin)

### 2. Database Setup
- [ ] Supabase project created
- [ ] Database schema run (`.cursor-docs/supabase-schema.sql`)
- [ ] Initial settings populated
- [ ] Service types configured

### 3. Google Calendar
- [ ] Calendar created/shared with service account
- [ ] Calendar ID added to database settings

## 🧪 Testing Steps

### Test 1: Booking Page Loads
1. Visit: `http://localhost:3000/book`
2. ✅ Page should load with "Book Your Service" heading
3. ✅ Progress indicator shows 4 steps
4. ⚠️ Service types may not load if Supabase not configured

**Expected**: Page loads, shows booking wizard UI

### Test 2: Service Types API
1. Visit: `http://localhost:3000/api/bookings/services`
2. ✅ Should return JSON with service_types array
3. ⚠️ Will fail if Supabase not configured

**Expected**: Returns service types or error message

### Test 3: Slot Availability API
1. Visit: `http://localhost:3000/api/bookings/slots?start=2024-12-20T00:00:00Z&end=2024-12-21T00:00:00Z`
2. ✅ Should return available slots
3. ⚠️ Will fail if Supabase not configured

**Expected**: Returns slots array or error

### Test 4: Complete Booking Flow (Requires Supabase)
1. Select a service type
2. Select date & time
3. Fill customer details:
   - Name: Test User
   - Email: test@example.com
   - Phone: +971501234567
4. Review and solve CAPTCHA
5. Submit booking

**Expected**: 
- Booking created with PENDING status
- Redirect to success page
- Email sent (if SMTP configured)

### Test 5: Email Confirmation
1. Check email inbox
2. Click confirmation link
3. Verify booking status changes to CONFIRMED
4. Check for calendar event (if configured)

**Expected**:
- Confirmation email received
- Link works
- Booking confirmed
- Calendar event created (if configured)

### Test 6: Admin Dashboard (Requires OAuth)
1. Visit: `http://localhost:3000/admin`
2. Sign in with Google (@mbrme.com email)
3. View bookings list
4. Click on a booking to see details

**Expected**:
- Login page shows
- OAuth works (if configured)
- Dashboard shows bookings
- Booking details viewable

## 🐛 Common Issues & Solutions

### Issue: Service types not loading
**Cause**: Supabase not configured or schema not run
**Solution**: 
1. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Run schema SQL in Supabase

### Issue: "Failed to fetch services"
**Cause**: API route can't connect to Supabase
**Solution**: Check Supabase credentials and network

### Issue: Slots not showing
**Cause**: Working hours not configured or no valid slots
**Solution**: Check database settings for working_hours

### Issue: Booking creation fails
**Cause**: Database connection or validation error
**Solution**: Check browser console and server logs

### Issue: Email not sending
**Cause**: SMTP not configured
**Solution**: Set `SMTP_PASSWORD` and configure SMTP in database

### Issue: Calendar event not created
**Cause**: Calendar not shared or wrong calendar ID
**Solution**: Check calendar sharing and calendar ID in settings

## 📊 Current Status

Based on your setup:
- ✅ Server running on http://localhost:3000
- ✅ Booking page loads
- ⚠️ Supabase needs configuration (for full functionality)
- ⚠️ SMTP needs configuration (for emails)
- ⚠️ Google OAuth needs configuration (for admin)

## 🚀 Next Steps

1. **Configure Supabase** (Critical)
   - Create project
   - Run schema
   - Add credentials to `.env.local`

2. **Test Basic Flow**
   - Once Supabase is configured, test booking creation

3. **Configure SMTP**
   - Set up email sending
   - Test confirmation emails

4. **Configure OAuth**
   - Set up Google OAuth
   - Test admin login

## 📝 Test Results

Document your test results here:

- [ ] Booking page loads: ✅/❌
- [ ] Service types load: ✅/❌
- [ ] Slots generate: ✅/❌
- [ ] Booking creation: ✅/❌
- [ ] Email sending: ✅/❌
- [ ] Email confirmation: ✅/❌
- [ ] Calendar event: ✅/❌
- [ ] Admin login: ✅/❌
- [ ] Admin dashboard: ✅/❌

