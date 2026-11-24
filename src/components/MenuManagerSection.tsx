import { useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  RotateCcw,
  UtensilsCrossed,
} from 'lucide-react';
import { CATEGORY_LABELS } from '../data/menuData';
import { resolveAssetUrl } from '../logic/routing';
import { formatRupiah, type MenuDraft } from '../logic/storeLogic';
import type { CategoryFilter, MenuItem } from '../types/kiosk';
import { MenuEditorModal } from './MenuEditorModal';

interface MenuManagerSectionProps {
  menuItems: MenuItem[];
  onAddMenu: (draft: MenuDraft) => void;
  onUpdateMenu: (itemId: string, draft: MenuDraft) => void;
  onDeleteMenu: (itemId: string) => void;
  onToggleStock: (itemId: string) => void;
  onResetMenuDefault: () => void;
}

const FILTER_TABS: { key: CategoryFilter; label: string }[] = [
  { key: 'semua', label: 'Semua' },
  { key: 'makanan', label: 'Makanan' },
  { key: 'dessert', label: 'Dessert' },
  { key: 'minuman', label: 'Minuman' },
  { key: 'paket_combo', label: 'Paket Combo' },
];

export function MenuManagerSection({
  menuItems,
  onAddMenu,
  onUpdateMenu,
  onDeleteMenu,
  onToggleStock,
  onResetMenuDefault,
}: MenuManagerSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('semua');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MenuItem | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return menuItems.filter((item) => {
      if (categoryFilter !== 'semua' && item.category !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });
  }, [menuItems, categoryFilter, searchQuery]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setEditorOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setEditorOpen(true);
  };

  const handleSave = (draft: MenuDraft, editingId: string | null) => {
    if (editingId) {
      onUpdateMenu(editingId, draft);
    } else {
      onAddMenu(draft);
    }
    setEditorOpen(false);
    setEditingItem(null);
  };

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    onDeleteMenu(pendingDelete.id);
    setPendingDelete(null);
  };

  const handleConfirmReset = () => {
    onResetMenuDefault();
    setConfirmResetOpen(false);
  };

  return (
    <section
      aria-label="Dashboard Edit Menu Makanan"
      className="bg-white rounded-xl border border-[#E2E4E8] overflow-hidden"
    >
      {/* Top Toolbar */}
      <div className="px-6 py-4 border-b border-[#E2E4E8] flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px] max-w-xs">
            <Search className="w-4 h-4 text-[#5C6370] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama menu..."
              aria-label="Cari nama menu makanan"
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#D1D5DB] bg-[#F4F5F7] focus:bg-white focus:border-[#EA580C] focus:outline-none text-sm text-[#111317]"
            />
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#F4F5F7] p-1 rounded-lg overflow-x-auto">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setCategoryFilter(tab.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  categoryFilter === tab.key
                    ? 'bg-[#1F2227] text-white'
                    : 'text-[#5C6370] hover:text-[#111317]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setConfirmResetOpen(true)}
            className="h-10 px-3.5 rounded-lg border border-[#D1D5DB] bg-white hover:bg-[#F4F5F7] text-[#111317] text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>Reset Default</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="h-10 px-4 rounded-lg kc-btn-accent text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Tambah Menu</span>
          </button>
        </div>
      </div>

      {/* Menu Catalog Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" data-testid="menu-editor-table">
          <thead>
            <tr className="bg-[#F4F5F7] border-b border-[#E2E4E8] text-xs font-semibold text-[#5C6370]">
              <th className="py-3 px-6">Menu &amp; Deskripsi</th>
              <th className="py-3 px-4">Kategori</th>
              <th className="py-3 px-4 text-right">Harga</th>
              <th className="py-3 px-4 text-center">Stok</th>
              <th className="py-3 px-6 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E4E8] text-sm">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 px-6 text-center">
                  <div className="inline-flex w-11 h-11 rounded-xl bg-[#F4F5F7] border border-[#E2E4E8] items-center justify-center text-[#5C6370] mb-2.5">
                    <UtensilsCrossed className="w-5 h-5" />
                  </div>
                  <p className="font-display font-semibold text-sm text-[#111317]">
                    Tidak ada menu yang cocok
                  </p>
                  <p className="text-xs text-[#5C6370] mt-1">
                    Coba ubah kata kunci pencarian atau tambahkan menu makanan baru.
                  </p>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr
                  key={item.id}
                  data-testid={`editor-row-${item.id}`}
                  className={`transition-colors ${
                    item.isAvailable
                      ? 'bg-white hover:bg-[#F4F5F7]/60'
                      : 'bg-[#F4F5F7]/75'
                  }`}
                >
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3.5 min-w-[240px]">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#2B2F36] shrink-0 border border-[#E2E4E8]">
                        <img
                          src={resolveAssetUrl(item.image)}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className={`w-full h-full object-cover ${
                            item.isAvailable ? '' : 'kc-out-of-stock-img'
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-display font-bold text-sm text-[#111317] truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-[#5C6370] line-clamp-1 max-w-md mt-0.5">
                          {item.description || 'Tanpa deskripsi'}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-xs font-medium text-[#5C6370] whitespace-nowrap">
                    {CATEGORY_LABELS[item.category]}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#111317] whitespace-nowrap">
                    {formatRupiah(item.price)}
                  </td>

                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={item.isAvailable}
                        aria-label={`Toggle stok ${item.name}`}
                        onClick={() => onToggleStock(item.id)}
                        className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${
                          item.isAvailable ? 'bg-[#EA580C]' : 'bg-[#3A3F47]'
                        }`}
                      >
                        <span
                          className={`block w-4 h-4 rounded-full bg-white shadow transition-transform duration-150 ${
                            item.isAvailable ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span
                        className={`text-xs font-semibold min-w-[68px] text-left ${
                          item.isAvailable ? 'text-[#C2410C]' : 'text-[#5C6370]'
                        }`}
                      >
                        {item.isAvailable ? 'Tersedia' : 'Habis'}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-6 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        aria-label={`Edit ${item.name}`}
                        className="h-8 px-3 rounded-lg bg-[#1F2227] hover:bg-[#2B2F36] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5 shrink-0" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPendingDelete(item)}
                        aria-label={`Hapus ${item.name}`}
                        className="h-8 px-2.5 rounded-lg border border-[#D1D5DB] bg-white hover:bg-[#1F2227] hover:text-white hover:border-[#1F2227] text-[#5C6370] text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      <MenuEditorModal
        isOpen={editorOpen}
        editingItem={editingItem}
        onClose={() => {
          setEditorOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
        >
          <div className="w-full max-w-sm bg-white rounded-xl border border-[#E2E4E8] shadow-2xl overflow-hidden">
            <div className="px-5 py-4 bg-[#1F2227] text-white">
              <h3 id="delete-confirm-title" className="font-display font-bold text-base">
                Hapus Menu?
              </h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-[#111317]">
                Menu <span className="font-bold">{pendingDelete.name}</span> akan
                dihapus dari katalog dan Layar Customer.
              </p>
            </div>
            <div className="px-5 py-3.5 bg-[#F4F5F7] border-t border-[#E2E4E8] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="h-9 px-4 rounded-lg border border-[#3A3F47] bg-white text-[#111317] text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="h-9 px-4 rounded-lg kc-btn-accent text-xs font-bold cursor-pointer"
              >
                Ya, Hapus Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Default Catalog Confirmation Dialog */}
      {confirmResetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-confirm-title"
        >
          <div className="w-full max-w-sm bg-white rounded-xl border border-[#E2E4E8] shadow-2xl overflow-hidden">
            <div className="px-5 py-4 bg-[#1F2227] text-white">
              <h3 id="reset-confirm-title" className="font-display font-bold text-base">
                Reset Menu ke Bawaan?
              </h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-[#111317]">
                Semua perubahan menu akan dikembalikan ke 12 daftar menu awal KIOS CAFE.
              </p>
            </div>
            <div className="px-5 py-3.5 bg-[#F4F5F7] border-t border-[#E2E4E8] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="h-9 px-4 rounded-lg border border-[#3A3F47] bg-white text-[#111317] text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="h-9 px-4 rounded-lg kc-btn-accent text-xs font-bold cursor-pointer"
              >
                Ya, Reset Default
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
