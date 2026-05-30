import React, { useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '@core/store/hooks';
import { completeOnboarding } from '@core/store/slices/userSlice';
import {
  setAlbumConfig,
  setPhotos,
  startCreation,
  finishCreation,
} from '@core/store/slices/albumSlice';

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
import { ProfileNavigator } from './ProfileNavigator';

import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const [showSplash, setShowSplash] = useState(true);
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.user);
  const album = useAppSelector(state => state.album);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
        initialRouteName={user.isOnboarded ? 'MainTabs' : 'Presentation'}>
        {/* Onboarding flow */}
        <Stack.Screen name="Presentation">
          {({ navigation }) => (
            <PresentationScreen
              onNext={() => navigation.navigate('OnboardingChat')}
              onLogin={() => {
                // TODO: Navigate to login
              }}
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
              onEdit={() => navigation.navigate('Editor')}
              onBuy={() => navigation.navigate('Checkout')}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Editor">
          {({ navigation }) => (
            <EditorScreen
              albumTitle={album.currentAlbum?.title || 'Verano en la playa'}
              photoCount={album.currentAlbum?.photoCount || 80}
              pageCount={album.currentAlbum?.pageCount || 28}
              onSave={() => navigation.navigate('MainTabs')}
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
              onBack={() => navigation.goBack()}
              onConfirm={() => {
                // TODO: Process payment
                navigation.navigate('MainTabs');
              }}
            />
          )}
        </Stack.Screen>

        {/* Main app */}
        <Stack.Screen name="MainTabs" component={ProfileNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
