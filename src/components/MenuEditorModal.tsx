import { useEffect, useRef, useState } from 'react';
import { X, Upload, Image as ImageIcon, Check } from 'lucide-react';
import { CATEGORY_LABELS, INITIAL_MENU_ITEMS } from '../data/menuData';
import { resolveAssetUrl } from '../logic/routing';
import {
  formatRupiah,
  validateMenuDraft,
  type MenuDraft,
  type MenuValidationErrors,
} from '../logic/storeLogic';
import type { MenuCategory, MenuItem } from '../types/kiosk';

interface MenuEditorModalProps {
  isOpen: boolean;
  editingItem: MenuItem | null;
  onClose: () => void;
  onSave: (draft: MenuDraft, editingId: string | null) => void;
}

const PRESET_PHOTOS = INITIAL_MENU_ITEMS.map((item) => ({
  id: item.id,
  label: item.name,
  src: item.image,
}));

function resizeImageToSquareDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 480;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => reject(new Error('Gagal membaca gambar'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsDataURL(file);
  });
}

export function MenuEditorModal({
  isOpen,
  editingItem,
  onClose,
  onSave,
}: MenuEditorModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MenuCategory>('makanan');
  const [priceInput, setPriceInput] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(PRESET_PHOTOS[0].src);
  const [isAvailable, setIsAvailable] = useState(true);
  const [errors, setErrors] = useState<MenuValidationErrors>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editingItem) {
      setName(editingItem.name);
      setCategory(editingItem.category);
      setPriceInput(String(editingItem.price));
      setDescription(editingItem.description);
      setImage(editingItem.image || PRESET_PHOTOS[0].src);
      setIsAvailable(editingItem.isAvailable);
    } else {
      setName('');
      setCategory('makanan');
      setPriceInput('');
      setDescription('');
      setImage(PRESET_PHOTOS[0].src);
      setIsAvailable(true);
    }
    setErrors({});
    setUploadError(null);
    setShowGallery(false);
  }, [isOpen, editingItem]);

  if (!isOpen) return null;

  const parsedPrice = Number.parseInt(priceInput.replace(/[^\d]/g, ''), 10);
  const numericPrice = Number.isNaN(parsedPrice) ? 0 : parsedPrice;

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('File harus berupa gambar (JPG, PNG, atau WebP).');
      return;
    }
    try {
      setUploadError(null);
      const dataUrl = await resizeImageToSquareDataUrl(file);
      setImage(dataUrl);
    } catch {
      setUploadError('Gagal memproses file gambar. Silakan pilih file lain.');
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const validation = validateMenuDraft({
      name,
      price: numericPrice,
      description,
    });

    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    onSave(
      {
        name: name.trim(),
        category,
        price: numericPrice,
        description: description.trim(),
        image: image.trim() || PRESET_PHOTOS[0].src,
        isAvailable,
      },
      editingItem ? editingItem.id : null
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="menu-editor-modal-title"
    >
      <div className="w-full max-w-2xl bg-white rounded-xl border border-[#E2E4E8] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#1F2227] text-white flex items-center justify-between gap-4">
          <div>
            <h2
              id="menu-editor-modal-title"
              className="font-display font-bold text-base"
            >
              {editingItem ? 'Edit Menu Makanan' : 'Tambah Menu Baru'}
            </h2>
            <p className="text-xs text-white/70 mt-0.5">
              Perubahan akan langsung tersinkronisasi ke Layar Customer KIOS CAFE.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup form editor menu"
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="overflow-y-auto kc-scroll flex-1 flex flex-col"
        >
          <div className="p-6 grid grid-cols-1 md:grid-cols-[200px_minmax(0,1fr)] gap-6">
            {/* Left Column: Live 1:1 Photo Preview & Picker */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#5C6370]">
                Pratinjau Foto (1:1)
              </p>
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#2B2F36] border border-[#E2E4E8]">
                {image ? (
                  <img
                    src={resolveAssetUrl(image)}
                    alt={name || 'Pratinjau foto menu'}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover ${
                      isAvailable ? '' : 'kc-out-of-stock-img'
                    }`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/60">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
                {!isAvailable && (
                  <div className="absolute inset-0 kc-out-of-stock-watermark flex items-center justify-center p-2">
                    <span className="kc-out-of-stock-stamp px-2.5 py-1 rounded font-display font-extrabold text-xs whitespace-nowrap">
                      STOK HABIS
                    </span>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Upload foto menu dari perangkat"
              />

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-9 px-3 rounded-lg border border-[#3A3F47] bg-white hover:bg-[#1F2227] hover:text-white text-[#111317] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5 shrink-0" />
                  <span>Upload Foto 1:1</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowGallery((prev) => !prev)}
                  className="w-full h-9 px-3 rounded-lg bg-[#F4F5F7] hover:bg-[#E2E4E8] text-[#111317] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{showGallery ? 'Tutup Galeri Foto' : 'Pilih Foto Galeri'}</span>
                </button>
              </div>

              {uploadError && (
                <p className="text-xs font-medium text-[#C2410C]" role="alert">
                  {uploadError}
                </p>
              )}
            </div>

            {/* Right Column: Menu Metadata Form Fields */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="menu-name-input"
                  className="block text-xs font-semibold text-[#111317] mb-1.5"
                >
                  Nama Menu <span className="text-[#C2410C]">*</span>
                </label>
                <input
                  id="menu-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder="Contoh: Nasi Goreng Wagyu Spesial"
                  className={`w-full h-10 px-3.5 rounded-lg border text-sm text-[#111317] bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 ${
                    errors.name
                      ? 'border-[#C2410C]'
                      : 'border-[#D1D5DB] focus:border-[#EA580C]'
                  }`}
                />
                {errors.name && (
                  <p
                    data-testid="error-menu-name"
                    role="alert"
                    className="text-xs font-medium text-[#C2410C] mt-1"
                  >
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="menu-category-select"
                    className="block text-xs font-semibold text-[#111317] mb-1.5"
                  >
                    Kategori Menu
                  </label>
                  <select
                    id="menu-category-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MenuCategory)}
                    className="w-full h-10 px-3 rounded-lg border border-[#D1D5DB] focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 text-sm text-[#111317] bg-white cursor-pointer"
                  >
                    {(Object.keys(CATEGORY_LABELS) as MenuCategory[]).map(
                      (catKey) => (
                        <option key={catKey} value={catKey}>
                          {CATEGORY_LABELS[catKey]}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="menu-price-input"
                    className="block text-xs font-semibold text-[#111317] mb-1.5"
                  >
                    Harga (Rupiah) <span className="text-[#C2410C]">*</span>
                  </label>
                  <input
                    id="menu-price-input"
                    type="number"
                    min={1000}
                    step={500}
                    value={priceInput}
                    onChange={(e) => {
                      setPriceInput(e.target.value);
                      if (errors.price)
                        setErrors((prev) => ({ ...prev, price: undefined }));
                    }}
                    placeholder="Contoh: 45000"
                    className={`w-full h-10 px-3.5 rounded-lg border font-mono-num text-sm text-[#111317] bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 ${
                      errors.price
                        ? 'border-[#C2410C]'
                        : 'border-[#D1D5DB] focus:border-[#EA580C]'
                    }`}
                  />
                  {errors.price ? (
                    <p
                      data-testid="error-menu-price"
                      role="alert"
                      className="text-xs font-medium text-[#C2410C] mt-1"
                    >
                      {errors.price}
                    </p>
                  ) : (
                    <p className="text-[11px] text-[#5C6370] font-mono-num mt-1">
                      Tampilan: {formatRupiah(numericPrice)}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="menu-desc-input"
                  className="block text-xs font-semibold text-[#111317] mb-1.5"
                >
                  Deskripsi Singkat
                </label>
                <textarea
                  id="menu-desc-input"
                  rows={2}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description)
                      setErrors((prev) => ({ ...prev, description: undefined }));
                  }}
                  placeholder="Komposisi atau catatan menu..."
                  className="w-full px-3.5 py-2 rounded-lg border border-[#D1D5DB] focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 text-sm text-[#111317] bg-white resize-none"
                />
                {errors.description && (
                  <p role="alert" className="text-xs font-medium text-[#C2410C] mt-1">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Availability Switch inside Editor */}
              <div className="pt-1 flex items-center justify-between gap-4 rounded-lg bg-[#F4F5F7] border border-[#E2E4E8] px-4 py-3">
                <div>
                  <p className="text-xs font-bold text-[#111317]">
                    Status Ketersediaan Stok
                  </p>
                  <p className="text-[11px] text-[#5C6370]">
                    {isAvailable
                      ? 'Menu tampil aktif dan dapat dipesan di Layar Customer.'
                      : 'Menu tampil abu-abu dengan watermark STOK HABIS.'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isAvailable}
                  aria-label="Status stok menu di form editor"
                  onClick={() => setIsAvailable((prev) => !prev)}
                  className={`relative w-12 h-7 rounded-full transition-colors shrink-0 cursor-pointer ${
                    isAvailable ? 'bg-[#EA580C]' : 'bg-[#3A3F47]'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow transition-transform duration-150 ${
                      isAvailable ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Built-in 1:1 Culinary Photo Gallery Picker */}
          {showGallery && (
            <div className="px-6 pb-5">
              <div className="p-4 rounded-xl bg-[#F4F5F7] border border-[#E2E4E8]">
                <p className="text-xs font-semibold text-[#111317] mb-3">
                  Pilih dari Galeri Foto KIOS CAFE (1:1)
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                  {PRESET_PHOTOS.map((preset) => {
                    const selected = image === preset.src;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setImage(preset.src)}
                        aria-label={`Pilih foto ${preset.label}`}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                          selected
                            ? 'border-[#EA580C] ring-2 ring-[#EA580C]/30'
                            : 'border-transparent hover:border-[#3A3F47]'
                        }`}
                      >
                        <img
                          src={resolveAssetUrl(preset.src)}
                          alt={preset.label}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        {selected && (
                          <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#EA580C] text-white flex items-center justify-center">
                            <Check className="w-3 h-3" strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="px-6 py-4 bg-[#F4F5F7] border-t border-[#E2E4E8] flex items-center justify-end gap-3 mt-auto">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-lg border border-[#3A3F47] bg-white hover:bg-[#1F2227] hover:text-white text-[#111317] text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              Batal
            </button>
            <button
              type="submit"
              className="h-10 px-5 rounded-lg kc-btn-accent text-sm font-bold cursor-pointer whitespace-nowrap"
            >
              {editingItem ? 'Simpan Perubahan' : 'Simpan Menu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
