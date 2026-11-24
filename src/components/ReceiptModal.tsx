import { Printer, X, Check } from 'lucide-react';
import { formatRupiah } from '../logic/storeLogic';
import type { OrderRecord } from '../types/kiosk';

interface ReceiptModalProps {
  order: OrderRecord | null;
  onClose: () => void;
}

export function ReceiptModal({ order, onClose }: ReceiptModalProps) {
  if (!order) return null;

  const orderDate = new Date(order.createdAt);
  const formattedDate = orderDate.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = orderDate.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 no-print-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
    >
      <div className="print-modal-shell w-full max-w-md bg-white rounded-xl border border-[#E2E4E8] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header (hidden when printing) */}
        <div className="no-print flex items-center justify-between px-5 py-4 bg-[#1F2227] text-white">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full kc-accent-gradient flex items-center justify-center">
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            </span>
            <h2 id="receipt-modal-title" className="font-display font-bold text-base">
              Struk Antrian Pesanan
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup struk antrian"
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Thermal Receipt Body */}
        <div className="p-6 overflow-y-auto kc-scroll print-only-receipt bg-white text-[#111317]">
          <div className="text-center border-b border-dashed border-[#3A3F47] pb-4">
            <p className="font-display font-extrabold text-2xl tracking-tight text-[#111317]">
              KIOS CAFE
            </p>
            <p className="text-xs text-[#5C6370] mt-0.5">
              Self-Service Ordering Kiosk
            </p>
            <p className="text-xs text-[#5C6370] font-mono-num mt-1">
              {formattedDate} · {formattedTime}
            </p>
          </div>

          {/* Queue Number Highlight Box */}
          <div className="my-5 py-4 px-4 rounded-lg bg-[#1F2227] text-white text-center">
            <p className="text-xs font-medium tracking-wider text-white/80">
              NOMOR ANTRIAN ANDA
            </p>
            <p
              data-testid="receipt-queue-number"
              className="font-mono-num font-bold text-5xl tracking-wider mt-1 text-[#F59E0B]"
            >
              {order.queueNumber}
            </p>
            <p className="text-xs text-white/80 mt-2">
              Harap menunggu panggilan di meja kasir depan
            </p>
          </div>

          {/* Itemized List */}
          <div className="border-t border-b border-dashed border-[#3A3F47] py-3 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-[#5C6370]">
              <span>Menu</span>
              <span>Subtotal</span>
            </div>
            {order.items.map((item) => (
              <div
                key={item.menuId}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-[#111317] leading-snug">
                    {item.name}
                  </p>
                  <p className="text-xs text-[#5C6370] font-mono-num">
                    {item.qty} x {formatRupiah(item.price)}
                  </p>
                </div>
                <span className="font-mono-num font-semibold text-[#111317] shrink-0">
                  {formatRupiah(item.lineTotal)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals Calculation */}
          <div className="pt-3.5 space-y-1.5 text-sm">
            <div className="flex items-center justify-between text-[#5C6370]">
              <span>Total Qty</span>
              <span className="font-mono-num font-medium text-[#111317]">
                {order.totalQty} item
              </span>
            </div>
            <div className="flex items-center justify-between text-[#5C6370]">
              <span>Subtotal</span>
              <span className="font-mono-num font-medium text-[#111317]">
                {formatRupiah(order.subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#5C6370]">
              <span>PPN (11%)</span>
              <span className="font-mono-num font-medium text-[#111317]">
                {formatRupiah(order.ppn)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#E2E4E8] text-base font-bold text-[#111317]">
              <span>Total Bayar</span>
              <span className="font-mono-num text-lg text-[#C2410C]">
                {formatRupiah(order.grandTotal)}
              </span>
            </div>
          </div>

          <p className="text-center text-xs text-[#5C6370] mt-5 pt-3 border-t border-dashed border-[#E2E4E8]">
            Terima kasih telah memesan di KIOS CAFE
          </p>
        </div>

        {/* Footer Actions (hidden when printing) */}
        <div className="no-print px-5 py-4 bg-[#F4F5F7] border-t border-[#E2E4E8] flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 kc-btn-accent h-11 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>Print Struk Antrian</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-5 rounded-lg bg-[#1F2227] hover:bg-[#2B2F36] text-white font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            Pesanan Baru
          </button>
        </div>
      </div>
    </div>
  );
}
