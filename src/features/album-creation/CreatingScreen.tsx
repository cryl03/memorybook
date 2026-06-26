import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, typography, spacing } from '@core/theme';
import { botImage } from '@core/assets/images';
import { useAppDispatch, useAppSelector } from '@core/store/hooks';
import { setRemoteAlbumId, setSyncError, mergeRemoteFotos } from '@core/store/slices/albumSlice';
import { syncAlbumToApi } from '@core/api/syncAlbum';
import { getErrorMessage } from '@core/api/errors';

const { height } = Dimensions.get('window');
const MIN_DISPLAY_MS = 4000;

interface CreatingScreenProps {
  onComplete: () => void;
}

export function CreatingScreen({ onComplete }: CreatingScreenProps) {
  const dispatch = useAppDispatch();
  const album = useAppSelector(state => state.album.currentAlbum);
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const [progress] = useState(new Animated.Value(0));
  const [statusText, setStatusText] = useState('Organizando tus recuerdos');
  const [pulseAnim] = useState(new Animated.Value(1));
  const progressValueRef = useRef(0);

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

    let cancelled = false;

    const runCreation = async () => {
      const startedAt = Date.now();

      Animated.timing(progress, {
        toValue: 1,
        duration: MIN_DISPLAY_MS,
        useNativeDriver: false,
      }).start();

      try {
        if (isAuthenticated && album) {
          const result = await syncAlbumToApi({
            title: album.title || 'Mi álbum',
            description: album.story,
            photoUris: album.photos,
            onProgress: (step, value) => {
              if (!cancelled) {
                setStatusText(step);
                const nextValue = Math.max(value, progressValueRef.current);
                progressValueRef.current = nextValue;
                progress.setValue(nextValue);
              }
            },
          });

          if (!cancelled && result.album.unique_id) {
            dispatch(setRemoteAlbumId(result.album.unique_id));
            if (Object.keys(result.remoteFotos).length > 0) {
              dispatch(mergeRemoteFotos(result.remoteFotos));
            }
            dispatch(setSyncError(null));
          }
        }
      } catch (error) {
        if (!cancelled) {
          dispatch(setSyncError(getErrorMessage(error, 'No se pudo sincronizar el álbum')));
        }
      }

      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_DISPLAY_MS) {
        await new Promise<void>(resolve => {
          setTimeout(() => resolve(), MIN_DISPLAY_MS - elapsed);
        });
      }

      if (!cancelled) {
        clearInterval(messageInterval);
        onComplete();
      }
    };

    runCreation();

    return () => {
      cancelled = true;
      clearInterval(messageInterval);
    };
  }, [album, dispatch, isAuthenticated, onComplete, progress, pulseAnim]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFFFFF', '#F0F4F8', '#EDE8E3', '#F2DFD0']}
        locations={[0, 0.4, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

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
