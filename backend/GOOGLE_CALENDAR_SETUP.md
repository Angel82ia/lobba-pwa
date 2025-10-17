# Google Calendar Integration Setup

## Environment Variables Required

Add these to your `.env` file:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-calendar/callback
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

## How to Get Google Calendar API Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Calendar API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs:
   - `http://localhost:3000/api/google-calendar/callback`
   - `https://your-domain.com/api/google-calendar/callback`
7. Copy `Client ID` and `Client Secret`

## Flow Overview

### 1. Connect Google Calendar
```
User → Click "Connect Google Calendar"
Frontend → GET /api/google-calendar/auth/:salonId
Backend → Returns authUrl
Frontend → Redirect to Google OAuth
User → Authorize LOBBA
Google → Redirect to /api/google-calendar/callback
Backend → Save tokens → Redirect to frontend
```

### 2. Select Calendar
```
Frontend → GET /api/google-calendar/calendars/:salonId
Backend → Returns list of available calendars
User → Select calendar
Frontend → POST /api/google-calendar/set-calendar/:salonId
Backend → Save calendar_id, enable sync
```

### 3. Manual Sync
```
Frontend → POST /api/google-calendar/sync/:salonId
Backend → Sync bidirectionally:
  1. LOBBA reservations → Google Calendar events
  2. Google Calendar events → LOBBA availability_blocks
```

### 4. Automatic Sync (Webhooks)
```
Frontend → POST /api/google-calendar/webhook/setup/:salonId
Backend → Register webhook with Google
Google → POST /api/google-calendar/webhook (on calendar changes)
Backend → Sync affected salon
```

## Sync Logic

### LOBBA → Google Calendar
- Creates Google Calendar event for each confirmed/pending reservation
- Stores `google_event_id` in reservation
- Skips reservations that already have `google_event_id`
- Event includes:
  - Summary: "Service - Client Name"
  - Description: Client email, status
  - Attendees: Client email
  - Private metadata: `lobba_reservation_id`, `lobba_source=true`

### Google Calendar → LOBBA
- Fetches all events in next 3 months
- Skips events with `lobba_source=true` (created by LOBBA)
- Creates/updates `availability_blocks` with type='google_calendar'
- Blocks prevent new reservations during those times

## Security Notes

- Tokens stored encrypted in database
- Refresh tokens automatically renew access tokens
- Webhook signatures should be validated (TODO)
- Only salon owner can connect/disconnect calendar

## Database Schema

### salon_profiles
- `google_calendar_id`: Selected calendar ID
- `google_calendar_enabled`: If connection is active
- `google_sync_enabled`: If bidirectional sync is enabled
- `google_refresh_token`: OAuth refresh token
- `google_access_token`: OAuth access token
- `google_token_expiry`: Token expiration timestamp
- `google_webhook_channel_id`: Webhook channel ID
- `google_webhook_resource_id`: Webhook resource ID
- `google_webhook_expiration`: Webhook expiration timestamp
- `last_google_sync`: Last successful sync timestamp

### reservations
- `google_event_id`: Google Calendar event ID if synced

### availability_blocks
- `block_type='google_calendar'`: Blocks created from Google events
- `google_calendar_event_id`: Original Google event ID

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/google-calendar/auth/:salonId` | Get OAuth URL |
| GET | `/api/google-calendar/callback` | OAuth callback |
| GET | `/api/google-calendar/calendars/:salonId` | List calendars |
| POST | `/api/google-calendar/set-calendar/:salonId` | Set primary calendar |
| POST | `/api/google-calendar/sync/:salonId` | Manual sync |
| POST | `/api/google-calendar/webhook/setup/:salonId` | Setup webhook |
| POST | `/api/google-calendar/webhook` | Receive webhook |
| DELETE | `/api/google-calendar/disconnect/:salonId` | Disconnect |
