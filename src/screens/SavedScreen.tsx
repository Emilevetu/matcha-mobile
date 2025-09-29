import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SavedScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Favoris</Text>
      <Text style={styles.subtitle}>Vos cafés sauvegardés</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fefdfb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7da06b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7A3A',
  },
});

export default SavedScreen;