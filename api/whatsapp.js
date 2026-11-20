// Webhook WhatsApp (Meta) : vérification (GET) et réception des messages (POST).
import { readRaw, send, makeDeps } from './_lib/http.js';
import { verifySignature, parseWebhook } from './_lib/whatsapp.js';
import { handleIncoming, markHumanFromEcho, updateStatus } from './_lib/agent.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const q = new URL(req.url, 'http://x').searchParams;
    if (q.get('hub.mode') === 'subscribe' && q.get('hub.verify_token') === process.env.WA_VERIFY_TOKEN) {
      res.statusCode = 200; return res.end(q.get('hub.challenge'));
    }
    return send(res, 403, { error: 'verify token invalide' });
  }
  if (req.method !== 'POST') return send(res, 405, { error: 'méthode' });
  const raw = await readRaw(req);
  if (!verifySignature(raw, req.headers['x-hub-signature-256'], process.env.WA_APP_SECRET)) return send(res, 401, { error: 'signature' });
  let body; try { body = JSON.parse(raw); } catch { return send(res, 400, { error: 'json' }); }
  const { messages, statuses, echoes } = parseWebhook(body);
  const d = makeDeps();
  const results = [];
  for (const m of messages) {
    try {
      if (!d.claude || !d.wa) { results.push({ id: m.id, action: 'not_configured' }); continue; }
      results.push({ id: m.id, ...(await handleIncoming(m, d)) });
    } catch (e) { console.error('handleIncoming', e); results.push({ id: m.id, error: e.message }); }
  }
  for (const e of echoes) { try { await markHumanFromEcho(e, d); } catch (err) { console.error(err); } }
  for (const s of statuses) { try { await updateStatus(s, d); } catch (err) { console.error(err); } }
  return send(res, 200, { ok: true, results });
}
