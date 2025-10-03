import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { X } from 'react-native-feather';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Toast } from './Toast';

interface Badge {
  id: number;
  name: string;
  color: string;
}

interface BadgeSelectorProps {
  visible: boolean;
  onClose: () => void;
  placeId: string;
  onBadgeAdded: () => void;
  userBadges?: number[]; // IDs des badges déjà sélectionnés par l'utilisateur
}

export const BadgeSelector: React.FC<BadgeSelectorProps> = ({
  visible,
  onClose,
  placeId,
  onBadgeAdded,
  userBadges = [],
}) => {
  const { user } = useAuth();
  const [selectedBadges, setSelectedBadges] = useState<number[]>(userBadges);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Mettre à jour les badges sélectionnés quand userBadges change
  React.useEffect(() => {
    setSelectedBadges(userBadges);
  }, [userBadges]);

  const handleBadgeToggle = (badgeId: number) => {
    if (selectedBadges.includes(badgeId)) {
      setSelectedBadges(selectedBadges.filter(id => id !== badgeId));
    } else if (selectedBadges.length < 6) {
      setSelectedBadges([...selectedBadges, badgeId]);
    } else {
      setToastMessage('Vous ne pouvez sélectionner que 6 badges maximum');
      setShowToast(true);
    }
  };

  const handleSubmit = async () => {
    if (!user || selectedBadges.length === 0) return;

    setIsSubmitting(true);
    try {
      // Supprimer les anciens badges de l'utilisateur pour ce lieu
      await supabase
        .from('place_badges')
        .delete()
        .eq('place_id', placeId)
        .eq('user_id', user.id);

      // Ajouter les nouveaux badges
      const badgesToInsert = selectedBadges.map(badgeId => ({
        place_id: placeId,
        user_id: user.id,
        badge_id: badgeId,
      }));

      const { error } = await supabase
        .from('place_badges')
        .insert(badgesToInsert);

      if (error) throw error;

      onBadgeAdded();
      onClose();
      setSelectedBadges([]);
    } catch (error) {
      console.error('❌ Erreur ajout badges:', error);
      setToastMessage('Impossible d\'ajouter les badges');
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Ajouter des badges</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.subtitle}>
            Sélectionnez jusqu'à 6 badges pour décrire ce matcha
          </Text>
          
          <View style={styles.badgesGrid}>
            {[
              { id: 1, name: 'Amer', color: '#8B4513' },
              { id: 2, name: 'Peu d\'amertume', color: '#A0522D' },
              { id: 3, name: 'Doux', color: '#D2B48C' },
              { id: 4, name: 'Chargé', color: '#654321' },
              { id: 5, name: 'Léger', color: '#F5DEB3' },
              { id: 6, name: 'Débutant Friendly', color: '#90EE90' },
              { id: 7, name: 'Fruité', color: '#FF6347' },
              { id: 8, name: 'Floral', color: '#FF69B4' },
              { id: 9, name: 'Iodé', color: '#20B2AA' },
              { id: 10, name: 'Umami', color: '#8B4513' },
              { id: 11, name: 'Noyé dans le lait', color: '#F0E68C' },
              { id: 12, name: 'Bien vert', color: '#228B22' },
              { id: 13, name: 'Préparé Minute', color: '#FFD700' },
              { id: 14, name: 'Frais', color: '#00CED1' },
              { id: 15, name: 'Lait Végé', color: '#98FB98' },
              { id: 16, name: 'Option Végé', color: '#90EE90' },
              { id: 17, name: 'Lait d\'amande', color: '#DEB887' },
              { id: 18, name: 'Lait d\'avoine', color: '#F5DEB3' },
              { id: 19, name: 'Sans Lactose', color: '#E0E0E0' },
              { id: 20, name: 'Bio', color: '#32CD32' },
              { id: 21, name: 'Pure', color: '#7da06b' },
              { id: 22, name: 'Claire', color: '#F0F8FF' },
              { id: 23, name: 'Takeaway Friendly', color: '#FFA500' },
              { id: 24, name: 'Ice Break', color: '#7da06b' },
            ].map((badge) => (
              <TouchableOpacity
                key={badge.id}
                style={[
                  styles.badge,
                  { backgroundColor: badge.color },
                  selectedBadges.includes(badge.id) && styles.badgeSelected,
                ]}
                onPress={() => handleBadgeToggle(badge.id)}
              >
                <Text style={styles.badgeText}>{badge.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              selectedBadges.length === 0 && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={selectedBadges.length === 0 || isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Ajout...' : `Ajouter ${selectedBadges.length} badge${selectedBadges.length > 1 ? 's' : ''}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Toast personnalisé */}
      <Toast
        visible={showToast}
        message={toastMessage}
        type="warning"
        onHide={() => setShowToast(false)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  badgeSelected: {
    borderColor: '#7da06b',
    borderWidth: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  submitButton: {
    backgroundColor: '#7da06b',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
