import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '@core/theme';
import { Button, GradientBackground } from '@shared/components';

interface OnboardingChatScreenProps {
  onComplete: (answers: OnboardingAnswers) => void;
}

export interface OnboardingAnswers {
  name: string;
  story: string;
  style: string;
}

type Step = 'name' | 'intro' | 'story' | 'style';

const STYLES = [
  { id: 'sutil', label: 'Sutil', color: colors.cream },
  { id: 'moderno', label: 'Moderno', color: colors.slate.light },
  { id: 'expresivo', label: 'Expresivo', color: colors.warm.medium },
  { id: 'clasico', label: 'Clásico', color: colors.blue.light },
  { id: 'divertido', label: 'Divertido', color: colors.accent.peach },
  { id: 'artistico', label: 'Artístico', color: colors.slate.dark },
];

export function OnboardingChatScreen({ onComplete }: OnboardingChatScreenProps) {
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [story, setStory] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');

  const handleNameSubmit = () => {
    if (name.trim()) {
      setStep('intro');
    }
  };

  const handleIntroNext = () => {
    setStep('story');
  };

  const handleStorySubmit = () => {
    if (story.trim()) {
      setStep('style');
    }
  };

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId);
  };

  const handleComplete = () => {
    onComplete({ name, story, style: selectedStyle });
  };

  const renderNameStep = () => (
    <View style={styles.stepContainer}>
      {/* Sphere visual element */}
      <View style={styles.sphereContainer}>
        <View style={styles.sphere} />
      </View>

      <Text style={styles.title}>Para crear algo{'\n'}hecho para ti</Text>
      <Text style={styles.subtitle}>¿Cómo prefieres que te llame?</Text>

      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Sam"
        placeholderTextColor={colors.text.tertiary}
        autoFocus
      />

      <View style={styles.buttonContainer}>
        <Button title="Continuar" onPress={handleNameSubmit} disabled={!name.trim()} />
      </View>
    </View>
  );

  const renderIntroStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.sphereContainer}>
        <View style={styles.sphere} />
      </View>

      <Text style={styles.title}>¡Hola! Soy Memora</Text>
      <Text style={styles.body}>
        Me gustaría saber un poco sobre ti{'\n'}para crear álbumes que realmente{'\n'}
        cuenten tu historia.
      </Text>

      <View style={styles.buttonContainer}>
        <Button title="Continuar" onPress={handleIntroNext} />
      </View>
    </View>
  );

  const renderStoryStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.sphereContainer}>
        <View style={styles.sphere} />
      </View>

      <Text style={styles.title}>
        ¡Hey {name}! ¿Qué historia{'\n'}quieres comenzar?
      </Text>

      <View style={styles.chipRow}>
        {['Viaje', 'Familia', 'Pareja', 'Amigos', 'Mascota'].map(option => (
          <ChipButton
            key={option}
            label={option}
            selected={story === option}
            onPress={() => setStory(option)}
          />
        ))}
      </View>

      <TextInput
        style={styles.input}
        value={story !== 'Viaje' && story !== 'Familia' && story !== 'Pareja' && story !== 'Amigos' && story !== 'Mascota' ? story : ''}
        onChangeText={setStory}
        placeholder="O escribe tu propia historia..."
        placeholderTextColor={colors.text.tertiary}
      />

      <View style={styles.buttonContainer}>
        <Button title="Continuar" onPress={handleStorySubmit} disabled={!story.trim()} />
      </View>
    </View>
  );

  const renderStyleStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.sphereContainer}>
        <View style={styles.sphere} />
      </View>

      <Text style={styles.title}>¿Qué estilo va más{'\n'}contigo?</Text>

      <View style={styles.styleGrid}>
        {STYLES.map(s => (
          <StyleCard
            key={s.id}
            label={s.label}
            color={s.color}
            selected={selectedStyle === s.id}
            onPress={() => handleStyleSelect(s.id)}
          />
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Continuar"
          onPress={handleComplete}
          disabled={!selectedStyle}
        />
      </View>
    </View>
  );

  return (
    <GradientBackground variant="warm">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {step === 'name' && renderNameStep()}
          {step === 'intro' && renderIntroStep()}
          {step === 'story' && renderStoryStep()}
          {step === 'style' && renderStyleStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

// Sub-components

function ChipButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <View style={[styles.chip, selected && styles.chipSelected]}>
      <Text
        style={[styles.chipText, selected && styles.chipTextSelected]}
        onPress={onPress}>
        {label}
      </Text>
    </View>
  );
}

function StyleCard({
  label,
  color,
  selected,
  onPress,
}: {
  label: string;
  color: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <View
      style={[styles.styleCard, { backgroundColor: color }, selected && styles.styleCardSelected]}
      onTouchEnd={onPress}>
      <Text style={styles.styleCardLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
    paddingVertical: spacing['4xl'],
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  sphereContainer: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  sphere: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.blue.light,
    opacity: 0.8,
    // In production, replace with an animated 3D sphere or Lottie
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    lineHeight: typography.sizes['3xl'] * typography.lineHeights.tight,
    marginBottom: spacing.lg,
  },
  subtitle: {
    fontSize: typography.sizes.lg,
    color: colors.text.secondary,
    marginBottom: spacing['2xl'],
  },
  body: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
    marginBottom: spacing['2xl'],
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    paddingVertical: spacing.md,
    marginBottom: spacing['2xl'],
  },
  buttonContainer: {
    marginTop: spacing['2xl'],
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.text.primary,
    borderColor: colors.text.primary,
  },
  chipText: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  chipTextSelected: {
    color: colors.text.inverse,
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  styleCard: {
    width: '30%',
    aspectRatio: 0.75,
    borderRadius: borderRadius.md,
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  styleCardSelected: {
    borderWidth: 2,
    borderColor: colors.text.primary,
  },
  styleCardLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
});
