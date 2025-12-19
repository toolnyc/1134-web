# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

11:34 is a minimal, Astro landing page with email waitlist functionality. The site captures emails, stores them in Supabase, and sends confirmation emails via Resend. 
## Tech Stack

- **Astro v5** with server output mode (required for API routes)
- **Supabase** for database storage (waitlist table)
- **Resend** for transactional emails
- **pnpm** as package manager
- **Vanilla CSS** with no frameworks (critical design principle)

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development server (http://localhost:4321)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Architecture

### Server-Side Rendering
The project uses Astro's `output: 'server'` mode (configured in astro.config.mjs) which enables:
- API routes under `/src/pages/api/`
- Server-side rendering for all pages
- Access to environment variables at runtime

### Email Flow
1. Client submits email via EmailCapture.astro component
2. POST request to `/api/subscribe` endpoint (src/pages/api/subscribe.ts)
3. Server validates email and checks for duplicates
4. Email stored in Supabase `waitlist` table with unique constraint
5. Confirmation email sent via Resend (errors are logged but don't fail the request)
6. Success/error response returned to client

### Service Clients
- `src/lib/supabase.ts` - Supabase client singleton (throws on missing env vars)
- `src/lib/resend.ts` - Resend client singleton (throws on missing env vars)

Both clients validate environment variables on initialization and will crash the server if misconfigured (intentional fail-fast behavior).

### Database Schema
The waitlist table requires:
```sql
CREATE TABLE waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_waitlist_email ON waitlist(email);
```

The UNIQUE constraint on email is critical - duplicate handling relies on PostgreSQL error code `23505`.

## Environment Variables

Required variables (see .env.example):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `RESEND_API_KEY` - Resend API key
- `RESEND_AUDIENCE_ID` - (Not currently used in code but present in .env.example)

Missing environment variables will cause the app to crash on startup.

## API Endpoints

### POST /api/subscribe
Handles email waitlist subscriptions with validation and duplicate checking.

**Key implementation details:**
- Email trimmed and lowercased before storage
- Duplicate detection via PostgreSQL unique constraint (error code 23505)
- Email sending failures don't fail the subscription (user still added to waitlist)
- All API routes must have `export const prerender = false` to work with server mode

## Important Code Patterns

### Email Validation
Validation occurs in two places with identical regex:
- Client-side: src/components/EmailCapture.astro (line 37)
- Server-side: src/pages/api/subscribe.ts (line 6)

Both use: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

### Error Handling in Components
The EmailCapture component uses className toggling for message display:
- `hidden` - No message shown
- `error` - Black background, white text
- `success` - White background, black text

Button states during submission show "Please wait." text and disable the button.

## Known TODO Items

1. **Email template customization** (src/pages/api/subscribe.ts:127-128):
   - Replace `from: 'onboarding@resend.dev'` with verified domain
   - Add plain text email version
   - Customize HTML template with brand assets

2. **Tablet Carousel** (src/components/TabletCarousel.astro):
   - Currently a placeholder component
   - Needs swipe/drag functionality
   - Auto-play with pause on hover
   - Navigation dots/arrows

## Testing Setup

The repository includes `test-supabase-connection.js` for verifying Supabase connectivity. Run with:
```bash
node test-supabase-connection.js
```

## Deployment Notes

- Designed for Vercel deployment
- Requires server-side runtime (not static export)
- All environment variables must be configured in deployment platform
- Email domain must be verified in Resend before production use
