// Configuration Supabase pour le développement
export const SUPABASE_CONFIG = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://vsbbylnnhvlqtwvfcmaj.supabase.co',
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzYmJ5bG5uaHZscXR3dmZjbWFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MjAwNTAsImV4cCI6MjA3NDI5NjA1MH0.Jq1A5liK_sDbHiEOdwoBo4UdpupHrQ2Fh2nie5Qu5o4'
};

// Configuration ImageKit
export const IMAGEKIT_CONFIG = {
  publicKey: process.env.EXPO_PUBLIC_IMAGEKIT_PUBLIC_KEY || 'public_sBxF75aTR4Ypm5JeKblR1Y3Fefo=',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || 'private_cd71AVNuSSbonS/LRTtZO2adoY4=',
  urlEndpoint: process.env.EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/n3dxvpvil'
};
