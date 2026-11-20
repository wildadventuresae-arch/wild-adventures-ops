// Appelée par l'appli quand la réception valide un booking : Google Agenda + confirmation WhatsApp.
import { readJson, send, fail, makeDeps, requireStaff } from './_lib/http.js';
import { confirmBooking } from './_lib/agent.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'méthode' });
  try {
    const d = makeDeps();
    const user = await requireStaff(req, d.db);
    const { id, notify = true } = await readJson(req);
    if (!id) return send(res, 400, { error: 'id manquant' });
    return send(res, 200, await confirmBooking(id, { notify, by: user.name }, d));
  } catch (e) { return fail(res, e); }
}
