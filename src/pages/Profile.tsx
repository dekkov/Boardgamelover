import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Camera, Save, User } from 'lucide-react';
import { toast } from 'sonner';

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, loading, updateProfile } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  // Populate form with current profile data
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setDisplayName(profile.display_name || '');
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  const validateUsername = (value: string): string => {
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Only letters, numbers, and underscores allowed';
    return '';
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setUsernameError(validateUsername(value));
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Please select a JPG, PNG, or WebP image');
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error('Image must be under 2MB');
      return;
    }

    setAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const filePath = `${user!.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Add cache-busting param so the browser fetches the new image
    return `${data.publicUrl}?t=${Date.now()}`;
  };

  const handleSave = async () => {
    const error = validateUsername(username);
    if (error) {
      setUsernameError(error);
      return;
    }

    setSaving(true);
    try {
      let newAvatarUrl = avatarUrl;

      if (avatarFile) {
        newAvatarUrl = await uploadAvatar(avatarFile);
      }

      await updateProfile({
        username,
        display_name: displayName || null as any,
        avatar_url: newAvatarUrl || undefined,
      });

      setAvatarFile(null);
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
        setAvatarPreview(null);
      }
      setAvatarUrl(newAvatarUrl);

      toast.success('Profile updated successfully');
    } catch (err: any) {
      if (err.code === '23505' || err.message?.includes('duplicate')) {
        toast.error('Username is already taken');
      } else {
        toast.error(err.message || 'Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  const displayAvatarUrl = avatarPreview || avatarUrl;
  const initials = (displayName || username || 'U').substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-extrabold text-slate-800 mb-8">Your Profile</h1>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Avatar Section */}
          <div className="p-8 flex flex-col items-center border-b border-slate-100">
            <div className="relative group">
              {displayAvatarUrl ? (
                <img
                  src={displayAvatarUrl}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-slate-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold text-white border-4 border-slate-200">
                  {initials}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all cursor-pointer"
              >
                <Camera size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarSelect}
                className="hidden"
              />
            </div>
            <p className="text-xs text-slate-400 mt-3">Click to change avatar (JPG, PNG, WebP, max 2MB)</p>
          </div>

          {/* Form Fields */}
          <div className="p-8 space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  usernameError ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
                } bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 text-sm text-slate-700 transition-all`}
                placeholder="your_username"
              />
              {usernameError && <p className="text-xs text-red-500">{usernameError}</p>}
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-700 transition-all"
                placeholder="How others see you"
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={user.email || ''}
                readOnly
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-100 text-sm text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-slate-400">Email cannot be changed</p>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving || !!usernameError}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
