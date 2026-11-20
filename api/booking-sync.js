// Appelée par l'appli après une modification, un report, une annulation ou une suppression.
import { readJson, send, fail, makeDeps, requireStaff } from './_lib/http.js';
import { syncBooking } from './_lib/agent.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'méthode' });
  try {
    const d = makeDeps();
    await requireStaff(req, d.db);
    const { id, deleted = false, calEventId = null } = await readJson(req);
    return send(res, 200, await syncBooking(id, { deleted, calEventId }, d));
  } catch (e) { return fail(res, e); }
}
