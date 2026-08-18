import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { icons } from '@core/assets/icons';
import { colors, typography, spacing, borderRadius } from '@core/theme';
import { useAppSelector } from '@core/store/hooks';
import { albumService } from '@core/api';
import { getLocalAlbumSummary } from '@core/storage/localAlbum';
import { APP_VERSION, APP_BUILD } from '@core/config/version';

interface ProfileScreenProps {
  onNavigateOrders: () => void;
  onNavigateProjects: () => void;
  onNavigateAlbums: () => void;
  onCreateNewAlbum: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onEditProfile: () => void;
}

export function ProfileScreen({
  onNavigateOrders,
  onNavigateProjects,
  onNavigateAlbums,
  onCreateNewAlbum,
  onLogin,
  onLogout,
  onEditProfile,
}: ProfileScreenProps) {
  const [notifications, setNotifications] = React.useState(true);
  const [albumCount, setAlbumCount] = useState(0);
  const auth = useAppSelector(state => state.auth);
  const user = useAppSelector(state => state.user);
  const currentAlbum = useAppSelector(state => state.album.currentAlbum);
  const localAlbum = getLocalAlbumSummary(currentAlbum);
  const localAlbumCount = localAlbum ? 1 : 0;

  const displayName = user.name || auth.username || 'Usuario';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const loadStats = useCallback(async () => {
    if (!auth.isAuthenticated) {
      setAlbumCount(localAlbumCount);
      return;
    }

    try {
      const response = await albumService.listAlbums();
      setAlbumCount(response.count);
    } catch {
      setAlbumCount(localAlbumCount);
    }
  }, [auth.isAuthenticated, localAlbumCount]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: onLogout },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
        <TouchableOpacity onPress={onEditProfile}>
          <Text style={styles.editButton}>Editar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.userSection}>
        <Text style={styles.userName}>{displayName}</Text>
        {auth.username ? (
          <Text style={styles.userEmail}>{auth.username}</Text>
        ) : null}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{avatarLetter}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{albumCount}</Text>
            <Text style={styles.statLabel}>
              {auth.isAuthenticated ? 'Álbumes creados' : 'Álbumes en el dispositivo'}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>—</Text>
            <Text style={styles.statLabel}>Compras</Text>
          </View>
        </View>
      </View>

      <View style={styles.menuSection}>
        <TouchableOpacity
          style={styles.createAlbumButton}
          onPress={onCreateNewAlbum}
          accessibilityRole="button"
          accessibilityLabel="Crear nuevo álbum">
          <Text style={styles.createAlbumText}>+ Crear nuevo álbum</Text>
        </TouchableOpacity>
        <MenuItem
          icon="book"
          label="Mis álbumes"
          value={String(albumCount)}
          onPress={onNavigateAlbums}
        />
        <MenuItem
          icon="badge"
          label="Mis compras"
          value="—"
          onPress={onNavigateOrders}
        />
        <MenuItem
          icon="book"
          label="Mis proyectos"
          value={String(albumCount)}
          onPress={onNavigateProjects}
        />
        <View style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Image
              source={icons.check}
              style={{ width: 18, height: 18, tintColor: colors.text.secondary }}
              resizeMode="contain"
            />
            <Text style={styles.menuItemLabel}>Notificaciones</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: colors.border, true: colors.text.primary }}
            thumbColor={colors.surface}
          />
        </View>
        {auth.isAuthenticated ? (
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={styles.menuItemLeft}>
              <Text style={styles.logoutLabel}>Cerrar sesión</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.loginCard} onPress={onLogin}>
            <Text style={styles.loginTitle}>Inicia sesión</Text>
            <Text style={styles.loginSubtitle}>
              Sube tu álbum local a la nube y compra cuando quieras.
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.versionFooter} accessibilityLabel={`Memora Book versión ${APP_VERSION} build ${APP_BUILD}`}>
        <Text style={styles.versionBrand}>Memora Book</Text>
        <Text style={styles.versionText}>
          Versión {APP_VERSION}
          <Text style={styles.versionDot}> · </Text>
          Build {APP_BUILD}
        </Text>
      </View>
    </ScrollView>
  );
}

function MenuItem({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof icons;
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <Image
          source={icons[icon]}
          style={{ width: 18, height: 18, tintColor: colors.text.secondary }}
          resizeMode="contain"
        />
        <Text style={styles.menuItemLabel}>{label}</Text>
      </View>
      <View style={styles.menuItemRight}>
        <Text style={styles.menuItemValue}>{value}</Text>
        <Image
          source={icons['arrow-right']}
          style={{ width: 16, height: 16, tintColor: colors.text.tertiary }}
          resizeMode="contain"
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  editButton: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  userSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  userName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.text.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarText: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statBox: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    minWidth: 100,
  },
  statNumber: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  menuSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.sm,
  },
  createAlbumButton: {
    backgroundColor: colors.text.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  createAlbumText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuItemLabel: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  logoutLabel: {
    fontSize: typography.sizes.md,
    color: colors.error,
  },
  loginCard: {
    marginTop: spacing.lg,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceSecondary,
    gap: spacing.xs,
  },
  loginTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  loginSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: typography.sizes.sm * 1.5,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuItemValue: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  versionFooter: {
    alignItems: 'center',
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['4xl'],
    paddingHorizontal: spacing.xl,
    gap: spacing.xs,
  },
  versionBrand: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.tertiary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  versionText: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
  },
  versionDot: {
    color: colors.border,
  },
});
