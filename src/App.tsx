import { useCallback, useEffect, useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { CustomerKiosk } from './components/CustomerKiosk';
import { ReceiptModal } from './components/ReceiptModal';
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
} from './logic/storeLogic';
import type { CartMap, MenuItem, OrderRecord } from './types/kiosk';

type AppView = 'customer' | 'admin';

function getInitialView(): AppView {
  if (typeof window === 'undefined') return 'customer';
  const hash = window.location.hash.toLowerCase();
  const path = window.location.pathname.toLowerCase();
  if (hash === '#admin' || path.startsWith('/admin')) {
    return 'admin';
  }
  return 'customer';
}

export default function App() {
  const [view, setView] = useState<AppView>(getInitialView);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(loadStoredMenu);
  const [orders, setOrders] = useState<OrderRecord[]>(loadStoredOrders);
  const [cart, setCart] = useState<CartMap>({});
  const [activeReceipt, setActiveReceipt] = useState<OrderRecord | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  // 1-second live clock for kitchen cooking timers
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Keep view synced with URL hash (#admin / #customer)
  useEffect(() => {
    const handleHashChange = () => {
      setView(getInitialView());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Cross-tab localStorage sync between Customer Kiosk and Admin Backpanel
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
      const targetHash = next === 'admin' ? '#admin' : '';
      if (window.location.hash !== targetHash) {
        window.history.replaceState(null, '', next === 'admin' ? '#admin' : window.location.pathname);
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

  const handleSubmitOrder = useCallback(() => {
    const now = Date.now();
    const newOrder = createOrderFromCart(cart, menuItems, orders, now);
    if (!newOrder) return;

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    saveStoredOrders(updatedOrders);
    setCart({});
    setActiveReceipt(newOrder);
    setNowMs(now);
  }, [cart, menuItems, orders]);

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

  const handleToggleStock = useCallback((menuId: string) => {
    setMenuItems((prev) => {
      const next = toggleMenuStock(prev, menuId);
      saveStoredMenu(next);
      setCart((prevCart) => pruneOutOfStockFromCart(prevCart, next));
      return next;
    });
  }, []);

  return (
    <>
      {view === 'customer' ? (
        <CustomerKiosk
          menuItems={menuItems}
          cart={cart}
          onUpdateQty={handleUpdateQty}
          onClearCart={handleClearCart}
          onSubmitOrder={handleSubmitOrder}
          onSwitchToAdmin={() => switchView('admin')}
        />
      ) : (
        <AdminDashboard
          menuItems={menuItems}
          orders={orders}
          nowMs={nowMs}
          onProcessOrder={handleProcessOrder}
          onFinishOrder={handleFinishOrder}
          onToggleStock={handleToggleStock}
          onSwitchToCustomer={() => switchView('customer')}
        />
      )}

      <ReceiptModal
        order={activeReceipt}
        onClose={() => setActiveReceipt(null)}
      />
    </>
  );
}
