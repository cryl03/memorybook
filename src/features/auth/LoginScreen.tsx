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
import { clearAuthError, loginUser } from '@core/store/slices/authSlice';
import { isValidEmail } from '@core/api/services/authService';

interface LoginScreenProps {
  onSuccess: () => void;
  onBack: () => void;
  onRegister: () => void;
  onForgotPassword: () => void;
}

export function LoginScreen({
  onSuccess,
  onBack,
  onRegister,
  onForgotPassword,
}: LoginScreenProps) {
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated } = useAppSelector(state => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleLogin = () => {
    const trimmed = email.trim();
    setValidationError(null);
    dispatch(clearAuthError());

    if (!isValidEmail(trimmed)) {
      setValidationError('Escribe un correo válido');
      return;
    }

    dispatch(loginUser({ username: trimmed, password }));
  };

  const displayError = validationError ?? error;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Iniciar sesión</Text>
      <Text style={styles.subtitle}>
        Entra con tu correo y contraseña. El nombre para saludarte va después.
      </Text>

      <View style={styles.form}>
        <Text style={styles.label}>Correo</Text>
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

        <TouchableOpacity onPress={onForgotPassword} style={styles.forgotButton}>
          <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        {displayError ? <Text style={styles.error}>{displayError}</Text> : null}

        <Button
          title="Entrar"
          onPress={handleLogin}
          loading={isLoading}
          disabled={!email.trim() || !password}
          fullWidth
        />

        <TouchableOpacity onPress={onRegister} style={styles.linkButton}>
          <Text style={styles.linkText}>¿No tienes cuenta? Crear una</Text>
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
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -spacing.sm,
    marginBottom: spacing.xs,
  },
  forgotText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textDecorationLine: 'underline',
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
