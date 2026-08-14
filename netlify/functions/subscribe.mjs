// netlify/functions/subscribe.mjs
// Guarda (o elimina) la suscripción push de un visitante en Netlify Blobs.
// Se llama automáticamente desde el navegador cuando el cliente activa notificaciones.
import { getStore } from '@netlify/blobs';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const store = getStore('push-subscriptions');

    // action: "subscribe" (default) o "unsubscribe"
    if (body.action === 'unsubscribe' && body.endpoint) {
      const key = Buffer.from(body.endpoint).toString('base64url');
      await store.delete(key);
      return new Response(JSON.stringify({ ok: true, removed: true }), {
        headers: { 'content-type': 'application/json' }
      });
    }

    if (!body.endpoint || !body.keys) {
      return new Response(JSON.stringify({ ok: false, error: 'Suscripción inválida' }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    const key = Buffer.from(body.endpoint).toString('base64url');
    await store.setJSON(key, {
      endpoint: body.endpoint,
      keys: body.keys,
      savedAt: new Date().toISOString()
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
