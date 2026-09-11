import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '@core/theme';
import { loadOrders, type LocalOrder } from '@core/storage/ordersStorage';

interface OrdersScreenProps {
  onBack: () => void;
  onReorder: (orderId: string) => void;
}

function formatArrival(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function OrdersScreen({ onBack, onReorder }: OrdersScreenProps) {
  const [orders, setOrders] = useState<LocalOrder[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void loadOrders().then(next => {
        if (!cancelled) setOrders(next);
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const activeOrders = orders.filter(o => o.status === 'en_curso');
  const deliveredOrders = orders.filter(o => o.status === 'entregado');
  const isEmpty = orders.length === 0;

  const renderOrderCard = (order: LocalOrder, variant: 'active' | 'delivered') => (
    <TouchableOpacity
      key={order.id}
      style={[styles.orderCard, variant === 'active' && styles.orderCardActive]}
      onPress={() => onReorder(order.id)}>
      {order.coverUri ? (
        <Image source={{ uri: order.coverUri }} style={styles.orderThumb} resizeMode="cover" />
      ) : (
        <View style={styles.orderThumb} />
      )}
      <View style={styles.orderInfo}>
        <Text style={styles.orderTitle}>{order.title}</Text>
        <Text style={styles.orderDate}>
          {variant === 'active'
            ? `llega el ${formatArrival(order.estimatedArrival)}`
            : `entregado el ${formatArrival(order.estimatedArrival)}`}
        </Text>
      </View>
      <Text style={styles.orderPrice}>${order.price}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Tus pedidos</Text>

      {isEmpty ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>Aún no tienes pedidos</Text>
          <Text style={styles.emptyBody}>
            Cuando compres un álbum, lo vas a ver aquí con el estado de envío.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}>
          {activeOrders.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>En curso</Text>
              {activeOrders.map(order => renderOrderCard(order, 'active'))}
            </View>
          ) : null}

          {deliveredOrders.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Entregados</Text>
              {deliveredOrders.map(order => renderOrderCard(order, 'delivered'))}
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['3xl'],
  },
  backButton: {
    marginBottom: spacing.xl,
  },
  backText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing['2xl'],
  },
  listContent: {
    paddingBottom: spacing['5xl'],
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['6xl'],
  },
  emptyIcon: {
    width: 56,
    height: 72,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyBody: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
  },
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  orderCardActive: {
    backgroundColor: colors.accent.blue,
  },
  orderThumb: {
    width: 40,
    height: 52,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.blue.light,
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  orderInfo: {
    flex: 1,
  },
  orderTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  orderDate: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  orderPrice: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
});
