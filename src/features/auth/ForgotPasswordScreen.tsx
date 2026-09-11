import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@core/theme';
import { Button, KeyboardSafeScreen } from '@shared/components';
import { authService } from '@core/api';
import { getErrorMessage } from '@core/api/errors';
import { isValidEmail } from '@core/api/services/authService';

interface ForgotPasswordScreenProps {
  onBack: () => void;
}

export function ForgotPasswordScreen({ onBack }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    setError(null);

    if (!isValidEmail(trimmed)) {
      setError('Escribe un correo válido');
      return;
    }

    setIsLoading(true);
    try {
      await authService.requestPasswordReset(trimmed);
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo enviar el correo'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardSafeScreen>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Recuperar contraseña</Text>
      <Text style={styles.subtitle}>
        Escribe el correo de tu cuenta. Si está registrado, te enviamos
        instrucciones para restablecerla.
      </Text>

      {sent ? (
        <View style={styles.form}>
          <Text style={styles.success}>
            Si {email.trim()} tiene una cuenta, vas a recibir un correo con los
            siguientes pasos.
          </Text>
          <Button title="Volver al login" onPress={onBack} fullWidth />
        </View>
      ) : (
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
            returnKeyType="go"
            onSubmitEditing={() => void handleSubmit()}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Enviar instrucciones"
            onPress={() => void handleSubmit()}
            loading={isLoading}
            disabled={!email.trim()}
            fullWidth
          />
        </View>
      )}
    </KeyboardSafeScreen>
  );
}

const styles = StyleSheet.create({
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
  success: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
    marginBottom: spacing.md,
  },
});
