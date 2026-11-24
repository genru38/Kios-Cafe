import { useCallback, useEffect, useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { CustomerKiosk } from './components/CustomerKiosk';
import { MenuAdminPage } from './components/MenuAdminPage';
import { ReceiptModal } from './components/ReceiptModal';
import {
  apiAddMenu,
  apiDeleteMenu,
  apiResetMenuDefault,
  apiToggleMenuStock,
  apiUpdateMenu,
  fetchServerMenu,
  logoutMenuAdmin,
} from './logic/menuApi';
import {
  buildViewUrl,
  parseAppView,
  type AppView,
} from './logic/routing';
import {
  loadStoredMenu,
  loadStoredOrders,
  saveStoredMenu,
  saveStoredOrders,
  subscribeCrossTabSync,
} from './logic/storage';
import {
  createOrderFromCart,
  finishOrderProcessing,
  pruneOutOfStockFromCart,
  startOrderProcessing,
  toggleMenuStock,
  type MenuDraft,
} from './logic/storeLogic';
import type { CartMap, MenuItem, OrderRecord } from './types/kiosk';

function getInitialView(): AppView {
  if (typeof window === 'undefined') return 'customer';
  return parseAppView(window.location.pathname, window.location.hash);
}

export default function App() {
  const [view, setView] = useState<AppView>(getInitialView);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(loadStoredMenu);
  const [orders, setOrders] = useState<OrderRecord[]>(loadStoredOrders);
  const [cart, setCart] = useState<CartMap>({});
  const [activeReceipt, setActiveReceipt] = useState<OrderRecord | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  // Server-verified Menu Admin Bearer session kept strictly in React memory
  const [menuAuthToken, setMenuAuthToken] = useState<string | null>(null);
  const [menuAuthUsername, setMenuAuthUsername] = useState<string | null>(null);

  const syncMenuState = useCallback((nextMenu: MenuItem[]) => {
    setMenuItems(nextMenu);
    saveStoredMenu(nextMenu);
    setCart((prevCart) => pruneOutOfStockFromCart(prevCart, nextMenu));
  }, []);

  // Load canonical menu catalog from backend on boot and when switching views
  useEffect(() => {
    let active = true;
    fetchServerMenu()
      .then((serverMenu) => {
        if (active) syncMenuState(serverMenu);
      })
      .catch(() => {
        // Keep local cache if offline
      });
    return () => {
      active = false;
    };
  }, [view, syncMenuState]);

  // 1-second live clock for kitchen cooking timers
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Keep view synced with browser hash/path navigation
  useEffect(() => {
    const handleLocationChange = () => {
      setView(getInitialView());
    };
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // Cross-tab sync between Customer Kiosk, Kitchen Admin, and Edit Menu Admin
  useEffect(() => {
    return subscribeCrossTabSync(
      (syncedMenu) => {
        setMenuItems(syncedMenu);
        setCart((prev) => pruneOutOfStockFromCart(prev, syncedMenu));
      },
      (syncedOrders) => {
        setOrders(syncedOrders);
      }
    );
  }, []);

  const switchView = useCallback((next: AppView) => {
    setView(next);
    if (typeof window !== 'undefined') {
      const targetUrl = buildViewUrl(window.location.pathname, next);
      if (window.location.pathname !== targetUrl || window.location.hash !== '') {
        window.history.pushState(null, '', targetUrl);
      }
    }
  }, []);

  const handleUpdateQty = useCallback((menuId: string, delta: number) => {
    setCart((prev) => {
      const nextQty = (prev[menuId] ?? 0) + delta;
      if (nextQty <= 0) {
        const next = { ...prev };
        delete next[menuId];
        return next;
      }
      return { ...prev, [menuId]: nextQty };
    });
  }, []);

  const handleClearCart = useCallback(() => {
    setCart({});
  }, []);

  const handleSubmitOrder = useCallback(
    (tableNumber: string) => {
      const now = Date.now();
      const newOrder = createOrderFromCart(
        cart,
        menuItems,
        orders,
        tableNumber,
        now
      );
      if (!newOrder) return;

      const updatedOrders = [newOrder, ...orders];
      setOrders(updatedOrders);
      saveStoredOrders(updatedOrders);
      setCart({});
      setActiveReceipt(newOrder);
      setNowMs(now);
    },
    [cart, menuItems, orders]
  );

  const handleProcessOrder = useCallback((orderId: string) => {
    const now = Date.now();
    setOrders((prev) => {
      const next = prev.map((order) =>
        order.id === orderId ? startOrderProcessing(order, now) : order
      );
      saveStoredOrders(next);
      return next;
    });
    setNowMs(now);
  }, []);

  const handleFinishOrder = useCallback((orderId: string) => {
    const now = Date.now();
    setOrders((prev) => {
      const next = prev.map((order) =>
        order.id === orderId ? finishOrderProcessing(order, now) : order
      );
      saveStoredOrders(next);
      return next;
    });
    setNowMs(now);
  }, []);

  const handleToggleStock = useCallback(
    async (menuId: string) => {
      if (!menuAuthToken) {
        throw new Error('Sesi login tidak valid. Silakan login kembali.');
      }
      try {
        const updated = await apiToggleMenuStock(menuAuthToken, menuId);
        syncMenuState(updated);
      } catch (err) {
        if (
          err instanceof Error &&
          err.message.toLowerCase().includes('sesi login')
        ) {
          setMenuAuthToken(null);
          setMenuAuthUsername(null);
          return;
        }
        setMenuItems((prev) => {
          const next = toggleMenuStock(prev, menuId);
          saveStoredMenu(next);
          setCart((prevCart) => pruneOutOfStockFromCart(prevCart, next));
          return next;
        });
      }
    },
    [menuAuthToken, syncMenuState]
  );

  const handleAddMenu = useCallback(
    async (draft: MenuDraft) => {
      if (!menuAuthToken) {
        throw new Error('Sesi login tidak valid. Silakan login kembali.');
      }
      const updated = await apiAddMenu(menuAuthToken, draft);
      syncMenuState(updated);
    },
    [menuAuthToken, syncMenuState]
  );

  const handleUpdateMenu = useCallback(
    async (itemId: string, draft: MenuDraft) => {
      if (!menuAuthToken) {
        throw new Error('Sesi login tidak valid. Silakan login kembali.');
      }
      const updated = await apiUpdateMenu(menuAuthToken, itemId, draft);
      syncMenuState(updated);
    },
    [menuAuthToken, syncMenuState]
  );

  const handleDeleteMenu = useCallback(
    async (itemId: string) => {
      if (!menuAuthToken) {
        throw new Error('Sesi login tidak valid. Silakan login kembali.');
      }
      const updated = await apiDeleteMenu(menuAuthToken, itemId);
      syncMenuState(updated);
    },
    [menuAuthToken, syncMenuState]
  );

  const handleResetMenuDefault = useCallback(async () => {
    if (!menuAuthToken) {
      throw new Error('Sesi login tidak valid. Silakan login kembali.');
    }
    const updated = await apiResetMenuDefault(menuAuthToken);
    syncMenuState(updated);
  }, [menuAuthToken, syncMenuState]);

  const handleMenuAuthChange = useCallback(
    (token: string | null, username: string | null) => {
      setMenuAuthToken(token);
      setMenuAuthUsername(username);
    },
    []
  );

  const handleAdminLogout = useCallback(async () => {
    if (menuAuthToken) {
      await logoutMenuAdmin(menuAuthToken);
    }
    setMenuAuthToken(null);
    setMenuAuthUsername(null);
  }, [menuAuthToken]);

  return (
    <>
      {view === 'customer' && (
        <CustomerKiosk
          menuItems={menuItems}
          cart={cart}
          onUpdateQty={handleUpdateQty}
          onClearCart={handleClearCart}
          onSubmitOrder={handleSubmitOrder}
        />
      )}

      {view === 'admin' && (
        <AdminDashboard
          menuItems={menuItems}
          orders={orders}
          nowMs={nowMs}
          authToken={menuAuthToken}
          authUsername={menuAuthUsername}
          onAuthChange={handleMenuAuthChange}
          onLogout={handleAdminLogout}
          onProcessOrder={handleProcessOrder}
          onFinishOrder={handleFinishOrder}
          onToggleStock={handleToggleStock}
          onOpenEditMenuPage={() => switchView('edit-menu')}
          onSwitchToCustomer={() => switchView('customer')}
        />
      )}

      {view === 'edit-menu' && (
        <MenuAdminPage
          menuItems={menuItems}
          authToken={menuAuthToken}
          authUsername={menuAuthUsername}
          onAuthChange={handleMenuAuthChange}
          onAddMenu={handleAddMenu}
          onUpdateMenu={handleUpdateMenu}
          onDeleteMenu={handleDeleteMenu}
          onToggleStock={handleToggleStock}
          onResetMenuDefault={handleResetMenuDefault}
          onGoCustomer={() => switchView('customer')}
          onGoKitchenAdmin={() => switchView('admin')}
        />
      )}

      <ReceiptModal
        order={activeReceipt}
        onClose={() => setActiveReceipt(null)}
      />
    </>
  );
}
