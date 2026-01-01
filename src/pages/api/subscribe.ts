import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { resend } from '../../lib/resend';

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body = await request.json();
    const { email } = body;

    // Server-side validation
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!emailRegex.test(trimmedEmail)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Insert into Supabase waitlist table
    const { data, error } = await supabase
      .from('waitlist')
      .insert([
        {
          email: trimmedEmail,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    // Handle duplicate email
    if (error) {
      // PostgreSQL unique constraint violation code
      if (error.code === '23505') {
        return new Response(
          JSON.stringify({ error: 'This email is already on the waitlist' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }

      console.error('Supabase error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to join waitlist. Please try again.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Send confirmation email via Resend
    // Note: All emails are stored in Supabase, so you have your contact list there
    const logoUrl = 'https://1134.world/images/logo-dk-8.png';

    try {
      await resend.emails.send({
        from: 'Admin @ 11:34 <admin@1134.world>',
        to: trimmedEmail,
        subject: "You're on the list",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
                  background-color: #ffffff;
                  color: #000000;
                  margin: 0;
                  padding: 0;
                  font-weight: 300;
                  -webkit-font-smoothing: antialiased;
                }
                .container {
                  max-width: 500px;
                  margin: 0 auto;
                  padding: 60px 20px;
                }
                .header {
                  text-align: center;
                  margin-bottom: 48px;
                }
                .logo {
                  margin-bottom: 24px;
                }
                .content {
                  text-align: center;
                  line-height: 1.8;
                  color: #333333;
                  font-size: 16px;
                }
                .content p {
                  margin: 0 0 16px 0;
                }
                .divider {
                  width: 40px;
                  height: 1px;
                  background: #e0e0e0;
                  margin: 40px auto;
                }
                .signature {
                  text-align: center;
                  font-size: 14px;
                  color: #666666;
                  margin-top: 48px;
                  font-style: italic;
                }
                .footer {
                  text-align: center;
                  font-size: 11px;
                  color: #999999;
                  margin-top: 32px;
                  letter-spacing: -0.01em;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">
                    <img src="${logoUrl}" alt="11:34" width="80" height="64" style="display: block; margin: 0 auto;">
                  </div>
                </div>
                <div class="content">
                  <p>Your spot on the waitlist is confirmed.</p>
                  <p>We'll be in touch when it's time.</p>
                </div>
                <div class="divider"></div>
                <div class="signature">
                  <p>Admin @ 11:34</p>
                </div>
                <div class="footer">
                  <p>&copy; ${new Date().getFullYear()} 11:34</p>
                </div>
              </div>
            </body>
          </html>
        `,
        text: `Your spot on the waitlist is confirmed.

We'll be in touch when it's time.

---

Admin @ 11:34

© ${new Date().getFullYear()} 11:34`,
      });
    } catch (emailError) {
      // Log email error but don't fail the request
      // The user is already in the database
      console.error('Failed to send confirmation email:', emailError);
    }

    return new Response(
      JSON.stringify({
        message: 'Successfully joined the waitlist! Check your email for confirmation.',
        data,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

