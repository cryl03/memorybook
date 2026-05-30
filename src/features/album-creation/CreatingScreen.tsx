import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, typography, spacing } from '@core/theme';

interface CreatingScreenProps {
  onComplete: () => void;
}

export function CreatingScreen({ onComplete }: CreatingScreenProps) {
  const [progress] = useState(new Animated.Value(0));
  const [statusText, setStatusText] = useState('Organizando tus recuerdos');

  useEffect(() => {
    const messages = [
      'Organizando tus recuerdos',
      'Eligiendo los mejores momentos',
      'Diseñando tu historia',
      'Añadiendo los toques finales',
    ];

    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      setStatusText(messages[messageIndex]);
    }, 2000);

    // Simulate creation progress
    Animated.timing(progress, {
      toValue: 1,
      duration: 8000,
      useNativeDriver: false,
    }).start(() => {
      clearInterval(messageInterval);
      onComplete();
    });

    return () => clearInterval(messageInterval);
  }, [onComplete, progress]);

  return (
    <View style={styles.container}>
      {/* Animated sphere — placeholder for 3D animation */}
      <View style={styles.sphereContainer}>
        <Animated.View
          style={[
            styles.sphere,
            {
              transform: [
                {
                  scale: progress.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 1.2, 1],
                  }),
                },
              ],
              opacity: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.6, 1],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.sphereGlow,
            {
              opacity: progress.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.2, 0.5, 0.3],
              }),
            },
          ]}
        />
      </View>

      <Text style={styles.title}>Creando tu historia</Text>
      <Text style={styles.subtitle}>{statusText}</Text>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  sphereContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing['4xl'],
  },
  sphere: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.blue.light,
  },
  sphereGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.blue.light,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    marginBottom: spacing['3xl'],
  },
  progressContainer: {
    width: '60%',
    height: 3,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.text.primary,
    borderRadius: 2,
  },
});
