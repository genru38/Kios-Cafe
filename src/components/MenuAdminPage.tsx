import { useState } from 'react';
import {
  LogOut,
  Eye,
  EyeOff,
  UtensilsCrossed,
  UserCog,
  Monitor,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import {
  logoutMenuAdmin,
  updateMenuAdminCredentials,
} from '../logic/menuApi';
import type { MenuDraft } from '../logic/storeLogic';
import type { MenuItem } from '../types/kiosk';
import { AdminLoginGate } from './AdminLoginGate';
import { BrandLogo } from './BrandLogo';
import { MenuManagerSection } from './MenuManagerSection';

interface MenuAdminPageProps {
  menuItems: MenuItem[];
  authToken: string | null;
  authUsername: string | null;
  onAuthChange: (token: string | null, username: string | null) => void;
  onAddMenu: (draft: MenuDraft) => Promise<void>;
  onUpdateMenu: (itemId: string, draft: MenuDraft) => Promise<void>;
  onDeleteMenu: (itemId: string) => Promise<void>;
  onToggleStock: (itemId: string) => Promise<void>;
  onResetMenuDefault: () => Promise<void>;
  onGoCustomer: () => void;
  onGoKitchenAdmin: () => void;
}

type MenuAdminTab = 'catalog' | 'account';

export function MenuAdminPage({
  menuItems,
  authToken,
  authUsername,
  onAuthChange,
  onAddMenu,
  onUpdateMenu,
  onDeleteMenu,
  onToggleStock,
  onResetMenuDefault,
  onGoCustomer,
  onGoKitchenAdmin,
}: MenuAdminPageProps) {
  // Authenticated page state
  const [activeTab, setActiveTab] = useState<MenuAdminTab>('catalog');
  const [actionError, setActionError] = useState<string | null>(null);

  // Change username / password state
  const [newUsername, setNewUsername] = useState(authUsername ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [credError, setCredError] = useState<string | null>(null);
  const [credSuccess, setCredSuccess] = useState<string | null>(null);
  const [credBusy, setCredBusy] = useState(false);

  const handleLogout = async () => {
    if (authToken) {
      await logoutMenuAdmin(authToken);
    }
    onAuthChange(null, null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setCredError(null);
    setCredSuccess(null);
    setActionError(null);
  };

  const handleCredentialsSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!authToken) return;

    setCredError(null);
    setCredSuccess(null);

    const trimmedNewUser = newUsername.trim();
    if (trimmedNewUser.length < 3) {
      setCredError('Username baru minimal 3 karakter.');
      return;
    }
    if (!currentPassword) {
      setCredError('Password saat ini wajib diisi untuk verifikasi.');
      return;
    }
    if (newPassword && newPassword.length < 4) {
      setCredError('Password baru minimal 4 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setCredError('Konfirmasi password baru tidak cocok.');
      return;
    }

    setCredBusy(true);
    try {
      const updated = await updateMenuAdminCredentials(authToken, {
        currentPassword,
        newUsername: trimmedNewUser,
        newPassword,
        confirmPassword,
      });
      onAuthChange(updated.token, updated.username);
      setNewUsername(updated.username);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setCredSuccess(
        newPassword
          ? `Username (${updated.username}) dan password berhasil diperbarui.`
          : `Username berhasil diperbarui menjadi ${updated.username}.`
      );
    } catch (err) {
      setCredError(
        err instanceof Error ? err.message : 'Gagal memperbarui akun admin.'
      );
    } finally {
      setCredBusy(false);
    }
  };

  const runProtectedAction = async (fn: () => Promise<void>) => {
    setActionError(null);
    try {
      await fn();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Gagal menyimpan perubahan menu.';
      setActionError(msg);
      if (msg.toLowerCase().includes('sesi login')) {
        onAuthChange(null, null);
      }
    }
  };

  // =========================================================================
  // VIEW 1: LOGIN GATE (Unauthenticated)
  // =========================================================================
  if (!authToken || !authUsername) {
    return (
      <AdminLoginGate
        title="Login Admin Edit Menu"
        subtitle="Halaman khusus pengelola katalog makanan & minuman KIOS CAFE."
        submitLabel="Masuk ke Editor Menu"
        footerLabel="KIOS CAFE · Akses Terpisah Pengelola Menu"
        onSuccess={(token, username) => {
          onAuthChange(token, username);
          setNewUsername(username);
          setActiveTab('catalog');
        }}
        onGoCustomer={onGoCustomer}
      />
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED SEPARATE MENU EDITOR DASHBOARD
  // =========================================================================
  const availableCount = menuItems.filter((m) => m.isAvailable).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F5F7] text-[#111317]">
      {/* Dedicated Top Bar (3-Zone Contract) */}
      <header className="sticky top-0 z-30 bg-[#1F2227] text-white border-b border-[#2B2F36]">
        <div className="max-w-[1440px] mx-auto px-5 lg:px-8 h-[72px] flex items-center justify-between gap-6">
          {/* Zone 1: Brand */}
          <BrandLogo variant="dark" size="sm" />

          {/* Zone 2: Clean Tab Navigation */}
          <nav
            aria-label="Navigasi Halaman Edit Menu"
            className="flex items-center gap-1.5 bg-[#2B2F36] p-1 rounded-lg"
          >
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              aria-current={activeTab === 'catalog' ? 'page' : undefined}
              className={`px-4 py-2 rounded-md text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'catalog'
                  ? 'kc-accent-gradient text-white'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4 shrink-0" />
              <span>Kelola Menu</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setNewUsername(authUsername);
                setCredError(null);
                setCredSuccess(null);
                setActiveTab('account');
              }}
              aria-current={activeTab === 'account' ? 'page' : undefined}
              className={`px-4 py-2 rounded-md text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'account'
                  ? 'kc-accent-gradient text-white'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserCog className="w-4 h-4 shrink-0" />
              <span>Pengaturan Akun</span>
            </button>
          </nav>

          {/* Zone 3: Logout Action */}
          <button
            type="button"
            onClick={handleLogout}
            className="h-10 px-4 rounded-lg border border-white/25 hover:border-[#F59E0B] hover:text-[#F59E0B] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* Sub-toolbar with Signed-In Identity & Quick Switch Links */}
      <div className="bg-white border-b border-[#E2E4E8]">
        <div className="max-w-[1440px] mx-auto px-5 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-lg text-[#111317]">
              {activeTab === 'catalog'
                ? 'Admin Edit Menu Makanan'
                : 'Pengaturan Username & Password Admin'}
            </h1>
            <p className="text-xs text-[#5C6370] mt-0.5">
              Login sebagai{' '}
              <span
                data-testid="logged-in-username"
                className="font-mono-num font-bold text-[#111317]"
              >
                {authUsername}
              </span>
              <span className="mx-2" aria-hidden="true">
                ·
              </span>
              <span className="font-mono-num">
                {availableCount}/{menuItems.length} menu aktif di Layar Customer
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onGoKitchenAdmin}
              className="h-9 px-3.5 rounded-lg border border-[#D1D5DB] bg-white hover:bg-[#F4F5F7] text-[#111317] text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              Panel Dapur &amp; Antrian
            </button>
            <button
              type="button"
              onClick={onGoCustomer}
              className="h-9 px-3.5 rounded-lg bg-[#1F2227] hover:bg-[#2B2F36] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
              <span>Buka Layar Customer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-5 lg:px-8 py-6 space-y-5">
        {actionError && (
          <div
            role="alert"
            className="px-4 py-3 rounded-lg bg-[#FFF7ED] border border-[#EA580C]/40 text-xs font-semibold text-[#C2410C]"
          >
            {actionError}
          </div>
        )}

        {activeTab === 'catalog' ? (
          <MenuManagerSection
            menuItems={menuItems}
            onAddMenu={(draft) => runProtectedAction(() => onAddMenu(draft))}
            onUpdateMenu={(id, draft) =>
              runProtectedAction(() => onUpdateMenu(id, draft))
            }
            onDeleteMenu={(id) => runProtectedAction(() => onDeleteMenu(id))}
            onToggleStock={(id) => runProtectedAction(() => onToggleStock(id))}
            onResetMenuDefault={() => runProtectedAction(onResetMenuDefault)}
          />
        ) : (
          <section
            aria-label="Form Ganti Username dan Password Admin"
            className="max-w-xl bg-white rounded-xl border border-[#E2E4E8] overflow-hidden"
          >
            <div className="px-6 py-4 bg-[#1F2227] text-white flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg kc-accent-gradient flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-display font-bold text-base">
                  Ganti Username &amp; Password
                </h2>
                <p className="text-xs text-white/75">
                  Kosongkan kolom password baru jika hanya ingin mengganti username.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleCredentialsSubmit}
              noValidate
              className="p-6 space-y-4"
              data-testid="credentials-form"
            >
              {credError && (
                <div
                  role="alert"
                  data-testid="credentials-error"
                  className="px-3.5 py-2.5 rounded-lg bg-[#FFF7ED] border border-[#EA580C]/40 text-xs font-semibold text-[#C2410C]"
                >
                  {credError}
                </div>
              )}

              {credSuccess && (
                <div
                  role="status"
                  data-testid="credentials-success"
                  className="px-3.5 py-2.5 rounded-lg bg-[#F4F5F7] border border-[#1F2227]/25 text-xs font-semibold text-[#111317] flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#EA580C] shrink-0" />
                  <span>{credSuccess}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="account-new-username"
                  className="block text-xs font-semibold text-[#111317] mb-1.5"
                >
                  Username Admin <span className="text-[#C2410C]">*</span>
                </label>
                <input
                  id="account-new-username"
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Contoh: genru_admin"
                  className="w-full h-10 px-3.5 rounded-lg border border-[#D1D5DB] focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 text-sm text-[#111317] bg-white"
                />
                <p className="text-[11px] text-[#5C6370] mt-1">
                  Minimal 3 karakter (huruf, angka, titik, garis bawah, atau strip).
                </p>
              </div>

              <div>
                <label
                  htmlFor="account-current-password"
                  className="block text-xs font-semibold text-[#111317] mb-1.5"
                >
                  Password Saat Ini <span className="text-[#C2410C]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="account-current-password"
                    type={showCurrentPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan password saat ini"
                    className="w-full h-10 pl-3.5 pr-10 rounded-lg border border-[#D1D5DB] focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 text-sm text-[#111317] bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw((prev) => !prev)}
                    aria-label={
                      showCurrentPw
                        ? 'Sembunyikan password saat ini'
                        : 'Tampilkan password saat ini'
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#5C6370] hover:text-[#111317] cursor-pointer"
                  >
                    {showCurrentPw ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-[#E2E4E8]">
                <div className="pt-3">
                  <label
                    htmlFor="account-new-password"
                    className="block text-xs font-semibold text-[#111317] mb-1.5"
                  >
                    Password Baru (Opsional)
                  </label>
                  <div className="relative">
                    <input
                      id="account-new-password"
                      type={showNewPw ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 4 karakter"
                      className="w-full h-10 pl-3.5 pr-10 rounded-lg border border-[#D1D5DB] focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 text-sm text-[#111317] bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw((prev) => !prev)}
                      aria-label={
                        showNewPw
                          ? 'Sembunyikan password baru'
                          : 'Tampilkan password baru'
                      }
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#5C6370] hover:text-[#111317] cursor-pointer"
                    >
                      {showNewPw ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-3">
                  <label
                    htmlFor="account-confirm-password"
                    className="block text-xs font-semibold text-[#111317] mb-1.5"
                  >
                    Konfirmasi Password Baru
                  </label>
                  <input
                    id="account-confirm-password"
                    type={showNewPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="w-full h-10 px-3.5 rounded-lg border border-[#D1D5DB] focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 text-sm text-[#111317] bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={credBusy}
                  className="h-10 px-5 rounded-lg kc-btn-accent font-display font-bold text-sm cursor-pointer whitespace-nowrap"
                >
                  {credBusy ? 'Menyimpan...' : 'Simpan Akun Baru'}
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
