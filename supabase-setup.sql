-- ============================================
-- Supabase Waitlist Table Setup
-- ============================================
-- Run this SQL in your Supabase SQL Editor to fix the RLS error
-- Dashboard → SQL Editor → New Query → Paste this → Run

-- Step 1: Create waitlist table (if it doesn't exist)
-- ============================================
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups and duplicate checks
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);

-- Step 2: Enable Row-Level Security
-- ============================================
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies if they exist (to avoid conflicts)
-- ============================================
DROP POLICY IF EXISTS "Allow anonymous inserts to waitlist" ON waitlist;
DROP POLICY IF EXISTS "Allow authenticated users to read waitlist" ON waitlist;
DROP POLICY IF EXISTS "Allow service role full access" ON waitlist;

-- Step 4: Create INSERT policy for anonymous/public users
-- ============================================
-- This allows anyone with your publishable key to insert rows
-- Note: Uses 'anon' role which is what the publishable key authenticates as
CREATE POLICY "Allow anonymous inserts to waitlist"
ON waitlist
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Step 5: Create SELECT policy for viewing data
-- ============================================
CREATE POLICY "Allow authenticated users to read waitlist"
ON waitlist
FOR SELECT
TO authenticated, anon
USING (true);

-- Step 6: Service role access (for admin/dashboard)
-- ============================================
CREATE POLICY "Allow service role full access"
ON waitlist
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- Grant permissions to anon role
-- ============================================
-- Ensure the anon role has INSERT and SELECT permissions
GRANT INSERT ON waitlist TO anon;
GRANT SELECT ON waitlist TO anon;
-- Note: No sequence needed since we use UUID with gen_random_uuid()

-- ============================================
-- Verification Queries
-- ============================================
-- After running the above, verify with these queries:

-- 1. Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'waitlist';
-- Expected: rowsecurity = true

-- 2. View all policies on the waitlist table
SELECT policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'waitlist';
-- Expected: You should see 3 policies

-- 3. Check table permissions
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'waitlist';
-- Expected: anon should have INSERT and SELECT

-- ============================================
-- Test Insert (optional)
-- ============================================
-- Try inserting a test email to verify it works:
-- INSERT INTO waitlist (email) VALUES ('test@example.com');
-- If successful, delete it:
-- DELETE FROM waitlist WHERE email = 'test@example.com';
