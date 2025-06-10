# Supabase Database Fixes

This directory contains SQL scripts to fix issues with the database schema.

## Fix Missing `updated_at` Column

If you're encountering an error like this:
```
Error updating listing status: {code: '42703', details: null, hint: null, message: 'record "new" has no field "updated_at"'}
```

This error occurs because the database is trying to access an `updated_at` field that doesn't exist in your products table. This is typically related to Row Level Security (RLS) policies or triggers in PostgreSQL.

### How to Fix

1. Go to your Supabase dashboard (https://app.supabase.com)
2. Select your project
3. Go to the SQL Editor
4. Copy the contents of the `fix-updated-at.sql` file
5. Paste it into the SQL Editor
6. Click "Run" to execute the script

### What this Fix Does

1. Adds an `updated_at` column to the products table with a default value of the current timestamp
2. Updates all existing records to set `updated_at` equal to `created_at` (or current time if `created_at` is null)
3. Creates a function that automatically sets `updated_at` to the current time whenever a record is updated
4. Creates a trigger that calls this function before each update operation on the products table

After applying this fix, you should be able to mark items as sold without encountering the error.

## Other Common Issues

If you encounter other database-related errors, please check the error message for clues about what might be missing or misconfigured in your Supabase database schema. 