/*
  # Create products and seller_profiles tables

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `description` (text, not null)
      - `price` (numeric, not null)
      - `category` (text, not null)
      - `location` (text, not null)
      - `condition` (text, not null)
      - `seller_id` (uuid, foreign key to auth.users)
      - `image_url` (text, not null)
      - `features` (text array)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
    
    - `seller_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `name` (text, not null)
      - `phone` (text, not null)
      - `rating` (numeric, default 5.0)
      - `total_sales` (integer, default 0)
      - `response_rate` (integer, default 100)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to:
      - Read all products
      - Create their own products
      - Update their own products
      - Delete their own products
      - Read all seller profiles
      - Update their own seller profile
*/

-- Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  price numeric NOT NULL,
  category text NOT NULL,
  location text NOT NULL,
  condition text NOT NULL,
  seller_id uuid REFERENCES auth.users(id) NOT NULL,
  image_url text NOT NULL,
  features text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create seller_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS seller_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  name text NOT NULL,
  phone text NOT NULL,
  rating numeric DEFAULT 5.0,
  total_sales integer DEFAULT 0,
  response_rate integer DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on products if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    AND c.relname = 'products'
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE products ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- Enable RLS on seller_profiles if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    AND c.relname = 'seller_profiles'
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read products" ON products;
DROP POLICY IF EXISTS "Users can create their own products" ON products;
DROP POLICY IF EXISTS "Users can update their own products" ON products;
DROP POLICY IF EXISTS "Users can delete their own products" ON products;
DROP POLICY IF EXISTS "Anyone can read seller profiles" ON seller_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON seller_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON seller_profiles;

-- Create policies for products
CREATE POLICY "Anyone can read products"
  ON products
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create their own products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update their own products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can delete their own products"
  ON products
  FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);

-- Create policies for seller_profiles
CREATE POLICY "Anyone can read seller profiles"
  ON seller_profiles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON seller_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON seller_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create function to update the updated_at column if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_products_updated_at'
  ) THEN
    CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_seller_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_seller_profiles_updated_at
    BEFORE UPDATE ON seller_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;