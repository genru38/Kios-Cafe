import { useMemo, useState } from 'react';
import {
  ChefHat,
  CheckCircle2,
  Clock,
  ClipboardList,
  BarChart3,
  PackageCheck,
  Monitor,
  Eye,
  Lock,
} from 'lucide-react';
import { CATEGORY_LABELS } from '../data/menuData';
import { resolveAssetUrl } from '../logic/routing';
import {
  calculateDailySummary,
  formatDuration,
  formatRupiah,
  formatTimeClock,
  getElapsedSeconds,
} from '../logic/storeLogic';
import type { CategoryFilter, MenuItem, OrderRecord } from '../types/kiosk';
import { BrandLogo } from './BrandLogo';
import { OrderDetailModal } from './OrderDetailModal';

interface AdminDashboardProps {
  menuItems: MenuItem[];
  orders: OrderRecord[];
  nowMs: number;
  onProcessOrder: (orderId: string) => void;
  onFinishOrder: (orderId: string) => void;
  onToggleStock: (menuId: string) => void;
  onOpenEditMenuPage: () => void;
  onSwitchToCustomer: () => void;
}

type AdminSection = 'orders' | 'recap' | 'stock';
type OrderFilter = 'all' | 'active' | 'finished';

export function AdminDashboard({
  menuItems,
  orders,
  nowMs,
  onProcessOrder,
  onFinishOrder,
  onToggleStock,
  onOpenEditMenuPage,
  onSwitchToCustomer,
}: AdminDashboardProps) {
  const [section, setSection] = useState<AdminSection>('orders');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');
  const [stockCategory, setStockCategory] = useState<CategoryFilter>('semua');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const summary = useMemo(() => calculateDailySummary(orders), [orders]);

  const sortedOrders = useMemo(() => {
    const rank: Record<OrderRecord['status'], number> = {
      processing: 0,
      waiting: 1,
      finished: 2,
    };
    const filtered = orders.filter((o) => {
      if (orderFilter === 'active') return o.status !== 'finished';
      if (orderFilter === 'finished') return o.status === 'finished';
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (rank[a.status] !== rank[b.status]) {
        return rank[a.status] - rank[b.status];
      }
      // Kitchen queue FIFO for active orders, newest-first for finished history
      if (a.status === 'finished') {
        return b.createdAt - a.createdAt;
      }
      return a.createdAt - b.createdAt;
    });
  }, [orders, orderFilter]);

  const filteredStockMenu = useMemo(() => {
    if (stockCategory === 'semua') return menuItems;
    return menuItems.filter((item) => item.category === stockCategory);
  }, [menuItems, stockCategory]);

  const availableCount = useMemo(
    () => menuItems.filter((m) => m.isAvailable).length,
    [menuItems]
  );

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) ?? null,
    [orders, selectedOrderId]
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F4F5F7] text-[#111317] no-print">
      {/* Distinct Admin Backpanel Sidebar (Dark Gray #1F2227) */}
      <aside className="lg:w-[260px] lg:min-h-screen bg-[#1F2227] text-white flex flex-col shrink-0 border-b lg:border-b-0 lg:border-r border-[#2B2F36]">
        <div className="px-6 py-5 border-b border-[#2B2F36]">
          <BrandLogo variant="dark" size="sm" />
          <p className="text-xs text-white/65 mt-2">
            Backpanel Dapur &amp; Kasir
          </p>
        </div>

        <nav
          aria-label="Navigasi Admin Backpanel"
          className="p-3 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible flex-1"
        >
          <button
            type="button"
            onClick={() => setSection('orders')}
            aria-current={section === 'orders' ? 'page' : undefined}
            className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              section === 'orders'
                ? 'kc-accent-gradient text-white'
                : 'text-white/80 hover:bg-[#2B2F36] hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <ClipboardList className="w-4 h-4 shrink-0" />
              <span>Order Masuk</span>
            </span>
            <span className="font-mono-num text-xs font-bold px-2 py-0.5 rounded bg-black/25 text-white">
              {summary.activeQueueCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSection('recap')}
            aria-current={section === 'recap' ? 'page' : undefined}
            className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              section === 'recap'
                ? 'kc-accent-gradient text-white'
                : 'text-white/80 hover:bg-[#2B2F36] hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>Rekapan Order</span>
            </span>
            <span className="font-mono-num text-xs font-bold text-white/80">
              {summary.totalOrders}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSection('stock')}
            aria-current={section === 'stock' ? 'page' : undefined}
            className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              section === 'stock'
                ? 'kc-accent-gradient text-white'
                : 'text-white/80 hover:bg-[#2B2F36] hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <PackageCheck className="w-4 h-4 shrink-0" />
              <span>Kelola Stok Menu</span>
            </span>
            <span className="font-mono-num text-xs font-bold text-white/80">
              {availableCount}/{menuItems.length}
            </span>
          </button>

          <div className="hidden lg:block my-2 border-t border-[#2B2F36]" />

          <button
            type="button"
            onClick={onOpenEditMenuPage}
            className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap text-[#F59E0B] hover:bg-[#2B2F36] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 shrink-0" />
              <span>Admin Edit Menu</span>
            </span>
            <span className="font-mono-num text-[11px] font-semibold text-white/60">
              Login
            </span>
          </button>
        </nav>

        <div className="p-4 border-t border-[#2B2F36]">
          <button
            type="button"
            onClick={onSwitchToCustomer}
            className="w-full h-11 px-4 rounded-lg bg-[#2B2F36] hover:bg-[#3A3F47] border border-white/15 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Monitor className="w-4 h-4 text-[#F59E0B] shrink-0" />
            <span>Layar Customer</span>
          </button>
        </div>
      </aside>

      {/* Main Backpanel Workspace */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top Admin Header */}
        <header className="bg-white border-b border-[#E2E4E8] px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-xl text-[#111317]">
              {section === 'orders'
                ? 'Antrian Order Masuk & Dapur'
                : section === 'recap'
                  ? 'Rekapan Order & Penjualan Hari Ini'
                  : 'Manajemen Ketersediaan Stok Menu'}
            </h1>
            <p className="text-xs text-[#5C6370] mt-0.5">
              {section === 'orders'
                ? 'Klik nomor antrian untuk melihat detail makanan. Klik PROSES untuk mulai timer masak, lalu FINISH saat dikirim ke meja kasir.'
                : section === 'recap'
                  ? 'Ringkasan seluruh pesanan yang masuk dan performa penjualan per menu hari ini.'
                  : 'Nonaktifkan menu yang habis agar layar customer otomatis menampilkan watermark STOK HABIS.'}
            </p>
          </div>
          <div className="text-right font-mono-num text-xs text-[#5C6370]">
            <span>Shift Hari Ini</span>
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            <span className="font-semibold text-[#111317]">
              {formatTimeClock(nowMs)}
            </span>
          </div>
        </header>

        <div className="p-6 lg:p-8 space-y-6 max-w-[1440px] w-full">
          {/* 4-Column KPI Strip (Always visible in Backpanel) */}
          <section
            aria-label="Ringkasan Operasional Hari Ini"
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
          >
            <div className="bg-white rounded-xl border border-[#E2E4E8] p-5">
              <p className="text-xs font-semibold text-[#5C6370]">
                Total Jumlah Antrian
              </p>
              <p
                data-testid="kpi-total-queue"
                className="font-mono-num font-bold text-3xl text-[#111317] mt-1.5"
              >
                {summary.totalOrders}
              </p>
              <p className="text-xs text-[#5C6370] mt-2 font-mono-num">
                {summary.waitingCount} Menunggu · {summary.processingCount} Diproses
              </p>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E4E8] p-5">
              <p className="text-xs font-semibold text-[#5C6370]">
                Total Pemasukan Hari Ini
              </p>
              <p
                data-testid="kpi-total-revenue"
                className="font-mono-num font-bold text-2xl sm:text-3xl text-[#C2410C] mt-1.5"
              >
                {formatRupiah(summary.totalRevenue)}
              </p>
              <p className="text-xs text-[#5C6370] mt-2">
                Termasuk PPN 11% dari {summary.totalOrders} order
              </p>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E4E8] p-5">
              <p className="text-xs font-semibold text-[#5C6370]">
                Order Selesai (Di Kasir)
              </p>
              <p
                data-testid="kpi-finished-orders"
                className="font-mono-num font-bold text-3xl text-[#111317] mt-1.5"
              >
                {summary.finishedCount}
              </p>
              <p className="text-xs text-[#5C6370] mt-2 font-mono-num">
                Rata-rata masak: {formatDuration(summary.averageCookSeconds)}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E4E8] p-5">
              <p className="text-xs font-semibold text-[#5C6370]">
                Status Menu Customer
              </p>
              <p
                data-testid="kpi-menu-stock"
                className="font-mono-num font-bold text-3xl text-[#111317] mt-1.5"
              >
                {availableCount} / {menuItems.length}
              </p>
              <p className="text-xs text-[#5C6370] mt-2">
                {menuItems.length - availableCount === 0
                  ? 'Semua menu tersedia'
                  : `${menuItems.length - availableCount} menu ditandai STOK HABIS`}
              </p>
            </div>
          </section>

          {/* SECTION 1: ORDER MASUK & ANTRIAN */}
          {section === 'orders' && (
            <section
              aria-label="Daftar Order Masuk"
              className="bg-white rounded-xl border border-[#E2E4E8] overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-[#E2E4E8] flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display font-bold text-base text-[#111317]">
                  Antrian Order Masuk
                </h2>
                <div className="flex items-center gap-1 bg-[#F4F5F7] p-1 rounded-lg">
                  {(
                    [
                      { key: 'all', label: `Semua (${orders.length})` },
                      {
                        key: 'active',
                        label: `Aktif (${summary.activeQueueCount})`,
                      },
                      {
                        key: 'finished',
                        label: `Selesai (${summary.finishedCount})`,
                      },
                    ] as { key: OrderFilter; label: string }[]
                  ).map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setOrderFilter(f.key)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        orderFilter === f.key
                          ? 'bg-[#1F2227] text-white'
                          : 'text-[#5C6370] hover:text-[#111317]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {sortedOrders.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="font-display font-semibold text-base text-[#111317]">
                    Belum ada order pada filter ini
                  </p>
                  <p className="text-sm text-[#5C6370] mt-1">
                    Pesanan baru dari Layar Customer akan langsung muncul di sini.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#E2E4E8]" data-testid="admin-orders-list">
                  {sortedOrders.map((order) => {
                    const elapsed = getElapsedSeconds(order, nowMs);
                    const isWaiting = order.status === 'waiting';
                    const isProcessing = order.status === 'processing';
                    const isFinished = order.status === 'finished';

                    const statusText = isWaiting
                      ? 'Menunggu'
                      : isProcessing
                        ? 'Sedang Dimasak'
                        : 'Selesai · Di Meja Kasir';

                    return (
                      <div
                        key={order.id}
                        data-testid={`admin-order-row-${order.queueNumber}`}
                        data-status={order.status}
                        className={`px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${
                          isProcessing
                            ? 'bg-[#FFF7ED]'
                            : 'bg-white hover:bg-[#F4F5F7]/60'
                        }`}
                      >
                        {/* Clickable Queue Number & Order Summary -> Opens Pop-up Detail */}
                        <button
                          type="button"
                          onClick={() => setSelectedOrderId(order.id)}
                          aria-label={`Lihat detail pesanan antrian ${order.queueNumber}`}
                          className="flex items-center gap-4 text-left min-w-0 flex-1 group cursor-pointer"
                        >
                          <div
                            className={`w-20 h-14 rounded-lg flex flex-col items-center justify-center shrink-0 font-mono-num ${
                              isProcessing
                                ? 'kc-accent-gradient text-white'
                                : isWaiting
                                  ? 'bg-[#1F2227] text-[#F59E0B]'
                                  : 'bg-[#E2E4E8] text-[#111317]'
                            }`}
                          >
                            <span className="text-[10px] font-semibold opacity-80 leading-none">
                              ANTRIAN
                            </span>
                            <span className="text-lg font-bold leading-tight mt-0.5">
                              {order.queueNumber}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                              <span className="font-display font-bold text-sm text-[#111317] group-hover:text-[#C2410C] transition-colors">
                                {order.totalQty} Item Pesanan
                              </span>
                              <span className="text-xs text-[#5C6370]" aria-hidden="true">
                                ·
                              </span>
                              <span className="font-mono-num text-xs font-semibold text-[#111317]">
                                {formatRupiah(order.grandTotal)}
                              </span>
                              <span className="text-xs text-[#5C6370]" aria-hidden="true">
                                ·
                              </span>
                              <span className="text-xs text-[#5C6370] font-mono-num">
                                Masuk {formatTimeClock(order.createdAt)}
                              </span>
                            </div>

                            <p className="text-xs text-[#5C6370] truncate mt-1">
                              {order.items
                                .map((it) => `${it.qty}x ${it.name}`)
                                .join(', ')}
                            </p>

                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#C2410C] mt-1.5 group-hover:underline">
                              <Eye className="w-3.5 h-3.5" />
                              <span>Klik untuk lihat detail menu</span>
                            </span>
                          </div>
                        </button>

                        {/* Status, Live MM:SS Timer, & PROSES / FINISH Buttons */}
                        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-4 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#E2E4E8]">
                          {/* Timer & Status Readout */}
                          <div className="flex items-center gap-3 min-w-[165px]">
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                isProcessing
                                  ? 'bg-[#EA580C]/15 text-[#C2410C]'
                                  : 'bg-[#F4F5F7] text-[#3A3F47]'
                              }`}
                            >
                              <Clock className="w-4 h-4" />
                            </div>
                            <div>
                              <p
                                data-testid={`timer-${order.queueNumber}`}
                                className={`font-mono-num font-bold text-lg leading-none ${
                                  isProcessing ? 'text-[#C2410C]' : 'text-[#111317]'
                                }`}
                              >
                                {formatDuration(elapsed)}
                              </p>
                              <p className="text-[11px] font-semibold text-[#5C6370] mt-1 whitespace-nowrap">
                                {statusText}
                              </p>
                            </div>
                          </div>

                          {/* PROSES & FINISH Buttons */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              disabled={!isWaiting}
                              onClick={() => onProcessOrder(order.id)}
                              aria-label={`Proses antrian ${order.queueNumber}`}
                              className={`h-10 px-4 rounded-lg text-xs font-bold tracking-wide flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                                isWaiting
                                  ? 'kc-btn-accent cursor-pointer'
                                  : 'bg-[#E2E4E8] text-[#5C6370] cursor-not-allowed'
                              }`}
                            >
                              <ChefHat className="w-3.5 h-3.5 shrink-0" />
                              <span>PROSES</span>
                            </button>

                            <button
                              type="button"
                              disabled={!isProcessing}
                              onClick={() => onFinishOrder(order.id)}
                              aria-label={`Finish antrian ${order.queueNumber}`}
                              className={`h-10 px-4 rounded-lg text-xs font-bold tracking-wide flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                                isProcessing
                                  ? 'bg-[#1F2227] hover:bg-[#2B2F36] text-white cursor-pointer'
                                  : isFinished
                                    ? 'bg-[#1F2227]/10 text-[#111317] cursor-not-allowed'
                                    : 'bg-[#E2E4E8] text-[#5C6370] cursor-not-allowed'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>{isFinished ? 'SELESAI' : 'FINISH'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* SECTION 2: REKAPAN ORDER HARI INI */}
          {section === 'recap' && (
            <div className="space-y-6">
              {/* Rekap per Menu Terjual */}
              <section className="bg-white rounded-xl border border-[#E2E4E8] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#E2E4E8] flex items-center justify-between">
                  <h2 className="font-display font-bold text-base text-[#111317]">
                    Rekapan Menu Dipesan Hari Ini
                  </h2>
                  <span className="text-xs font-mono-num text-[#5C6370]">
                    {summary.itemRecap.length} jenis menu terjual
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F4F5F7] border-b border-[#E2E4E8] text-xs font-semibold text-[#5C6370]">
                        <th className="py-3 px-6">Nama Menu</th>
                        <th className="py-3 px-4">Kategori</th>
                        <th className="py-3 px-4 text-right">Qty Terjual</th>
                        <th className="py-3 px-6 text-right">Subtotal Penjualan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E4E8] text-sm">
                      {summary.itemRecap.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="py-8 text-center text-[#5C6370]"
                          >
                            Belum ada menu terjual hari ini.
                          </td>
                        </tr>
                      ) : (
                        summary.itemRecap.map((row) => (
                          <tr
                            key={row.menuId}
                            className="hover:bg-[#F4F5F7]/60 transition-colors"
                          >
                            <td className="py-3 px-6 font-semibold text-[#111317]">
                              {row.name}
                            </td>
                            <td className="py-3 px-4 text-[#5C6370]">
                              {CATEGORY_LABELS[row.category]}
                            </td>
                            <td className="py-3 px-4 text-right font-mono-num font-bold text-[#111317]">
                              {row.qtySold}
                            </td>
                            <td className="py-3 px-6 text-right font-mono-num font-semibold text-[#C2410C]">
                              {formatRupiah(row.revenue)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Log Semua Transaksi Order Masuk */}
              <section className="bg-white rounded-xl border border-[#E2E4E8] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#E2E4E8] flex items-center justify-between">
                  <h2 className="font-display font-bold text-base text-[#111317]">
                    Riwayat Semua Order Masuk
                  </h2>
                  <span className="text-xs font-mono-num font-semibold text-[#111317]">
                    Total: {formatRupiah(summary.totalRevenue)}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F4F5F7] border-b border-[#E2E4E8] text-xs font-semibold text-[#5C6370]">
                        <th className="py-3 px-6">No. Antrian</th>
                        <th className="py-3 px-4">Jam</th>
                        <th className="py-3 px-4">Rincian Makanan</th>
                        <th className="py-3 px-4 text-right">Durasi Masak</th>
                        <th className="py-3 px-4 text-right">Total (+PPN)</th>
                        <th className="py-3 px-6 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E4E8] text-sm">
                      {orders.map((order) => {
                        const elapsed = getElapsedSeconds(order, nowMs);
                        return (
                          <tr
                            key={order.id}
                            className="hover:bg-[#F4F5F7]/60 transition-colors"
                          >
                            <td className="py-3 px-6">
                              <button
                                type="button"
                                onClick={() => setSelectedOrderId(order.id)}
                                className="font-mono-num font-bold text-[#C2410C] hover:underline cursor-pointer"
                              >
                                {order.queueNumber}
                              </button>
                            </td>
                            <td className="py-3 px-4 font-mono-num text-[#5C6370]">
                              {formatTimeClock(order.createdAt)}
                            </td>
                            <td className="py-3 px-4 text-[#111317] max-w-md truncate">
                              {order.items
                                .map((it) => `${it.qty}x ${it.name}`)
                                .join(', ')}
                            </td>
                            <td className="py-3 px-4 text-right font-mono-num text-[#111317]">
                              {formatDuration(elapsed)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono-num font-bold text-[#111317]">
                              {formatRupiah(order.grandTotal)}
                            </td>
                            <td className="py-3 px-6 text-right text-xs font-semibold whitespace-nowrap">
                              {order.status === 'waiting'
                                ? 'Menunggu'
                                : order.status === 'processing'
                                  ? 'Diproses'
                                  : 'Selesai'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* SECTION 3: KELOLA STOK MENU (ON / OFF -> WATERMARK STOK HABIS) */}
          {section === 'stock' && (
            <section className="bg-white rounded-xl border border-[#E2E4E8] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E2E4E8] flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display font-bold text-base text-[#111317]">
                  Kontrol Ketersediaan Menu Customer
                </h2>
                <div className="flex items-center gap-1 bg-[#F4F5F7] p-1 rounded-lg overflow-x-auto">
                  {(
                    [
                      { key: 'semua', label: 'Semua' },
                      { key: 'makanan', label: 'Makanan' },
                      { key: 'dessert', label: 'Dessert' },
                      { key: 'minuman', label: 'Minuman' },
                      { key: 'paket_combo', label: 'Paket Combo' },
                    ] as { key: CategoryFilter; label: string }[]
                  ).map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setStockCategory(cat.key)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        stockCategory === cat.key
                          ? 'bg-[#1F2227] text-white'
                          : 'text-[#5C6370] hover:text-[#111317]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-6"
                data-testid="admin-stock-grid"
              >
                {filteredStockMenu.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-4 flex items-center justify-between gap-4 transition-colors ${
                      item.isAvailable
                        ? 'bg-white border-[#E2E4E8]'
                        : 'bg-[#F4F5F7] border-[#D1D5DB]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-[#2B2F36] shrink-0">
                        <img
                          src={resolveAssetUrl(item.image)}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className={`w-full h-full object-cover ${
                            item.isAvailable ? '' : 'kc-out-of-stock-img'
                          }`}
                        />
                        {!item.isAvailable && (
                          <div className="absolute inset-0 bg-[#1F2227]/55 flex items-center justify-center">
                            <span className="text-[9px] font-extrabold text-white tracking-wider">
                              HABIS
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-display font-bold text-sm text-[#111317] truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-[#5C6370]">
                          {CATEGORY_LABELS[item.category]} ·{' '}
                          <span className="font-mono-num">
                            {formatRupiah(item.price)}
                          </span>
                        </p>
                        <p
                          className={`text-xs font-semibold mt-1 ${
                            item.isAvailable ? 'text-[#C2410C]' : 'text-[#5C6370]'
                          }`}
                        >
                          {item.isAvailable
                            ? 'Aktif (Tersedia)'
                            : 'Nonaktif (STOK HABIS)'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={item.isAvailable}
                      aria-label={`Ubah status stok ${item.name}`}
                      onClick={() => onToggleStock(item.id)}
                      className={`relative w-12 h-7 rounded-full transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA580C] ${
                        item.isAvailable ? 'bg-[#EA580C]' : 'bg-[#3A3F47]'
                      }`}
                    >
                      <span
                        className={`block w-5 h-5 rounded-full bg-white shadow transition-transform duration-150 ${
                          item.isAvailable ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Pop-up Detail Order Masuk */}
      <OrderDetailModal
        order={selectedOrder}
        nowMs={nowMs}
        onClose={() => setSelectedOrderId(null)}
        onProcess={onProcessOrder}
        onFinish={onFinishOrder}
      />
    </div>
  );
}
