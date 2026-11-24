export type MenuCategory = 'makanan' | 'dessert' | 'minuman' | 'paket_combo';

export type CategoryFilter = 'semua' | MenuCategory;

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  image: string;
  description: string;
  isAvailable: boolean;
}

export type CartMap = Record<string, number>;

export type OrderStatus = 'waiting' | 'processing' | 'finished';

export interface OrderItem {
  menuId: string;
  name: string;
  category: MenuCategory;
  price: number;
  qty: number;
  lineTotal: number;
}

export interface OrderRecord {
  id: string;
  queueNumber: string;
  tableNumber: string;
  items: OrderItem[];
  totalQty: number;
  subtotal: number;
  ppn: number;
  grandTotal: number;
  status: OrderStatus;
  createdAt: number;
  startedAt: number | null;
  finishedAt: number | null;
  durationSeconds: number;
}

export interface ItemRecapRow {
  menuId: string;
  name: string;
  category: MenuCategory;
  qtySold: number;
  revenue: number;
}

export interface DailySummary {
  totalOrders: number;
  waitingCount: number;
  processingCount: number;
  finishedCount: number;
  activeQueueCount: number;
  totalRevenue: number;
  averageCookSeconds: number;
  itemRecap: ItemRecapRow[];
}
