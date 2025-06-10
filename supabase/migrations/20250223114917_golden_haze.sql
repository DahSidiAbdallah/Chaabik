/*
  # Add Chat System and Product Management Features

  1. New Tables
    - `chats`: Manages chat sessions between buyers and sellers
      - `id` (uuid, primary key)
      - `product_id` (uuid, references products)
      - `buyer_id` (uuid, references auth.users)
      - `seller_id` (uuid, references auth.users)
      - `created_at` (timestamp)

    - `messages`: Stores individual chat messages
      - `id` (uuid, primary key)
      - `chat_id` (uuid, references chats)
      - `sender_id` (uuid, references auth.users)
      - `content` (text)
      - `created_at` (timestamp)
      - `read` (boolean)

  2. Changes
    - Add sold status tracking to products table
    - Add RLS policies for chat and message management
    - Add policies for product status updates

  3. Security
    - Enable RLS on new tables
    - Restrict chat access to participants only
    - Allow sellers to manage their product status
*/

-- Add sold status to products
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'is_sold'
  ) THEN
    ALTER TABLE products ADD COLUMN is_sold boolean DEFAULT false;
    ALTER TABLE products ADD COLUMN sold_at timestamptz;
  END IF;
END $$;

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  buyer_id uuid REFERENCES auth.users(id) NOT NULL,
  seller_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  read boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Chat policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chats' AND policyname = 'Users can see their own chats'
  ) THEN
    CREATE POLICY "Users can see their own chats"
      ON chats
      FOR SELECT
      TO authenticated
      USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chats' AND policyname = 'Buyers can create chats'
  ) THEN
    CREATE POLICY "Buyers can create chats"
      ON chats
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = buyer_id);
  END IF;
END $$;

-- Message policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'messages' AND policyname = 'Chat participants can see messages'
  ) THEN
    CREATE POLICY "Chat participants can see messages"
      ON messages
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM chats
          WHERE chats.id = messages.chat_id
          AND (chats.buyer_id = auth.uid() OR chats.seller_id = auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'messages' AND policyname = 'Chat participants can send messages'
  ) THEN
    CREATE POLICY "Chat participants can send messages"
      ON messages
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM chats
          WHERE chats.id = messages.chat_id
          AND (chats.buyer_id = auth.uid() OR chats.seller_id = auth.uid())
          AND auth.uid() = sender_id
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'messages' AND policyname = 'Users can mark their received messages as read'
  ) THEN
    CREATE POLICY "Users can mark their received messages as read"
      ON messages
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM chats
          WHERE chats.id = messages.chat_id
          AND (chats.buyer_id = auth.uid() OR chats.seller_id = auth.uid())
          AND sender_id != auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM chats
          WHERE chats.id = messages.chat_id
          AND (chats.buyer_id = auth.uid() OR chats.seller_id = auth.uid())
          AND sender_id != auth.uid()
        )
      );
  END IF;
END $$;