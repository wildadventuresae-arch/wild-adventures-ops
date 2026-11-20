// Accès à la base Supabase (table "records") par l'API REST, avec la clé de service.
// Aucune dépendance : fetch natif de Node 18+.

export function makeDb({ url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY, fetchImpl = fetch } = {}) {
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants');
  const base = url.replace(/\/$/, '') + '/rest/v1';
  const hdr = (extra = {}) => ({ apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', ...extra });
  const enc = encodeURIComponent;
  async function req(path, opts = {}) {
    const r = await fetchImpl(base + path, { ...opts, headers: hdr(opts.headers) });
    if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
    const t = await r.text();
    return t ? JSON.parse(t) : null;
  }
  return {
    async get(kind, id) {
      const rows = await req(`/records?kind=eq.${enc(kind)}&id=eq.${enc(id)}&select=data`);
      return rows && rows[0] ? rows[0].data : null;
    },
    // filters : objet { 'data->>date': 'eq.2026-11-20' }
    async list(kind, filters = {}) {
      const out = [];
      const f = Object.entries(filters).map(([k, v]) => `&${k}=${enc(v)}`).join('');
      for (let off = 0; ; off += 1000) {
        const rows = await req(`/records?kind=eq.${enc(kind)}${f}&select=id,data&order=id&limit=1000&offset=${off}`);
        out.push(...rows.map((r) => r.data));
        if (rows.length < 1000) break;
      }
      return out;
    },
    async put(kind, id, data) {
      await req('/records?on_conflict=kind,id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify([{ kind, id, data, updated_at: new Date().toISOString() }]),
      });
      return data;
    },
    async del(kind, id) {
      await req(`/records?kind=eq.${enc(kind)}&id=eq.${enc(id)}`, { method: 'DELETE' });
    },
    async staffRole(userId) {
      const rows = await req(`/staff_users?user_id=eq.${enc(userId)}&select=role,name`);
      return rows && rows[0] ? rows[0] : null;
    },
  };
}

// Base en mémoire, mêmes méthodes : utilisée par les tests.
export function memDb(seed = {}) {
  const store = new Map();
  for (const [kind, items] of Object.entries(seed)) for (const [id, data] of Object.entries(items)) store.set(kind + '|' + id, structuredClone(data));
  const match = (data, filters) => Object.entries(filters).every(([k, v]) => {
    const field = k.replace(/^data->>/, '');
    const [op, val] = [v.slice(0, v.indexOf('.')), v.slice(v.indexOf('.') + 1)];
    const x = String(data[field] ?? '');
    return op === 'eq' ? x === val : op === 'gte' ? x >= val : op === 'lte' ? x <= val : true;
  });
  return {
    store,
    async get(kind, id) { const v = store.get(kind + '|' + id); return v ? structuredClone(v) : null; },
    async list(kind, filters = {}) { return [...store.entries()].filter(([k, d]) => k.startsWith(kind + '|') && match(d, filters)).map(([, d]) => structuredClone(d)); },
    async put(kind, id, data) { store.set(kind + '|' + id, structuredClone(data)); return data; },
    async del(kind, id) { store.delete(kind + '|' + id); },
    async staffRole() { return { role: 'owner', name: 'Test' }; },
  };
}
