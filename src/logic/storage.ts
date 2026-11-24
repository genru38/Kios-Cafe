import { INITIAL_MENU_ITEMS, createSeedOrders } from '../data/menuData';
import type { MenuItem, OrderRecord } from '../types/kiosk';

const MENU_STORAGE_KEY = 'kios_cafe_menu_v1';
const ORDERS_STORAGE_KEY = 'kios_cafe_orders_v1';

export function loadStoredMenu(): MenuItem[] {
  if (typeof window === 'undefined') return INITIAL_MENU_ITEMS;
  try {
    const raw = window.localStorage.getItem(MENU_STORAGE_KEY);
    if (!raw) return INITIAL_MENU_ITEMS;
    const parsed = JSON.parse(raw) as Partial<MenuItem>[];
    if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_MENU_ITEMS;

    // Merge stored availability flags onto canonical catalog so fresh asset paths stay valid
    const availabilityMap = new Map<string, boolean>();
    for (const item of parsed) {
      if (item && typeof item.id === 'string' && typeof item.isAvailable === 'boolean') {
        availabilityMap.set(item.id, item.isAvailable);
      }
    }
    return INITIAL_MENU_ITEMS.map((item) => ({
      ...item,
      isAvailable: availabilityMap.has(item.id)
        ? Boolean(availabilityMap.get(item.id))
        : item.isAvailable,
    }));
  } catch {
    return INITIAL_MENU_ITEMS;
  }
}

export function saveStoredMenu(menuItems: MenuItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menuItems));
  } catch {
    // Ignore storage quota errors in restricted preview frames
  }
}

export function loadStoredOrders(): OrderRecord[] {
  if (typeof window === 'undefined') return createSeedOrders();
  try {
    const raw = window.localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) {
      const seeds = createSeedOrders();
      saveStoredOrders(seeds);
      return seeds;
    }
    const parsed = JSON.parse(raw) as OrderRecord[];
    if (!Array.isArray(parsed)) return createSeedOrders();
    return parsed;
  } catch {
    return createSeedOrders();
  }
}

export function saveStoredOrders(orders: OrderRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // Ignore storage quota errors
  }
}

export function subscribeCrossTabSync(
  onMenuChange: (menu: MenuItem[]) => void,
  onOrdersChange: (orders: OrderRecord[]) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  const handleStorage = (event: StorageEvent) => {
    if (event.key === MENU_STORAGE_KEY) {
      onMenuChange(loadStoredMenu());
    } else if (event.key === ORDERS_STORAGE_KEY) {
      onOrdersChange(loadStoredOrders());
    }
  };
  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
}
