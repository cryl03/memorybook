import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Image, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, typography, spacing } from '@core/theme';
import { botImage } from '@core/assets/images';

const { height } = Dimensions.get('window');

interface CreatingScreenProps {
  onComplete: () => void;
}

export function CreatingScreen({ onComplete }: CreatingScreenProps) {
  const [progress] = useState(new Animated.Value(0));
  const [statusText, setStatusText] = useState('Organizando tus recuerdos');
  const [pulseAnim] = useState(new Animated.Value(1));

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

    // Pulse animation for the sphere
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();

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
  }, [onComplete, progress, pulseAnim]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFFFFF', '#F0F4F8', '#EDE8E3', '#F2DFD0']}
        locations={[0, 0.4, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Bot sphere */}
      <View style={styles.sphereContainer}>
        <Animated.Image
          source={botImage}
          style={[styles.sphereImage, { transform: [{ scale: pulseAnim }] }]}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>Creando tu historia</Text>
      <Text style={styles.subtitle}>{statusText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  sphereContainer: {
    marginBottom: spacing['4xl'],
  },
  sphereImage: {
    width: 200,
    height: 200,
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
    fontStyle: 'italic',
  },
});
