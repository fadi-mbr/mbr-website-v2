# Slot Availability Guide

## How Slot Availability Works

Time slot availability is calculated based on several factors configured in the admin settings:

### 1. **Working Hours** (Most Common Issue)
- **Location**: Admin Dashboard → Settings → Working Hours
- **What it does**: Defines when your business is open each day
- **Required**: At least one day must be enabled with valid open/close times
- **Format**: `HH:MM` (24-hour format, e.g., "08:30", "19:30")

**Common Issues:**
- All days disabled → No slots will show
- Days not configured → No slots for those days
- Close time before open time → No slots generated

### 2. **Lead Time** (`lead_time_hours`)
- **Location**: Admin Dashboard → Settings → Booking Settings → Lead Time (hours)
- **What it does**: Minimum hours before a slot that customers can book
- **Default**: 2 hours
- **Example**: If lead time is 2 hours and it's 3:00 PM, slots before 5:00 PM today won't show

**Common Issues:**
- Too high (e.g., 24 hours) → Most slots filtered out
- If it's late in the day and lead time is high, tomorrow's early slots might be filtered

### 3. **Max Future Days** (`max_future_days`)
- **Location**: Admin Dashboard → Settings → Booking Settings → Max Future Booking Window
- **What it does**: Maximum days in the future customers can book
- **Default**: 90 days
- **Example**: If set to 7 days, customers can only book up to 7 days ahead

**Common Issues:**
- Set to 0 → No slots will show
- Too low → Limited booking window

### 4. **Slot Duration** (`slot_duration_minutes`)
- **Location**: Admin Dashboard → Settings → Booking Settings → Slot Duration
- **What it does**: Length of each time slot
- **Default**: 30 minutes
- **Example**: 30 minutes = slots at 9:00, 9:30, 10:00, etc.

### 5. **Slot Capacity** (`slot_capacity`)
- **Location**: Admin Dashboard → Settings → Booking Settings → Slot Capacity
- **What it does**: How many bookings can be in the same time slot
- **Default**: 1
- **Example**: If capacity is 2, two customers can book 9:00 AM slot

### 6. **Blocked Slots**
- **Location**: Admin Dashboard → Settings (can be managed via blocked_slots table)
- **What it does**: Specific time ranges that are unavailable
- **Use case**: Holidays, maintenance, special events

### 7. **Existing Bookings**
- Slots are filtered based on confirmed and pending bookings
- If a slot reaches capacity, it shows as "Full" or "Limited"

## Troubleshooting "No Slots Available"

### Step 1: Check Server Logs
After adding debug logging, check your server console when loading the booking page. You should see:
```
Slot generation settings: { timezone, slotDuration, leadTimeHours, ... }
Generating slots from ... to ...
Generated X available slots
```

### Step 2: Verify Working Hours
1. Go to Admin Dashboard → Settings
2. Scroll to "Working Hours" section
3. Verify:
   - At least one day has `enabled: true`
   - Open and close times are set (format: `HH:MM`)
   - Close time is after open time

### Step 3: Check Lead Time
1. Go to Admin Dashboard → Settings
2. Find "Lead Time (hours)"
3. If it's too high (e.g., 24), reduce it to 2-4 hours
4. **Note**: Lead time is calculated from current time, so if it's late in the day, early tomorrow slots might be filtered

### Step 4: Check Max Future Days
1. Go to Admin Dashboard → Settings
2. Find "Max Future Booking Window (days)"
3. Ensure it's > 0 (recommended: 30-90 days)

### Step 5: Verify Timezone
1. Go to Admin Dashboard → Settings
2. Check "Business Timezone"
3. Should be set to `Asia/Dubai` for UAE

### Step 6: Test with Default Settings
If still no slots, try resetting to defaults:
- **Working Hours**: Monday-Saturday, 08:30 - 19:30, enabled
- **Lead Time**: 2 hours
- **Max Future Days**: 90 days
- **Slot Duration**: 30 minutes

## Quick Fix Checklist

- [ ] At least one day in working hours is enabled
- [ ] Working hours have valid open/close times (close > open)
- [ ] Lead time is reasonable (2-4 hours, not 24+)
- [ ] Max future days is > 0
- [ ] Timezone is correct (Asia/Dubai)
- [ ] Check server console for debug logs
- [ ] Try selecting a date 2-3 days in the future (to avoid lead time issues)

## Example: Why No Slots Show Today

**Scenario**: It's 6:00 PM, lead time is 2 hours, working hours end at 7:30 PM

**Result**: Only slots after 8:00 PM would show, but business closes at 7:30 PM, so no slots available today.

**Solution**: Select tomorrow's date instead, or reduce lead time.

## Database Check

If settings look correct but still no slots, check the database directly:

```sql
-- Check working hours
SELECT value FROM settings WHERE key = 'working_hours';

-- Check lead time
SELECT value FROM settings WHERE key = 'lead_time_hours';

-- Check max future days
SELECT value FROM settings WHERE key = 'max_future_days';
```

The `working_hours` should be a JSON object like:
```json
{
  "monday": {"open": "08:30", "close": "19:30", "enabled": true},
  "tuesday": {"open": "08:30", "close": "19:30", "enabled": true},
  ...
}
```

