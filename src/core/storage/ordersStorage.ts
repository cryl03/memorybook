import AsyncStorage from '@react-native-async-storage/async-storage';

const ORDERS_KEY = '@memora_orders';

export type OrderStatus = 'en_curso' | 'entregado';

export interface LocalOrder {
  id: string;
  title: string;
  createdAt: string;
  estimatedArrival: string;
  price: number;
  status: OrderStatus;
  coverUri?: string | null;
  albumId?: string;
}

export async function loadOrders(): Promise<LocalOrder[]> {
  try {
    const raw = await AsyncStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalOrder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Error loading orders:', error);
    return [];
  }
}

export async function saveOrder(
  order: Omit<LocalOrder, 'id' | 'createdAt'> & { id?: string },
): Promise<LocalOrder> {
  const next: LocalOrder = {
    ...order,
    id: order.id ?? `${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const current = await loadOrders();
  await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify([next, ...current]));
  return next;
}

export async function countOrders(): Promise<number> {
  const orders = await loadOrders();
  return orders.length;
}
