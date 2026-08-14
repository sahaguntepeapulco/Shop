// netlify/functions/notify.mjs
// Envía una notificación push a TODOS los clientes suscritos.
// Protegida con una clave secreta (ADMIN_NOTIFY_SECRET) para que solo tú puedas usarla.
//
// Cómo usarla (desde el navegador, la terminal, o la app de notas de tu celular con una PWA de requests):
//   POST https://tu-tienda.netlify.app/.netlify/functions/notify
//   Header: x-admin-secret: TU_CLAVE_SECRETA
//   Body JSON: { "title": "¡Nueva oferta! 🐱", "body": "20% off en vestidos esta semana", "url": "/#productos" }
import webpush from 'web-push';
import { getStore } from '@netlify/blobs';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const adminSecret = req.headers.get('x-admin-secret');
  if (!adminSecret || adminSecret !== process.env.ADMIN_NOTIFY_SECRET) {
    return new Response(JSON.stringify({ ok: false, error: 'No autorizado' }), {
      status: 401,
      headers: { 'content-type': 'application/json' }
    });
  }

  const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return new Response(JSON.stringify({ ok: false, error: 'Faltan llaves VAPID en variables de entorno' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }

  webpush.setVapidDetails('mailto:contacto@elclosetdelgato.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  let payload;
  try {
    const body = await req.json();
    payload = JSON.stringify({
      title: body.title || 'El Closet del Gato',
      body: body.body || 'Tenemos novedades para ti 🐱',
      url: body.url || '/',
      icon: body.icon || '/icons/icon-192.png'
    });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'JSON inválido' }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }

  const store = getStore('push-subscriptions');
  const { blobs } = await store.list();

  let sent = 0, removed = 0, failed = 0;

  await Promise.all(blobs.map(async ({ key }) => {
    const sub = await store.get(key, { type: 'json' });
    if (!sub) return;
    try {
      await webpush.sendNotification(sub, payload);
      sent++;
    } catch (err) {
      // 404/410 = la suscripción ya no existe (usuario desinstaló, borró datos, etc.) -> limpiar
      if (err.statusCode === 404 || err.statusCode === 410) {
        await store.delete(key);
        removed++;
      } else {
        failed++;
      }
    }
  }));

  return new Response(JSON.stringify({ ok: true, sent, removed, failed, total: blobs.length }), {
    headers: { 'content-type': 'application/json' }
  });
};
