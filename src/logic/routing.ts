export type AppView = 'customer' | 'admin' | 'edit-menu';

export function parseAppView(pathname: string, hash: string): AppView {
  const normalizedHash = hash.replace(/^#\/?/, '').trim().toLowerCase();
  if (normalizedHash === 'edit-menu' || normalizedHash.startsWith('edit-menu/')) {
    return 'edit-menu';
  }
  if (normalizedHash === 'admin' || normalizedHash.startsWith('admin/')) {
    return 'admin';
  }

  const cleanPath = pathname
    .replace(/\/index\.html$/i, '')
    .replace(/\/+$/, '')
    .toLowerCase();

  if (cleanPath === '/edit-menu' || cleanPath.endsWith('/edit-menu')) {
    return 'edit-menu';
  }
  if (cleanPath === '/admin' || cleanPath.endsWith('/admin')) {
    return 'admin';
  }

  return 'customer';
}

export function getBasePath(pathname: string): string {
  const stripped = pathname
    .replace(/\/edit-menu(?:\/index\.html|\/)?$/i, '/')
    .replace(/\/admin(?:\/index\.html|\/)?$/i, '/')
    .replace(/\/index\.html$/i, '/');
  if (!stripped || stripped === '/') return '/';
  return stripped.endsWith('/') ? stripped : `${stripped}/`;
}

export function buildViewUrl(pathname: string, view: AppView): string {
  const base = getBasePath(pathname);
  if (view === 'admin') return `${base}admin/`;
  if (view === 'edit-menu') return `${base}edit-menu/`;
  return base;
}

export function resolveApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  if (typeof window === 'undefined') {
    return `/${cleanEndpoint}`;
  }
  const base = getBasePath(window.location.pathname);
  return `${base}${cleanEndpoint}`;
}

export function resolveAssetUrl(assetPath: string, pathnameOverride?: string): string {
  const trimmed = assetPath.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }
  const pathname =
    pathnameOverride ??
    (typeof window !== 'undefined' ? window.location.pathname : '/');
  const base = getBasePath(pathname);
  const cleanAsset = trimmed.replace(/^\.?\//, '');
  return `${base}${cleanAsset}`;
}
