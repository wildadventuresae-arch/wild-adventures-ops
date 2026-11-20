// Google Agenda par compte de service (aucune dépendance).
// L'agenda doit être partagé avec l'adresse e-mail du compte de service ("Modifier les événements").
import crypto from 'node:crypto';
import { calc, svcLabel, durOf, gearLines, aed } from './catalog.js';

const b64u = (s) => Buffer.from(s).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

export function signJwt(sa, now = Math.floor(Date.now() / 1000)) {
  const head = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64u(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/calendar', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const sig = crypto.createSign('RSA-SHA256').update(head + '.' + claim).sign(sa.private_key).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return head + '.' + claim + '.' + sig;
}

const addMin = (date, time, min) => {
  const t = Date.parse(`${date}T${time}:00Z`) + min * 60000; // heure "murale" de Dubaï
  return new Date(t).toISOString().slice(0, 19);
};

export function eventBody(cat, b, agents = {}) {
  const c = calc(cat, b);
  const ag = b.agentId ? agents[b.agentId] : null;
  const lines = [
    b.num, '📞 ' + (b.phone || '—'),
    ag ? `Agent : ${ag.name} (${c.pct} %)` : 'Canal : ' + (b.channel || '—'),
    'Total : ' + aed(c.total) + ' · reste sur place : ' + aed(c.rest),
    ...((b.options || []).length ? ['Options : ' + b.options.map((k) => cat.OPTIONS[k]?.[0] || k).join(', ')] : []),
    ...((b.demands || []).length ? ['Demandes : ' + b.demands.map((d) => d.tag + (d.detail ? ' (' + d.detail + ')' : '')).join(', ')] : []),
    ...gearLines(cat, b),
    ...(b.notes ? ['Note : ' + b.notes] : []),
  ];
  return {
    summary: `${b.client} · ${svcLabel(cat, b)}${b.member ? ' · member' : ''}`,
    location: 'Wild Adventures, Al Badayer',
    description: lines.join('\n'),
    start: { dateTime: addMin(b.date, b.time, 0), timeZone: 'Asia/Dubai' },
    end: { dateTime: addMin(b.date, b.time, durOf(b)), timeZone: 'Asia/Dubai' },
  };
}

export function makeCalendar({ sa = process.env.GOOGLE_SERVICE_ACCOUNT, calendarId = process.env.GOOGLE_CALENDAR_ID, fetchImpl = fetch } = {}) {
  if (!sa || !calendarId) throw new Error('GOOGLE_SERVICE_ACCOUNT / GOOGLE_CALENDAR_ID manquants');
  const account = typeof sa === 'string' ? JSON.parse(sa) : sa;
  let token = null, exp = 0;
  async function auth() {
    if (token && Date.now() < exp) return token;
    const r = await fetchImpl('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: signJwt(account) }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error('Google auth: ' + (j.error_description || j.error || r.status));
    token = j.access_token; exp = Date.now() + (j.expires_in - 60) * 1000;
    return token;
  }
  const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
  async function call(method, path, body) {
    const r = await fetchImpl(base + path, { method, headers: { Authorization: 'Bearer ' + (await auth()), 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 404 || r.status === 410) return { gone: true };
    const j = r.status === 204 ? {} : await r.json();
    if (!r.ok) throw new Error('Google Agenda: ' + (j.error?.message || r.status));
    return j;
  }
  return {
    async upsert(cat, b, agents) {
      const body = eventBody(cat, b, agents);
      if (b.calEventId) { const r = await call('PATCH', '/' + encodeURIComponent(b.calEventId), body); if (!r.gone) return r.id; }
      return (await call('POST', '', body)).id;
    },
    async remove(eventId) { if (eventId) await call('DELETE', '/' + encodeURIComponent(eventId)); },
  };
}
