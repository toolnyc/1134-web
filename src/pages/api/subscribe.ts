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
        from: 'admin@1134.world',
        to: trimmedEmail,
        subject: 'Welcome to 11:34',
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
                .title {
                  font-size: 32px;
                  font-weight: 300;
                  color: #000000;
                  margin: 0;
                  letter-spacing: 0.1em;
                }
                .content {
                  text-align: center;
                  line-height: 1.8;
                  color: #666666;
                  font-size: 15px;
                }
                .content p {
                  margin: 0 0 16px 0;
                }
                .divider {
                  width: 40px;
                  height: 1px;
                  background: #f5f5f5;
                  margin: 40px auto;
                }
                .footer {
                  text-align: center;
                  font-size: 12px;
                  color: #999999;
                  margin-top: 48px;
                  letter-spacing: 0.05em;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 class="title">11:34</h1>
                </div>
                <div class="content">
                  <p>Welcome.</p>
                  <p>You've joined the waitlist.</p>
                  <p>We'll reach out when the time comes.</p>
                </div>
                <div class="divider"></div>
                <div class="footer">
                  <p>${new Date().getFullYear()} 11:34</p>
                </div>
              </div>
            </body>
          </html>
        `,
        text: `11:34

Welcome.

You've joined the waitlist.
We'll reach out when the time comes.

---
${new Date().getFullYear()} 11:34`,
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

