const STATE_KEY = 'rothman-8k-plan-v1';
const MAX_BODY_BYTES = 300000; // 300KB safety cap, plenty for this app's data

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/state') {
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders() });
      }

      if (request.method === 'GET') {
        const value = await env.KV.get(STATE_KEY);
        return new Response(value || 'null', {
          headers: { 'Content-Type': 'application/json', ...corsHeaders() }
        });
      }

      if (request.method === 'POST') {
        const body = await request.text();

        if (body.length > MAX_BODY_BYTES) {
          return json({ error: 'Payload too large' }, 413);
        }

        try {
          JSON.parse(body);
        } catch (e) {
          return json({ error: 'Invalid JSON' }, 400);
        }

        await env.KV.put(STATE_KEY, body);
        return json({ ok: true });
      }

      return json({ error: 'Method not allowed' }, 405);
    }

    // Everything else: serve the static site
    return env.ASSETS.fetch(request);
  }
};
