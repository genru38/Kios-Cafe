import { INITIAL_MENU_ITEMS, createSeedOrders } from '../data/menuData';
import type { MenuItem, OrderRecord } from '../types/kiosk';

const MENU_STORAGE_KEY = 'kios_cafe_menu_v1';
const ORDERS_STORAGE_KEY = 'kios_cafe_orders_v1';

const VALID_CATEGORIES = new Set(['makanan', 'dessert', 'minuman', 'paket_combo']);

export function loadStoredMenu(): MenuItem[] {
  if (typeof window === 'undefined') return INITIAL_MENU_ITEMS;
  try {
    const raw = window.localStorage.getItem(MENU_STORAGE_KEY);
    if (!raw) return INITIAL_MENU_ITEMS;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return INITIAL_MENU_ITEMS;

    const validItems: MenuItem[] = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== 'object') continue;
      const item = entry as Partial<MenuItem>;
      if (
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.category === 'string' &&
        VALID_CATEGORIES.has(item.category) &&
        typeof item.price === 'number' &&
        Number.isFinite(item.price)
      ) {
        validItems.push({
          id: item.id,
          name: item.name,
          category: item.category as MenuItem['category'],
          price: item.price,
          image: typeof item.image === 'string' ? item.image : '',
          description: typeof item.description === 'string' ? item.description : '',
          isAvailable: typeof item.isAvailable === 'boolean' ? item.isAvailable : true,
        });
      }
    }
    return validItems;
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
