import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@core/theme';

interface OrdersScreenProps {
  onBack: () => void;
  onReorder: (orderId: string) => void;
}

interface Order {
  id: string;
  title: string;
  date: string;
  price: number;
  status: 'en_curso' | 'entregado';
}

const MOCK_ORDERS: Order[] = [
  { id: '1', title: 'Verano en la playa', date: '15 de mayo del 2026', price: 300, status: 'en_curso' },
  { id: '2', title: 'Verano en la playa', date: '15 de mayo del 2026', price: 300, status: 'entregado' },
  { id: '3', title: 'Verano en la playa', date: '15 de mayo del 2026', price: 300, status: 'entregado' },
];

export function OrdersScreen({ onBack, onReorder }: OrdersScreenProps) {
  const activeOrders = MOCK_ORDERS.filter(o => o.status === 'en_curso');
  const deliveredOrders = MOCK_ORDERS.filter(o => o.status === 'entregado');

  const renderOrderCard = (order: Order, variant: 'active' | 'delivered') => (
    <TouchableOpacity
      key={order.id}
      style={[styles.orderCard, variant === 'active' && styles.orderCardActive]}
      onPress={() => onReorder(order.id)}>
      <View style={styles.orderThumb} />
      <View style={styles.orderInfo}>
        <Text style={styles.orderTitle}>{order.title}</Text>
        <Text style={styles.orderDate}>llega el {order.date}</Text>
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

      {activeOrders.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>En curso</Text>
          {activeOrders.map(order => renderOrderCard(order, 'active'))}
        </View>
      )}

      {deliveredOrders.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entregados</Text>
          {deliveredOrders.map(order => renderOrderCard(order, 'delivered'))}
        </View>
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
