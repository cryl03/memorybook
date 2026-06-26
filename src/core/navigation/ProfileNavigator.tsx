import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '@features/profile/ProfileScreen';
import { OrdersScreen } from '@features/profile/OrdersScreen';
import { ProjectsScreen } from '@features/profile/ProjectsScreen';
import type { ProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

interface ProfileNavigatorProps {
  onEditProject: (projectId: string) => Promise<void>;
  onLogout: () => Promise<void>;
}

export function ProfileNavigator({ onEditProject, onLogout }: ProfileNavigatorProps) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="ProfileHome">
        {({ navigation }) => (
          <ProfileScreen
            onNavigateOrders={() => navigation.navigate('Orders')}
            onNavigateProjects={() => navigation.navigate('Projects')}
            onNavigateAlbums={() => navigation.navigate('Projects')}
            onLogout={onLogout}
            onEditProfile={() => {}}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Orders">
        {({ navigation }) => (
          <OrdersScreen
            onBack={() => navigation.goBack()}
            onReorder={(_orderId: string) => {
              // TODO: Navigate to reorder flow
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Projects">
        {({ navigation }) => (
          <ProjectsScreen
            onBack={() => navigation.goBack()}
            onEdit={onEditProject}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
