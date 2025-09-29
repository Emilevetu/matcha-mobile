import CryptoJS from 'crypto-js';
import { IMAGEKIT_CONFIG } from '../config';

// Types pour l'upload
export interface UploadTokenRequest {
  type: 'avatar' | 'reaction';
  placeId?: string;
  userId: string;
}

export interface UploadTokenResponse {
  token: string;
  signature: string;
  expire: number;
  publicKey: string;
  urlEndpoint: string;
  folder: string;
  maxSize: number;
  allowedMimeTypes: string[];
}

// Générer un token d'upload sécurisé
export const generateUploadToken = async (request: UploadTokenRequest): Promise<UploadTokenResponse> => {
  console.log('🔑 Génération token ImageKit pour:', request);
  
  const { type, placeId, userId } = request;
  
  // Définir le dossier selon le type
  let folder: string;
  if (type === 'avatar') {
    folder = 'avatars';
  } else if (type === 'reaction' && placeId) {
    folder = `reactions/${placeId}`;
  } else {
    throw new Error('Type invalide ou placeId manquant pour les réactions');
  }
  
  // Configuration de sécurité
  const maxSize = 6 * 1024 * 1024; // 6MB
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png', 
    'image/webp',
    'image/heic'
  ];
  
  // TTL court (2 minutes)
  const expire = Math.floor(Date.now() / 1000) + 120;
  
  // Générer la signature avec crypto-js (compatible React Native)
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const signature = CryptoJS.HmacSHA1(token + expire, IMAGEKIT_CONFIG.privateKey).toString(CryptoJS.enc.Hex);
  
  console.log('✅ Token généré:', {
    folder,
    maxSize,
    expire: new Date(expire * 1000).toISOString(),
    allowedMimeTypes,
    token: token.substring(0, 8) + '...',
    signature: signature.substring(0, 8) + '...'
  });
  
  return {
    token,
    signature,
    expire,
    publicKey: IMAGEKIT_CONFIG.publicKey,
    urlEndpoint: IMAGEKIT_CONFIG.urlEndpoint,
    folder,
    maxSize,
    allowedMimeTypes
  };
};

// Upload direct côté client via API REST ImageKit
export const uploadToImageKit = async (
  file: any,
  token: string,
  signature: string,
  folder: string,
  fileName: string,
  expire: number
): Promise<string> => {
  console.log('📤 Upload vers ImageKit:', { folder, fileName });
  
  try {
    // Créer FormData pour l'upload
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: fileName,
      type: file.mimeType || 'image/jpeg',
    } as any);
    formData.append('fileName', fileName);
    formData.append('folder', folder);
    formData.append('token', token);
    formData.append('signature', signature);
    formData.append('expire', expire.toString());
    formData.append('publicKey', IMAGEKIT_CONFIG.publicKey);
    
    console.log('📋 FormData créé:', {
      fileName,
      folder,
      token: token.substring(0, 8) + '...',
      signature: signature.substring(0, 8) + '...',
      expire: expire, // Nombre UNIX timestamp
      expireISO: new Date(expire * 1000).toISOString(), // Pour debug
      publicKey: IMAGEKIT_CONFIG.publicKey.substring(0, 8) + '...'
    });
    
    // Upload vers ImageKit (URL correcte)
    const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('📡 Réponse ImageKit:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur upload ImageKit:', response.status, errorText);
      throw new Error(`Upload failed: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Upload réussi:', {
      fileId: result.fileId,
      url: result.url,
      name: result.name,
      size: result.size
    });
    
    // Retourner l'URL publique
    return result.url;
    
  } catch (error) {
    console.error('❌ Erreur upload:', error);
    throw error;
  }
};

// Générer URL avec transformations
export const getImageUrl = (fileId: string, transformations?: string): string => {
  const baseUrl = `${IMAGEKIT_CONFIG.urlEndpoint}/${fileId}`;
  return transformations ? `${baseUrl}?tr=${transformations}` : baseUrl;
};

// Transformations prédéfinies
export const TRANSFORMATIONS = {
  avatar: 'w-200,h-200,fo-auto,q-70,f-webp',
  thumbnail: 'w-400,h-300,fo-auto,q-70,f-webp',
  large: 'w-1000,h-800,fo-auto,q-70,f-webp',
  original: 'q-70,f-webp'
} as const;
