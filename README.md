# 11:34 

A minimal, dark-themed Astro site for the 11:34 brand featuring email waitlist capture with Supabase storage and Resend email confirmations.

## 🚀 Tech Stack

- **Framework**: [Astro](https://astro.build) v5
- **Styling**: Vanilla CSS with custom properties
- **Database**: [Supabase](https://supabase.com)
- **Email**: [Resend](https://resend.com)
- **Package Manager**: pnpm

## 📁 Project Structure

```
/
├── public/
│   ├── images/          # Tablet render images for carousel
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── EmailCapture.astro    # Email signup form with validation
│   │   └── TabletCarousel.astro  # Placeholder for future carousel
│   ├── layouts/
│   │   └── Layout.astro          # Base layout with metadata
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client
│   │   └── resend.ts             # Resend email client
│   └── pages/
│       ├── index.astro           # Landing page
│       └── api/
│           └── subscribe.ts      # Email subscription endpoint
├── .env.example
├── astro.config.mjs
└── package.json
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `RESEND_API_KEY`: Your Resend API key

### 3. Supabase Database Setup

Create a `waitlist` table in your Supabase database:

```sql
CREATE TABLE waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX idx_waitlist_email ON waitlist(email);
```

### 4. Resend Setup

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain (or use the test domain for development)
3. Update the `from` field in `/src/pages/api/subscribe.ts` with your verified domain email

### 5. Run Development Server

```bash
pnpm dev
```

Visit `http://localhost:4321` to see your site.

## 🎨 Design System

### Colors

- **Background**: Pure black `#000000`
- **Text/Accent**: Pure white `#ffffff`
- High contrast, stark aesthetic

### Typography

- **Font**: Arial, sans-serif
- **Kerning**: Tight letter-spacing (-0.01em)
- Bold, condensed style

### Layout

- Mobile-first responsive design
- Full-viewport hero section
- Sharp borders (2px solid)
- No border-radius or gradients
- Centered content with max-width constraints
- Pure vanilla CSS - no frameworks
- Instant state changes (minimal transitions)

## 📡 API Endpoints

### POST `/api/subscribe`

Subscribe an email to the waitlist.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "message": "Successfully joined the waitlist! Check your email for confirmation.",
  "data": {...}
}
```

**Error Responses:**
- `400`: Invalid email format
- `409`: Email already exists
- `500`: Server error

## ✅ Features

- ✅ Email validation (client-side & server-side)
- ✅ Duplicate email handling
- ✅ Supabase waitlist storage
- ✅ Resend confirmation emails
- ✅ Dark theme with mystical aesthetic
- ✅ Mobile-first responsive design
- ✅ Loading states and error handling
- ✅ Smooth animations
- ✅ Vanilla CSS - no build dependencies

## 🔧 TODO Items

The following items are marked with TODO comments in the code:

1. **Email Template** (`/src/pages/api/subscribe.ts`):
   - Customize the email HTML template with brand assets
   - Add plain text version for better compatibility
   - Replace `from` email with your verified domain

2. **Tablet Carousel** (`/src/components/TabletCarousel.astro`):
   - Implement swipe/drag functionality
   - Add tablet image renders
   - Create auto-play with pause on hover
   - Add navigation dots/arrows

## 🚀 Deployment

### Build for Production

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

### Deploy to Vercel

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add your environment variables
4. Deploy

## 📝 Notes

- The site uses Astro's server output mode for API routes
- Email sending errors are logged but don't fail the subscription request
- The carousel component is a placeholder for future implementation
- All styling is done with vanilla CSS for maximum performance and minimal dependencies

## 🎯 Brand Identity

**11:34** represents a bold underground experience. The design emphasizes:

- Brutal minimalism
- Pure black and white contrast
- Sharp, hard edges
- Tight, condensed typography
- Immediate, decisive interactions
- Raw, uncompromising aesthetic

---

Built with ❤️ for the mystical underground
