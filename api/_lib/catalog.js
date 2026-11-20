// Catalogue et calculs partagés côté serveur.
// La source de vérité est le document "config" enregistré par l'appli (Réglages).
// Ces valeurs par défaut ne servent que si l'appli n'a encore rien enregistré.

export const DEFAULT_CONFIG = {
  ACT: {
    MR4: { name: 'Maverick R 240 CV · 4 places', short: 'Maverick R 4p', p: { 60: 1800, 120: 3200 }, seats: 4, fleet: 'buggy', tier: 'VIP' },
    MR2: { name: 'Maverick R 240 CV · 2 places', short: 'Maverick R 2p', p: { 60: 1600, 120: 3000 }, seats: 2, fleet: 'buggy', tier: 'VIP' },
    X34: { name: 'Maverick X3 Turbo 200 CV · 4 places', short: 'X3 Turbo 4p', p: { 60: 1500, 120: 2400 }, seats: 4, fleet: 'buggy', tier: 'Best seller' },
    X32: { name: 'Maverick X3 Turbo 200 CV · 2 places', short: 'X3 Turbo 2p', p: { 60: 1300, 120: 2200 }, seats: 2, fleet: 'buggy', tier: 'Best seller' },
    SP4: { name: 'Maverick Sport 95 CV · 4 places', short: 'Sport 4p', p: { 60: 1200, 120: 2000 }, seats: 4, fleet: 'buggy', tier: 'Good deal' },
    SP2: { name: 'Maverick Sport 95 CV · 2 places', short: 'Sport 2p', p: { 60: 950, 120: 1800 }, seats: 2, fleet: 'buggy', tier: 'Good deal' },
    GRZ: { name: 'Grizzly 350cc · 2 pers.', short: 'Grizzly 350', p: { 60: 350, 120: 550 }, seats: 2, fleet: 'quad', tier: 'Automatic' },
    OUT: { name: 'Can-Am Outlander 650cc · 1 pers.', short: 'Outlander 650', p: { 60: 500, 120: 800 }, seats: 1, fleet: 'quad', tier: 'Automatic' },
    RAP: { name: 'Raptor 700cc · 1 pers.', short: 'Raptor 700', p: { 60: 500, 120: 800 }, seats: 1, fleet: 'quad', tier: 'Manual' },
    KTM: { name: 'KTM 450cc · 1 pers.', short: 'KTM 450', p: { 60: 550, 120: 850 }, seats: 1, fleet: 'bike', tier: 'Manual', gear: true },
  },
  SAFARI: {
    adult: ['Safari adulte', 350], vip: ['Safari adulte VIP', 450], child: ['Safari enfant', 250],
    baby: ['Safari bébé', 0], private: ['Safari voiture privée (5 pers.)', 1500],
  },
  OPTIONS: {
    transport: ['Transport aller-retour', 500], bbq: ['Barbecue', 150], breakfast: ['Breakfast morning', 120],
    gopro: ['Photos & vidéo GoPro', 150], camel: ['Balade à dos de chameau', 50], tent: ['Tente VIP privée', 300],
  },
  CFG: { member: 20, aiOn: true, reviewUrl: '', ownerWa: '', feedbackAgents: true },
};

export function withDefaults(cfg) {
  const c = cfg || {};
  return {
    ACT: c.ACT && Object.keys(c.ACT).length ? c.ACT : DEFAULT_CONFIG.ACT,
    SAFARI: c.SAFARI || DEFAULT_CONFIG.SAFARI,
    OPTIONS: c.OPTIONS || DEFAULT_CONFIG.OPTIONS,
    CFG: { ...DEFAULT_CONFIG.CFG, ...(c.CFG || {}) },
  };
}

export const r2 = (n) => Math.round((+n || 0) * 100) / 100;
export const aed = (n) => r2(n).toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' AED';
export const digits = (p) => String(p || '').replace(/\D/g, '').replace(/^00/, '');
const TZ = 4 * 3600e3;
export const dubaiDate = (t = Date.now()) => new Date(t + TZ).toISOString().slice(0, 10);
export const dubaiTime = (t = Date.now()) => new Date(t + TZ).toISOString().slice(11, 16);

const fleetItems = (b) => Object.entries(b.items || {}).filter(([, q]) => q > 0);
export const priceOf = (cat, m, d) => cat.ACT[m]?.p?.[d] ?? null;
const unitOf = (cat, b, m) => b.unit?.[m] ?? priceOf(cat, m, b.dur) ?? 0;
const sPrice = (cat, b, k) => b.sunit?.[k] ?? cat.SAFARI[k]?.[1] ?? 0;
const oPrice = (cat, b, k) => b.oprice?.[k] ?? cat.OPTIONS[k]?.[1] ?? 0;

// Même calcul que l'appli : commission uniquement sur les activités, jamais sur les options.
export function calc(cat, b) {
  const act = r2(fleetItems(b).reduce((s, [m, q]) => s + unitOf(cat, b, m) * q, 0)
    + Object.entries(b.safari || {}).reduce((s, [k, q]) => s + sPrice(cat, b, k) * q, 0));
  const disc = b.member ? r2(act * cat.CFG.member / 100) : 0;
  const actNet = r2(act - disc);
  const opt = r2((b.options || []).reduce((s, k) => s + oPrice(cat, b, k), 0));
  const total = r2(actNet + opt);
  const pct = b.agentId ? +b.pct || 0 : 0;
  const agentPart = r2(actNet * pct / 100);
  const pays = b.pays || [];
  const paidAgent = r2(pays.filter((p) => p.mode === 'agent').reduce((s, p) => s + p.amount, 0));
  const paid = r2(pays.reduce((s, p) => s + p.amount, 0));
  const rest = ['cancelled', 'noshow'].includes(b.status) ? 0 : r2(Math.max(0, total - paid));
  return { act, disc, actNet, opt, total, pct, agentPart, wildPart: r2(total - agentPart), paidAgent, paid, rest, agentOwes: r2(paidAgent - agentPart) };
}

const SAF_SHORT = { adult: 'Safari', vip: 'Safari VIP', child: 'Safari enfant', baby: 'Bébé', private: 'Safari privé' };
export function svcLabel(cat, b) {
  return [
    ...fleetItems(b).map(([m, q]) => (cat.ACT[m]?.short || m) + (q > 1 ? ' ×' + q : '')),
    ...Object.entries(b.safari || {}).filter(([, q]) => q).map(([k, q]) => SAF_SHORT[k] + (q > 1 ? ' ×' + q : '')),
  ].join(' + ') || '—';
}
export const durOf = (b) => (Object.values(b.safari || {}).some((q) => q > 0) && !fleetItems(b).length ? 360 : b.dur || 60);
export const gearLines = (cat, b) => Object.entries(b.gear || {}).flatMap(([m, arr]) => (arr || []).map((g, i) =>
  `${cat.ACT[m]?.short || m} pilote ${i + 1} : casque ${g.helmet || '?'} · tenue ${g.suit || '?'} · bottes ${g.boots || '?'}`));

const fmtLong = (d, lang = 'fr') => new Date(d + 'T12:00:00Z').toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'ru' ? 'ru-RU' : lang === 'ar' ? 'ar-AE' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
export { fmtLong };

// Message récap pour l'agent (mêmes lignes que dans l'appli).
export function agentMsg(cat, b, agent) {
  const c = calc(cat, b);
  return [
    '*Booking confirmé – Wild Adventures*', b.num,
    'Client : ' + b.client,
    'Date : ' + fmtLong(b.date) + ' à ' + b.time,
    'Activité : ' + svcLabel(cat, b) + (fleetItems(b).length ? ' (' + (b.dur === 120 ? '2 h' : '1 h') + ')' : '') + (c.disc ? ' (remise member −' + cat.CFG.member + ' %)' : ''),
    'Prix activités : ' + aed(c.actNet),
    ...((b.options || []).length ? ['Options (sans commission) : ' + b.options.map((k) => cat.OPTIONS[k]?.[0] || k).join(', ')] : []),
    'Commission ' + c.pct + ' % : ' + aed(c.agentPart),
    "Payé à l'agent : " + aed(c.paidAgent),
    c.agentOwes > 0.01 ? 'À reverser à Wild : ' + aed(c.agentOwes) : c.agentOwes < -0.01 ? 'Wild vous doit : ' + aed(-c.agentOwes) : 'Solde : réglé',
    'Reste à payer sur place : ' + aed(c.rest),
    'Lieu : Wild Adventures, Al Badayer',
  ].join('\n');
}
