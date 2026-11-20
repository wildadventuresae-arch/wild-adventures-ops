// Donne à l'appli l'adresse Supabase et la clé publique (anon). Sans configuration : mode démo.
export default function handler(req, res) {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_ANON_KEY;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  if (!url || !key) { res.statusCode = 404; return res.end(JSON.stringify({ demo: true })); }
  res.statusCode = 200;
  res.end(JSON.stringify({
    supabaseUrl: url, supabaseAnonKey: key,
    features: { whatsapp: !!(process.env.WA_TOKEN && process.env.WA_PHONE_NUMBER_ID), calendar: !!(process.env.GOOGLE_SERVICE_ACCOUNT && process.env.GOOGLE_CALENDAR_ID), ai: !!process.env.ANTHROPIC_API_KEY },
  }));
}
