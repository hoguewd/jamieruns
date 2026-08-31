const STATE_KEY = 'rothman-8k-plan-v1';
const MAX_BODY_BYTES = 250000; // safety cap, well above expected payload size

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/state') {
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: cors() });
      }

      if (request.method === 'GET') {
        const value = await env.KV.get(STATE_KEY);
        return new Response(value || 'null', {
          headers: { 'Content-Type': 'application/json', ...cors() },
        });
      }

      if (request.method === 'POST') {
        const body = await request.text();
        if (body.length > MAX_BODY_BYTES) {
          return new Response(JSON.stringify({ error: 'Payload too large' }), {
            status: 413,
            headers: { 'Content-Type': 'application/json', ...cors() },
          });
        }
        try {
          JSON.parse(body);
        } catch (e) {
          return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...cors() },
          });
        }
        await env.KV.put(STATE_KEY, body);
        return new Response(JSON.stringify({ ok: true }), {
          headers: { 'Content-Type': 'application/json', ...cors() },
        });
      }

      return new Response('Method not allowed', { status: 405, headers: cors() });
    }

    // Everything else: serve the static site
    return env.ASSETS.fetch(request);
  },
};
