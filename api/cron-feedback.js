// Tous les jours à 20 h (Dubaï) : message de suivi aux clients dont le tour est terminé.
import { send, fail, makeDeps } from './_lib/http.js';
import { runFeedback } from './_lib/agent.js';

export default async function handler(req, res) {
  if (process.env.CRON_SECRET && req.headers.authorization !== 'Bearer ' + process.env.CRON_SECRET) return send(res, 401, { error: 'non autorisé' });
  try {
    const d = makeDeps();
    if (!d.wa) return send(res, 200, { skipped: 'WhatsApp non configuré' });
    return send(res, 200, await runFeedback(d));
  } catch (e) { return fail(res, e); }
}
