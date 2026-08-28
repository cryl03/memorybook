import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, typography, spacing } from '@core/theme';
import { botImage } from '@core/assets/images';
import { useAppDispatch, useAppSelector } from '@core/store/hooks';
import { setRemoteAlbumId, setSyncError, mergeRemoteFotos, setPdfUrl } from '@core/store/slices/albumSlice';
import { store } from '@core/store';
import { syncAlbumToApi, getLastSyncAlbumResult } from '@core/api/syncAlbum';
import { getErrorMessage } from '@core/api/errors';
import { ALLOW_GUEST_FLOW } from '@core/api';

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
  const syncStartedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Snapshot once — album identity must NOT re-trigger createAlbum.
  // Refresh if first paint had album without photos yet.
  const albumSnapshotRef = useRef(album);
  if (!albumSnapshotRef.current && album) {
    albumSnapshotRef.current = album;
  } else if (
    album?.photos?.length &&
    !(albumSnapshotRef.current?.photos?.length)
  ) {
    albumSnapshotRef.current = album;
  }

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
      const snapshot = albumSnapshotRef.current;

      Animated.timing(progress, {
        toValue: 1,
        duration: MIN_DISPLAY_MS,
        useNativeDriver: false,
      }).start();

      try {
        const live = store.getState().album.currentAlbum;
        const alreadyRemote = Boolean(live?.remoteId ?? snapshot?.remoteId);
        const photoUris =
          (live?.photos?.length ? live.photos : snapshot?.photos) ?? [];

        console.log('[FOTOS] CreatingScreen', {
          auth: isAuthenticated,
          alreadyRemote,
          snapshotCount: snapshot?.photos?.length ?? 0,
          liveCount: live?.photos?.length ?? 0,
          using: photoUris.length,
          sample: photoUris[0]?.slice(0, 96),
        });

        const prior = getLastSyncAlbumResult();
        if (prior?.album.unique_id && !alreadyRemote) {
          dispatch(setRemoteAlbumId(prior.album.unique_id));
          if (Object.keys(prior.remoteFotos).length > 0) {
            dispatch(mergeRemoteFotos(prior.remoteFotos));
          }
          if (prior.pdfUrl) {
            dispatch(setPdfUrl(prior.pdfUrl));
          }
        } else if (!isAuthenticated && !ALLOW_GUEST_FLOW) {
          dispatch(
            setSyncError('Inicia sesión para crear el álbum en la nube'),
          );
        } else if (
          isAuthenticated &&
          (live || snapshot) &&
          !alreadyRemote &&
          !syncStartedRef.current
        ) {
          syncStartedRef.current = true;
          const result = await syncAlbumToApi({
            title: live?.title || snapshot?.title || 'Mi álbum',
            description: live?.coverText ?? snapshot?.coverText ?? null,
            photoUris,
            story: live?.story ?? snapshot?.story,
            style: live?.style ?? snapshot?.style,
            fotosPorPagina: live?.fotosPorPagina ?? snapshot?.fotosPorPagina,
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
            if (result.pdfUrl) {
              dispatch(setPdfUrl(result.pdfUrl));
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
        onCompleteRef.current();
      }
    };

    void runCreation();

    return () => {
      cancelled = true;
      clearInterval(messageInterval);
    };
    // Intentionally omit `album` — setRemoteAlbumId/mergeRemoteFotos must not re-create
  }, [dispatch, isAuthenticated, progress, pulseAnim]);

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
