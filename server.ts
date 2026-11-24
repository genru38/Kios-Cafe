import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { INITIAL_MENU_ITEMS } from './src/data/menuData.ts';
import {
  addMenuItem,
  deleteMenuItem,
  toggleMenuStock,
  updateMenuItem,
  validateMenuDraft,
  type MenuDraft,
} from './src/logic/storeLogic.ts';
import type { MenuCategory, MenuItem } from './src/types/kiosk.ts';
import {
  createInitialCredentials,
  hashPassword,
  sanitizeImageUrl,
  validateCredentialChange,
  verifyPassword,
  type StoredCredentials,
} from './server/authCore.ts';

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const DATA_DIR = path.resolve(process.cwd(), '.data');
const STORE_PATH = path.resolve(DATA_DIR, 'kios-cafe-store.json');

const VALID_CATEGORIES = new Set<MenuCategory>([
  'makanan',
  'dessert',
  'minuman',
  'paket_combo',
]);

interface PersistedStore {
  credentials: StoredCredentials;
  menuItems: MenuItem[];
}

interface SessionRecord {
  token: string;
  username: string;
  expiresAt: number;
}

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const sessions = new Map<string, SessionRecord>();

// Simple brute-force guard for login endpoint
const LOGIN_WINDOW_MS = 5 * 60 * 1000;
const MAX_LOGIN_FAILURES = 15;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function getDefaultCredentials(): StoredCredentials {
  const envUser = process.env.MENU_ADMIN_USERNAME?.trim();
  const envPass = process.env.MENU_ADMIN_PASSWORD;
  const initialUser = envUser && envUser.length >= 3 ? envUser : 'genru';
  const initialPass = envPass && envPass.length >= 4 ? envPass : '1234';
  return createInitialCredentials(initialUser, initialPass);
}

function loadStore(): PersistedStore {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as Partial<PersistedStore>;
      const validCreds =
        parsed.credentials &&
        typeof parsed.credentials.username === 'string' &&
        typeof parsed.credentials.passwordSalt === 'string' &&
        typeof parsed.credentials.passwordHash === 'string'
          ? parsed.credentials
          : getDefaultCredentials();
      const validMenu =
        Array.isArray(parsed.menuItems) && parsed.menuItems.length > 0
          ? parsed.menuItems
          : INITIAL_MENU_ITEMS;
      return { credentials: validCreds, menuItems: validMenu };
    }
  } catch {
    // Fall back to fresh default store if file is unreadable
  }

  const fresh: PersistedStore = {
    credentials: getDefaultCredentials(),
    menuItems: INITIAL_MENU_ITEMS,
  };
  saveStore(fresh);
  return fresh;
}

function saveStore(store: PersistedStore): void {
  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), {
    encoding: 'utf8',
    mode: 0o600,
  });
}

let store: PersistedStore = loadStore();

// If env override is explicitly configured, sync credentials with it
if (
  process.env.MENU_ADMIN_USERNAME?.trim() &&
  process.env.MENU_ADMIN_PASSWORD &&
  !verifyPassword(
    process.env.MENU_ADMIN_PASSWORD,
    store.credentials.passwordSalt,
    store.credentials.passwordHash
  )
) {
  store = {
    ...store,
    credentials: getDefaultCredentials(),
  };
  saveStore(store);
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

function getValidSession(token: string | null): SessionRecord | null {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return session;
}

function issueSession(username: string): SessionRecord {
  const token = crypto.randomBytes(32).toString('hex');
  const record: SessionRecord = {
    token,
    username,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  sessions.set(token, record);
  return record;
}

function requireMenuAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = extractBearerToken(req);
  const session = getValidSession(token);
  if (!session) {
    res.status(401).json({ error: 'Sesi login tidak valid atau telah berakhir.' });
    return;
  }
  res.locals.session = session;
  next();
}

function parseMenuDraftFromBody(body: unknown): {
  draft?: MenuDraft;
  error?: string;
} {
  if (!body || typeof body !== 'object') {
    return { error: 'Payload menu tidak valid.' };
  }
  const input = body as Record<string, unknown>;
  const name = typeof input.name === 'string' ? input.name : '';
  const category =
    typeof input.category === 'string' &&
    VALID_CATEGORIES.has(input.category as MenuCategory)
      ? (input.category as MenuCategory)
      : null;
  const price =
    typeof input.price === 'number'
      ? input.price
      : Number(input.price);
  const description =
    typeof input.description === 'string' ? input.description : '';
  const rawImage = typeof input.image === 'string' ? input.image : '';
  const isAvailable =
    typeof input.isAvailable === 'boolean' ? input.isAvailable : true;

  if (!category) {
    return { error: 'Kategori menu tidak valid.' };
  }

  const errors = validateMenuDraft({ name, price, description });
  const firstError = errors.name || errors.price || errors.description;
  if (firstError) {
    return { error: firstError };
  }

  const safeImage =
    sanitizeImageUrl(rawImage) || INITIAL_MENU_ITEMS[0].image;

  return {
    draft: {
      name: name.trim(),
      category,
      price: Math.round(price),
      description: description.trim(),
      image: safeImage,
      isAvailable,
    },
  };
}

function createApiRouter(): express.Router {
  const router = express.Router();

  // --- Menu Admin Authentication Routes ---
  router.post('/menu-admin/login', (req: Request, res: Response) => {
    const clientIp = req.ip || 'unknown';
    const now = Date.now();
    const attempt = loginAttempts.get(clientIp);
    if (attempt && now < attempt.resetAt && attempt.count >= MAX_LOGIN_FAILURES) {
      res.status(429).json({
        error: 'Terlalu banyak percobaan gagal. Coba lagi dalam beberapa menit.',
      });
      return;
    }

    const body = req.body as Record<string, unknown> | undefined;
    const username =
      typeof body?.username === 'string' ? body.username.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!username || !password) {
      res.status(400).json({ error: 'Username dan password wajib diisi.' });
      return;
    }

    const usernameMatch =
      username.toLowerCase() === store.credentials.username.toLowerCase();
    const passwordMatch = verifyPassword(
      password,
      store.credentials.passwordSalt,
      store.credentials.passwordHash
    );

    if (!usernameMatch || !passwordMatch) {
      const nextCount =
        attempt && now < attempt.resetAt ? attempt.count + 1 : 1;
      loginAttempts.set(clientIp, {
        count: nextCount,
        resetAt:
          attempt && now < attempt.resetAt
            ? attempt.resetAt
            : now + LOGIN_WINDOW_MS,
      });
      res.status(401).json({ error: 'Username atau password salah.' });
      return;
    }

    loginAttempts.delete(clientIp);
    const session = issueSession(store.credentials.username);
    res.json({
      token: session.token,
      username: session.username,
    });
  });

  router.get('/menu-admin/session', (req: Request, res: Response) => {
    const session = getValidSession(extractBearerToken(req));
    if (!session) {
      res.status(401).json({ authenticated: false });
      return;
    }
    res.json({
      authenticated: true,
      username: store.credentials.username,
    });
  });

  router.post('/menu-admin/logout', (req: Request, res: Response) => {
    const token = extractBearerToken(req);
    if (token) sessions.delete(token);
    res.json({ ok: true });
  });

  router.put(
    '/menu-admin/credentials',
    requireMenuAdmin,
    (req: Request, res: Response) => {
      const body = req.body as Record<string, unknown> | undefined;
      const currentPassword =
        typeof body?.currentPassword === 'string' ? body.currentPassword : '';
      const newUsername =
        typeof body?.newUsername === 'string' ? body.newUsername.trim() : '';
      const newPassword =
        typeof body?.newPassword === 'string' ? body.newPassword : '';
      const confirmPassword =
        typeof body?.confirmPassword === 'string' ? body.confirmPassword : '';

      const errors = validateCredentialChange({
        currentPassword,
        newUsername,
        newPassword,
        confirmPassword,
      });

      if (Object.keys(errors).length > 0) {
        const firstError =
          errors.currentPassword ||
          errors.newUsername ||
          errors.newPassword ||
          errors.confirmPassword;
        res.status(400).json({ error: firstError, fields: errors });
        return;
      }

      if (
        !verifyPassword(
          currentPassword,
          store.credentials.passwordSalt,
          store.credentials.passwordHash
        )
      ) {
        res.status(401).json({
          error: 'Password saat ini tidak sesuai.',
          fields: { currentPassword: 'Password saat ini tidak sesuai.' },
        });
        return;
      }

      const nextHash =
        newPassword.length > 0
          ? hashPassword(newPassword)
          : {
              salt: store.credentials.passwordSalt,
              hash: store.credentials.passwordHash,
            };

      store = {
        ...store,
        credentials: {
          username: newUsername,
          passwordSalt: nextHash.salt,
          passwordHash: nextHash.hash,
          updatedAt: Date.now(),
        },
      };
      saveStore(store);

      // Rotate token & revoke older sessions
      const oldToken = extractBearerToken(req);
      sessions.clear();
      if (oldToken) sessions.delete(oldToken);
      const nextSession = issueSession(store.credentials.username);

      res.json({
        token: nextSession.token,
        username: nextSession.username,
      });
    }
  );

  // --- Public Menu Read + Kitchen Stock Toggle ---
  router.get('/menu', (_req: Request, res: Response) => {
    res.json({ menuItems: store.menuItems });
  });

  router.patch(
    '/menu/:id/stock',
    requireMenuAdmin,
    (req: Request, res: Response) => {
      const id = req.params.id;
      const exists = store.menuItems.some((item) => item.id === id);
      if (!exists) {
        res.status(404).json({ error: 'Menu tidak ditemukan.' });
        return;
      }
      store = {
        ...store,
        menuItems: toggleMenuStock(store.menuItems, id),
      };
      saveStore(store);
      res.json({ menuItems: store.menuItems });
    }
  );

  // --- Protected Menu Editor CRUD Routes (Require Login Token) ---
  router.post('/menu', requireMenuAdmin, (req: Request, res: Response) => {
    const { draft, error } = parseMenuDraftFromBody(req.body);
    if (!draft || error) {
      res.status(400).json({ error: error || 'Data menu tidak valid.' });
      return;
    }
    store = {
      ...store,
      menuItems: addMenuItem(store.menuItems, draft, Date.now()),
    };
    saveStore(store);
    res.status(201).json({ menuItems: store.menuItems });
  });

  router.put('/menu/:id', requireMenuAdmin, (req: Request, res: Response) => {
    const id = req.params.id;
    const exists = store.menuItems.some((item) => item.id === id);
    if (!exists) {
      res.status(404).json({ error: 'Menu tidak ditemukan.' });
      return;
    }
    const { draft, error } = parseMenuDraftFromBody(req.body);
    if (!draft || error) {
      res.status(400).json({ error: error || 'Data menu tidak valid.' });
      return;
    }
    store = {
      ...store,
      menuItems: updateMenuItem(store.menuItems, id, draft),
    };
    saveStore(store);
    res.json({ menuItems: store.menuItems });
  });

  router.delete(
    '/menu/:id',
    requireMenuAdmin,
    (req: Request, res: Response) => {
      const id = req.params.id;
      const exists = store.menuItems.some((item) => item.id === id);
      if (!exists) {
        res.status(404).json({ error: 'Menu tidak ditemukan.' });
        return;
      }
      store = {
        ...store,
        menuItems: deleteMenuItem(store.menuItems, id),
      };
      saveStore(store);
      res.json({ menuItems: store.menuItems });
    }
  );

  router.post(
    '/menu/reset',
    requireMenuAdmin,
    (_req: Request, res: Response) => {
      store = {
        ...store,
        menuItems: INITIAL_MENU_ITEMS,
      };
      saveStore(store);
      res.json({ menuItems: store.menuItems });
    }
  );

  return router;
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '4mb' }));

  const apiRouter = createApiRouter();
  app.use('/api', apiRouter);
  // Also support subpath hosting under /project/
  app.use('/project/api', apiRouter);

  if (!IS_PROD) {
    // Allow accessing /project/, /project/admin/, /project/edit-menu/ and /project/src/assets/... in dev
    app.use((req, _res, next) => {
      if (req.url === '/project') {
        req.url = '/';
      } else if (req.url.startsWith('/project/')) {
        req.url = req.url.slice('/project'.length);
      }
      next();
    });

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use('/project', express.static(distDir));
    app.use(express.static(distDir));

    app.get(['/project/admin', '/project/admin/', '/admin', '/admin/'], (_req, res) => {
      res.sendFile(path.join(distDir, 'admin', 'index.html'));
    });
    app.get(
      ['/project/edit-menu', '/project/edit-menu/', '/edit-menu', '/edit-menu/'],
      (_req, res) => {
        res.sendFile(path.join(distDir, 'edit-menu', 'index.html'));
      }
    );
    app.get(['/project', '/project/*'], (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KIOS CAFE server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
