-- Fix for missing updated_at column in seller_profiles table
-- This script adds the updated_at column and creates a trigger to update it automatically

-- Add updated_at column to seller_profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seller_profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE seller_profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
END $$;

-- Update all existing records to set updated_at equal to created_at (or current time if created_at is null)
UPDATE seller_profiles SET updated_at = COALESCE(created_at, now()) WHERE updated_at IS NULL;

-- Create or replace the trigger function to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger that calls the function before each update
DROP TRIGGER IF EXISTS set_seller_profiles_updated_at ON seller_profiles;
CREATE TRIGGER set_seller_profiles_updated_at
BEFORE UPDATE ON seller_profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Inform user about the changes
DO $$
BEGIN
  RAISE NOTICE 'Successfully added updated_at column and automatic update trigger to seller_profiles table';
END $$;