import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '@core/theme';
import { Button } from '@shared/components';
import { useAppDispatch, useAppSelector } from '@core/store/hooks';
import { clearAuthError, registerUser } from '@core/store/slices/authSlice';

interface RegisterScreenProps {
  onSuccess: () => void;
  onBack: () => void;
  onLogin: () => void;
}

export function RegisterScreen({ onSuccess, onBack, onLogin }: RegisterScreenProps) {
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated } = useAppSelector(state => state.auth);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const authHandledRef = useRef(false);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    if (!isAuthenticated) {
      authHandledRef.current = false;
      return;
    }
    if (authHandledRef.current) return;
    authHandledRef.current = true;
    onSuccessRef.current();
  }, [isAuthenticated]);

  const handleRegister = () => {
    setValidationError(null);
    dispatch(clearAuthError());

    if (password !== confirmPassword) {
      setValidationError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 3) {
      setValidationError('La contraseña debe tener al menos 3 caracteres');
      return;
    }

    dispatch(
      registerUser({
        username: username.trim(),
        password,
        email: (email.trim() || username.trim()) || undefined,
      }),
    );
  };

  const displayError = validationError ?? error;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Crear cuenta</Text>
      <Text style={styles.subtitle}>
        Regístrate para guardar tus álbumes y acceder desde cualquier dispositivo.
      </Text>

      <View style={styles.form}>
        <Text style={styles.label}>Usuario</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="tu@email.com"
          placeholderTextColor={colors.text.secondary}
          style={styles.input}
        />

        <Text style={styles.label}>Correo (opcional)</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="tu@email.com"
          placeholderTextColor={colors.text.secondary}
          style={styles.input}
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={colors.text.secondary}
          style={styles.input}
        />

        <Text style={styles.label}>Confirmar contraseña</Text>
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={colors.text.secondary}
          style={styles.input}
        />

        {displayError ? <Text style={styles.error}>{displayError}</Text> : null}

        <Button
          title="Crear cuenta"
          onPress={handleRegister}
          loading={isLoading}
          disabled={!username.trim() || !password || !confirmPassword}
          fullWidth
        />

        <TouchableOpacity onPress={onLogin} style={styles.linkButton}>
          <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['3xl'],
  },
  backButton: {
    marginBottom: spacing.xl,
  },
  backText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
    marginBottom: spacing['2xl'],
  },
  form: {
    gap: spacing.md,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  error: {
    color: colors.error,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.sm,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  linkText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textDecorationLine: 'underline',
  },
});
