import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// File upload helper with better error handling
export async function uploadProductImage(file: File, userId: string): Promise<string> {
  if (!file) throw new Error('No file provided');
  
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.');
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    throw new Error('File size too large. Maximum size is 10MB.');
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase request failed', error);
      throw error;
    }
    if (!data?.path) throw new Error('Upload failed - no path returned');

    return data.path;
  } catch (error) {
    console.error('Supabase request failed', error);
    if (error instanceof Error) {
      // Handle specific error cases
      if (error.message.includes('duplicate')) {
        throw new Error('A file with this name already exists. Please try again.');
      }
      if (error.message.includes('permission') || error.message.includes('security policy')) {
        throw new Error('You do not have permission to upload files.');
      }
      throw error;
    }
    throw new Error('An unexpected error occurred during file upload.');
  }
}

// Helper to get public URL for an image
export function getImageUrl(path: string): string {
  if (!path) return '/placeholder-image.jpg';
  
  // If already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Extract the filename for paths that might include folders
  const filename = path.includes('/') ? path.split('/').pop() : path;
  
  // Check if this is a simple filename (like 1747132858821.png)
  if (filename && !path.includes('/')) {
    // For files directly in the bucket root
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filename);
    console.log('Generated URL for', filename, ':', data.publicUrl);
    return data.publicUrl;
  }
  
  // Handle more complex paths
  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(path);
    
  console.log('Generated URL for', path, ':', data.publicUrl);
  return data.publicUrl;
}

// Helper to delete an image
export async function deleteProductImage(path: string): Promise<void> {
  if (!path) throw new Error('No file path provided');
  
  const { error } = await supabase.storage
    .from('product-images')
    .remove([path]);
  
  if (error) throw error;
}

// Helper to check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Session check error:', error.message);
      return false;
    }
    return !!data.session;
  } catch (err) {
    console.error('Authentication check failed:', err);
    return false;
  }
}