/*
  # Create database schema for marketplace
  
  1. New Tables
    - `products` - Stores product listings
    - `seller_profiles` - Stores seller information
  
  2. Security
    - Enable RLS on all tables
    - Create policies for authenticated users to manage their own data
    - Create policies for public read access
  
  3. Utilities
    - Add trigger for updating timestamps
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

-- Enable RLS on products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Enable RLS on seller_profiles
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid errors
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

-- Create function to update the updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_seller_profiles_updated_at ON seller_profiles;

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seller_profiles_updated_at
BEFORE UPDATE ON seller_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();