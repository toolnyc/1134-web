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
    // Logo embedded as base64 to avoid issues with static asset serving
    const logoBase64 = 'data:image/png;base64,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';

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
                  letter-spacing: 0.05em;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">
                    <img src="${logoBase64}" alt="11:34" width="80" style="display: block; margin: 0 auto;">
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

