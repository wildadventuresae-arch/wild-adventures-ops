// Réponse manuelle depuis la messagerie de l'appli (l'équipe reprend la main).
import { readJson, send, fail, makeDeps, requireStaff } from './_lib/http.js';
import { sendManual } from './_lib/agent.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'méthode' });
  try {
    const d = makeDeps();
    const user = await requireStaff(req, d.db);
    if (!d.wa) return send(res, 400, { error: 'WhatsApp non configuré' });
    const { phone, text } = await readJson(req);
    if (!phone || !text) return send(res, 400, { error: 'phone et text requis' });
    return send(res, 200, await sendManual(phone, text, user.name, d));
  } catch (e) { return fail(res, e); }
}
