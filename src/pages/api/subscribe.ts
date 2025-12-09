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
    try {
      await resend.emails.send({
        from: 'onboarding@resend.dev', // TODO: Replace with your verified domain
        to: trimmedEmail,
        subject: 'Welcome to 11:34 - You\'re on the List',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  background-color: #0a0a0a;
                  color: #c0c0c0;
                  margin: 0;
                  padding: 0;
                }
                .container {
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 40px 20px;
                }
                .header {
                  text-align: center;
                  margin-bottom: 40px;
                }
                .title {
                  font-size: 48px;
                  font-weight: bold;
                  color: #c0c0c0;
                  margin: 0;
                  letter-spacing: 2px;
                }
                .content {
                  line-height: 1.6;
                  margin-bottom: 30px;
                }
                .footer {
                  text-align: center;
                  font-size: 12px;
                  color: #666;
                  margin-top: 40px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 class="title">11:34</h1>
                </div>
                <div class="content">
                  <p>Welcome to the mystical,</p>
                  <p>You've successfully joined the 11:34 waitlist. You're now part of an exclusive underground experience that transcends reality.</p>
                  <p>We'll reach out when the portal opens.</p>
                  <p>Stay mystical.</p>
                </div>
                <div class="footer">
                  <p>&copy; ${new Date().getFullYear()} 11:34. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
        // TODO: Customize email template with your brand assets and styling
        // TODO: Add plain text version for better email client compatibility
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

