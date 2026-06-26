import React, { useState, useCallback, useEffect } from 'react';
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
  startCreation,
  finishCreation,
  hydrateAlbum,
} from '@core/store/slices/albumSlice';
import { loadSession } from '@core/storage/sessionStorage';
import { hasSavedAlbum } from '@features/editor/storage';
import { loadRemoteAlbumForEditor, saveAlbumToCloud, requestAlbumPdf } from '@core/api';
import { clearSession } from '@core/storage/sessionStorage';
import { logout } from '@core/store/slices/authSlice';
import { resetAlbum } from '@core/store/slices/albumSlice';
import { resetUser } from '@core/store/slices/userSlice';
import { clearAlbumStorage } from '@features/editor/storage';

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

import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

async function resolveInitialRoute(): Promise<keyof RootStackParamList> {
  const [session, savedAlbum] = await Promise.all([loadSession(), hasSavedAlbum()]);

  if (savedAlbum) return 'Editor';
  if (session?.album.currentAlbum && !session.album.isCreating) return 'Wow';
  if (session?.user.isOnboarded) return 'MainTabs';
  return 'Presentation';
}

export function RootNavigator() {
  const [showSplash, setShowSplash] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Presentation');
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.user);
  const album = useAppSelector(state => state.album);

  const handleCloudSave = useCallback(async () => {
    return saveAlbumToCloud(dispatch, () => store.getState());
  }, [dispatch]);

  const handleGeneratePdf = useCallback(async () => {
    return requestAlbumPdf(dispatch, () => store.getState());
  }, [dispatch]);

  const handleLogout = useCallback(async () => {
    dispatch(logout());
    dispatch(resetUser());
    dispatch(resetAlbum());
    await Promise.all([clearSession(), clearAlbumStorage()]);
  }, [dispatch]);

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
        dispatch(hydrateAlbum(session.album));
        if (session.auth) {
          dispatch(hydrateAuth(session.auth));
        }
      }

      const route = await resolveInitialRoute();
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
              onNext={() => navigation.navigate('OnboardingChat')}
              onLogin={() => navigation.navigate('Login')}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Login">
          {({ navigation }) => (
            <LoginScreen
              onBack={() => navigation.goBack()}
              onSuccess={() => navigation.navigate('MainTabs')}
              onRegister={() => navigation.navigate('Register')}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Register">
          {({ navigation }) => (
            <RegisterScreen
              onBack={() => navigation.goBack()}
              onSuccess={() => navigation.navigate('MainTabs')}
              onLogin={() => navigation.navigate('Login')}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="OnboardingChat">
          {({ navigation }) => (
            <OnboardingChatScreen
              onComplete={(answers: OnboardingAnswers) => {
                dispatch(
                  completeOnboarding({
                    name: answers.name,
                    style: answers.style,
                    story: answers.story,
                  }),
                );
                navigation.navigate('PhotoCount');
              }}
            />
          )}
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
              onNext={(photos: string[]) => {
                dispatch(setPhotos(photos));
                dispatch(startCreation());
                navigation.navigate('Creating');
              }}
              onClose={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Creating">
          {({ navigation }) => (
            <CreatingScreen
              onComplete={() => {
                dispatch(finishCreation());
                navigation.navigate('Wow');
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Wow">
          {({ navigation }) => (
            <WowScreen
              albumTitle={album.currentAlbum?.title || 'Verano en la playa'}
              photoCount={album.currentAlbum?.photoCount || 80}
              pageCount={album.currentAlbum?.pageCount || 28}
              hasRemoteAlbum={Boolean(album.currentAlbum?.remoteId)}
              onEdit={() => navigation.navigate('Editor')}
              onBuy={() => navigation.navigate('Checkout')}
              onSave={async () => {
                const saved = await handleCloudSave();
                if (saved) {
                  Alert.alert('Guardado', 'Tu álbum se sincronizó correctamente.');
                }
              }}
              onGeneratePdf={async () => {
                await handleGeneratePdf();
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Editor">
          {({ navigation }) => (
            <EditorScreen
              albumTitle={album.currentAlbum?.title || 'Verano en la playa'}
              photoCount={album.currentAlbum?.photoCount || 80}
              pageCount={album.currentAlbum?.pageCount || 28}
              onSave={async () => {
                const saved = await handleCloudSave();
                if (saved) navigation.navigate('MainTabs');
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
              photoCount={album.currentAlbum?.photoCount || 80}
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
              onEditProject={async (projectId: string) => {
                await loadRemoteAlbumForEditor(projectId, dispatch);
                navigation.navigate('Editor');
              }}
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
  );
}
