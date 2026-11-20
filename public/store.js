/* Couche de données : connexion Supabase, chargement, sauvegarde automatique, temps réel.
   Sans configuration en ligne (fichier ouvert seul, ou /api/public-config absent) : mode démo. */
(function () {
  const SEP = '\u0001';
  const S = {
    demo: false, sb: null, user: null, profile: null, features: {},
    snap: new Map(), ready: false, timer: null, busy: null, again: false,
    coll: null, onRemote: null,
  };

  function setStatus(state, txt) {
    const el = document.getElementById('syncState');
    if (el) { el.dataset.state = state; el.textContent = txt; }
  }

  function loginUI(sb, message) {
    return new Promise((resolve) => {
      const box = document.createElement('div');
      box.className = 'login';
      box.innerHTML = `<form class="card" id="loginForm">
        <img src="/logo.png" alt="Wild Adventures" style="width:120px;align-self:center">
        <h2 style="text-align:center">Connexion</h2>
        ${message ? `<div class="note bad">${message}</div>` : ''}
        <label class="fld"><span>E-mail</span><input id="lgE" type="email" autocomplete="username" required></label>
        <label class="fld"><span>Mot de passe</span><input id="lgP" type="password" autocomplete="current-password" required></label>
        <div id="lgErr" class="small t-crit"></div>
        <button class="btn pri big" type="submit">Se connecter</button>
        <button class="btn ghost sm" type="button" id="lgForgot">Mot de passe oublié</button></form>`;
      document.body.appendChild(box);
      box.querySelector('#loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = box.querySelector('#lgErr'); err.textContent = '';
        const { data, error } = await sb.auth.signInWithPassword({ email: box.querySelector('#lgE').value.trim(), password: box.querySelector('#lgP').value });
        if (error) { err.textContent = 'E-mail ou mot de passe incorrect.'; return; }
        box.remove(); resolve(data.session);
      });
      box.querySelector('#lgForgot').addEventListener('click', async () => {
        const email = box.querySelector('#lgE').value.trim();
        const err = box.querySelector('#lgErr');
        if (!email) { err.textContent = "Écris d'abord ton e-mail."; return; }
        await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin });
        err.textContent = 'Un lien de réinitialisation vient de partir par e-mail.';
      });
    });
  }

  S.boot = async function () {
    let cfg = null;
    try { const r = await fetch('/api/public-config', { cache: 'no-store' }); if (r.ok) cfg = await r.json(); } catch (e) { /* hors ligne ou fichier local */ }
    if (!cfg || !cfg.supabaseUrl || !window.supabase) { S.demo = true; return { demo: true }; }
    S.features = cfg.features || {};
    S.sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true } });
    let { data: { session } } = await S.sb.auth.getSession();
    // retour du lien "mot de passe oublié"
    if (location.hash.includes('type=recovery') && session) {
      const p = prompt('Nouveau mot de passe (8 caractères minimum)');
      if (p && p.length >= 8) await S.sb.auth.updateUser({ password: p });
      history.replaceState(null, '', location.pathname);
    }
    if (!session) session = await loginUI(S.sb);
    S.user = session.user;
    const { data: prof } = await S.sb.from('staff_users').select('name,role').eq('user_id', S.user.id).maybeSingle();
    if (!prof) {
      await S.sb.auth.signOut();
      await loginUI(S.sb, "Ce compte n'a pas encore d'accès. Demande à la direction de l'ajouter à l'équipe.");
      location.reload();
      return new Promise(() => {});
    }
    S.profile = prof;
    return { demo: false, profile: prof };
  };

  S.loadAll = async function () {
    const rows = [];
    for (let off = 0; ; off += 1000) {
      const { data, error } = await S.sb.from('records').select('kind,id,data').neq('kind', 'wa_msg').order('kind').order('id').range(off, off + 999);
      if (error) throw error;
      rows.push(...data);
      if (data.length < 1000) break;
    }
    const since = new Date(Date.now() - 30 * 864e5).toISOString();
    for (let off = 0; ; off += 1000) {
      const { data, error } = await S.sb.from('records').select('kind,id,data').eq('kind', 'wa_msg').gte('data->>at', since).order('id').range(off, off + 999);
      if (error) throw error;
      rows.push(...data);
      if (data.length < 1000) break;
    }
    return rows;
  };

  function current() {
    const m = new Map();
    const C = S.coll();
    for (const kind in C) for (const [id, o] of C[kind]()) m.set(kind + SEP + id, o);
    return m;
  }

  S.prime = function () {
    S.snap = new Map();
    current().forEach((o, k) => S.snap.set(k, JSON.stringify(o)));
    S.ready = true;
    setStatus('ok', 'Enregistré');
  };

  S.schedule = function () {
    if (S.demo || !S.ready) return;
    clearTimeout(S.timer);
    S.timer = setTimeout(S.flush, 600);
  };

  S.dirty = () => !!S.timer || !!S.busy;

  S.flush = async function () {
    if (S.demo || !S.ready) return;
    clearTimeout(S.timer); S.timer = null;
    if (S.busy) { S.again = true; return S.busy; }
    S.busy = (async () => {
      await null; // laisse S.busy être assigné avant le bloc finally
      try {
        const m = current(), ups = [], dels = [];
        m.forEach((o, k) => { const j = JSON.stringify(o); if (S.snap.get(k) !== j) ups.push([k, j]); });
        S.snap.forEach((_, k) => { if (!m.has(k)) dels.push(k); });
        if (!ups.length && !dels.length) return;
        setStatus('saving', 'Enregistrement…');
        for (let i = 0; i < ups.length; i += 400) {
          const chunk = ups.slice(i, i + 400);
          const rows = chunk.map(([k, j]) => { const [kind, id] = k.split(SEP); return { kind, id, data: JSON.parse(j), updated_at: new Date().toISOString(), updated_by: S.user.id }; });
          const { error } = await S.sb.from('records').upsert(rows, { onConflict: 'kind,id' });
          if (error) throw error;
          chunk.forEach(([k, j]) => S.snap.set(k, j));
        }
        const byKind = {};
        dels.forEach((k) => { const [kind, id] = k.split(SEP); (byKind[kind] = byKind[kind] || []).push(id); });
        for (const kind in byKind) {
          const { error } = await S.sb.from('records').delete().eq('kind', kind).in('id', byKind[kind]);
          if (error) throw error;
          byKind[kind].forEach((id) => S.snap.delete(kind + SEP + id));
        }
        setStatus('ok', 'Enregistré');
      } catch (e) {
        console.error(e);
        setStatus('error', 'Hors ligne · nouvel essai…');
        setTimeout(S.schedule, 5000);
      } finally {
        S.busy = null;
        if (S.again) { S.again = false; S.schedule(); }
      }
    })();
    return S.busy;
  };

  S.listen = function () {
    S.sb.channel('records-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'records' }, (p) => {
        const row = p.eventType === 'DELETE' ? p.old : p.new;
        if (!row || !row.kind) return;
        const k = row.kind + SEP + row.id;
        if (p.eventType === 'DELETE') {
          if (!S.snap.has(k) && row.kind !== 'wa_msg') return;
          S.snap.delete(k);
          S.onRemote('delete', row.kind, row.id);
          return;
        }
        const j = JSON.stringify(row.data);
        if (S.snap.get(k) === j) return; // notre propre enregistrement
        const norm = S.onRemote('upsert', row.kind, row.id, row.data);
        if (norm !== undefined && row.kind !== 'wa_msg') S.snap.set(k, JSON.stringify(norm));
      })
      .subscribe();
  };

  S.api = async function (path, body) {
    const { data: { session } } = await S.sb.auth.getSession();
    const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Erreur ' + r.status);
    return j;
  };

  S.logout = async function () { await S.flush(); await S.sb.auth.signOut(); location.reload(); };

  window.addEventListener('beforeunload', (e) => { if (!S.demo && S.dirty()) { S.flush(); e.preventDefault(); e.returnValue = ''; } });
  window.STORE = S;
})();
