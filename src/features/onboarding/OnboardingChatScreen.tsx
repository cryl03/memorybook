import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import { colors, typography, spacing, borderRadius } from '@core/theme';
import { Button } from '@shared/components';
import { botImage, onboardingNameBg } from '@core/assets/images';
import { useAppSelector } from '@core/store/hooks';
import { albumService, getErrorMessage } from '@core/api';
import type { StyleSelectorOption } from '@core/api';

const { width, height } = Dimensions.get('window');

interface OnboardingChatScreenProps {
  onComplete: (answers: OnboardingAnswers) => void;
  /** From "Crear nuevo álbum": skip intro + name, start at story/tone. */
  skipIntro?: boolean;
  existingName?: string;
  onBack?: () => void;
}

export interface OnboardingAnswers {
  name: string;
  story: string;
  style: string;
}

type Step = 'intro' | 'name' | 'story' | 'storyResponse' | 'style' | 'styleResponse';

interface ToneOption extends StyleSelectorOption {
  color: string;
}

const FALLBACK_STORY_OPTIONS: StyleSelectorOption[] = [
  { id: 'viaje', label: 'Viaje' },
  { id: 'familia', label: 'Familia' },
  { id: 'pareja', label: 'Pareja' },
  { id: 'amigos', label: 'Amigos' },
  { id: 'mascota', label: 'Mascota' },
];

const TONE_COLORS: Record<string, string> = {
  sutil: '#C8D8E8',
  elegante: '#3D2B1F',
  espontaneo: '#F5820D',
  clasico: '#D4A5A5',
};
const DEFAULT_TONE_COLOR = '#C8D8E8';

const FALLBACK_TONE_OPTIONS: ToneOption[] = [
  { id: 'sutil', label: 'Sútil', color: TONE_COLORS.sutil },
  { id: 'elegante', label: 'Elegante', color: TONE_COLORS.elegante },
  { id: 'espontaneo', label: 'Espontáneo', color: TONE_COLORS.espontaneo },
  { id: 'clasico', label: 'Clásico', color: TONE_COLORS.clasico },
];

const STORY_RESPONSES: Record<string, string> = {
  viaje: '¡Los viajes suelen guardar algunos\nde los momentos más inolvidables!',
  familia: '¡La familia es el corazón de las\nmejores historias!',
  pareja: '¡Qué bonito guardar los momentos\njuntos para siempre!',
  amigos: '¡Los amigos hacen que cada\nmomento sea especial!',
  mascota: '¡Las mascotas nos regalan los\nmomentos más tiernos!',
  cotidianos: '¡Los momentos cotidianos merecen\nun lugar especial!',
  special: '¡Algo especial se merece un\nálbum inolvidable!',
};

const STYLE_RESPONSES: Record<string, string> = {
  sutil: 'Me encanta tu idea, ¡Sí que vamos\na divertirnos!',
  elegante: '¡Elegante! Vamos a crear algo\nmuy sofisticado.',
  espontaneo: 'Me encanta tu idea, ¡Sí que vamos\na divertirnos!',
  clasico: '¡Clásico y atemporal! Me encanta\nesa elección.',
};

function withToneColor(option: StyleSelectorOption): ToneOption {
  return {
    ...option,
    color: TONE_COLORS[option.id] ?? DEFAULT_TONE_COLOR,
  };
}

export function OnboardingChatScreen({
  onComplete,
  skipIntro = false,
  existingName = '',
  onBack,
}: OnboardingChatScreenProps) {
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const startAtStory = skipIntro || isAuthenticated;
  const [step, setStep] = useState<Step>(startAtStory ? 'story' : 'intro');
  const [name, setName] = useState(existingName);
  const [story, setStory] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [showTyping, setShowTyping] = useState(false);
  const [showStoryResponse, setShowStoryResponse] = useState(false);
  const [showStyleResponse, setShowStyleResponse] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(isAuthenticated);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [storyQuestion, setStoryQuestion] = useState('');
  const [toneQuestion, setToneQuestion] = useState(
    isAuthenticated ? '' : '¿Qué estilo va más\ncontigo?',
  );
  const [storyOptions, setStoryOptions] = useState<StyleSelectorOption[]>(
    isAuthenticated ? [] : FALLBACK_STORY_OPTIONS,
  );
  const [toneOptions, setToneOptions] = useState<ToneOption[]>(
    isAuthenticated ? [] : FALLBACK_TONE_OPTIONS,
  );

  const loadQuestions = useCallback(async () => {
    if (!isAuthenticated) {
      setStoryOptions(FALLBACK_STORY_OPTIONS);
      setToneOptions(FALLBACK_TONE_OPTIONS);
      setToneQuestion('¿Qué estilo va más\ncontigo?');
      setQuestionsError(null);
      setLoadingQuestions(false);
      return;
    }

    setLoadingQuestions(true);
    setQuestionsError(null);

    try {
      const response = await albumService.getStyleSelector();
      const storyQ = response.questions.find(q => q.id === 'story');
      const toneQ = response.questions.find(q => q.id === 'tone');
      if (!storyQ?.options.length || !toneQ?.options.length) {
        throw new Error('El cuestionario llegó incompleto');
      }
      setStoryQuestion(storyQ.question);
      setStoryOptions(storyQ.options);
      setToneQuestion(toneQ.question);
      setToneOptions(toneQ.options.map(withToneColor));
    } catch (error) {
      setStoryQuestion('');
      setToneQuestion('');
      setStoryOptions([]);
      setToneOptions([]);
      setQuestionsError(
        getErrorMessage(error, 'No se pudieron cargar las preguntas'),
      );
    } finally {
      setLoadingQuestions(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  const handleNameSubmit = () => {
    if (name.trim()) {
      setStep('story');
    }
  };

  const handleIntroNext = () => {
    setStep('name');
  };

  const handleStorySelect = (option: StyleSelectorOption) => {
    setStory(option.id);
    setShowTyping(true);
    setTimeout(() => {
      setShowTyping(false);
      setShowStoryResponse(true);
    }, 1500);
  };

  const handleStoryNext = () => {
    setStep('style');
  };

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId);
    setShowTyping(true);
    setTimeout(() => {
      setShowTyping(false);
      setShowStyleResponse(true);
    }, 1500);
  };

  const handleComplete = () => {
    onComplete({ name: name.trim() || existingName, story, style: selectedStyle });
  };

  const storyLabel =
    storyOptions.find(option => option.id === story)?.label ?? story;
  const styleLabel =
    toneOptions.find(option => option.id === selectedStyle)?.label ??
    selectedStyle;
  const storyTitle = isAuthenticated
    ? storyQuestion.trim()
    : storyQuestion.trim() || `¡Hey ${name}!, ¿Qué historia\nquieres comenzar?`;

  const renderIntroStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.topSection}>
        <View style={styles.sphereContainer}>
          <Image source={botImage} style={styles.sphereImage} resizeMode="contain" />
        </View>

        <Text style={styles.titleCenter}>¡Hola! Soy Memora</Text>
        <Text style={styles.bodyCenter}>
          Me gustaría saber un poco sobre ti{'\n'}para crear álbumes que realmente
          {'\n'}cuenten tu historia.
        </Text>
      </View>

      <View style={styles.bottomButton}>
        <Button title="Continuar" onPress={handleIntroNext} />
      </View>
    </View>
  );

  const renderNameStepBackground = () => (
    <Image
      source={onboardingNameBg}
      style={styles.nameBgFull}
      resizeMode="contain"
    />
  );

  const renderNameStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.nameTopSection}>
        <Text style={styles.titleLeft}>Para crear algo{'\n'}hecho para ti</Text>
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>¿Cómo prefieres que te llame?</Text>
        <View style={styles.inputPill}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Sam"
            placeholderTextColor="rgba(26, 26, 26, 0.45)"
            autoFocus
          />
        </View>
      </View>

      <View style={styles.bottomButton}>
        <Button
          title="Continuar"
          onPress={handleNameSubmit}
          disabled={!name.trim()}
          style={styles.continueButton}
          textStyle={styles.continueButtonText}
        />
      </View>
    </View>
  );

  const renderStoryStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.topSection}>
        <View style={styles.sphereContainer}>
          <Image source={botImage} style={styles.sphereImage} resizeMode="contain" />
        </View>

        <Text style={styles.titleCenter}>{storyTitle}</Text>
      </View>

      <View style={styles.chatSection}>
        {loadingQuestions && !story ? (
          <ActivityIndicator color={colors.text.primary} />
        ) : questionsError && !story ? (
          <View style={styles.errorBlock}>
            <Text style={styles.errorText}>{questionsError}</Text>
            <Button title="Reintentar" onPress={() => void loadQuestions()} />
          </View>
        ) : story ? (
          <Animated.View entering={FadeInUp.duration(300)} style={styles.userBubble}>
            <Text style={styles.userBubbleText}>{storyLabel}</Text>
          </Animated.View>
        ) : (
          <View style={styles.chipsRow}>
            {storyOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={styles.chip}
                onPress={() => handleStorySelect(option)}>
                <Text style={styles.chipText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Typing indicator */}
        {showTyping && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.typingContainer}>
            <Text style={styles.typingDots}>•••</Text>
          </Animated.View>
        )}

        {/* Memora response */}
        {showStoryResponse && story && (
          <Animated.View entering={FadeInUp.duration(400)} style={styles.memoraResponse}>
            <Text style={styles.memoraResponseText}>
              {STORY_RESPONSES[story] || '¡Genial! Vamos a crear algo increíble.'}
            </Text>
          </Animated.View>
        )}
      </View>

      {showStoryResponse && (
        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.bottomButton}>
          <Button title="Continuar" onPress={handleStoryNext} />
        </Animated.View>
      )}
    </View>
  );

  const renderStyleStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.topSection}>
        <View style={styles.sphereContainer}>
          <Image source={botImage} style={styles.sphereImage} resizeMode="contain" />
        </View>

        <Text style={styles.titleCenter}>{toneQuestion}</Text>
      </View>

      {loadingQuestions && !selectedStyle ? (
        <View style={styles.styleStatus}>
          <ActivityIndicator color={colors.text.primary} />
        </View>
      ) : questionsError && !selectedStyle ? (
        <View style={styles.errorBlock}>
          <Text style={styles.errorText}>{questionsError}</Text>
          <Button title="Reintentar" onPress={() => void loadQuestions()} />
        </View>
      ) : !selectedStyle ? (
        <View style={styles.styleGrid}>
          {toneOptions.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[styles.styleCard, { backgroundColor: s.color }]}
              onPress={() => handleStyleSelect(s.id)}
              activeOpacity={0.8}>
              {/* Album cover placeholder */}
              <View style={styles.styleCardCover}>
                <View style={styles.styleCardPhoto} />
                <Text style={styles.styleCardQuote}>
                  "si no es de ti hacer...{'\n'}café es poder"
                </Text>
              </View>
              <Text style={styles.styleCardLabel}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.chatSection}>
          {/* User selected style */}
          <Animated.View entering={FadeInUp.duration(300)} style={styles.userBubble}>
            <Text style={styles.userBubbleText}>{styleLabel}</Text>
          </Animated.View>

          {/* Typing indicator */}
          {showTyping && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.typingContainer}>
              <Text style={styles.typingDots}>•••</Text>
            </Animated.View>
          )}

          {/* Memora response */}
          {showStyleResponse && (
            <Animated.View entering={FadeInUp.duration(400)} style={styles.memoraResponse}>
              <Text style={styles.memoraResponseText}>
                {STYLE_RESPONSES[selectedStyle] || 'Me encanta tu elección!'}
              </Text>
            </Animated.View>
          )}
        </View>
      )}

      {showStyleResponse && (
        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.bottomButton}>
          <Button title="Continuar" onPress={handleComplete} />
        </Animated.View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {step === 'name' ? (
        renderNameStepBackground()
      ) : (
        <LinearGradient
          colors={['#FFFFFF', '#F0F4F8', '#EDE8E3', '#F2DFD0']}
          locations={[0, 0.4, 0.7, 1]}
          style={StyleSheet.absoluteFill}
        />
      )}
      {skipIntro && onBack ? (
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Volver">
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
      ) : null}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive">
          {step === 'intro' && renderIntroStep()}
          {step === 'name' && renderNameStep()}
          {step === 'story' && renderStoryStep()}
          {step === 'style' && renderStyleStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  flex: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: spacing['3xl'],
    left: spacing.xl,
    zIndex: 2,
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
  },
  backText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  stepContainer: {
    flex: 1,
    minHeight: height,
    justifyContent: 'space-between',
    paddingBottom: spacing['3xl'],
  },
  topSection: {
    alignItems: 'center',
    paddingTop: height * 0.12,
  },

  // Sphere
  sphereContainer: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  sphereImage: {
    width: 120,
    height: 120,
  },

  // Name step background
  nameBgFull: {
    ...StyleSheet.absoluteFillObject,
    width,
    height,
  },
  nameTopSection: {
    paddingTop: height * 0.12,
    paddingHorizontal: spacing['3xl'],
    zIndex: 1,
  },

  // Titles
  titleCenter: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    lineHeight: typography.sizes['3xl'] * typography.lineHeights.tight,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing['3xl'],
  },
  titleLeft: {
    fontSize: 34,
    fontWeight: typography.weights.regular,
    color: colors.text.primary,
    lineHeight: 34 * 1.25,
    alignSelf: 'flex-start',
    letterSpacing: -0.3,
  },
  bodyCenter: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
    textAlign: 'center',
  },

  // Input section (name step)
  inputSection: {
    paddingHorizontal: spacing['3xl'],
    marginTop: 'auto',
    marginBottom: spacing['3xl'],
    zIndex: 1,
  },
  inputLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.regular,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  inputPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    overflow: 'hidden',
  },
  input: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    padding: 0,
  },

  // Chat section
  chatSection: {
    flex: 1,
    paddingHorizontal: spacing['3xl'],
    justifyContent: 'flex-end',
    paddingBottom: spacing.xl,
  },
  errorBlock: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  errorText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  styleStatus: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Chips
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-start',
  },
  chip: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  chipText: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
  },

  // User bubble
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  userBubbleText: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
  },

  // Typing
  typingContainer: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  typingDots: {
    fontSize: typography.sizes['2xl'],
    color: colors.text.primary,
    letterSpacing: 2,
  },

  // Memora response
  memoraResponse: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  memoraResponseText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },

  // Style grid
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing['2xl'],
    gap: spacing.lg,
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  styleCard: {
    width: (width - spacing['2xl'] * 2 - spacing.lg) / 2,
    aspectRatio: 0.8,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  styleCardCover: {
    width: '70%',
    aspectRatio: 0.75,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    padding: spacing.sm,
  },
  styleCardPhoto: {
    width: '60%',
    aspectRatio: 1.3,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: borderRadius.xs,
    marginBottom: spacing.xs,
  },
  styleCardQuote: {
    fontSize: 6,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  styleCardLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // Bottom button
  bottomButton: {
    paddingHorizontal: spacing['3xl'],
    paddingBottom: spacing['3xl'],
    zIndex: 1,
  },
  continueButton: {
    borderRadius: borderRadius.full,
    height: 56,
  },
  continueButtonText: {
    fontWeight: typography.weights.medium,
    fontSize: typography.sizes.md,
  },
});
