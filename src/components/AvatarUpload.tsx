import React, { useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getImageUrl } from '../lib/supabase';
import { Camera } from 'lucide-react';

interface AvatarUploadProps {
  userId: string;
  avatarUrl?: string;
  onUpload: (url: string) => void;
}

export function AvatarUpload({ userId, avatarUrl, onUpload }: AvatarUploadProps) {
  const [avatarError, setAvatarError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.');
        setUploading(false);
        return;
      }
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setError('File size too large. Maximum size is 5MB.');
        setUploading(false);
        return;
      }
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
      if (uploadError) {
        setError(uploadError.message);
        setUploading(false);
        return;
      }
      onUpload(fileName);
    } catch (err: any) {
      setError(err.message || 'An error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative inline-block">
      {(!avatarUrl || avatarError) ? (
  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center text-3xl font-bold text-white border-2 border-yellow-400">
    {userId?.[0]?.toUpperCase() || '?'}
  </div>
) : (
  <img
    src={getImageUrl(avatarUrl)}
    alt="Avatar"
    className="w-20 h-20 rounded-full object-cover border-2 border-yellow-400"
    onError={() => setAvatarError(true)}
  />
) }
      <button
        type="button"
        className="absolute bottom-0 right-0 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full p-2 shadow-lg focus:outline-none"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label="Upload avatar"
      >
        <Camera className="w-5 h-5" />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && (
        <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center rounded-full">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500"></div>
        </div>
      )}
      {error && (
        <div className="absolute left-0 right-0 top-full mt-2 text-xs text-red-600 bg-white p-1 rounded shadow">
          {error}
        </div>
      )}
    </div>
  );
}
