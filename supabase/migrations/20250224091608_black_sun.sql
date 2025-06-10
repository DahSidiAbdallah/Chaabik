-- Add sold status to products
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'is_sold'
  ) THEN
    ALTER TABLE products ADD COLUMN is_sold BOOLEAN DEFAULT false;
    ALTER TABLE products ADD COLUMN sold_at TIMESTAMPTZ;
  END IF;
END $$;
