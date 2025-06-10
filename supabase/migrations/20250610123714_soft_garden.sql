/*
  # Fix seller_profiles table missing updated_at column

  1. Schema Changes
    - Add `updated_at` column to `seller_profiles` table if it doesn't exist
    - Set default value to current timestamp
    - Update existing records to have proper updated_at values

  2. Triggers
    - Ensure the update trigger function exists
    - Create/recreate the trigger for seller_profiles table

  This migration fixes the "record 'new' has no field 'updated_at'" error
  that occurs when trying to update seller profiles.
*/

-- Add updated_at column to seller_profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seller_profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE seller_profiles ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Update all existing records to set updated_at equal to created_at (or current time if created_at is null)
UPDATE seller_profiles 
SET updated_at = COALESCE(created_at, now()) 
WHERE updated_at IS NULL;

-- Ensure the trigger function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger to ensure it works properly
DROP TRIGGER IF EXISTS update_seller_profiles_updated_at ON seller_profiles;

CREATE TRIGGER update_seller_profiles_updated_at
BEFORE UPDATE ON seller_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();