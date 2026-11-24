import type {
  CartMap,
  DailySummary,
  ItemRecapRow,
  MenuItem,
  OrderItem,
  OrderRecord,
} from '../types/kiosk';

export const PPN_RATE = 0.11;

export function formatRupiah(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `Rp ${safe.toLocaleString('id-ID')}`;
}

export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatTimeClock(timestamp: number): string {
  const d = new Date(timestamp);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export interface CartCalculation {
  items: OrderItem[];
  totalQty: number;
  subtotal: number;
  ppn: number;
  grandTotal: number;
}

export function calculateCartTotals(
  cart: CartMap,
  menuItems: MenuItem[]
): CartCalculation {
  const itemMap = new Map(menuItems.map((m) => [m.id, m]));
  const items: OrderItem[] = [];
  let totalQty = 0;
  let subtotal = 0;

  for (const [menuId, rawQty] of Object.entries(cart)) {
    const qty = Math.floor(rawQty);
    if (qty <= 0) continue;
    const menu = itemMap.get(menuId);
    if (!menu || !menu.isAvailable) continue;

    const lineTotal = menu.price * qty;
    items.push({
      menuId: menu.id,
      name: menu.name,
      category: menu.category,
      price: menu.price,
      qty,
      lineTotal,
    });
    totalQty += qty;
    subtotal += lineTotal;
  }

  const ppn = Math.round(subtotal * PPN_RATE);
  const grandTotal = subtotal + ppn;

  return {
    items,
    totalQty,
    subtotal,
    ppn,
    grandTotal,
  };
}

export function generateQueueNumber(existingOrders: OrderRecord[]): string {
  let maxSeq = 0;
  for (const order of existingOrders) {
    const match = /^A-(\d+)$/.exec(order.queueNumber);
    if (match) {
      const seq = Number.parseInt(match[1], 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  }
  const nextSeq = maxSeq + 1;
  return `A-${String(nextSeq).padStart(3, '0')}`;
}

export function normalizeTableNumber(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, 16);
}

export function validateTableNumber(raw: string): string | null {
  const normalized = normalizeTableNumber(raw);
  if (!normalized) {
    return 'Nomor meja wajib diisi (contoh: 05 atau A2).';
  }
  return null;
}

export function createOrderFromCart(
  cart: CartMap,
  menuItems: MenuItem[],
  existingOrders: OrderRecord[],
  tableNumber: string,
  nowMs: number = Date.now()
): OrderRecord | null {
  const calc = calculateCartTotals(cart, menuItems);
  if (calc.items.length === 0) return null;
  const normalizedTable = normalizeTableNumber(tableNumber);
  if (!normalizedTable) return null;

  const queueNumber = generateQueueNumber(existingOrders);
  return {
    id: `ord-${nowMs}-${queueNumber.toLowerCase()}`,
    queueNumber,
    tableNumber: normalizedTable,
    items: calc.items,
    totalQty: calc.totalQty,
    subtotal: calc.subtotal,
    ppn: calc.ppn,
    grandTotal: calc.grandTotal,
    status: 'waiting',
    createdAt: nowMs,
    startedAt: null,
    finishedAt: null,
    durationSeconds: 0,
  };
}

export function startOrderProcessing(
  order: OrderRecord,
  nowMs: number = Date.now()
): OrderRecord {
  if (order.status !== 'waiting') return order;
  return {
    ...order,
    status: 'processing',
    startedAt: nowMs,
    finishedAt: null,
    durationSeconds: 0,
  };
}

export function finishOrderProcessing(
  order: OrderRecord,
  nowMs: number = Date.now()
): OrderRecord {
  if (order.status === 'finished') return order;
  const startRef = order.startedAt ?? order.createdAt;
  const elapsed = Math.max(0, Math.floor((nowMs - startRef) / 1000));
  return {
    ...order,
    status: 'finished',
    startedAt: startRef,
    finishedAt: nowMs,
    durationSeconds: elapsed,
  };
}

export function getElapsedSeconds(order: OrderRecord, nowMs: number): number {
  if (order.status === 'waiting') return 0;
  if (order.status === 'finished') return order.durationSeconds;
  if (order.startedAt === null) return 0;
  return Math.max(0, Math.floor((nowMs - order.startedAt) / 1000));
}

export function toggleMenuStock(
  menuItems: MenuItem[],
  itemId: string
): MenuItem[] {
  return menuItems.map((item) =>
    item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item
  );
}

export interface MenuDraft {
  name: string;
  category: MenuItem['category'];
  price: number;
  image: string;
  description: string;
  isAvailable: boolean;
}

export interface MenuValidationErrors {
  name?: string;
  price?: string;
  description?: string;
}

export function validateMenuDraft(draft: {
  name: string;
  price: number;
  description: string;
}): MenuValidationErrors {
  const errors: MenuValidationErrors = {};
  const trimmedName = draft.name.trim();
  if (trimmedName.length < 2) {
    errors.name = 'Nama menu wajib diisi minimal 2 karakter.';
  }
  if (!Number.isFinite(draft.price) || draft.price < 1000) {
    errors.price = 'Harga menu wajib diisi minimal Rp 1.000.';
  }
  if (draft.description.trim().length > 220) {
    errors.description = 'Deskripsi maksimal 220 karakter.';
  }
  return errors;
}

const CATEGORY_ID_PREFIX: Record<MenuItem['category'], string> = {
  makanan: 'mkn',
  dessert: 'dst',
  minuman: 'mnm',
  paket_combo: 'cmb',
};

export function addMenuItem(
  menuItems: MenuItem[],
  draft: MenuDraft,
  nowMs: number = Date.now()
): MenuItem[] {
  const prefix = CATEGORY_ID_PREFIX[draft.category];
  const newItem: MenuItem = {
    id: `${prefix}-${nowMs}`,
    name: draft.name.trim(),
    category: draft.category,
    price: Math.round(draft.price),
    image: draft.image.trim(),
    description: draft.description.trim(),
    isAvailable: draft.isAvailable,
  };
  return [newItem, ...menuItems];
}

export function updateMenuItem(
  menuItems: MenuItem[],
  itemId: string,
  draft: MenuDraft
): MenuItem[] {
  return menuItems.map((item) =>
    item.id === itemId
      ? {
          ...item,
          name: draft.name.trim(),
          category: draft.category,
          price: Math.round(draft.price),
          image: draft.image.trim(),
          description: draft.description.trim(),
          isAvailable: draft.isAvailable,
        }
      : item
  );
}

export function deleteMenuItem(
  menuItems: MenuItem[],
  itemId: string
): MenuItem[] {
  return menuItems.filter((item) => item.id !== itemId);
}

export function pruneOutOfStockFromCart(
  cart: CartMap,
  menuItems: MenuItem[]
): CartMap {
  const availableSet = new Set(
    menuItems.filter((m) => m.isAvailable).map((m) => m.id)
  );
  const next: CartMap = {};
  for (const [id, qty] of Object.entries(cart)) {
    if (qty > 0 && availableSet.has(id)) {
      next[id] = qty;
    }
  }
  return next;
}

export function calculateDailySummary(orders: OrderRecord[]): DailySummary {
  let waitingCount = 0;
  let processingCount = 0;
  let finishedCount = 0;
  let totalRevenue = 0;
  let finishedDurationSum = 0;

  const recapMap = new Map<string, ItemRecapRow>();

  for (const order of orders) {
    if (order.status === 'waiting') waitingCount += 1;
    else if (order.status === 'processing') processingCount += 1;
    else if (order.status === 'finished') {
      finishedCount += 1;
      finishedDurationSum += order.durationSeconds;
    }

    totalRevenue += order.grandTotal;

    for (const item of order.items) {
      const existing = recapMap.get(item.menuId);
      if (existing) {
        existing.qtySold += item.qty;
        existing.revenue += item.lineTotal;
      } else {
        recapMap.set(item.menuId, {
          menuId: item.menuId,
          name: item.name,
          category: item.category,
          qtySold: item.qty,
          revenue: item.lineTotal,
        });
      }
    }
  }

  const itemRecap = Array.from(recapMap.values()).sort(
    (a, b) => b.qtySold - a.qtySold || b.revenue - a.revenue
  );

  return {
    totalOrders: orders.length,
    waitingCount,
    processingCount,
    finishedCount,
    activeQueueCount: waitingCount + processingCount,
    totalRevenue,
    averageCookSeconds:
      finishedCount > 0 ? Math.round(finishedDurationSum / finishedCount) : 0,
    itemRecap,
  };
}
