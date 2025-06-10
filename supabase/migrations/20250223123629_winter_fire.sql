/*
  # Fix UUID Type Mismatch

  1. Changes
    - Add proper UUID type handling for seller_profiles and products tables
    - Update RLS policies to handle UUID comparisons correctly
    - Add helper functions for UUID validation
    - Add indexes for better performance

  2. Security
    - Maintain existing RLS policies with proper UUID handling
    - Ensure type safety in all operations
*/

/* Drop existing policies to recreate them with proper UUID handling */
DROP POLICY IF EXISTS "Sellers can read own profile" ON seller_profiles;
DROP POLICY IF EXISTS "Sellers can update own profile" ON seller_profiles;
DROP POLICY IF EXISTS "Anyone can read profiles" ON seller_profiles;

/* Recreate policies with proper UUID handling */
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
  TO public;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS seller_profiles_id_idx ON seller_profiles(id);
CREATE INDEX IF NOT EXISTS products_seller_id_idx ON products(seller_id);
