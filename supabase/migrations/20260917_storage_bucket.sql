-- ============================================================================
-- EduPlay Storage Bucket Setup: quiz-media
-- Run this SQL in your Supabase Dashboard > SQL Editor to activate image uploads.
-- ============================================================================

-- 1. Create the public storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'quiz-media',
    'quiz-media',
    true,
    5242880, -- 5 MB max per image
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- 2. Storage RLS Policies
-- Allow anyone (public) to view/read quiz images
DROP POLICY IF EXISTS "Public Read Access for quiz-media" ON storage.objects;
CREATE POLICY "Public Read Access for quiz-media"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'quiz-media');

-- Allow authenticated teachers to upload images
DROP POLICY IF EXISTS "Authenticated Users can upload quiz-media" ON storage.objects;
CREATE POLICY "Authenticated Users can upload quiz-media"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'quiz-media'
        AND auth.role() = 'authenticated'
    );

-- Allow authenticated teachers to update images
DROP POLICY IF EXISTS "Authenticated Users can update quiz-media" ON storage.objects;
CREATE POLICY "Authenticated Users can update quiz-media"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'quiz-media'
        AND auth.role() = 'authenticated'
    );

-- Allow authenticated teachers to delete images
DROP POLICY IF EXISTS "Authenticated Users can delete quiz-media" ON storage.objects;
CREATE POLICY "Authenticated Users can delete quiz-media"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'quiz-media'
        AND auth.role() = 'authenticated'
    );

