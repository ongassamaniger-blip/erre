-- Fix RLS policies for profiles and facility_users
-- Run this in Supabase SQL Editor

-- 1. Enable RLS on profiles (if not already)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- 3. Create permissive policies for profiles
-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile (needed for triggers sometimes)
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Enable RLS on facility_users
ALTER TABLE public.facility_users ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies on facility_users
DROP POLICY IF EXISTS "Users can view their own facility access" ON public.facility_users;

-- 6. Create permissive policies for facility_users
-- Allow users to view their own facility access
CREATE POLICY "Users can view their own facility access" ON public.facility_users
  FOR SELECT USING (auth.uid() = user_id);

-- Allow Super Admins to view all facility access (optional, but good for debugging)
-- Note: This creates a dependency on profiles table, so be careful with recursion.
-- Ideally, facility_users should be viewable if you are the user OR if you are an admin.
-- For now, let's keep it simple: Users can see their own.

-- RAISE NOTICE 'RLS policies updated successfully.';
