/*
  # Create image validation function
  
  1. Validation Function
    - Add function to validate image files
    - Check file extensions (jpg, jpeg, png, gif, webp)
    - Verify file size (max 10MB)
*/

-- Create helper function for file validation
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