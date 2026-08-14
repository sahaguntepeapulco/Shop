# El Closet del Gato — Guía de Despliegue v2.1

## 🆕 Qué cambió en esta revisión

- ✅ **Íconos del PWA arreglados** — el manifest no tenía íconos y por eso el botón "Instalar" probablemente no aparecía en Android/Chrome. Ya se generaron y están en `/icons`.
- ✅ **Notificaciones push reales** — funcionan aunque el cliente no tenga la página abierta (`netlify/functions/subscribe.mjs` + `notify.mjs`, más una página de administración simple).
- ✅ **Insignia "NUEVO"** para productos, y las insignias OFERTA/DESTACADO ahora se controlan con una propiedad en cada producto (antes estaban escondidas como listas de IDs en el código).
- ✅ **Ahorro de ancho de banda**: imágenes con `loading="lazy"`, medidas fijas (evita saltos de layout), caché de un año para `/images` y `/icons`, y ya no dependen de un servicio externo (`via.placeholder.com`) para las imágenes rotas.
- ✅ **Accesibilidad**: botones de solo-ícono (carrito, favoritos, notificaciones) ahora tienen `aria-label`.

---

## 📦 Paso 1: Sube los archivos a Netlify

1. Conserva tu carpeta `images/` junto a `index.html` (no viene incluida en este paquete).
2. Sube **todo** el contenido de esta carpeta a tu repositorio o arrástralo directo al panel de Netlify (Deploys → arrastra la carpeta).
3. Netlify detectará `netlify.toml` automáticamente. La primera vez instalará las dependencias (`web-push` y `@netlify/blobs`) gracias al `command = "npm install --omit=dev"` que ya está configurado.

---

## 🔔 Paso 2: Activa las notificaciones push (una sola vez)

### 2.1 Verifica que Netlify Blobs esté disponible
Ve a tu panel → **Project configuration → Environment variables**. Netlify Blobs viene activado automáticamente en cuentas con Functions habilitado; no necesitas crear nada manualmente.

### 2.2 Configura las variables de entorno
En **Project configuration → Environment variables**, agrega:

| Variable | Valor |
|---|---|
| `VAPID_PUBLIC_KEY` | `BJ-JArjXXzITME9rMXTYj-wlD5Qg38xFjxipjhXOgmqZXJDmBMflOY_NAYT-ojZNXKq8-S1QKJnjvKAxbK9cZSM` |
| `VAPID_PRIVATE_KEY` | `RNjmHRslefT_rosn2j4cVvM_3jiExQKBY9LAa1UuT1g` |
| `ADMIN_NOTIFY_SECRET` | Inventa tu propia clave secreta (ej: `Gato2026Secreto!`) — es la que usarás para enviar notificaciones |

⚠️ **Importante:** la llave pública (`VAPID_PUBLIC_KEY`) ya está también escrita dentro de `index.html` (línea con `const VAPID_PUBLIC_KEY = ...`). **Debe ser exactamente la misma** en ambos lugares. Si alguna vez generas llaves nuevas, cámbialas en los dos sitios a la vez.

Después de guardar las variables, haz un **re-deploy** (Deploys → Trigger deploy → Clear cache and deploy site) para que las funciones las tomen en cuenta.

### 2.3 Pruébalo
1. Abre tu tienda ya publicada (tiene que ser `https://...netlify.app`, los push **no funcionan abriendo el `index.html` directo desde tu computadora**).
2. Click en la campanita 🔔 del encabezado → tu navegador pedirá permiso → acepta.
3. Ve a `https://tu-tienda.netlify.app/admin/notificar.html`
4. Ingresa tu `ADMIN_NOTIFY_SECRET`, escribe un título y mensaje, y presiona **Enviar a todos los suscritos**.
5. Deberías recibir la notificación en segundos, incluso con la pestaña cerrada.

### 2.4 Cómo enviar notificaciones en tu día a día
Simplemente entra a `/admin/notificar.html` desde tu celular o computadora (guárdalo en favoritos). Ahí hay botones rápidos para "Nuevo producto", "Oferta" y "Poco stock", o puedes escribir tu propio mensaje. Todos tus clientes que hayan activado la campanita 🔔 lo recibirán.

**Recomendación:** no lo satures — 1 o 2 notificaciones por semana es un buen ritmo. Si mandas muchas, la gente desactiva los permisos.

🔒 **Protege el enlace del admin:** cualquiera que tenga la URL puede intentar enviar notificaciones, pero necesita tu `ADMIN_NOTIFY_SECRET` para lograrlo. No compartas esa clave ni la pongas en redes sociales.

---

## 🏷️ Paso 3: Cómo marcar productos con insignias (sin tocar el diseño)

Dentro de `index.html`, busca `const productos = [` y usa estas propiedades en cualquier producto:

```javascript
{
    id: 16,
    nombre: "Bolso Nuevo",
    descripcion: "...",
    precio: 999,
    categoria: "moda",
    imagen: "images/16.jpg",
    nuevo: true,           // <- Muestra insignia NUEVO (verde)
    destacado: true,       // <- Muestra insignia DESTACADO
    oferta: true,          // <- Muestra insignia OFERTA (requiere precioAnterior)
    precioAnterior: 1299,  // <- Precio tachado (solo si oferta:true)
    stock: 3                // <- Si no lo pones, se asume 5 disponibles
}
```

Cuando el producto ya no sea nuevo o la oferta termine, simplemente borra esa línea (o cámbiala a `false`).

---

## 💰 Paso 4: Aprovechar al máximo tu plan gratuito (cuenta Legacy desde 2016/2017)

Tu cuenta tiene el plan clásico: **100 GB de ancho de banda**, **300 minutos de build**, **125,000 invocaciones de funciones**, y — el número que más hay que vigilar — **100 envíos de formulario al mes** (contando pedidos + newsletter + contacto juntos).

1. **Vigila tus envíos de formulario.** Panel → Project configuration → Forms → verás cuántos llevas este mes. Si te acercas a 100, considera que el pedido por WhatsApp ya es tu canal principal — el envío a Netlify Forms es solo un respaldo, así que si algún mes te pasas, el negocio sigue funcionando igual por WhatsApp.
2. **Activa las notificaciones por correo de los formularios:** Project configuration → Notifications → Emails and webhooks → Form submission notifications, así te enteras de cada pedido sin entrar al panel.
3. **Comprime tus imágenes antes de subirlas** (ver Paso 5) — es lo que más ancho de banda consume.
4. **No hagas deploys innecesarios.** Cada vez que subes cambios cuenta contra tus minutos de build (aunque para un sitio estático como este, cada build tarda segundos, así que 300 minutos te alcanzan para cientos de despliegues).
5. Las funciones (`subscribe`, `notify`, `health`) son extremadamente ligeras — con cientos de clientes suscritos seguirás muy por debajo de las 125,000 invocaciones mensuales.

---

## 📸 Paso 5: Imágenes — tamaño ideal

- **800×800 px**, formato JPG, menos de 300–500 KB cada una (usa [squoosh.app](https://squoosh.app) gratis para comprimirlas antes de subir).
- Ya están configuradas con caché de 1 año — un cliente que vuelva a tu tienda no vuelve a descargar las imágenes que ya vio, lo cual ahorra tu ancho de banda mensual.

---

## 🧭 Resumen de archivos nuevos/cambiados

```
El Closet del Gato/
├── index.html                       (actualizado: badges, lazy loading, campanita)
├── manifest.webmanifest             (actualizado: íconos agregados)
├── sw.js                            (actualizado: maneja notificaciones push)
├── netlify.toml                     (actualizado: cache headers + build command)
├── package.json                     (nuevo: dependencias de las funciones)
├── icons/                           (nuevo: íconos del PWA)
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon-192-maskable.png
│   ├── icon-512-maskable.png
│   ├── favicon-32.png
│   └── apple-touch-icon.png
├── admin/
│   └── notificar.html               (nuevo: panel para enviar notificaciones)
└── netlify/functions/
    ├── health.mjs                   (sin cambios)
    ├── subscribe.mjs                (nuevo: guarda suscripciones push)
    └── notify.mjs                   (nuevo: envía notificaciones push)
```

Recuerda seguir conservando tu carpeta `images/` junto a `index.html`. Revisa los datos de contacto y redes sociales antes de publicar.
