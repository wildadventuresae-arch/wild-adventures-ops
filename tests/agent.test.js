import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { memDb } from '../api/_lib/db.js';
import { handleIncoming, confirmBooking, runFeedback, syncBooking, sendManual, markHumanFromEcho } from '../api/_lib/agent.js';
import { calc, withDefaults, agentMsg } from '../api/_lib/catalog.js';
import { verifySignature, parseWebhook, makeWa } from '../api/_lib/whatsapp.js';
import { signJwt, eventBody } from '../api/_lib/calendar.js';

const NOW = Date.parse('2026-11-20T10:00:00Z'); // 14:00 à Dubaï
const AGENT = { id: 'a2', name: 'Karim Tours', pct: 20, phone: '+971 55 000 0000' };

function deps(seed = {}, claudeAnswers = []) {
  const sent = [];
  const answers = [...claudeAnswers];
  const db = memDb({ agent: { a2: AGENT }, client: { c1: { _id: 'c1', name: 'Khalid Al Mansoori', phone: '+971 50 222 1188', member: true } }, doc: { config: { CFG: { member: 20, aiOn: true, reviewUrl: 'https://g.page/r/WILD/review', ownerWa: '+971563331185', feedbackAgents: true } } }, ...seed });
  return {
    sent,
    d: {
      db, now: () => NOW,
      wa: {
        sendText: async (to, text) => { sent.push({ to, text, via: 'text' }); return 'wamid.out' + sent.length; },
        send: async (to, text, { lastInAt, template } = {}) => {
          const open = lastInAt && NOW - Date.parse(lastInAt) < 864e5;
          sent.push({ to, text, via: open || !template?.name ? 'text' : 'template', template: template?.name });
          return { id: 'wamid.out' + sent.length, via: open || !template?.name ? 'text' : 'template', outsideWindow: !open };
        },
      },
      claude: {
        decide: async (ctx) => { const a = answers.shift(); assert.ok(a, 'réponse Claude attendue'); a.check?.(ctx); return a.out; },
        classifyFeedback: async () => { const a = answers.shift(); return a.out; },
      },
      cal: { calls: [], async upsert(cat, b) { this.calls.push(['upsert', b.id]); return b.calEventId || 'ev_' + b.id.slice(0, 4); }, async remove(id) { this.calls.push(['remove', id]); } },
    },
  };
}
const msg = (from, text, id = crypto.randomUUID()) => ({ id, from, name: 'WhatsApp Name', type: 'text', text, ts: NOW });

test('calcul identique à l\'appli : member −20 % sur activités, options sans remise ni commission', () => {
  const cat = withDefaults({});
  const b = { items: { X32: 2 }, dur: 60, options: ['gopro'], member: true, pays: [{ mode: 'card', amount: 2230 }] };
  const c = calc(cat, b);
  assert.equal(c.total, 2230); // 2×1300 = 2600 − 520 + 150
  assert.equal(c.rest, 0);
  const a = calc(cat, { items: { SP2: 1, SP4: 1 }, dur: 60, member: true, agentId: 'a2', pct: 20, options: ['transport'], pays: [{ mode: 'agent', amount: 1000 }] });
  assert.equal(a.actNet, 1720);
  assert.equal(a.agentPart, 344); // commission sur 1720 seulement, pas sur le transport
  assert.equal(a.agentOwes, 656);
  assert.equal(a.rest, 1220);
});

test('agent connu : brouillon avec commission, rien envoyé au client', async () => {
  const { d, sent } = deps({}, [{
    check: (ctx) => { assert.equal(ctx.role, 'agent'); assert.equal(ctx.agent.name, 'Karim Tours'); },
    out: { intent: 'new_booking', language: 'en', reply: 'Received, the team confirms shortly.', missing: [], needs_human: false,
      booking: { client_name: 'Chen Wei', date: '2026-11-21', time: '16:00', duration_hours: 1, items: [{ code: 'KTM', qty: 2 }], paid_to_agent: 1100 } },
  }]);
  const r = await handleIncoming(msg('971550000000', '2 KTM tomorrow 4pm for Chen Wei, he paid me 1100'), d);
  assert.equal(r.action, 'draft_created');
  const b = await d.db.get('booking', r.draftId);
  assert.equal(b.status, 'draft');
  assert.equal(b.agentId, 'a2');
  assert.equal(b.pct, 20);
  assert.equal(b.channel, 'Agent / plateforme');
  assert.deepEqual(b.items, { KTM: 2 });
  assert.equal(b.unit.KTM, 550);
  assert.equal(b.gear.KTM.length, 0);
  assert.deepEqual(b.pays, [{ mode: 'agent', amount: 1100, at: '14:00' }]);
  assert.equal(b.num, 'WA-261121-01');
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, '+971550000000'); // la réponse va à l'agent
  const conv = await d.db.get('wa_conv', '971550000000');
  assert.equal(conv.role, 'agent');
  assert.equal(conv.stage, 'pending_validation');
});

test('client direct : pas d\'agent, pas de commission, nom et téléphone repris de WhatsApp, membre reconnu', async () => {
  const { d } = deps({}, [{
    check: (ctx) => assert.equal(ctx.role, 'client'),
    out: { intent: 'new_booking', language: 'fr', reply: 'Merci ! Pour quelle heure ?', missing: ['time'], needs_human: false,
      booking: { date: '2026-11-22', items: [{ code: 'X32', qty: 1 }], duration_hours: 2 } },
  }, {
    out: { intent: 'update_booking', language: 'fr', reply: 'Parfait, l\'équipe vous confirme très vite.', missing: [], needs_human: false, booking: { time: '15:30' } },
  }]);
  const r1 = await handleIncoming(msg('971502221188', 'Bonjour, un X3 deux heures samedi'), d);
  let b = await d.db.get('booking', r1.draftId);
  assert.equal(b.agentId, '');
  assert.equal(b.pct, 0);
  assert.equal(b.phone, '+971502221188');
  assert.equal(b.client, 'Khalid Al Mansoori'); // registre clients
  assert.equal(b.member, true);
  assert.equal(b.unit.X32, 2200);
  assert.deepEqual(b.missing, ['time']);
  assert.equal((await d.db.get('wa_conv', '971502221188')).stage, 'collecting');
  const r2 = await handleIncoming(msg('971502221188', '15h30'), d);
  assert.equal(r2.action, 'draft_updated');
  b = await d.db.get('booking', r1.draftId);
  assert.equal(b.time, '15:30');
  assert.equal(calc(withDefaults({}), b).agentPart, 0);
  assert.equal((await d.db.get('wa_conv', '971502221188')).stage, 'pending_validation');
});

test('message reçu deux fois : traité une seule fois', async () => {
  const { d, sent } = deps({}, [{ out: { intent: 'question', language: 'en', reply: 'X3 Turbo 2 seats is 1300 AED for 1h.', missing: [], needs_human: false } }]);
  const m = msg('447700900123', 'price X3?', 'wamid.same');
  await handleIncoming(m, d);
  const r = await handleIncoming(m, d);
  assert.equal(r.action, 'duplicate');
  assert.equal(sent.length, 1);
});

test('validation : agent reçoit le récap avec commission ; client direct reçoit une simple confirmation', async () => {
  const base = { status: 'up', date: '2026-11-21', time: '16:00', dur: 60, items: { KTM: 2 }, unit: { KTM: 550 }, safari: {}, options: [], pays: [{ mode: 'agent', amount: 1100 }], history: [], num: 'WA-261121-01' };
  const { d, sent } = deps({
    booking: {
      b1: { ...base, id: 'b1', client: 'Chen Wei', phone: '', agentId: 'a2', pct: 20 },
      b2: { ...base, id: 'b2', client: 'Khalid Al Mansoori', phone: '+971502221188', agentId: '', pct: 0, member: true, pays: [] },
    },
  });
  const r1 = await confirmBooking('b1', { notify: true, by: 'Sara' }, d);
  assert.equal(r1.calendar, 'ok');
  assert.equal(sent[0].to, '+971 55 000 0000');
  assert.match(sent[0].text, /Commission 20 % : 220 AED/);
  assert.match(sent[0].text, /À reverser à Wild : 880 AED/);
  const r2 = await confirmBooking('b2', { notify: true }, d);
  assert.equal(sent[1].to, '+971502221188');
  assert.doesNotMatch(sent[1].text, /Commission/);
  assert.match(sent[1].text, /confirmed|confirmée/);
  assert.match(sent[1].text, /880 AED/); // 2×550 −20 % membre
  assert.equal(r2.whatsapp, 'sent_outside_window'); // pas de modèle configuré dans le test
  assert.equal((await d.db.get('booking', 'b2')).calEventId.startsWith('ev_'), true);
});

test('20 h : question de suivi, puis lien avis UNIQUEMENT si la réponse est positive', async () => {
  const done = (id, phone, client) => ({ id, status: 'done', date: '2026-11-20', time: '15:00', dur: 60, items: { SP2: 1 }, safari: {}, options: [], pays: [], history: [], client, phone, num: id });
  const { d, sent } = deps({ booking: { h: done('h', '+33612345678', 'Claire Martin'), s: done('s', '+447700900123', 'Emma Johnson'), x: { ...done('x', '', 'Sans Tel') } } }, [
    { out: { sentiment: 'positive', language: 'fr', reply: 'Merci beaucoup Claire !' } },
    { out: { sentiment: 'negative', language: 'en', reply: 'We are very sorry, our manager will call you.' } },
  ]);
  const r = await runFeedback(d);
  assert.equal(r.sent, 2);
  assert.equal(r.skipped.find((s) => s.id === 'x').why, 'pas de numéro');
  assert.match(sent[0].text, /How was your experience|Comment s'est passée/);

  await handleIncoming(msg('33612345678', 'Super, génial !'), d);
  const happy = await d.db.get('booking', 'h');
  assert.equal(happy.feedback.sentiment, 'positive');
  assert.equal(happy.after.review, 'lien');
  assert.match(sent.at(-1).text, /https:\/\/g\.page\/r\/WILD\/review/);

  const before = sent.length;
  await handleIncoming(msg('447700900123', 'The buggy broke down, not happy'), d);
  const sad = await d.db.get('booking', 's');
  assert.equal(sad.feedback.sentiment, 'negative');
  assert.equal(sad.after.mood, 'mecontent');
  assert.equal(sad.feedback.needsFollowUp, true);
  const newMsgs = sent.slice(before);
  assert.ok(newMsgs.every((m) => !m.text.includes('g.page')), 'aucun lien avis pour un client mécontent');
  assert.ok(newMsgs.some((m) => m.to === '+971563331185' && /mécontent/.test(m.text)), 'alerte au responsable');
  assert.equal((await d.db.get('wa_conv', '447700900123')).needsHuman, true);
  assert.equal((await runFeedback(d)).sent, 0, 'pas de deuxième message le même jour');
});

test('reprise en main : l\'agent IA se tait quand l\'équipe répond', async () => {
  const { d, sent } = deps({}, []);
  await d.db.put('wa_conv', '33755443322', { id: '33755443322', phone: '+33755443322', role: 'client', history: [], stage: 'idle' });
  await sendManual('+33755443322', 'Bonjour, c\'est Sara de Wild Adventures', 'Sara', d);
  const r = await handleIncoming(msg('33755443322', 'Merci Sara'), d);
  assert.equal(r.action, 'logged'); // aucune réponse automatique
  assert.equal(sent.length, 1);
  await d.db.put('wa_conv', '33600000000', { id: '33600000000', phone: '+33600000000', role: 'client', history: [], stage: 'idle' });
  await markHumanFromEcho({ to: '33600000000', text: 'Réponse depuis le téléphone' }, d);
  assert.equal((await handleIncoming(msg('33600000000', 'ok'), d)).action, 'logged');
});

test('agenda : annulation supprime l\'événement, modification le met à jour', async () => {
  const { d } = deps({ booking: { b: { id: 'b', status: 'up', date: '2026-11-21', time: '10:00', dur: 120, items: { MR4: 1 }, safari: {}, options: [], pays: [], client: 'X', phone: '', calEventId: 'ev1', history: [] } } });
  assert.equal((await syncBooking('b', {}, d)).calendar, 'ok');
  const b = await d.db.get('booking', 'b'); b.status = 'cancelled'; await d.db.put('booking', 'b', b);
  assert.equal((await syncBooking('b', {}, d)).calendar, 'removed');
  assert.deepEqual(d.cal.calls.at(-1), ['remove', 'ev1']);
});

test('événement Google Agenda : heure de Dubaï, durée, détails', () => {
  const cat = withDefaults({});
  const e = eventBody(cat, { num: 'WA-1', client: 'Chen Wei', phone: '+86', date: '2026-11-21', time: '16:30', dur: 120, items: { KTM: 1 }, gear: { KTM: [{ helmet: 'M', suit: 'L', boots: '42' }] }, safari: {}, options: ['gopro'], pays: [], agentId: 'a2', pct: 20, demands: [{ tag: 'Débutant', detail: '' }] }, { a2: AGENT });
  assert.equal(e.start.dateTime, '2026-11-21T16:30:00');
  assert.equal(e.end.dateTime, '2026-11-21T18:30:00');
  assert.equal(e.start.timeZone, 'Asia/Dubai');
  assert.match(e.description, /Karim Tours \(20 %\)/);
  assert.match(e.description, /casque M · tenue L · bottes 42/);
});

test('signature du webhook et lecture du message', () => {
  const raw = JSON.stringify({ entry: [{ changes: [{ field: 'messages', value: { contacts: [{ wa_id: '971501', profile: { name: 'Omar' } }], messages: [{ id: 'w1', from: '971501', timestamp: '1700000000', type: 'text', text: { body: ' Hello ' } }], statuses: [{ id: 'w0', status: 'delivered', recipient_id: '971501' }] } }] }] });
  const sig = 'sha256=' + crypto.createHmac('sha256', 'secret').update(raw).digest('hex');
  assert.equal(verifySignature(raw, sig, 'secret'), true);
  assert.equal(verifySignature(raw + ' ', sig, 'secret'), false);
  const p = parseWebhook(JSON.parse(raw));
  assert.deepEqual(p.messages[0], { id: 'w1', from: '971501', name: 'Omar', type: 'text', text: 'Hello', ts: 1700000000000 });
  assert.equal(p.statuses[0].status, 'delivered');
});

test('envoi WhatsApp : texte dans les 24 h, modèle approuvé au-delà', async () => {
  const calls = [];
  const wa = makeWa({ token: 't', phoneId: '1', fetchImpl: async (url, o) => { calls.push(JSON.parse(o.body)); return { ok: true, json: async () => ({ messages: [{ id: 'm' }] }) }; } });
  await wa.send('+971 50', 'hi', { lastInAt: new Date().toISOString(), template: { name: 'tpl', lang: 'fr', params: ['a'] } });
  await wa.send('+971 50', 'hi', { lastInAt: null, template: { name: 'tpl', lang: 'fr', params: ['a'] } });
  assert.equal(calls[0].type, 'text');
  assert.equal(calls[1].type, 'template');
  assert.equal(calls[1].template.language.code, 'fr');
  assert.equal(calls[1].to, '97150');
});

test('jeton Google signé en RS256 vérifiable', () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const sa = { client_email: 'bot@x.iam.gserviceaccount.com', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }) };
  const [h, c, s] = signJwt(sa, 1000).split('.');
  const ok = crypto.createVerify('RSA-SHA256').update(h + '.' + c).verify(publicKey, Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64'));
  assert.equal(ok, true);
  assert.equal(JSON.parse(Buffer.from(c, 'base64').toString()).scope, 'https://www.googleapis.com/auth/calendar');
});

test('récap agent : options listées sans commission', () => {
  const cat = withDefaults({});
  const t = agentMsg(cat, { num: 'WA-1', client: 'Ivan', date: '2026-11-21', time: '18:00', dur: 60, items: {}, safari: { private: 1 }, options: ['transport'], agentId: 'a4', pct: 10, pays: [{ mode: 'agent', amount: 500 }] }, { name: 'Desert Concierge' });
  assert.match(t, /Commission 10 % : 150 AED/);
  assert.match(t, /Options \(sans commission\) : Transport aller-retour/);
  assert.match(t, /Wild vous doit|À reverser à Wild : 350 AED/);
});
