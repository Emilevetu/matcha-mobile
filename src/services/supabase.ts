import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_CONFIG } from '../config';

// Configuration Supabase pour mobile
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || SUPABASE_CONFIG.url;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_CONFIG.anonKey;

console.log('🔧 Supabase - Configuration:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Types pour la base de données
export interface Place {
  id: string;
  name: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  hours: string | null;
  photos: string | null;
}

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Reaction {
  id: string;
  place_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

// Types pour le système d'amis
export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  updated_at: string;
}

export interface FriendRequest {
  id: string;
  requester_id: string;
  requested_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
}

export interface PlacePhoto {
  id: string;
  user_id: string;
  place_id: string;
  photo_url: string;
  caption?: string;
  created_at: string;
  updated_at: string;
}