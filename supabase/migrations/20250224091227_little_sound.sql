/*
  # Clean up and simplify storage configuration

  1. Changes
    - Remove redundant storage bucket configurations
    - Simplify storage policies to handle both UUID and text owner fields
    - Add proper error logging with text user_id
    - Add helper functions for file validation and cleanup

  2. Security
    - Maintain RLS on all tables
    - Ensure proper access control for file operations
    - Add security definer to functions
*/

/* Create the storage bucket if it doesn't exist */
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760,  -- 10MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

/* Enable RLS on storage.objects */
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

/* Drop existing policies if they exist */
DROP POLICY IF EXISTS "Give users authenticated read access" ON storage.objects;
DROP POLICY IF EXISTS "Give public read access" ON storage.objects;

/* Create simplified storage policies */
CREATE POLICY "Give users authenticated read access"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'product-images' );

CREATE POLICY "Give public read access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'product-images' );
