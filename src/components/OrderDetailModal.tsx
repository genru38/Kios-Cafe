import { X, Clock, ChefHat, CheckCircle2 } from 'lucide-react';
import { CATEGORY_LABELS } from '../data/menuData';
import {
  formatDuration,
  formatRupiah,
  formatTimeClock,
  getElapsedSeconds,
} from '../logic/storeLogic';
import type { OrderRecord } from '../types/kiosk';

interface OrderDetailModalProps {
  order: OrderRecord | null;
  nowMs: number;
  onClose: () => void;
  onProcess: (orderId: string) => void;
  onFinish: (orderId: string) => void;
}

export function OrderDetailModal({
  order,
  nowMs,
  onClose,
  onProcess,
  onFinish,
}: OrderDetailModalProps) {
  if (!order) return null;

  const elapsed = getElapsedSeconds(order, nowMs);
  const statusLabel =
    order.status === 'waiting'
      ? 'Menunggu Dapur'
      : order.status === 'processing'
        ? 'Sedang Dimasak'
        : 'Selesai · Di Meja Kasir';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-detail-title"
    >
      <div className="w-full max-w-lg bg-white rounded-xl border border-[#E2E4E8] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#1F2227] text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono-num font-bold text-2xl text-[#F59E0B] shrink-0">
              {order.queueNumber}
            </span>
            <div className="min-w-0">
              <h2
                id="order-detail-title"
                className="font-display font-bold text-base truncate"
              >
                Detail Pesanan · Meja{' '}
                <span data-testid="modal-table-number" className="font-mono-num text-[#F59E0B]">
                  {order.tableNumber}
                </span>
              </h2>
              <p className="text-xs text-white/75">
                Masuk pukul {formatTimeClock(order.createdAt)} · {statusLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail pesanan"
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Cooking Timer Strip */}
        <div className="px-6 py-3.5 bg-[#F4F5F7] border-b border-[#E2E4E8] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-[#111317] font-medium">
            <Clock className="w-4 h-4 text-[#D97706] shrink-0" />
            <span>
              {order.status === 'waiting'
                ? 'Durasi Masak (Belum Dimulai)'
                : order.status === 'processing'
                  ? 'Timer Masak Berjalan'
                  : 'Total Waktu Penyajian'}
            </span>
          </div>
          <span
            data-testid="modal-order-timer"
            className={`font-mono-num text-xl font-bold ${
              order.status === 'processing' ? 'text-[#C2410C]' : 'text-[#111317]'
            }`}
          >
            {formatDuration(elapsed)}
          </span>
        </div>

        {/* Food Items List */}
        <div className="p-6 overflow-y-auto kc-scroll space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-[#5C6370] pb-2 border-b border-[#E2E4E8]">
            <span>Item Makanan & Minuman ({order.totalQty} porsi)</span>
            <span>Subtotal</span>
          </div>
          <ul className="divide-y divide-[#E2E4E8]">
            {order.items.map((item) => (
              <li
                key={item.menuId}
                className="py-3 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-[#111317]">
                    {item.name}
                  </p>
                  <p className="text-xs text-[#5C6370] mt-0.5">
                    {CATEGORY_LABELS[item.category]} · {item.qty} x{' '}
                    <span className="font-mono-num">{formatRupiah(item.price)}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-block font-mono-num font-bold text-sm text-[#111317]">
                    {formatRupiah(item.lineTotal)}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {/* Price Breakdown */}
          <div className="pt-4 border-t border-[#E2E4E8] space-y-1.5 text-sm">
            <div className="flex justify-between text-[#5C6370]">
              <span>Subtotal</span>
              <span className="font-mono-num text-[#111317] font-medium">
                {formatRupiah(order.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-[#5C6370]">
              <span>PPN (11%)</span>
              <span className="font-mono-num text-[#111317] font-medium">
                {formatRupiah(order.ppn)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#E2E4E8] font-bold text-base text-[#111317]">
              <span>Total Pembayaran</span>
              <span className="font-mono-num text-[#C2410C]">
                {formatRupiah(order.grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#F4F5F7] border-t border-[#E2E4E8] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={order.status !== 'waiting'}
              onClick={() => onProcess(order.id)}
              className="kc-btn-accent h-10 px-4 rounded-lg text-sm font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <ChefHat className="w-4 h-4 shrink-0" />
              <span>PROSES</span>
            </button>
            <button
              type="button"
              disabled={order.status !== 'processing'}
              onClick={() => onFinish(order.id)}
              className={`h-10 px-4 rounded-lg text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
                order.status === 'processing'
                  ? 'bg-[#1F2227] hover:bg-[#2B2F36] text-white cursor-pointer'
                  : 'bg-[#E2E4E8] text-[#5C6370] cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>FINISH</span>
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg border border-[#3A3F47] text-[#111317] hover:bg-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
