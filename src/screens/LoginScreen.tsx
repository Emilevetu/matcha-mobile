import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { UsernameValidator, UsernameValidationResult } from '../services/usernameValidation';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // États pour la validation username
  const [usernameValidation, setUsernameValidation] = useState<UsernameValidationResult>({ isValid: true });
  const [isValidatingUsername, setIsValidatingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  
  const { signIn, signUp } = useAuth();

  // Validation en temps réel du username
  const validateUsername = async (value: string) => {
    if (!value.trim()) {
      setUsernameError(null);
      setUsernameValidation({ isValid: true });
      return;
    }

    setIsValidatingUsername(true);
    setUsernameError(null);

    try {
      const validation = await UsernameValidator.validateComplete(value);
      setUsernameValidation(validation);
      
      if (!validation.isValid) {
        setUsernameError(validation.error || 'Nom d\'utilisateur invalide');
      }
    } catch (error) {
      console.error('❌ Erreur validation username:', error);
      setUsernameError('Erreur lors de la validation');
    } finally {
      setIsValidatingUsername(false);
    }
  };

  // Handler pour le changement de username avec validation
  const handleUsernameChange = (value: string) => {
    // Laisser l'utilisateur taper librement
    setUsername(value);
    
    // Délai pour éviter trop de requêtes
    const timeoutId = setTimeout(() => {
      validateUsername(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (isSignUp && !username.trim()) {
      Alert.alert('Erreur', 'Veuillez choisir un nom d\'utilisateur');
      return;
    }

    if (isSignUp && !usernameValidation.isValid) {
      Alert.alert('Erreur', usernameError || 'Nom d\'utilisateur invalide');
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = isSignUp 
        ? await signUp(email, password, username.trim())
        : await signIn(email, password);

      if (error) {
        console.error('❌ Erreur auth:', error);
        Alert.alert('Erreur', error.message || 'Une erreur est survenue');
      } else if (isSignUp) {
        Alert.alert('Succès', 'Compte créé ! Vérifiez votre email pour confirmer.');
      }
    } catch (error) {
      console.error('❌ Erreur auth:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Matcha</Text>
        <Text style={styles.subtitle}>
          {isSignUp ? 'Créez votre compte' : 'Connectez-vous'}
        </Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          {isSignUp && (
            <View style={styles.usernameContainer}>
              <View style={styles.usernameInputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    usernameError && styles.inputError
                  ]}
                  placeholder="Nom d'utilisateur"
                  value={username}
                  onChangeText={handleUsernameChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {/* Indicateur de validation */}
                <View style={styles.validationIndicator}>
                  {isValidatingUsername ? (
                    <ActivityIndicator size="small" color="#7da06b" />
                  ) : usernameValidation.isValid && username.trim() ? (
                    <Text style={styles.checkIcon}>✓</Text>
                  ) : usernameError ? (
                    <Text style={styles.errorIcon}>✕</Text>
                  ) : null}
                </View>
              </View>
              
              {/* Message d'erreur */}
              {usernameError && (
                <Text style={styles.errorText}>{usernameError}</Text>
              )}
              
              {/* Suggestions si username invalide */}
              {usernameError && username.trim() && (
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsTitle}>Suggestions :</Text>
                  <View style={styles.suggestionsRow}>
                    {UsernameValidator.generateSuggestions(username).map((suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionButton}
                        onPress={() => setUsername(suggestion)}
                      >
                        <Text style={styles.suggestionText}>@{suggestion}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
          
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Chargement...' : (isSignUp ? 'Créer un compte' : 'Se connecter')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text style={styles.switchText}>
              {isSignUp 
                ? 'Déjà un compte ? Se connecter' 
                : 'Pas de compte ? Créer un compte'
              }
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefdfb',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#7da06b',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7A3A',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d4c4a8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    color: '#5a4d3a',
  },
  button: {
    backgroundColor: '#7da06b',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#A8B85C',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    alignItems: 'center',
  },
  switchText: {
    color: '#6B7A3A',
    fontSize: 14,
  },
  // Styles pour la validation username
  usernameContainer: {
    marginBottom: 16,
  },
  usernameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  validationIndicator: {
    position: 'absolute',
    right: 12,
    width: 20,
    alignItems: 'center',
  },
  checkIcon: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorIcon: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputError: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  suggestionsContainer: {
    marginTop: 8,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  suggestionButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 11,
    color: '#7da06b',
    fontWeight: '500',
  },
});

export default LoginScreen;