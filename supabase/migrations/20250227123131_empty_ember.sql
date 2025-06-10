/*
  # Create storage bucket and policies for product images

  1. New Storage Configuration
    - Create 'product-images' bucket with proper permissions
    - Set file size limits and allowed MIME types
  
  2. Security
    - Enable RLS on storage.objects
    - Create policies for authenticated users to:
      - Read their own images
      - Upload images to their own folder
      - Delete their own images
    - Create policy for public read access
  
  3. Helper Functions
    - Add image validation function
    - Add cleanup function for orphaned files
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760,  -- 10MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Give users authenticated read access" ON storage.objects;
DROP POLICY IF EXISTS "Give public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- Create storage policies with proper UUID handling
CREATE POLICY "Give users authenticated read access"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'product-images' );

CREATE POLICY "Give public read access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'product-images' );

CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Create helper functions for file validation
CREATE OR REPLACE FUNCTION storage.validate_image_file(
  file_name text,
  file_size bigint
) RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check file extension
  IF NOT storage.extension(file_name) = ANY(ARRAY['jpg', 'jpeg', 'png', 'gif', 'webp']) THEN
    RAISE EXCEPTION 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.';
  END IF;

  -- Check file size
  IF file_size > 10485760 THEN  -- 10MB in bytes
    RAISE EXCEPTION 'File size too large. Maximum size is 10MB.';
  END IF;

  RETURN true;
END;
$$;

-- Create function to clean up orphaned files
CREATE OR REPLACE FUNCTION storage.cleanup_orphaned_files()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete files that don't belong to any product
  DELETE FROM storage.objects
  WHERE bucket_id = 'product-images'
  AND NOT EXISTS (
    SELECT 1 FROM products
    WHERE products.image_url = storage.objects.name
    OR products.features @> ARRAY[storage.objects.name]
  );
END;
$$;

-- Create error logging table
CREATE TABLE IF NOT EXISTS storage.upload_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  file_name text NOT NULL,
  error_message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on error logging
ALTER TABLE storage.upload_errors ENABLE ROW LEVEL SECURITY;

-- Create policy for error logging
CREATE POLICY "Users can see their own upload errors"
ON storage.upload_errors
FOR SELECT
TO authenticated
USING (user_id = auth.uid());