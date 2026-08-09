export default {
  async fetch(request, env) {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers })
    }

    const url = new URL(request.url)

    try {
      // --- Feedback delete ---
      if (url.pathname.startsWith('/feedback/fb-') && request.method === 'DELETE') {
        const id = url.pathname.replace('/feedback/', '')
        await env.COUNTER.delete(id)
        return new Response(JSON.stringify({ ok: true }), { headers })
      }

      // --- Feedback ---
      if (url.pathname === '/feedback') {
        if (request.method === 'POST') {
          const body = await request.json()
          const id = `fb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
          const entry = {
            id,
            type: body.type || 'general',
            message: body.message || '',
            email: body.email || '',
            page: body.page || '',
            created: new Date().toISOString(),
          }
          await env.COUNTER.put(id, JSON.stringify(entry))
          // Update feedback count
          const count = parseInt(await env.COUNTER.get('feedback-count') || '0', 10)
          await env.COUNTER.put('feedback-count', String(count + 1))
          return new Response(JSON.stringify({ ok: true, id }), { headers })
        }

        // GET — list feedback (for you to check)
        const list = await env.COUNTER.list({ prefix: 'fb-' })
        const items = []
        for (const key of list.keys) {
          const val = await env.COUNTER.get(key.name)
          if (val) items.push(JSON.parse(val))
        }
        return new Response(JSON.stringify({ feedback: items }), { headers })
      }

      // --- Counter ---
      const key = 'plugin-copies'

      if (request.method === 'POST') {
        const current = parseInt(await env.COUNTER.get(key) || '0', 10)
        const next = current + 1
        await env.COUNTER.put(key, String(next))
        return new Response(JSON.stringify({ count: next }), { headers })
      }

      const count = parseInt(await env.COUNTER.get(key) || '0', 10)
      return new Response(JSON.stringify({ count }), { headers })
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'quota_exceeded' }),
        { status: 402, headers }
      )
    }
  },
}
