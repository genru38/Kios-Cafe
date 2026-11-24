import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react';
import { loginMenuAdmin } from '../logic/menuApi';
import { BrandLogo } from './BrandLogo';

interface AdminLoginGateProps {
  title: string;
  subtitle: string;
  submitLabel: string;
  footerLabel: string;
  onSuccess: (token: string, username: string) => void;
  onGoCustomer: () => void;
}

export function AdminLoginGate({
  title,
  subtitle,
  submitLabel,
  footerLabel,
  onSuccess,
  onGoCustomer,
}: AdminLoginGateProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setError('Username dan password wajib diisi.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const result = await loginMenuAdmin(trimmedUser, password);
      setPassword('');
      onSuccess(result.token, result.username);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal masuk. Periksa akun Anda.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1F2227] flex flex-col justify-between p-5 no-print">
      {/* Top Return Link */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between pt-2">
        <BrandLogo variant="dark" size="sm" />
        <button
          type="button"
          onClick={onGoCustomer}
          className="h-9 px-3.5 rounded-lg border border-white/20 hover:border-[#F59E0B] text-white/90 hover:text-[#F59E0B] text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          <span>Kembali ke Layar Customer</span>
        </button>
      </div>

      {/* Centered Login Card */}
      <main className="flex-1 flex items-center justify-center py-10">
        <div className="w-full max-w-md bg-white rounded-xl border border-[#E2E4E8] shadow-2xl overflow-hidden">
          <div className="px-7 py-6 bg-[#2B2F36] text-white border-b border-[#3A3F47]">
            <div className="w-11 h-11 rounded-lg kc-accent-gradient flex items-center justify-center mb-3.5 shadow-sm">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-display font-bold text-xl tracking-tight">
              {title}
            </h1>
            <p className="text-xs text-white/75 mt-1 leading-relaxed">
              {subtitle}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="p-7 space-y-4"
            data-testid="admin-login-form"
          >
            {error && (
              <div
                role="alert"
                data-testid="login-error-alert"
                className="px-3.5 py-2.5 rounded-lg bg-[#FFF7ED] border border-[#EA580C]/40 text-xs font-semibold text-[#C2410C]"
              >
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-semibold text-[#111317] mb-1.5"
              >
                Username
              </label>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Masukkan username admin"
                className="w-full h-11 px-3.5 rounded-lg border border-[#D1D5DB] focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 text-sm text-[#111317] bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-[#111317] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Masukkan password"
                  className="w-full h-11 pl-3.5 pr-11 rounded-lg border border-[#D1D5DB] focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/25 text-sm text-[#111317] bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword
                      ? 'Sembunyikan password'
                      : 'Tampilkan password'
                  }
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#5C6370] hover:text-[#111317] cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full h-11 rounded-lg kc-btn-accent font-display font-bold text-sm cursor-pointer mt-2"
            >
              {busy ? 'Memverifikasi...' : submitLabel}
            </button>
          </form>
        </div>
      </main>

      <footer className="text-center text-xs text-white/50 pb-2">
        {footerLabel}
      </footer>
    </div>
  );
}
