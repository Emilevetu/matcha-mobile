import { supabase } from './supabase';

// Regex Instagram-style : a-z, 0-9, _, ., - uniquement
export const USERNAME_REGEX = /^[a-z0-9._-]{3,30}$/;

// Caractères interdits pour feedback utilisateur
export const FORBIDDEN_CHARS = /[^a-z0-9._-]/g;

export interface UsernameValidationResult {
  isValid: boolean;
  isAvailable?: boolean;
  error?: string;
  suggestions?: string[];
}

export class UsernameValidator {
  /**
   * Valide le format du username (côté client)
   */
  static validateFormat(username: string): { isValid: boolean; error?: string } {
    if (!username) {
      return { isValid: false, error: 'Le nom d\'utilisateur est requis' };
    }

    if (username.length < 3) {
      return { isValid: false, error: 'Le nom d\'utilisateur doit contenir au moins 3 caractères' };
    }

    if (username.length > 30) {
      return { isValid: false, error: 'Le nom d\'utilisateur ne peut pas dépasser 30 caractères' };
    }

    // Vérifier d'abord les caractères interdits
    const forbiddenChars = username.match(FORBIDDEN_CHARS);
    if (forbiddenChars) {
      return { 
        isValid: false, 
        error: `Caractères non autorisés : ${[...new Set(forbiddenChars)].join(', ')}. Utilisez uniquement des lettres minuscules, chiffres, _, . et -` 
      };
    }

    // Vérifications spécifiques Instagram
    if (username.startsWith('.') || username.endsWith('.')) {
      return { isValid: false, error: 'Le nom d\'utilisateur ne peut pas commencer ou finir par un point' };
    }

    if (username.includes('..')) {
      return { isValid: false, error: 'Le nom d\'utilisateur ne peut pas contenir deux points consécutifs' };
    }

    if (username.startsWith('_') || username.endsWith('_')) {
      return { isValid: false, error: 'Le nom d\'utilisateur ne peut pas commencer ou finir par un underscore' };
    }

    if (username.startsWith('-') || username.endsWith('-')) {
      return { isValid: false, error: 'Le nom d\'utilisateur ne peut pas commencer ou finir par un tiret' };
    }

    return { isValid: true };
  }

  /**
   * Vérifie la disponibilité du username (côté serveur)
   */
  static async checkAvailability(username: string, currentUserId?: string): Promise<{ isAvailable: boolean; error?: string }> {
    try {
      console.log('🔍 Vérification disponibilité username:', username);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('username, user_id')
        .eq('username', username)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('❌ Erreur vérification username:', error);
        return { isAvailable: false, error: 'Erreur lors de la vérification' };
      }

      // Si on trouve un profil avec ce username
      if (data) {
        // Si c'est le même utilisateur, c'est OK (modification de son propre profil)
        if (currentUserId && data.user_id === currentUserId) {
          console.log('✅ Username disponible (même utilisateur)');
          return { isAvailable: true };
        }
        
        console.log('❌ Username déjà pris');
        return { isAvailable: false, error: 'Ce nom d\'utilisateur est déjà pris' };
      }

      console.log('✅ Username disponible');
      return { isAvailable: true };

    } catch (error) {
      console.error('❌ Erreur vérification disponibilité:', error);
      return { isAvailable: false, error: 'Erreur lors de la vérification' };
    }
  }

  /**
   * Validation complète (format + disponibilité)
   */
  static async validateComplete(username: string, currentUserId?: string): Promise<UsernameValidationResult> {
    // 1. Validation format
    const formatValidation = this.validateFormat(username);
    if (!formatValidation.isValid) {
      return {
        isValid: false,
        error: formatValidation.error
      };
    }

    // 2. Vérification disponibilité
    const availabilityCheck = await this.checkAvailability(username, currentUserId);
    if (!availabilityCheck.isAvailable) {
      return {
        isValid: false,
        isAvailable: false,
        error: availabilityCheck.error
      };
    }

    return {
      isValid: true,
      isAvailable: true
    };
  }

  /**
   * Génère des suggestions d'usernames alternatifs
   */
  static generateSuggestions(baseUsername: string): string[] {
    const suggestions: string[] = [];
    const cleanBase = baseUsername.toLowerCase().replace(FORBIDDEN_CHARS, '');
    
    // Ajouter des chiffres
    for (let i = 1; i <= 3; i++) {
      suggestions.push(`${cleanBase}${i}`);
    }
    
    // Ajouter des underscores
    suggestions.push(`${cleanBase}_`);
    suggestions.push(`_${cleanBase}`);
    
    // Ajouter des points
    if (!cleanBase.includes('.')) {
      suggestions.push(`${cleanBase}.`);
    }
    
    return suggestions.slice(0, 5); // Max 5 suggestions
  }

  /**
   * Nettoie le username (supprime caractères interdits)
   */
  static sanitizeUsername(username: string): string {
    return username
      .toLowerCase()
      .replace(FORBIDDEN_CHARS, '')
      .replace(/^[._-]+|[._-]+$/g, '') // Supprime ., _ et - au début/fin
      .replace(/\.{2,}/g, '.') // Remplace les points multiples par un seul
      .substring(0, 30); // Limite à 30 caractères
  }
}
