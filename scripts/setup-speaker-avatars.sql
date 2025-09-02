-- Setup script for speaker avatar storage
-- Run this in your Supabase SQL editor

-- Create the avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Remove existing policies to start fresh
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload speaker avatars" ON storage.objects;

-- Allow public read access to avatars
CREATE POLICY "Public avatar access" ON storage.objects 
FOR SELECT USING (bucket_id = 'avatars');

-- Allow users to upload their own avatar
CREATE POLICY "Users can upload own avatar" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update own avatar" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete own avatar" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to upload speaker avatars for events
CREATE POLICY "Users can upload speaker avatars" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = 'speakers'
);

-- Allow authenticated users to update speaker avatars for events  
CREATE POLICY "Users can update speaker avatars" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'avatars' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = 'speakers'
);

-- Allow authenticated users to delete speaker avatars for events
CREATE POLICY "Users can delete speaker avatars" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'avatars' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = 'speakers'
);

-- Test the setup by checking if bucket exists
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'avatars';

-- Check policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;