import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Image,
} from 'react-native';
import { icons } from '@core/assets/icons';
import { colors, typography, spacing, borderRadius } from '@core/theme';

interface ProfileScreenProps {
  onNavigateOrders: () => void;
  onNavigateProjects: () => void;
  onEditProfile: () => void;
}

export function ProfileScreen({
  onNavigateOrders,
  onNavigateProjects,
  onEditProfile,
}: ProfileScreenProps) {
  const [notifications, setNotifications] = React.useState(true);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
        <TouchableOpacity onPress={onEditProfile}>
          <Text style={styles.editButton}>Editar</Text>
        </TouchableOpacity>
      </View>

      {/* User info */}
      <View style={styles.userSection}>
        <Text style={styles.userName}>Sam Mendoza</Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>S</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Álbumes creados</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Compras</Text>
          </View>
        </View>
      </View>

      {/* Menu items */}
      <View style={styles.menuSection}>
        <MenuItem
          icon="book"
          label="Mis álbumes"
          value="12"
          onPress={() => {}}
        />
        <MenuItem
          icon="badge"
          label="Mis compras"
          value="8"
          onPress={onNavigateOrders}
        />
        <MenuItem
          icon="book"
          label="Mis proyectos"
          value="5"
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
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuItemValue: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
});
