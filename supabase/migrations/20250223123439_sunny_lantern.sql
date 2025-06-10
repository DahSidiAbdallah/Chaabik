/*
  # Fix UUID type handling in seller_profiles table

  1. Changes
    - Add proper type casting for UUID fields
    - Update RLS policies to handle UUID types correctly
    - Add indexes for better performance

  2. Security
    - Maintains existing RLS policies with proper type handling
*/

-- Add index on seller_profiles id for better performance
CREATE INDEX IF NOT EXISTS seller_profiles_id_idx ON seller_profiles(id);

-- Update seller profiles policies with proper UUID handling
DROP POLICY IF EXISTS "Sellers can read own profile" ON seller_profiles;
DROP POLICY IF EXISTS "Sellers can update own profile" ON seller_profiles;
DROP POLICY IF EXISTS "Anyone can read profiles" ON seller_profiles;

CREATE POLICY "Sellers can read own profile"
  ON seller_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Sellers can update own profile"
  ON seller_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Anyone can read profiles"
  ON seller_profiles
  FOR SELECT
  TO anon
  USING (true);

-- Add function to ensure UUID type consistency
CREATE OR REPLACE FUNCTION ensure_uuid(input text)
RETURNS uuid
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN input::uuid;
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$;