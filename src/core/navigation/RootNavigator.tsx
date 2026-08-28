import React, { useState, useCallback, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Alert } from 'react-native';
import { useAppDispatch, useAppSelector } from '@core/store/hooks';
import { store } from '@core/store';
import { completeOnboarding, hydrateUser } from '@core/store/slices/userSlice';
import { hydrateAuth } from '@core/store/slices/authSlice';
import {
  setAlbumConfig,
  setPhotos,
  appendPhotos,
  startCreation,
  finishCreation,
  repairAlbum,
  resetAlbum,
  ensurePhotoCapacity,
} from '@core/store/slices/albumSlice';
import { resolveAlbumMaxPhotos } from '@core/store/albumUtils';
import { loadSession, saveSession, clearSession } from '@core/storage/sessionStorage';
import { syncPagesWithPhotos, clearAlbumStorage } from '@features/editor/storage';
import { openRemoteAlbumForPreview, saveAlbumToCloud, albumNeedsCloudSync, syncLocalAlbumOnAuth, ALLOW_GUEST_FLOW } from '@core/api';
import { getErrorMessage } from '@core/api/errors';
import { isLocalAlbumId } from '@core/storage/localAlbum';
import { logout } from '@core/store/slices/authSlice';
import { resetUser } from '@core/store/slices/userSlice';

import { SplashScreen } from '@features/splash/SplashScreen';
import { PresentationScreen } from '@features/onboarding/PresentationScreen';
import {
  OnboardingChatScreen,
  OnboardingAnswers,
} from '@features/onboarding/OnboardingChatScreen';
import { PhotoCountScreen } from '@features/album-creation/PhotoCountScreen';
import { PhotoSelectorScreen } from '@features/album-creation/PhotoSelectorScreen';
import { CreatingScreen } from '@features/album-creation/CreatingScreen';
import { WowScreen } from '@features/album-creation/WowScreen';
import { EditorScreen } from '@features/editor/EditorScreen';
import { CheckoutScreen } from '@features/checkout/CheckoutScreen';
import { LoginScreen } from '@features/auth/LoginScreen';
import { RegisterScreen } from '@features/auth/RegisterScreen';
import { ProfileNavigator } from './ProfileNavigator';
import { AlbumSyncOverlay } from '@shared/components';

import type { RootStackParamList } from './types';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator<RootStackParamList>();

function CreatingRoute({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Creating'>) {
  const dispatch = useAppDispatch();
  const handleComplete = useCallback(() => {
    dispatch(finishCreation());
    dispatch(repairAlbum());
    navigation.navigate('Wow');
  }, [dispatch, navigation]);
  return <CreatingScreen onComplete={handleComplete} />;
}

function hasAuthSession(
  session: Awaited<ReturnType<typeof loadSession>>,
): boolean {
  return Boolean(session?.auth?.token && session.auth.isAuthenticated);
}

async function resolveInitialRoute(
  session: Awaited<ReturnType<typeof loadSession>>,
): Promise<keyof RootStackParamList> {
  const signedIn = hasAuthSession(session);

  if (!ALLOW_GUEST_FLOW && !signedIn) {
    return 'Presentation';
  }

  // Never restore local Editor/Wow. Cloud albums open from Mis álbumes.
  if (signedIn || session?.user.isOnboarded) return 'MainTabs';
  return 'Presentation';
}

export function RootNavigator() {
  const [showSplash, setShowSplash] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Presentation');
  const [syncOverlay, setSyncOverlay] = useState({
    visible: false,
    step: 'Preparando...',
    progress: 0,
  });
  const syncInFlightRef = useRef(false);
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.user);
  const album = useAppSelector(state => state.album);

  const updateSyncOverlay = useCallback((step: string, progress: number) => {
    setSyncOverlay(prev => {
      if (prev.visible && prev.step === step && prev.progress === progress) {
        return prev;
      }
      return { visible: true, step, progress };
    });
  }, []);

  const handlePersistAlbum = useCallback(
    async (options?: { showOverlay?: boolean; silentAlert?: boolean }) => {
      const state = store.getState();
      const hasAlbum = Boolean(state.album.currentAlbum);
      if (!hasAlbum) return false;

      const isAuthenticated = state.auth.isAuthenticated;
      const showOverlay = Boolean(options?.showOverlay && isAuthenticated);

      try {
        if (showOverlay) {
          setSyncOverlay({
            visible: true,
            step: 'Guardando en la nube',
            progress: 0,
          });
        }

        const ok = await saveAlbumToCloud(
          dispatch,
          () => store.getState(),
          undefined,
          {
            onProgress: showOverlay ? updateSyncOverlay : undefined,
          },
        );

        if (options?.silentAlert) {
          return isAuthenticated ? ok : true;
        }

        if (!isAuthenticated) {
          if (!ALLOW_GUEST_FLOW) {
            Alert.alert(
              'Inicia sesión',
              'Necesitas una cuenta para guardar el álbum en la nube.',
            );
            return false;
          }
          Alert.alert(
            'Guardado en el dispositivo',
            'Tu álbum quedó guardado aquí. Inicia sesión cuando quieras sincronizarlo a la nube.',
          );
          return true;
        }

        if (ok) {
          Alert.alert('Guardado', 'Tu álbum se sincronizó correctamente.');
          return true;
        }

        return false;
      } finally {
        if (showOverlay) {
          setSyncOverlay({ visible: false, step: '', progress: 0 });
        }
      }
    },
    [dispatch, updateSyncOverlay],
  );

  const handleAuthSuccess = useCallback(
    async (navigation: NativeStackNavigationProp<RootStackParamList>) => {
      if (syncInFlightRef.current) return;
      syncInFlightRef.current = true;

      try {
        if (albumNeedsCloudSync(store.getState()) && ALLOW_GUEST_FLOW) {
          setSyncOverlay({ visible: true, step: 'Preparando sincronización', progress: 0 });

          try {
            await syncLocalAlbumOnAuth(dispatch, () => store.getState(), {
              onProgress: updateSyncOverlay,
            });
            Alert.alert(
              'Álbum sincronizado',
              'Tu álbum local ya está disponible en tu cuenta.',
            );
          } catch (error) {
            Alert.alert(
              'Sincronización pendiente',
              getErrorMessage(
                error,
                'Tu sesión está activa, pero el álbum no se pudo subir. Usa Guardar para reintentar.',
              ),
            );
          } finally {
            setSyncOverlay({ visible: false, step: '', progress: 0 });
          }
        }

        navigation.navigate(
          store.getState().user.isOnboarded ? 'MainTabs' : 'OnboardingChat',
        );
      } finally {
        syncInFlightRef.current = false;
      }
    },
    [dispatch, updateSyncOverlay],
  );

  const handleLogout = useCallback(async () => {
    dispatch(logout());
    dispatch(resetUser());
    dispatch(resetAlbum());
    await Promise.all([clearSession(), clearAlbumStorage()]);
  }, [dispatch]);

  const handleCreateNewAlbum = useCallback(
    (navigation: NativeStackNavigationProp<RootStackParamList>) => {
      if (!ALLOW_GUEST_FLOW && !store.getState().auth.isAuthenticated) {
        navigation.navigate('Login');
        return;
      }

      const startFresh = async () => {
        dispatch(resetAlbum());
        await clearAlbumStorage();
        navigation.push('OnboardingChat', { skipIntro: true });
      };

      const hasAlbum = Boolean(store.getState().album.currentAlbum?.photos.length);
      if (!hasAlbum) {
        void startFresh();
        return;
      }

      Alert.alert(
        'Crear nuevo álbum',
        'Vas a empezar un álbum nuevo. El actual queda guardado en Mis proyectos (si ya lo sincronizaste).',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Crear nuevo', onPress: () => void startFresh() },
        ],
      );
    },
    [dispatch],
  );

  const openAddPhotos = useCallback(
    (
      navigation: NativeStackNavigationProp<RootStackParamList>,
      returnTo: 'Wow' | 'Editor',
    ) => {
      // Unlock legacy albums where maxPhotos == photos.length (e.g. 18/18)
      dispatch(ensurePhotoCapacity());
      const current = store.getState().album.currentAlbum;
      if (!current) return;

      const maxPhotos = resolveAlbumMaxPhotos(current);
      const remaining = maxPhotos - current.photos.length;

      if (remaining <= 0) {
        Alert.alert(
          'Límite del álbum',
          `Elegiste un álbum de ${maxPhotos} fotos y ya están llenas. No puedes agregar más en este paquete.`,
        );
        return;
      }

      navigation.navigate('PhotoSelector', {
        maxPhotos: remaining,
        existingPhotos: current.photos,
        returnTo,
      });
    },
    [dispatch],
  );

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  useEffect(() => {
    if (showSplash) return;

    let cancelled = false;

    async function bootstrap() {
      const session = await loadSession();
      if (session) {
        dispatch(hydrateUser(session.user));
        if (session.auth) {
          dispatch(hydrateAuth(session.auth));
        }
      }

      dispatch(resetAlbum());
      await clearAlbumStorage();
      const { user, album, auth } = store.getState();
      await saveSession({ user, album, auth });
      if (session) {
        session.album = { currentAlbum: null, isCreating: false, syncError: null };
      }

      const route = await resolveInitialRoute(session);
      if (!cancelled) {
        setInitialRoute(route);
        setIsReady(true);
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [showSplash, dispatch]);

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (!isReady) {
    return null;
  }

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
          initialRouteName={initialRoute}>
        {/* Onboarding flow */}
        <Stack.Screen name="Presentation">
          {({ navigation }) => (
            <PresentationScreen
              onNext={() => {
                if (
                  ALLOW_GUEST_FLOW ||
                  store.getState().auth.isAuthenticated
                ) {
                  navigation.navigate('OnboardingChat');
                  return;
                }
                navigation.navigate('Login');
              }}
              onLogin={() => navigation.navigate('Login')}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Login">
          {({ navigation }) => (
            <LoginScreen
              onBack={() => navigation.goBack()}
              onSuccess={() => {
                void handleAuthSuccess(navigation);
              }}
              onRegister={() => navigation.navigate('Register')}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Register">
          {({ navigation }) => (
            <RegisterScreen
              onBack={() => navigation.goBack()}
              onSuccess={() => {
                void handleAuthSuccess(navigation);
              }}
              onLogin={() => navigation.navigate('Login')}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="OnboardingChat">
          {({ navigation, route }) => {
            const skipIntro = Boolean(route.params?.skipIntro);
            return (
              <OnboardingChatScreen
                skipIntro={skipIntro}
                existingName={user.name}
                onBack={skipIntro ? () => navigation.goBack() : undefined}
                onComplete={(answers: OnboardingAnswers) => {
                  dispatch(
                    completeOnboarding({
                      name: answers.name || user.name,
                      style: answers.style,
                      story: answers.story,
                    }),
                  );
                  navigation.navigate('PhotoCount');
                }}
              />
            );
          }}
        </Stack.Screen>

        {/* Album creation flow */}
        <Stack.Screen name="PhotoCount">
          {({ navigation }) => (
            <PhotoCountScreen
              onSelect={(count: number) => {
                dispatch(
                  setAlbumConfig({
                    photoCount: count,
                    style: user.preferences.style,
                    story: user.preferences.story,
                  }),
                );
                navigation.navigate('PhotoSelector', { maxPhotos: count });
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="PhotoSelector">
          {({ navigation, route }) => (
            <PhotoSelectorScreen
              maxPhotos={route.params.maxPhotos}
              existingPhotos={route.params.existingPhotos}
              onNext={async (photos: string[]) => {
                if (route.params.existingPhotos) {
                  dispatch(appendPhotos(photos));
                  const current = store.getState().album.currentAlbum;
                  if (route.params.returnTo === 'Editor' && current) {
                    await syncPagesWithPhotos(current.photos, current.pageCount);
                  }
                  if (route.params.returnTo !== 'Editor' && current?.remoteId) {
                    await handlePersistAlbum({ showOverlay: true });
                  }
                  navigation.navigate(route.params.returnTo ?? 'Wow');
                  return;
                }

                dispatch(setPhotos(photos));
                dispatch(startCreation());
                navigation.navigate('Creating');
              }}
              onClose={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Creating" component={CreatingRoute} />

        <Stack.Screen name="Wow">
          {({ navigation }) => (
            <WowScreen
              albumTitle={album.currentAlbum?.title || 'Verano en la playa'}
              onBack={() => navigation.navigate('MainTabs')}
              onBuy={() => navigation.navigate('Checkout')}
              onAddPhotos={() => openAddPhotos(navigation, 'Wow')}
              onSave={async () => {
                const ok = await handlePersistAlbum({
                  showOverlay: true,
                  silentAlert: true,
                });
                if (ok) {
                  navigation.navigate('MainTabs');
                }
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Editor">
          {({ navigation }) => (
            <EditorScreen
              albumTitle={album.currentAlbum?.title || 'Verano en la playa'}
              photoCount={album.currentAlbum?.photos.length || 0}
              pageCount={album.currentAlbum?.pageCount || 28}
              onAddPhotos={() => openAddPhotos(navigation, 'Editor')}
              onSave={async () => {
                // Local ya flushed en Editor. Ir a perfil ya; sync nube con overlay.
                navigation.navigate('MainTabs');
                await handlePersistAlbum({ showOverlay: true });
              }}
              onBuy={() => navigation.navigate('Checkout')}
              onBack={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Checkout">
          {({ navigation }) => (
            <CheckoutScreen
              albumTitle={album.currentAlbum?.title || 'Verano en la playa'}
              albumDate="15 de mayo del 2026"
              price={300}
              pageCount={album.currentAlbum?.pageCount || 28}
              photoCount={album.currentAlbum?.photos.length || 0}
              remoteAlbumId={album.currentAlbum?.remoteId}
              onBack={() => navigation.goBack()}
              onConfirm={() => navigation.navigate('MainTabs')}
            />
          )}
        </Stack.Screen>

        {/* Main app */}
        <Stack.Screen name="MainTabs">
          {({ navigation }) => (
            <ProfileNavigator
              onEditProject={async (projectId, albumSnapshot) => {
                if (isLocalAlbumId(projectId)) {
                  if (ALLOW_GUEST_FLOW) {
                    navigation.navigate('Editor');
                  }
                  return;
                }
                await openRemoteAlbumForPreview(
                  projectId,
                  dispatch,
                  albumSnapshot,
                );
                navigation.navigate('Wow');
              }}
              onCreateNewAlbum={() => handleCreateNewAlbum(navigation)}
              onLogin={() => navigation.navigate('Login')}
              onLogout={async () => {
                await handleLogout();
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Presentation' }],
                });
              }}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
    <AlbumSyncOverlay
      visible={syncOverlay.visible}
      step={syncOverlay.step}
      progress={syncOverlay.progress}
    />
    </>
  );
}
