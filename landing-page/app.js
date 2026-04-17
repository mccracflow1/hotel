/**
 * Landing Semana 8 — datos desde API (README + `window.API_BASE_URL` o default localhost).
 */
(function () {
  const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000/api/v1';

  function $(sel) {
    return document.querySelector(sel);
  }

  function setHtml(sel, html) {
    const el = $(sel);
    if (el) el.innerHTML = html;
  }

  function emptyMessage(section) {
    return `<p class="text-slate-400">Configuración pendiente (${section}).</p>`;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function fetchJson(path) {
    const r = await fetch(`${API_BASE_URL}${path}`, { credentials: 'omit' });
    if (!r.ok) throw new Error(`${path} → ${r.status}`);
    return r.json();
  }

  function heroFromBundle(site) {
    const rows = site || [];
    const get = (k) => rows.find((e) => e.section === 'hero' && e.key === k)?.value ?? '';
    const title = get('title');
    const subtitle = get('subtitle');
    if (!title && !subtitle) {
      setHtml('#hero', `<p class="text-sm uppercase tracking-wide text-amber-400">Hero</p>
        <h1 class="mt-2 text-3xl font-bold sm:text-4xl">Hotel</h1>${emptyMessage('hero')}`);
      return;
    }
    setHtml(
      '#hero',
      `<p class="text-sm uppercase tracking-wide text-amber-400">Hero</p>
       <h1 class="mt-2 text-3xl font-bold sm:text-4xl">${escapeHtml(title || 'Hotel')}</h1>
       <p class="mt-4 max-w-2xl text-slate-300">${escapeHtml(subtitle || '')}</p>`,
    );
  }

  function contactFromBundle(site) {
    const rows = site || [];
    const get = (k) => rows.find((e) => e.section === 'contact' && e.key === k)?.value ?? '';
    const phone = get('phone');
    const email = get('email');
    const wa = get('whatsapp');
    if (!phone && !email && !wa) {
      setHtml('#contact', `<div class="mx-auto max-w-5xl">${emptyMessage('contacto')}</div>`);
      return;
    }
    setHtml(
      '#contact',
      `<div class="mx-auto max-w-5xl">
        <p class="text-sm uppercase tracking-wide text-amber-400">Contacto</p>
        <h2 class="mt-2 text-2xl font-semibold">Datos</h2>
        <ul class="mt-3 list-disc pl-5 text-slate-300">
          ${phone ? `<li>Tel: ${escapeHtml(phone)}</li>` : ''}
          ${wa ? `<li>WhatsApp: ${escapeHtml(wa)}</li>` : ''}
          ${email ? `<li>Email: ${escapeHtml(email)}</li>` : ''}
        </ul>
       </div>`,
    );
    const foot = [phone, email].filter(Boolean).join(' · ');
    if (foot) setHtml('#footer', `<div class="mx-auto max-w-3xl">${escapeHtml(foot)}</div>`);
  }

  function renderRooms(list) {
    if (!list?.length) {
      setHtml(
        '#services',
        `<div class="mx-auto max-w-5xl"><p class="text-sm uppercase tracking-wide text-amber-400">Servicios</p>
        <h2 class="mt-2 text-2xl font-semibold">Habitaciones</h2>${emptyMessage('habitaciones')}</div>`,
      );
      return;
    }
    const cards = list
      .map(
        (r) => `<div class="rounded border border-slate-700 p-4">
        <div class="font-semibold">${escapeHtml(r.name)}</div>
        <div class="text-slate-400 text-sm">Capacidad ${r.capacity} · desde $${r.base_price}</div>
      </div>`,
      )
      .join('');
    setHtml(
      '#services',
      `<div class="mx-auto max-w-5xl">
        <p class="text-sm uppercase tracking-wide text-amber-400">Servicios</p>
        <h2 class="mt-2 text-2xl font-semibold">Habitaciones activas</h2>
        <div class="mt-4 grid gap-3 sm:grid-cols-2">${cards}</div>
      </div>`,
    );
  }

  function renderPlans(list) {
    if (!list?.length) {
      setHtml(
        '#plans',
        `<div class="mx-auto max-w-5xl"><p class="text-sm uppercase tracking-wide text-amber-400">Planes</p>
        <h2 class="mt-2 text-2xl font-semibold">Estadías y paquetes</h2>${emptyMessage('planes')}</div>`,
      );
      return;
    }
    const cards = list
      .map(
        (p) => `<div class="rounded border border-slate-700 p-4">
        <div class="font-semibold">${escapeHtml(p.name)}</div>
        <div class="text-slate-400 text-sm">${escapeHtml(String(p.short_desc || '').slice(0, 140))}</div>
      </div>`,
      )
      .join('');
    setHtml(
      '#plans',
      `<div class="mx-auto max-w-5xl">
        <p class="text-sm uppercase tracking-wide text-amber-400">Planes</p>
        <h2 class="mt-2 text-2xl font-semibold">Paquetes</h2>
        <div class="mt-4 grid gap-3 sm:grid-cols-2">${cards}</div>
      </div>`,
    );
  }

  function galleryFromBundle(site) {
    const row = (site || []).find((e) => e.section === 'gallery' && e.key === 'images');
    if (!row?.value) {
      setHtml(
        '#gallery',
        `<div class="mx-auto max-w-5xl"><p class="text-sm uppercase tracking-wide text-amber-400">Galería</p>
        <h2 class="mt-2 text-2xl font-semibold">Galería del hotel</h2>${emptyMessage('galería')}</div>`,
      );
      return;
    }
    let imgs = [];
    try {
      const parsed = JSON.parse(row.value);
      if (Array.isArray(parsed)) {
        imgs = parsed.map((x) => {
          if (typeof x === 'string') return x;
          if (x && typeof x === 'object') return x.thumbnail_url || x.url || x.original_url || '';
          return '';
        });
      }
    } catch {
      /* ignore */
    }
    const tiles = imgs
      .filter(Boolean)
      .map(
        (url, i) =>
          `<img src="${escapeHtml(url)}" alt="" class="rounded border border-slate-700 w-full h-40 object-cover" loading="${i > 1 ? 'lazy' : 'eager'}" />`,
      )
      .join('');
    setHtml(
      '#gallery',
      `<div class="mx-auto max-w-5xl">
        <p class="text-sm uppercase tracking-wide text-amber-400">Galería</p>
        <h2 class="mt-2 text-2xl font-semibold">Fotos</h2>
        <div class="mt-4 grid gap-2 sm:grid-cols-3">${tiles || emptyMessage('galería sin imágenes')}</div>
      </div>`,
    );
  }

  function mapFromBundle(site) {
    const url = (site || []).find((e) => e.section === 'contact' && e.key === 'maps_embed_url')?.value;
    if (!url) {
      setHtml(
        '#map',
        `<div class="mx-auto max-w-5xl"><p class="text-sm uppercase tracking-wide text-amber-400">Mapa</p>
        <h2 class="mt-2 text-2xl font-semibold">Ubicación</h2>${emptyMessage('mapa')}</div>`,
      );
      return;
    }
    setHtml(
      '#map',
      `<div class="mx-auto max-w-5xl">
        <p class="text-sm uppercase tracking-wide text-amber-400">Mapa</p>
        <h2 class="mt-2 text-2xl font-semibold">Ubicación</h2>
        <iframe class="mt-4 w-full min-h-[280px] rounded border border-slate-700" src="${escapeHtml(
          String(url),
        )}" loading="lazy" title="Mapa"></iframe>
      </div>`,
    );
  }

  function renderFaqs(list) {
    if (!list?.length) {
      setHtml(
        '#faq',
        `<div class="mx-auto max-w-5xl"><p class="text-sm uppercase tracking-wide text-amber-400">FAQ</p>
        <h2 class="mt-2 text-2xl font-semibold">Preguntas frecuentes</h2>${emptyMessage('FAQ')}</div>`,
      );
      return;
    }
    const items = list
      .map(
        (f) => `<details class="border border-slate-700 rounded p-3 mb-2">
        <summary class="cursor-pointer font-medium">${escapeHtml(f.question)}</summary>
        <p class="mt-2 text-slate-300">${escapeHtml(f.answer)}</p>
      </details>`,
      )
      .join('');
    setHtml(
      '#faq',
      `<div class="mx-auto max-w-5xl"><p class="text-sm uppercase tracking-wide text-amber-400">FAQ</p>
      <h2 class="mt-2 text-2xl font-semibold mb-4">Preguntas frecuentes</h2>${items}</div>`,
    );
  }

  function metaFromHero(site) {
    const rows = site || [];
    const title = rows.find((e) => e.section === 'hero' && e.key === 'title')?.value || 'Hotel';
    const desc = rows.find((e) => e.section === 'hero' && e.key === 'subtitle')?.value || '';
    document.title = title;
    let m = document.querySelector('meta[name="description"]');
    if (!m) {
      m = document.createElement('meta');
      m.setAttribute('name', 'description');
      document.head.appendChild(m);
    }
    m.setAttribute('content', desc || 'Sitio del hotel');
    ['og:title', 'og:description'].forEach((prop) => {
      let t = document.querySelector(`meta[property="${prop}"]`);
      if (!t) {
        t = document.createElement('meta');
        t.setAttribute('property', prop);
        document.head.appendChild(t);
      }
      t.setAttribute('content', prop.endsWith('title') ? title : desc || title);
    });
  }

  async function main() {
    try {
      const bundle = await fetchJson('/site-content/public');
      const site = bundle.data?.site_content || [];
      heroFromBundle(site);
      contactFromBundle(site);
      galleryFromBundle(site);
      mapFromBundle(site);
      metaFromHero(site);

      const rooms = await fetchJson('/public/rooms');
      renderRooms(rooms.data || []);

      const plans = await fetchJson('/public/plans');
      renderPlans(plans.data || []);

      const faqs = await fetchJson('/faqs');
      renderFaqs(faqs.data || []);
    } catch (e) {
      console.error(e);
      setHtml('#hero', `<p class="text-red-400">No se pudo cargar el sitio. Revisá API_BASE_URL y CORS.</p>`);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
  else main();
})();
