// WhatsApp Business Cloud API (Meta) : envoi de messages, lecture du webhook, vérification de signature.
import crypto from 'node:crypto';
import { digits } from './catalog.js';

export function verifySignature(raw, header, secret) {
  if (!secret) return true; // non configuré : on accepte (à configurer en production)
  if (!header || !header.startsWith('sha256=')) return false;
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  const got = header.slice(7);
  return got.length === expected.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

// Transforme le webhook Meta en listes simples.
export function parseWebhook(body) {
  const messages = [], statuses = [], echoes = [];
  for (const entry of body?.entry || []) {
    for (const ch of entry.changes || []) {
      const v = ch.value || {};
      const names = Object.fromEntries((v.contacts || []).map((c) => [c.wa_id, c.profile?.name || '']));
      for (const m of v.messages || []) {
        if (['reaction', 'unsupported', 'system'].includes(m.type)) continue; // un emoji en réaction n'appelle pas de réponse
        const text = m.type === 'text' ? m.text?.body
          : m.type === 'button' ? m.button?.text
          : m.type === 'interactive' ? (m.interactive?.button_reply?.title || m.interactive?.list_reply?.title)
          : '';
        messages.push({ id: m.id, from: m.from, name: names[m.from] || '', type: m.type, text: (text || '').trim(), ts: +m.timestamp * 1000 || Date.now() });
      }
      for (const s of v.statuses || []) statuses.push({ id: s.id, status: s.status, to: s.recipient_id, error: s.errors?.[0] || null });
      // Coexistence : messages envoyés depuis l'appli WhatsApp Business du téléphone
      if (ch.field === 'smb_message_echoes') for (const e of v.message_echoes || []) echoes.push({ to: e.to, text: e.text?.body || '' });
    }
  }
  return { messages, statuses, echoes };
}

const WINDOW = 24 * 3600e3;

export function makeWa({ token = process.env.WA_TOKEN, phoneId = process.env.WA_PHONE_NUMBER_ID, version = process.env.WA_API_VERSION || 'v21.0', fetchImpl = fetch } = {}) {
  if (!token || !phoneId) throw new Error('WA_TOKEN / WA_PHONE_NUMBER_ID manquants');
  async function post(payload) {
    const r = await fetchImpl(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', ...payload }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error('WhatsApp: ' + (j.error?.message || r.status)); e.code = j.error?.code; throw e; }
    return j.messages?.[0]?.id || null;
  }
  const sendText = (to, body) => post({ to: digits(to), type: 'text', text: { preview_url: true, body } });
  const sendTemplate = (to, name, lang, params = []) => post({
    to: digits(to), type: 'template',
    template: { name, language: { code: lang }, components: params.length ? [{ type: 'body', parameters: params.map((t) => ({ type: 'text', text: String(t) })) }] : [] },
  });
  // Hors fenêtre de 24 h après le dernier message reçu, Meta impose un modèle approuvé.
  async function send(to, text, { lastInAt, template } = {}) {
    const open = lastInAt && Date.now() - Date.parse(lastInAt) < WINDOW;
    if (open || !template?.name) return { id: await sendText(to, text), via: 'text', outsideWindow: !open };
    const langs = (process.env.WA_TEMPLATE_LANGS || 'en,fr').split(',');
    return { id: await sendTemplate(to, template.name, langs.includes(template.lang) ? template.lang : 'en', template.params), via: 'template' };
  }
  return { sendText, sendTemplate, send };
}
