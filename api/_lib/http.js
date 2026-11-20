// Outils communs aux fonctions Vercel.
import { makeDb } from './db.js';
import { makeWa } from './whatsapp.js';
import { makeCalendar } from './calendar.js';
import { makeClaude } from './claude.js';

const tryMake = (fn) => { try { return fn(); } catch { return null; } };

// Chaque service est optionnel : s'il n'est pas configuré, la fonction correspondante est simplement désactivée.
export function makeDeps() {
  return {
    db: makeDb(),
    wa: tryMake(() => makeWa()),
    cal: tryMake(() => makeCalendar()),
    claude: tryMake(() => makeClaude()),
    now: () => Date.now(),
  };
}

export async function readRaw(req) {
  // Lire le flux brut d'abord : la signature WhatsApp se vérifie sur le texte exact envoyé par Meta.
  const chunks = [];
  try { for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c); } catch { /* flux déjà lu */ }
  if (chunks.length) return Buffer.concat(chunks).toString('utf8');
  const b = req.body;
  if (typeof b === 'string') return b;
  if (Buffer.isBuffer(b)) return b.toString('utf8');
  if (b && typeof b === 'object') return JSON.stringify(b);
  return '';
}

export async function readJson(req) {
  const raw = await readRaw(req);
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

export function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

// Vérifie le jeton de connexion Supabase et le rôle dans staff_users.
export async function requireStaff(req, db, roles = ['owner', 'manager', 'reception']) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) throw Object.assign(new Error('Non connecté'), { status: 401 });
  const url = process.env.SUPABASE_URL.replace(/\/$/, '');
  const r = await fetch(url + '/auth/v1/user', { headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + token } });
  if (!r.ok) throw Object.assign(new Error('Session expirée'), { status: 401 });
  const user = await r.json();
  const staff = await db.staffRole(user.id);
  if (!staff || !roles.includes(staff.role)) throw Object.assign(new Error('Accès refusé'), { status: 403 });
  return { id: user.id, ...staff };
}

export const fail = (res, e) => send(res, e.status || 500, { error: e.message || String(e) });
