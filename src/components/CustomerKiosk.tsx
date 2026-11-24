import { useMemo, useState } from 'react';
import {
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Printer,
  LayoutDashboard,
  UtensilsCrossed,
} from 'lucide-react';
import { CATEGORY_LABELS } from '../data/menuData';
import { resolveAssetUrl } from '../logic/routing';
import { calculateCartTotals, formatRupiah } from '../logic/storeLogic';
import type { CartMap, CategoryFilter, MenuItem } from '../types/kiosk';
import { BrandLogo } from './BrandLogo';

interface CustomerKioskProps {
  menuItems: MenuItem[];
  cart: CartMap;
  onUpdateQty: (menuId: string, delta: number) => void;
  onClearCart: () => void;
  onSubmitOrder: () => void;
  onSwitchToAdmin: () => void;
}

const CATEGORY_TABS: { key: CategoryFilter; label: string }[] = [
  { key: 'semua', label: 'Semua Menu' },
  { key: 'makanan', label: 'Makanan' },
  { key: 'dessert', label: 'Dessert' },
  { key: 'minuman', label: 'Minuman' },
  { key: 'paket_combo', label: 'Paket Combo' },
];

export function CustomerKiosk({
  menuItems,
  cart,
  onUpdateQty,
  onClearCart,
  onSubmitOrder,
  onSwitchToAdmin,
}: CustomerKioskProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('semua');
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const filteredMenu = useMemo(() => {
    if (activeCategory === 'semua') return menuItems;
    return menuItems.filter((item) => item.category === activeCategory);
  }, [menuItems, activeCategory]);

  const calculation = useMemo(
    () => calculateCartTotals(cart, menuItems),
    [cart, menuItems]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F5F7] text-[#111317] no-print">
      {/* Top Bar — Strict 3-Zone Contract: Brand | Category Navigation | Admin Action */}
      <header className="sticky top-0 z-30 bg-[#1F2227] text-white border-b border-[#2B2F36]">
        <div className="max-w-[1600px] mx-auto px-5 lg:px-8 h-[72px] flex items-center justify-between gap-6">
          {/* Zone 1: Logo & Headline KIOS CAFE */}
          <BrandLogo variant="dark" size="md" />

          {/* Zone 2: Category Navigation Tabs (Desktop) */}
          <nav
            aria-label="Kategori Menu"
            className="hidden md:flex items-center gap-1.5 bg-[#2B2F36] p-1 rounded-lg"
          >
            {CATEGORY_TABS.map((tab) => {
              const isActive = activeCategory === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveCategory(tab.key)}
                  aria-pressed={isActive}
                  className={`px-4 py-2 rounded-md text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isActive
                      ? 'kc-accent-gradient text-white shadow-sm'
                      : 'text-white/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Action to Admin Backpanel */}
          <button
            type="button"
            onClick={onSwitchToAdmin}
            className="h-10 px-4 rounded-lg border border-white/25 hover:border-[#F59E0B] hover:text-[#F59E0B] text-white text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Admin Panel</span>
          </button>
        </div>

        {/* Mobile Category Bar */}
        <div className="md:hidden border-t border-[#2B2F36] px-4 py-2.5 overflow-x-auto kc-scroll">
          <div className="flex items-center gap-1.5 w-max">
            {CATEGORY_TABS.map((tab) => {
              const isActive = activeCategory === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveCategory(tab.key)}
                  aria-pressed={isActive}
                  className={`px-3.5 py-2 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isActive
                      ? 'kc-accent-gradient text-white'
                      : 'bg-[#2B2F36] text-white/80'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main 2-Column Workspace: Column 1 (Menu 4-Column Grid) + Column 2 (Order Summary Qty / Total / PPN) */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-5 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px] gap-6 items-start">
          {/* COLUMN 1: Menu Catalog (4 Columns on Desktop) */}
          <section aria-labelledby="menu-section-heading" className="min-w-0">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-5">
              <div>
                <h1
                  id="menu-section-heading"
                  className="font-display font-bold text-2xl text-[#111317] tracking-tight"
                >
                  {activeCategory === 'semua'
                    ? 'Semua Menu KIOS CAFE'
                    : `Menu ${CATEGORY_LABELS[activeCategory]}`}
                </h1>
                <p className="text-sm text-[#5C6370] mt-0.5">
                  Pilih jumlah porsi atau klik ORDER — total &amp; PPN 11% terhitung otomatis di panel kanan.
                </p>
              </div>
              <span className="text-xs font-medium text-[#5C6370] font-mono-num">
                {filteredMenu.length} menu ditampilkan
              </span>
            </div>

            <div
              data-testid="menu-grid"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              {filteredMenu.map((item) => {
                const qty = cart[item.id] ?? 0;
                const isSoldOut = !item.isAvailable;
                const isSelected = qty > 0 && !isSoldOut;

                return (
                  <article
                    key={item.id}
                    data-testid={`menu-card-${item.id}`}
                    data-available={item.isAvailable ? 'true' : 'false'}
                    className={`bg-white rounded-xl border transition-all flex flex-col overflow-hidden ${
                      isSoldOut
                        ? 'border-[#D1D5DB] bg-[#ECEEF1]'
                        : isSelected
                          ? 'border-[#EA580C] ring-1 ring-[#EA580C]/25 shadow-sm'
                          : 'border-[#E2E4E8] hover:border-[#3A3F47]/40 hover:-translate-y-0.5 shadow-[0_1px_2px_rgba(17,19,23,0.04)]'
                    }`}
                  >
                    {/* 1:1 Food Image Frame */}
                    <div className="relative aspect-square w-full bg-[#2B2F36] overflow-hidden">
                      {!brokenImages[item.id] ? (
                        <img
                          src={resolveAssetUrl(item.image)}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setBrokenImages((prev) => ({
                              ...prev,
                              [item.id]: true,
                            }))
                          }
                          className={`w-full h-full object-cover transition-transform duration-300 ${
                            isSoldOut
                              ? 'kc-out-of-stock-img'
                              : 'group-hover:scale-105'
                          }`}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#2B2F36] text-white/70 p-4 text-center">
                          <UtensilsCrossed className="w-8 h-8" />
                          <span className="text-xs font-medium">{item.name}</span>
                        </div>
                      )}

                      {/* Selected Quantity Corner Counter (clean contrast, only when qty > 0) */}
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 h-7 min-w-7 px-2 rounded-md bg-[#1F2227] text-white font-mono-num text-xs font-bold flex items-center justify-center shadow">
                          {qty}x
                        </div>
                      )}

                      {/* Translucent STOK HABIS Watermark Overlay */}
                      {isSoldOut && (
                        <div
                          data-testid={`soldout-watermark-${item.id}`}
                          className="absolute inset-0 kc-out-of-stock-watermark flex items-center justify-center p-4"
                        >
                          <span className="kc-out-of-stock-stamp px-4 py-2 rounded font-display font-extrabold text-sm sm:text-base whitespace-nowrap shadow-md">
                            STOK HABIS
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Details */}
                    <div
                      className={`p-4 flex-1 flex flex-col justify-between gap-3 ${
                        isSoldOut ? 'opacity-65' : ''
                      }`}
                    >
                      <div>
                        <p className="text-xs font-medium text-[#5C6370]">
                          {CATEGORY_LABELS[item.category]}
                        </p>
                        <h2 className="font-display font-bold text-[15px] leading-snug text-[#111317] mt-0.5 line-clamp-2 min-h-[2.5rem]">
                          {item.name}
                        </h2>
                        <p
                          className={`font-mono-num font-bold text-base mt-1.5 ${
                            isSoldOut
                              ? 'text-[#5C6370] line-through'
                              : 'text-[#C2410C]'
                          }`}
                        >
                          {formatRupiah(item.price)}
                        </p>
                      </div>

                      {/* Qty Selector & ORDER Button */}
                      <div className="pt-2.5 border-t border-[#E2E4E8] flex items-center gap-2">
                        <div
                          className="flex items-center rounded-lg border border-[#D1D5DB] bg-[#F4F5F7] h-10 shrink-0"
                          aria-label={`Jumlah ${item.name}`}
                        >
                          <button
                            type="button"
                            disabled={isSoldOut || qty === 0}
                            onClick={() => onUpdateQty(item.id, -1)}
                            aria-label={`Kurangi ${item.name}`}
                            className="w-8 h-full flex items-center justify-center text-[#111317] hover:bg-white rounded-l-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span
                            data-testid={`qty-value-${item.id}`}
                            className="w-7 text-center font-mono-num text-sm font-bold text-[#111317] select-none"
                          >
                            {qty}
                          </span>
                          <button
                            type="button"
                            disabled={isSoldOut}
                            onClick={() => onUpdateQty(item.id, 1)}
                            aria-label={`Tambah ${item.name}`}
                            className="w-8 h-full flex items-center justify-center text-[#111317] hover:bg-white rounded-r-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={isSoldOut}
                          onClick={() => onUpdateQty(item.id, 1)}
                          aria-label={`Order ${item.name}`}
                          className="flex-1 h-10 px-3 rounded-lg kc-btn-accent font-display font-bold text-xs tracking-wide whitespace-nowrap cursor-pointer"
                        >
                          {isSoldOut ? 'HABIS' : 'ORDER'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* COLUMN 2: Live Order Summary (Qty, Subtotal, PPN 11%, Total & Print Struk) */}
          <aside
            aria-label="Ringkasan Pesanan"
            className="lg:sticky lg:top-[96px] bg-white rounded-xl border border-[#E2E4E8] overflow-hidden shadow-[0_2px_8px_rgba(17,19,23,0.05)] flex flex-col lg:max-h-[calc(100vh-120px)]"
          >
            {/* Dark Charcoal Header */}
            <div className="px-5 py-4 bg-[#1F2227] text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-[#F59E0B] shrink-0" />
                <h2 className="font-display font-bold text-base">
                  Ringkasan Pesanan
                </h2>
              </div>
              <span
                data-testid="cart-total-qty-header"
                className="font-mono-num text-xs font-semibold text-white/85"
              >
                {calculation.totalQty} Qty
              </span>
            </div>

            {/* Selected Items Scroll Area */}
            <div className="flex-1 overflow-y-auto kc-scroll p-5 min-h-[200px]">
              {calculation.items.length === 0 ? (
                <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center px-4 py-8">
                  <div className="w-12 h-12 rounded-xl bg-[#F4F5F7] border border-[#E2E4E8] flex items-center justify-center text-[#5C6370] mb-3">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <p className="font-display font-semibold text-sm text-[#111317]">
                    Belum ada menu dipilih
                  </p>
                  <p className="text-xs text-[#5C6370] mt-1 max-w-[230px]">
                    Tekan tombol ORDER atau tanda + pada menu di kiri untuk mulai memesan.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-[#E2E4E8]" data-testid="cart-items-list">
                  {calculation.items.map((item) => (
                    <li
                      key={item.menuId}
                      className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-[#111317] truncate">
                          {item.name}
                        </p>
                        <p className="font-mono-num text-xs text-[#5C6370] mt-0.5">
                          {formatRupiah(item.price)} / porsi
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="inline-flex items-center border border-[#D1D5DB] rounded-md bg-[#F4F5F7] h-7">
                            <button
                              type="button"
                              onClick={() => onUpdateQty(item.menuId, -1)}
                              aria-label={`Kurangi ${item.name} dari keranjang`}
                              className="w-7 h-full flex items-center justify-center text-[#111317] hover:bg-white rounded-l-md cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-7 text-center font-mono-num text-xs font-bold text-[#111317]">
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQty(item.menuId, 1)}
                              aria-label={`Tambah ${item.name} di keranjang`}
                              className="w-7 h-full flex items-center justify-center text-[#111317] hover:bg-white rounded-r-md cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.menuId, -item.qty)}
                            aria-label={`Hapus ${item.name} dari pesanan`}
                            className="p-1 text-[#5C6370] hover:text-[#111317] transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <span className="font-mono-num font-bold text-sm text-[#111317] shrink-0">
                        {formatRupiah(item.lineTotal)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Auto-Calculated Qty, Subtotal, PPN 11%, Grand Total */}
            <div className="p-5 bg-[#F4F5F7] border-t border-[#E2E4E8] space-y-2.5">
              <div className="flex items-center justify-between text-sm text-[#5C6370]">
                <span>Total Qty</span>
                <span
                  data-testid="summary-qty"
                  className="font-mono-num font-semibold text-[#111317]"
                >
                  {calculation.totalQty} item
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-[#5C6370]">
                <span>Subtotal</span>
                <span
                  data-testid="summary-subtotal"
                  className="font-mono-num font-semibold text-[#111317]"
                >
                  {formatRupiah(calculation.subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-[#5C6370]">
                <span>PPN (11%)</span>
                <span
                  data-testid="summary-ppn"
                  className="font-mono-num font-semibold text-[#111317]"
                >
                  {formatRupiah(calculation.ppn)}
                </span>
              </div>
              <div className="pt-3 mt-1 border-t border-[#D1D5DB] flex items-center justify-between">
                <span className="font-display font-bold text-base text-[#111317]">
                  Total Bayar
                </span>
                <span
                  data-testid="summary-total"
                  className="font-mono-num font-bold text-xl text-[#C2410C]"
                >
                  {formatRupiah(calculation.grandTotal)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center gap-2.5">
                {calculation.items.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearCart}
                    aria-label="Reset pesanan"
                    className="h-12 px-3.5 rounded-lg border border-[#3A3F47] bg-white hover:bg-[#1F2227] hover:text-white text-[#111317] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  disabled={calculation.items.length === 0}
                  onClick={onSubmitOrder}
                  className="flex-1 h-12 px-4 rounded-lg kc-btn-accent font-display font-bold text-sm flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <Printer className="w-4 h-4 shrink-0" />
                  <span>Pesan &amp; Cetak Struk</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
