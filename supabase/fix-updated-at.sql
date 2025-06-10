-- Fix for missing updated_at column in products table
-- This script adds the updated_at column and creates a trigger to update it automatically

-- Add updated_at column to products table
ALTER TABLE products ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update all existing records to set updated_at equal to created_at (or current time if created_at is null)
UPDATE products SET updated_at = COALESCE(created_at, now());

-- Create a trigger function to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger that calls the function before each update
DROP TRIGGER IF EXISTS set_products_updated_at ON products;
CREATE TRIGGER set_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Inform user about the changes
DO $$
BEGIN
  RAISE NOTICE 'Successfully added updated_at column and automatic update trigger to products table';
END $$; 