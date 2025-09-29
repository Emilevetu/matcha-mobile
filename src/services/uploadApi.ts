import { supabase } from './supabase';
import { generateUploadToken, UploadTokenRequest } from './imagekit';

// Simuler une API route pour les tokens d'upload
export const getUploadToken = async (request: UploadTokenRequest) => {
  console.log('🔐 Vérification session pour upload token...');
  
  try {
    // Vérifier que l'utilisateur est connecté
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Utilisateur non connecté:', authError);
      throw new Error('Utilisateur non connecté');
    }
    
    console.log('✅ Utilisateur connecté:', user.id);
    
    // Vérifier que l'userId correspond à l'utilisateur connecté
    if (request.userId !== user.id) {
      console.error('❌ userId ne correspond pas à l\'utilisateur connecté');
      throw new Error('Accès non autorisé');
    }
    
    // Générer le token d'upload
    const tokenData = await generateUploadToken(request);
    
    console.log('✅ Token d\'upload généré avec succès');
    return tokenData;
    
  } catch (error) {
    console.error('❌ Erreur génération token:', error);
    throw error;
  }
};

// Rate limiting simple (en mémoire pour le MVP)
const uploadAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export const checkRateLimit = (userId: string): boolean => {
  const now = Date.now();
  const userAttempts = uploadAttempts.get(userId);
  
  if (!userAttempts) {
    uploadAttempts.set(userId, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Reset si la fenêtre est expirée
  if (now - userAttempts.lastAttempt > WINDOW_MS) {
    uploadAttempts.set(userId, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Vérifier la limite
  if (userAttempts.count >= MAX_ATTEMPTS) {
    console.warn(`⚠️ Rate limit atteint pour l'utilisateur ${userId}`);
    return false;
  }
  
  // Incrémenter le compteur
  userAttempts.count++;
  userAttempts.lastAttempt = now;
  return true;
};
