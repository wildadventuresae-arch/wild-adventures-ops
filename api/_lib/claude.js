// Agent IA (Claude) : lit les messages WhatsApp et renvoie une décision structurée.
// Appel direct de l'API Messages, sans dépendance.

const API = 'https://api.anthropic.com/v1/messages';

export function makeClaude({ apiKey = process.env.ANTHROPIC_API_KEY, model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5', fetchImpl = fetch } = {}) {
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY manquant');
  async function tool(system, messages, toolDef) {
    const r = await fetchImpl(API, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model, max_tokens: 1200, system, messages, tools: [toolDef], tool_choice: { type: 'tool', name: toolDef.name } }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error('Claude: ' + (j.error?.message || r.status));
    const use = (j.content || []).find((c) => c.type === 'tool_use');
    if (!use) throw new Error('Claude: pas de décision');
    return use.input;
  }
  return {
    decide: (ctx) => tool(decideSystem(ctx), toMessages(ctx), decideTool(ctx.cat)),
    classifyFeedback: (ctx) => tool(feedbackSystem(ctx), [{ role: 'user', content: ctx.text }], FEEDBACK_TOOL),
  };
}

function catalogText(cat) {
  const acts = Object.entries(cat.ACT).map(([k, a]) => `- ${k}: ${a.name} (${a.tier}) — 1h ${a.p[60]} AED, 2h ${a.p[120] ?? 'n/a'} AED`).join('\n');
  const saf = Object.entries(cat.SAFARI).map(([k, [n, p]]) => `- ${k}: ${n} — ${p} AED`).join('\n');
  const opt = Object.entries(cat.OPTIONS).map(([k, [n, p]]) => `- ${k}: ${n} — ${p} AED`).join('\n');
  return `Vehicles (code: name — price per vehicle):\n${acts}\nDesert safari (per person unless private car):\n${saf}\nOptions (extras):\n${opt}\nAll buggies include refreshment, protection, music and sandboard. Quads/bikes include refreshment and protection. Minimum driver age 16. Base: Wild Adventures, Al Badayer (Dubai).`;
}

function decideSystem(ctx) {
  const who = ctx.role === 'agent'
    ? `The sender is a registered PARTNER AGENT: "${ctx.agent.name}" (commission ${ctx.agent.pct}%). Agents send bookings for their own customers. Be brief and professional. The agent may give the price they sold and the amount the customer paid them ("paid_to_agent"). Customer phone is optional.`
    : `The sender is a DIRECT CUSTOMER (no agent, no commission). Their WhatsApp name is "${ctx.name || 'unknown'}" and their phone is the sender number. Be warm and welcoming.`;
  return `You are the WhatsApp booking assistant of Wild Adventures, a desert activities company in Dubai (buggies, quads, dirt bikes, desert safaris).
${who}
Today in Dubai: ${ctx.today} (${ctx.weekday}), current time ${ctx.time}.

${catalogText(ctx.cat)}

Your job:
1. Understand the message (and the conversation so far) and extract booking details into the decide tool.
2. Essential details for a booking: customer name, date, time, at least one activity with quantity. Duration is 1 hour unless 2 hours is mentioned.
3. If essentials are missing, list them in "missing" and write a short reply asking ONLY for them.
4. When the booking request is complete, reply that you received it and that the team will confirm availability shortly. NEVER say the booking is confirmed: a team member validates every booking.
5. Questions about prices or activities: answer from the catalog above only. Never invent prices, availability or policies.
6. Anything else (complaints, cancellations, refunds, complex requests, voice notes): reply politely that a team member will answer, and set needs_human=true.
7. Reply in the sender's language (set "language" to its ISO code: en, fr, ru, ar, de…). Keep replies short (1–4 lines), friendly, no markdown headings.
8. Convert relative dates ("tomorrow", "Saturday") to YYYY-MM-DD and times to 24h HH:MM.
${ctx.draft ? `\nA booking draft is already open for this conversation; update it with any new details (intent update_booking):\n${JSON.stringify(ctx.draft)}` : ''}`;
}

function toMessages(ctx) {
  const msgs = (ctx.history || []).map((h) => ({ role: h.r === 'user' ? 'user' : 'assistant', content: h.t || '…' }));
  // l'API exige une alternance qui commence par "user"
  const out = [];
  for (const m of msgs) { if (out.length && out[out.length - 1].role === m.role) out[out.length - 1].content += '\n' + m.content; else out.push({ ...m }); }
  while (out.length && out[0].role !== 'user') out.shift();
  if (!out.length) out.push({ role: 'user', content: ctx.text || '' });
  return out;
}

function decideTool(cat) {
  return {
    name: 'decide',
    description: 'Record what to do with the incoming WhatsApp message.',
    input_schema: {
      type: 'object',
      properties: {
        intent: { type: 'string', enum: ['new_booking', 'update_booking', 'question', 'cancel_request', 'other'] },
        language: { type: 'string', description: 'ISO 639-1 code of the sender language' },
        reply: { type: 'string', description: 'Message to send back to the sender' },
        booking: {
          type: 'object',
          properties: {
            client_name: { type: 'string' },
            client_phone: { type: 'string' },
            date: { type: 'string', description: 'YYYY-MM-DD' },
            time: { type: 'string', description: 'HH:MM 24h' },
            duration_hours: { type: 'integer', enum: [1, 2] },
            items: { type: 'array', items: { type: 'object', properties: { code: { type: 'string', enum: Object.keys(cat.ACT) }, qty: { type: 'integer' }, unit_price: { type: 'number', description: 'Only if the agent states a specific price per vehicle' } }, required: ['code', 'qty'] } },
            safari: { type: 'object', properties: Object.fromEntries(Object.keys(cat.SAFARI).map((k) => [k, { type: 'integer' }])) },
            options: { type: 'array', items: { type: 'string', enum: Object.keys(cat.OPTIONS) } },
            demands: { type: 'array', items: { type: 'string' }, description: 'Special requests: beginner, child, birthday, baby seat…' },
            paid_to_agent: { type: 'number', description: 'Amount the customer already paid to the agent, in AED' },
            notes: { type: 'string' },
          },
        },
        missing: { type: 'array', items: { type: 'string', enum: ['client_name', 'date', 'time', 'activity', 'quantity'] } },
        needs_human: { type: 'boolean' },
      },
      required: ['intent', 'language', 'reply', 'missing', 'needs_human'],
    },
  };
}

function feedbackSystem(ctx) {
  return `You read a customer's answer to "How was your experience with Wild Adventures today?" (desert buggy/quad/safari tour in Dubai).
Classify the sentiment: positive (happy, great, amazing, thumbs up…), neutral (ok, fine, mixed), negative (problem, unhappy, complaint).
Write a short reply in the customer's language (${ctx.lang || 'detect it'}): if positive, thank them warmly (do NOT include any link, it is added automatically); if neutral or negative, apologise sincerely and say the manager will contact them personally. 1–3 lines, no markdown.`;
}

const FEEDBACK_TOOL = {
  name: 'classify_feedback',
  description: 'Classify the customer feedback and write the reply.',
  input_schema: {
    type: 'object',
    properties: {
      sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
      language: { type: 'string' },
      reply: { type: 'string' },
    },
    required: ['sentiment', 'language', 'reply'],
  },
};
