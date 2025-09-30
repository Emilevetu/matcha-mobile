import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { supabase } from './supabase';
import { getUploadToken, checkRateLimit } from './uploadApi';
import { uploadToImageKit, TRANSFORMATIONS } from './imagekit';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

// Service principal pour l'upload d'images
export class UploadService {
  
  // Upload d'avatar
  static async uploadAvatar(userId: string): Promise<UploadResult> {
    console.log('📸 Début upload avatar pour user:', userId);
    
    try {
      // 1. Vérifier le rate limiting
      if (!checkRateLimit(userId)) {
        return {
          success: false,
          error: 'Trop de tentatives d\'upload. Veuillez patienter.'
        };
      }
      
      // 2. Sélectionner l'image
      const imageAsset = await this.pickImage('avatar');
      if (!imageAsset) {
        return { success: false, error: 'Aucune image sélectionnée' };
      }
      
      console.log('📷 Image sélectionnée:', {
        uri: imageAsset.uri,
        mimeType: imageAsset.mimeType,
        width: imageAsset.width,
        height: imageAsset.height
      });
      
      // 3. Obtenir le token d'upload
      const tokenData = await getUploadToken({
        type: 'avatar',
        userId
      });
      
      console.log('🔑 Token obtenu:', {
        folder: tokenData.folder,
        maxSize: tokenData.maxSize,
        expire: new Date(tokenData.expire * 1000).toISOString()
      });
      
      // 4. Upload vers ImageKit
      const fileName = `${userId}-${Date.now()}.jpg`;
      const imageUrl = await uploadToImageKit(
        imageAsset,
        tokenData.token,
        tokenData.signature,
        tokenData.folder,
        fileName,
        tokenData.expire
      );
      
      console.log('✅ Upload réussi, URL:', imageUrl);
      
      // 5. Mettre à jour le profil dans Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: imageUrl })
        .eq('user_id', userId);
      
      if (updateError) {
        console.error('❌ Erreur mise à jour profil:', updateError);
        return {
          success: false,
          error: 'Upload réussi mais erreur de mise à jour du profil'
        };
      }
      
      console.log('✅ Profil mis à jour avec succès');
      
      return {
        success: true,
        url: imageUrl
      };
      
    } catch (error) {
      console.error('❌ Erreur upload avatar:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }
  
  // Upload de photo de réaction
  static async uploadReaction(userId: string, placeId: string): Promise<UploadResult> {
    console.log('📸 Début upload réaction pour user:', userId, 'place:', placeId);
    
    try {
      // 1. Vérifier le rate limiting
      if (!checkRateLimit(userId)) {
        return {
          success: false,
          error: 'Trop de tentatives d\'upload. Veuillez patienter.'
        };
      }
      
      // 2. Sélectionner l'image
      const imageAsset = await this.pickImage('reaction');
      if (!imageAsset) {
        return { success: false, error: 'Aucune image sélectionnée' };
      }
      
      console.log('📷 Image sélectionnée:', {
        uri: imageAsset.uri,
        mimeType: imageAsset.mimeType,
        width: imageAsset.width,
        height: imageAsset.height
      });
      
      // 3. Obtenir le token d'upload
      const tokenData = await getUploadToken({
        type: 'reaction',
        userId,
        placeId
      });
      
      console.log('🔑 Token obtenu:', {
        folder: tokenData.folder,
        maxSize: tokenData.maxSize,
        expire: new Date(tokenData.expire * 1000).toISOString()
      });
      
      // 4. Upload vers ImageKit
      const fileName = `${userId}-${Date.now()}.jpg`;
      const imageUrl = await uploadToImageKit(
        imageAsset,
        tokenData.token,
        tokenData.signature,
        tokenData.folder,
        fileName,
        tokenData.expire
      );
      
      console.log('✅ Upload réussi, URL:', imageUrl);
      
      // Note: La photo n'est PAS sauvegardée en DB ici
      // Elle sera sauvegardée seulement quand l'utilisateur clique "Envoyer"
      console.log('📸 Photo uploadée, prête pour l\'envoi');
      
      return {
        success: true,
        url: imageUrl
      };
      
    } catch (error) {
      console.error('❌ Erreur upload réaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }
  
  // Sélectionner une image (galerie ou caméra)
  private static async pickImage(type: 'avatar' | 'reaction' = 'avatar'): Promise<any> {
    console.log('📱 Sélection d\'image...');
    
    // Demander les permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission galerie refusée');
    }
    
    // Qualité différente selon le type
    const quality = type === 'reaction' ? 0.9 : 0.85; // Qualité Instagram pour réactions
    
    // Afficher les options
    return new Promise((resolve, reject) => {
      // Pour l'instant, on utilise directement la galerie
      // Dans une vraie app, on aurait une modal avec les options
      ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: quality,
      }).then(result => {
        if (!result.canceled && result.assets[0]) {
          console.log('✅ Image sélectionnée depuis la galerie');
          resolve(result.assets[0]);
        } else {
          console.log('❌ Sélection d\'image annulée');
          resolve(null);
        }
      }).catch(reject);
    });
  }
  
  // Générer URL avec transformations
  static getOptimizedImageUrl(originalUrl: string, size: keyof typeof TRANSFORMATIONS = 'original'): string {
    if (!originalUrl || !originalUrl.includes('ik.imagekit.io')) {
      return originalUrl; // Retourner l'URL originale si ce n'est pas ImageKit
    }
    
    const transformations = TRANSFORMATIONS[size];
    return `${originalUrl}?tr=${transformations}`;
  }
}
