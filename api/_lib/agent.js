// Cœur de l'automatisation WhatsApp.
// deps = { db, wa, claude, cal, now() } : injectés pour pouvoir tout tester sans réseau.
import crypto from 'node:crypto';
import { withDefaults, calc, svcLabel, agentMsg, aed, digits, dubaiDate, dubaiTime, fmtLong, priceOf } from './catalog.js';
import { tx } from './texts.js';

const iso = (d) => new Date(d.now()).toISOString();
const uid = () => crypto.randomUUID();
const HISTORY = 16;

export async function loadCat(db) { return withDefaults(await db.get('doc', 'config')); }
async function agentsMap(db) { return Object.fromEntries((await db.list('agent')).map((a) => [a.id, a])); }
async function findClient(db, phone) { const d = digits(phone); return d ? (await db.list('client')).find((c) => digits(c.phone) === d) || null : null; }
const firstName = (n) => String(n || '').trim().split(/\s+/)[0] || '';

async function logMsg(db, d, { phone, dir, text, by, waId, via }) {
  const id = waId || uid();
  await db.put('wa_msg', id, { id, phone: digits(phone), dir, text, by, via: via || '', at: iso(d), status: dir === 'out' ? 'sent' : 'received' });
}

function newConv(phone) {
  return { id: digits(phone), phone: '+' + digits(phone), name: '', role: 'client', agentId: '', stage: 'idle', draftId: null, human: false, humanUntil: null, needsHuman: false, unread: 0, lang: '', history: [], lastAt: null, lastInAt: null, lastText: '' };
}
const pushHist = (conv, r, t) => { conv.history = [...(conv.history || []), { r, t }].slice(-HISTORY); };

async function reply(d, conv, text, by = 'ai') {
  const r = await d.wa.sendText(conv.phone, text);
  await logMsg(d.db, d, { phone: conv.phone, dir: 'out', text, by, waId: r || undefined });
  pushHist(conv, 'assistant', text);
  conv.lastAt = iso(d); conv.lastText = text;
}

/* ---------- Message reçu ---------- */
export async function handleIncoming(m, d) {
  const db = d.db;
  if (await db.get('wa_msg', m.id)) return { action: 'duplicate' }; // Meta peut renvoyer le même webhook
  const cat = await loadCat(db);
  await logMsg(db, d, { phone: m.from, dir: 'in', text: m.text || `[${m.type}]`, by: 'contact', waId: m.id });

  const conv = (await db.get('wa_conv', digits(m.from))) || newConv(m.from);
  const agent = (await db.list('agent')).find((a) => a.phone && digits(a.phone) === digits(m.from)) || null;
  conv.role = agent ? 'agent' : 'client';
  conv.agentId = agent ? agent.id : '';
  conv.name = agent ? agent.name : conv.name || m.name || '';
  conv.lastAt = conv.lastInAt = iso(d);
  conv.lastText = m.text || `[${m.type}]`;
  conv.unread = (conv.unread || 0) + 1;
  pushHist(conv, 'user', m.text || `[${m.type}]`);

  const humanActive = conv.human || (conv.humanUntil && conv.humanUntil > iso(d));
  if (!cat.CFG.aiOn || humanActive) { await db.put('wa_conv', conv.id, conv); return { action: 'logged' }; }

  if (!m.text) {
    conv.needsHuman = true;
    await reply(d, conv, tx(conv.lang).textOnly());
    await db.put('wa_conv', conv.id, conv);
    return { action: 'non_text' };
  }

  if (conv.role === 'client' && conv.stage === 'await_feedback' && conv.feedbackBookingId) {
    const r = await handleFeedback(m, conv, cat, d);
    await db.put('wa_conv', conv.id, conv);
    return r;
  }

  let draft = conv.draftId ? await db.get('booking', conv.draftId) : null;
  if (draft && draft.status !== 'draft') draft = null;
  const now = d.now();
  const res = await d.claude.decide({
    role: conv.role, agent, name: conv.name, cat, draft: draft && publicDraft(draft), history: conv.history, text: m.text,
    today: dubaiDate(now), time: dubaiTime(now), weekday: new Date(now + 4 * 3600e3).toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' }),
  });
  conv.lang = res.language || conv.lang || 'en';
  let action = res.intent;

  if ((res.intent === 'new_booking' || res.intent === 'update_booking') && res.booking) {
    const isNew = !draft;
    draft = await buildDraft(res.booking, draft, { conv, agent, m, cat, d, missing: res.missing || [] });
    await db.put('booking', draft.id, draft);
    conv.draftId = draft.id;
    conv.stage = draft.missing.length ? 'collecting' : 'pending_validation';
    action = isNew ? 'draft_created' : 'draft_updated';
  }
  if (res.intent === 'cancel_request' || res.needs_human) conv.needsHuman = true;
  if (res.reply) await reply(d, conv, res.reply);
  await db.put('wa_conv', conv.id, conv);
  return { action, draftId: conv.draftId, missing: res.missing || [] };
}

const publicDraft = (b) => ({ client: b.client, phone: b.phone, date: b.date, time: b.time, dur: b.dur, items: b.items, safari: b.safari, options: b.options, demands: b.demands, paid: b.pays, missing: b.missing });

async function buildDraft(x, prev, { conv, agent, m, cat, d, missing }) {
  const b = prev ? structuredClone(prev) : {
    id: uid(), num: '', status: 'draft', source: 'whatsapp', createdAt: iso(d),
    items: {}, unit: {}, safari: {}, sunit: {}, options: [], oprice: {}, gear: {}, demands: [], pays: [], vehicles: [], ext: {},
    guide: '', contract: false, briefing: false, arrivedAt: null, alerted: {}, after: null, notes: '', history: [], dur: 60, member: false,
    agentId: agent ? agent.id : '', pct: agent ? +agent.pct || 0 : 0, channel: agent ? 'Agent / plateforme' : 'WhatsApp',
    waFrom: '+' + digits(m.from), waRole: conv.role, waText: '', client: '', phone: '', date: '', time: '',
  };
  if (x.client_name) b.client = x.client_name;
  if (conv.role === 'client') b.phone = '+' + digits(m.from);
  else if (x.client_phone) b.phone = x.client_phone;
  if (x.date) b.date = x.date;
  if (x.time) b.time = x.time;
  if (x.duration_hours) b.dur = x.duration_hours === 2 ? 120 : 60;
  if (Array.isArray(x.items) && x.items.length) {
    b.items = {}; b.unit = {};
    for (const it of x.items) {
      if (!cat.ACT[it.code] || !(it.qty > 0)) continue;
      b.items[it.code] = (b.items[it.code] || 0) + it.qty;
      b.unit[it.code] = it.unit_price > 0 ? it.unit_price : priceOf(cat, it.code, b.dur) ?? 0;
    }
  } else { // la durée a pu changer : on recalcule les prix catalogue
    for (const k of Object.keys(b.items)) if (!x.items) b.unit[k] = b.unit[k] ?? priceOf(cat, k, b.dur);
  }
  if (x.safari && Object.values(x.safari).some((q) => q > 0)) b.safari = Object.fromEntries(Object.entries(x.safari).filter(([k, q]) => cat.SAFARI[k] && q > 0));
  if (Array.isArray(x.options)) b.options = [...new Set(x.options.filter((k) => cat.OPTIONS[k]))];
  if (Array.isArray(x.demands) && x.demands.length) b.demands = x.demands.map((t) => ({ tag: t, detail: '' }));
  if (x.notes) b.notes = x.notes;
  if (agent && x.paid_to_agent > 0) b.pays = [{ mode: 'agent', amount: +x.paid_to_agent, at: dubaiTime(d.now()) }];
  for (const k of Object.keys(b.items)) if (cat.ACT[k]?.gear) b.gear[k] = (b.gear[k] || []).slice(0, b.items[k]);
  const c = await findClient(d.db, b.phone);
  if (c) { b.member = !!c.member; if (!b.client) b.client = c.name; } // nom du registre en priorité
  if (!b.client && conv.role === 'client') b.client = m.name || ''; // sinon le nom WhatsApp
  if (!b.num && b.date) b.num = await nextNum(d.db, b.date);
  b.missing = missing;
  b.waText = [b.waText, m.text].filter(Boolean).join('\n').slice(-1500);
  b.history.push({ t: dubaiTime(d.now()), x: (prev ? 'Mis à jour' : 'Reçu') + ' par WhatsApp · ' + (agent ? 'agent ' + agent.name : 'client direct') + (missing.length ? ' · manque : ' + missing.join(', ') : '') });
  return b;
}

async function nextNum(db, date) {
  const n = (await db.list('booking', { 'data->>date': 'eq.' + date })).length + 1;
  return 'WA-' + date.slice(2).replace(/-/g, '') + '-' + String(n).padStart(2, '0');
}

/* ---------- Réponse au message de suivi (20 h) ---------- */
async function handleFeedback(m, conv, cat, d) {
  const b = await d.db.get('booking', conv.feedbackBookingId);
  const res = await d.claude.classifyFeedback({ text: m.text, lang: conv.lang });
  conv.lang = res.language || conv.lang;
  conv.stage = 'idle'; conv.feedbackBookingId = null;
  if (!b) { if (res.reply) await reply(d, conv, res.reply); return { action: 'feedback_orphan' }; }
  b.feedback = { ...(b.feedback || {}), answer: m.text, sentiment: res.sentiment, answeredAt: iso(d) };
  const after = b.after || { accident: 'non', note: '' };
  let text = res.reply || '';
  if (res.sentiment === 'positive') {
    after.mood = 'content';
    if (cat.CFG.reviewUrl) {
      text = (text ? text + '\n\n' : '') + tx(conv.lang).review(cat.CFG.reviewUrl);
      after.review = 'lien'; b.feedback.reviewSentAt = iso(d);
    } else after.review = after.review || 'pas';
    b.history.push({ t: dubaiTime(d.now()), x: 'Client satisfait (WhatsApp)' + (cat.CFG.reviewUrl ? ' · lien avis Google envoyé' : '') });
  } else {
    after.mood = res.sentiment === 'neutral' ? 'moyen' : 'mecontent';
    after.review = 'pas';
    b.feedback.needsFollowUp = true;
    conv.needsHuman = true;
    b.history.push({ t: dubaiTime(d.now()), x: 'Client ' + (res.sentiment === 'neutral' ? 'mitigé' : 'mécontent') + ' (WhatsApp) : « ' + m.text.slice(0, 200) + ' » · pas de lien avis' });
    if (cat.CFG.ownerWa) {
      try { await d.wa.sendText(cat.CFG.ownerWa, `⚠️ Client ${res.sentiment === 'neutral' ? 'mitigé' : 'mécontent'} : ${b.client} (${b.phone})\n${b.num} · ${svcLabel(cat, b)}\n« ${m.text.slice(0, 300)} »`); } catch (e) { /* le responsable n'a pas écrit depuis 24 h : l'alerte reste visible dans l'appli */ }
    }
  }
  b.after = after;
  await d.db.put('booking', b.id, b);
  if (text) await reply(d, conv, text);
  return { action: 'feedback_' + res.sentiment, bookingId: b.id };
}

/* ---------- Validation par la réception : agenda + confirmation ---------- */
export async function confirmBooking(id, { notify = true, by = '' } = {}, d) {
  const db = d.db;
  const b = await db.get('booking', id);
  if (!b) throw Object.assign(new Error('Booking introuvable'), { status: 404 });
  const cat = await loadCat(db);
  const agents = await agentsMap(db);
  const out = { calendar: 'off', whatsapp: notify ? 'skipped' : 'off' };
  if (d.cal) {
    try { b.calEventId = await d.cal.upsert(cat, b, agents); out.calendar = 'ok'; } catch (e) { out.calendar = 'error'; out.calendarError = e.message; }
  }
  if (notify && d.wa) {
    const c = calc(cat, b);
    const ag = b.agentId ? agents[b.agentId] : null;
    // Agent : récap avec commission. Client direct : simple confirmation, aucune commission.
    const to = ag ? ag.phone : b.phone;
    if (!to) out.whatsapp = 'no_phone';
    else {
      const conv = (await db.get('wa_conv', digits(to))) || newConv(to);
      const lang = conv.lang || 'en';
      const text = ag ? agentMsg(cat, b, ag) : tx(lang).confirm({ name: firstName(b.client), date: fmtLong(b.date, lang), time: b.time, activity: svcLabel(cat, b), options: (b.options || []).map((k) => cat.OPTIONS[k]?.[0]).join(', '), rest: c.rest, restTxt: aed(c.rest) });
      const template = ag
        ? { name: process.env.WA_TPL_AGENT, lang: 'fr', params: [ag.name, b.num, b.client, fmtLong(b.date), b.time, svcLabel(cat, b), aed(c.agentPart), c.agentOwes > 0.01 ? 'À reverser à Wild : ' + aed(c.agentOwes) : c.agentOwes < -0.01 ? 'Wild vous doit : ' + aed(-c.agentOwes) : 'Réglé'] }
        : { name: process.env.WA_TPL_CONFIRM, lang, params: [firstName(b.client) || 'there', fmtLong(b.date, lang), b.time, svcLabel(cat, b), c.rest > 0 ? aed(c.rest) : '0 AED'] };
      try {
        const r = await d.wa.send(to, text, { lastInAt: conv.lastInAt, template });
        await logMsg(db, d, { phone: to, dir: 'out', text, by: by || 'staff', waId: r.id || undefined, via: r.via });
        conv.lastAt = iso(d); conv.lastText = text; pushHist(conv, 'assistant', text);
        if (conv.draftId === id) { conv.draftId = null; conv.stage = 'idle'; }
        await db.put('wa_conv', conv.id, conv);
        out.whatsapp = r.via === 'template' ? 'template' : r.outsideWindow ? 'sent_outside_window' : 'ok';
        out.to = ag ? ag.name : b.client;
      } catch (e) { out.whatsapp = 'error'; out.whatsappError = e.message; }
    }
  }
  b.history = b.history || [];
  b.history.push({ t: dubaiTime(d.now()), x: 'Confirmé' + (by ? ' par ' + by : '') + ' · agenda : ' + label(out.calendar) + ' · WhatsApp : ' + label(out.whatsapp) });
  await db.put('booking', b.id, b);
  return out;
}
const label = (s) => ({ ok: 'ok', off: 'non configuré', skipped: 'non envoyé', no_phone: 'pas de numéro', error: 'erreur', template: 'ok (modèle)', sent_outside_window: 'envoyé (hors fenêtre 24 h)' }[s] || s);

/* ---------- Modification / annulation : mise à jour de l'agenda ---------- */
export async function syncBooking(id, { deleted = false, calEventId = null } = {}, d) {
  if (!d.cal) return { calendar: 'off' };
  if (deleted) { await d.cal.remove(calEventId); return { calendar: 'removed' }; }
  const b = await d.db.get('booking', id);
  if (!b) return { calendar: 'missing' };
  if (['cancelled', 'noshow', 'draft'].includes(b.status)) {
    if (b.calEventId) { await d.cal.remove(b.calEventId); delete b.calEventId; await d.db.put('booking', b.id, b); return { calendar: 'removed' }; }
    return { calendar: 'none' };
  }
  const cat = await loadCat(d.db);
  const evId = await d.cal.upsert(cat, b, await agentsMap(d.db));
  if (evId !== b.calEventId) { b.calEventId = evId; await d.db.put('booking', b.id, b); }
  return { calendar: 'ok' };
}

/* ---------- 20 h : demander au client s'il est content ---------- */
export async function runFeedback(d, { date } = {}) {
  const db = d.db;
  const day = date || dubaiDate(d.now());
  const cat = await loadCat(db);
  const bookings = await db.list('booking', { 'data->>date': 'eq.' + day, 'data->>status': 'eq.done' });
  const sent = [], skipped = [];
  const seen = new Set();
  for (const b of bookings) {
    const why = b.feedback?.askedAt ? 'déjà demandé' : !b.phone ? 'pas de numéro' : b.agentId && !cat.CFG.feedbackAgents ? 'client agent' : seen.has(digits(b.phone)) ? 'même client' : '';
    if (why) { skipped.push({ id: b.id, why }); continue; }
    seen.add(digits(b.phone));
    const conv = (await db.get('wa_conv', digits(b.phone))) || newConv(b.phone);
    if (!conv.name) conv.name = b.client;
    const lang = conv.lang || 'en';
    const text = tx(lang).feedback({ name: firstName(b.client) });
    try {
      const r = await d.wa.send(b.phone, text, { lastInAt: conv.lastInAt, template: { name: process.env.WA_TPL_FEEDBACK, lang, params: [firstName(b.client) || 'there'] } });
      await logMsg(db, d, { phone: b.phone, dir: 'out', text, by: 'ai', waId: r.id || undefined, via: r.via });
      b.feedback = { askedAt: iso(d), via: r.via };
      b.history = [...(b.history || []), { t: dubaiTime(d.now()), x: 'Message de suivi envoyé (satisfaction)' }];
      await db.put('booking', b.id, b);
      conv.stage = 'await_feedback'; conv.feedbackBookingId = b.id; conv.lastAt = iso(d); conv.lastText = text; pushHist(conv, 'assistant', text);
      await db.put('wa_conv', conv.id, conv);
      sent.push(b.id);
    } catch (e) { skipped.push({ id: b.id, why: 'erreur : ' + e.message }); }
  }
  return { date: day, sent: sent.length, skipped };
}

/* ---------- Réponse manuelle depuis l'appli ---------- */
export async function sendManual(phone, text, by, d) {
  const conv = (await d.db.get('wa_conv', digits(phone))) || newConv(phone);
  const id = await d.wa.sendText(conv.phone, text);
  await logMsg(d.db, d, { phone, dir: 'out', text, by: 'staff:' + (by || ''), waId: id || undefined });
  conv.human = true; conv.needsHuman = false; conv.unread = 0; conv.lastAt = iso(d); conv.lastText = text; pushHist(conv, 'assistant', text);
  await d.db.put('wa_conv', conv.id, conv);
  return { ok: true };
}

/* ---------- Coexistence : l'équipe répond depuis le téléphone ---------- */
export async function markHumanFromEcho(e, d) {
  const conv = await d.db.get('wa_conv', digits(e.to));
  if (!conv) return;
  conv.humanUntil = new Date(d.now() + 6 * 3600e3).toISOString(); // l'agent IA se tait 6 h dans cette conversation
  if (e.text) { pushHist(conv, 'assistant', e.text); await logMsg(d.db, d, { phone: e.to, dir: 'out', text: e.text, by: 'phone' }); }
  conv.lastAt = iso(d);
  await d.db.put('wa_conv', conv.id, conv);
}

export async function updateStatus(s, d) {
  const msg = await d.db.get('wa_msg', s.id);
  if (!msg) return;
  msg.status = s.status;
  if (s.error) msg.error = (s.error.code || '') + ' ' + (s.error.title || s.error.message || '');
  await d.db.put('wa_msg', s.id, msg);
}
