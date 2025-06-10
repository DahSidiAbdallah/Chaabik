/*
  # Create products table and seller profile

  1. New Tables
    - `seller_profiles`
      - `id` (uuid, primary key, matches auth.users.id)
      - `name` (text)
      - `phone` (text)
      - `total_sales` (int)
      - `response_rate` (int)
      - `created_at` (timestamp)
    - `products`
      - `id` (uuid, primary key)
      - `seller_id` (uuid, references seller_profiles)
      - `title` (text)
      - `description` (text)
      - `price` (numeric)
      - `category` (text)
      - `location` (text)
      - `image_url` (text)
      - `condition` (text)
      - `features` (text[])
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Policies for seller_profiles:
      - Sellers can read their own profile
      - Sellers can update their own profile
      - Anyone can read profiles
    - Policies for products:
      - Sellers can create their own products
      - Sellers can update their own products
      - Anyone can read products
*/

/* Create seller_profiles table */
CREATE TABLE IF NOT EXISTS seller_profiles (
  id UUID PRIMARY KEY,
  name TEXT,
  phone TEXT,
  total_sales INT,
  response_rate INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

/* Create products table */
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY,
  seller_id UUID REFERENCES seller_profiles(id),
  title TEXT,
  description TEXT,
  price NUMERIC,
  category TEXT,
  location TEXT,
  image_url TEXT,
  condition TEXT,
  features TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

/* Enable RLS on both tables */
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

/* Define policies */
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

CREATE POLICY "Sellers can create own products"
  ON products
  FOR INSERT
  TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can update own products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "Anyone can read products"
  ON products
  FOR SELECT
  TO public;
