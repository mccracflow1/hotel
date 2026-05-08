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
    const image = get('image'); // Usamos la convención de la DB para la imagen de fondo si existe.

    const t = title || 'Bienvenido al Hotel';
    const st = subtitle || 'Disfruta de una experiencia inolvidable en la naturaleza.';

    // Update nav title
    const navTitle = $('#nav-title');
    if(navTitle && title) navTitle.textContent = title;

    if (image) {
      // Intenta parsear la URL por si viene con JSON desde la librería de medios
      let bgUrl = image;
      try {
        const parsed = JSON.parse(image);
        if (Array.isArray(parsed) && parsed.length > 0) bgUrl = parsed[0].original_url || parsed[0].url || parsed[0];
        else if (parsed && typeof parsed === 'object') bgUrl = parsed.original_url || parsed.url;
      } catch { /* ignore */ }

      const heroBg = $('#hero-bg');
      if (heroBg && bgUrl) heroBg.style.backgroundImage = `url('${escapeHtml(bgUrl)}')`;
    }

    setHtml(
      '#hero-content',
      `<h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white drop-shadow-md">${escapeHtml(t)}</h1>
       <p class="mt-6 text-xl text-slate-200 drop-shadow-sm max-w-2xl mx-auto">${escapeHtml(st)}</p>
       <div class="mt-10 flex flex-col sm:flex-row justify-center gap-4">
         <a href="#plans" class="rounded-full bg-emerald-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg hover:bg-emerald-500 transition-all hover:scale-105">Ver planes</a>
         <a href="#services" class="rounded-full bg-white/20 px-8 py-3.5 text-base font-semibold text-white shadow-sm backdrop-blur-md hover:bg-white/30 transition-all">Nuestras Habitaciones</a>
       </div>`
    );
  }

  function contactFromBundle(site) {
    const rows = site || [];
    const get = (k) => rows.find((e) => e.section === 'contact' && e.key === k)?.value ?? '';
    const phone = get('phone');
    const email = get('email');
    const wa = get('whatsapp');
    const address = get('address');

    if (!phone && !email && !wa) {
      setHtml('#contact-content', emptyMessage('contacto'));
      return;
    }
    setHtml(
      '#contact-content',
      `<ul class="space-y-6 text-slate-300">
          ${address ? `<li class="flex items-start gap-4">
            <svg class="h-6 w-6 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>${escapeHtml(address)}</span>
          </li>` : ''}
          ${phone ? `<li class="flex items-center gap-4">
            <svg class="h-6 w-6 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>${escapeHtml(phone)}</span>
          </li>` : ''}
          ${wa ? `<li class="flex items-center gap-4">
            <svg class="h-6 w-6 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>${escapeHtml(wa)} (WhatsApp)</span>
          </li>` : ''}
          ${email ? `<li class="flex items-center gap-4">
            <svg class="h-6 w-6 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>${escapeHtml(email)}</span>
          </li>` : ''}
        </ul>`
    );
    const foot = [phone, email].filter(Boolean).join(' · ');
    if (foot) {
      const p = document.createElement('p');
      p.className = 'mt-4';
      p.textContent = foot;
      $('#footer').prepend(p);
    }
  }

  function renderRooms(list) {
    if (!list?.length) {
      setHtml('#services-content', emptyMessage('habitaciones'));
      return;
    }
    const cards = list
      .map(
        (r) => `<div class="group overflow-hidden rounded-2xl bg-slate-50 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
        <div class="aspect-[4/3] w-full overflow-hidden bg-slate-200 relative">
          ${r.media && r.media.length ? `<img src="${escapeHtml(r.media[0].thumbnail_url || r.media[0].original_url)}" alt="${escapeHtml(r.name)}" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />` : '<div class="flex h-full items-center justify-center text-slate-400">Sin imagen</div>'}
          <div class="absolute top-4 right-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-700 shadow-sm backdrop-blur">
            Cap. ${r.capacity}
          </div>
        </div>
        <div class="p-6">
          <h3 class="text-xl font-bold text-slate-900">${escapeHtml(r.name)}</h3>
          <p class="mt-2 line-clamp-2 text-sm text-slate-500">${escapeHtml(r.description || 'Una habitación pensada para tu confort.')}</p>
          <div class="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
            <span class="text-sm font-medium text-slate-500">Desde</span>
            <span class="text-lg font-bold text-emerald-600">$${Number(r.base_price).toLocaleString('es-CO')}</span>
          </div>
        </div>
      </div>`,
      )
      .join('');
    setHtml(
      '#services-content',
      `<div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">${cards}</div>`
    );
  }

  function renderPlans(list) {
    if (!list?.length) {
      setHtml('#plans-content', emptyMessage('planes'));
      return;
    }
    const cards = list
      .map((p) => {
        let planImg = '';
        if (p.media && p.media.length) {
           planImg = `<img src="${escapeHtml(p.media[0].thumbnail_url || p.media[0].original_url)}" alt="${escapeHtml(p.name)}" class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />`;
        } else {
           planImg = '<div class="flex h-full items-center justify-center text-slate-400 bg-slate-200">Sin imagen</div>';
        }

        const inner = `<div class="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100 hover:shadow-2xl transition-all duration-300">
        <div class="relative aspect-video w-full overflow-hidden">
          ${planImg}
          <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
          <h3 class="absolute bottom-4 left-6 right-6 text-2xl font-bold text-white">${escapeHtml(p.name)}</h3>
        </div>
        <div class="flex flex-1 flex-col p-6">
          <p class="mb-6 flex-1 text-slate-600">${escapeHtml(String(p.short_desc || '').slice(0, 140))}${p.short_desc?.length > 140 ? '...' : ''}</p>
          <div class="mt-auto flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Ver detalles</span>
            <span class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>`;
        if (p.slug) {
          return `<a class="block focus:outline-none focus:ring-4 focus:ring-emerald-500/50 rounded-2xl" href="./plan.html?slug=${encodeURIComponent(
            p.slug,
          )}" aria-label="Ver plan ${escapeHtml(p.name)}">${inner}</a>`;
        }
        return inner;
      })
      .join('');
    setHtml(
      '#plans-content',
      `<div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">${cards}</div>`
    );
  }

  function galleryFromBundle(site) {
    const row = (site || []).find((e) => e.section === 'gallery' && e.key === 'images');
    if (!row?.value) {
      setHtml('#gallery-content', emptyMessage('galería'));
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
          `<div class="group relative overflow-hidden rounded-xl bg-slate-100 aspect-square">
            <img src="${escapeHtml(url)}" alt="" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="${i > 3 ? 'lazy' : 'eager'}" />
            <div class="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20"></div>
          </div>`
      )
      .join('');
    setHtml(
      '#gallery-content',
      `<div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">${tiles || emptyMessage('galería sin imágenes')}</div>`
    );
  }

  function mapFromBundle(site) {
    const url = (site || []).find((e) => e.section === 'contact' && e.key === 'maps_embed_url')?.value;
    if (!url) {
      setHtml('#map-content', `<div class="flex h-full items-center justify-center p-6">${emptyMessage('mapa')}</div>`);
      return;
    }
    setHtml(
      '#map-content',
      `<iframe class="h-full w-full border-0" src="${escapeHtml(
          String(url),
        )}" loading="lazy" title="Mapa del Hotel" allowfullscreen></iframe>`
    );
  }

  function renderFaqs(list) {
    if (!list?.length) {
      setHtml('#faq-content', emptyMessage('FAQ'));
      return;
    }
    const items = list
      .map(
        (f) => `<details class="group rounded-xl bg-white shadow-sm border border-slate-100 mb-4 overflow-hidden open:shadow-md transition-all">
        <summary class="flex cursor-pointer items-center justify-between px-6 py-4 font-semibold text-slate-900 marker:content-none hover:bg-slate-50">
          ${escapeHtml(f.question)}
          <span class="ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 transition-transform duration-300 group-open:rotate-180">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </summary>
        <div class="px-6 pb-6 text-slate-600">
          <p class="pt-2 border-t border-slate-50">${escapeHtml(f.answer)}</p>
        </div>
      </details>`,
      )
      .join('');
    setHtml(
      '#faq-content',
      `<div class="space-y-4">${items}</div>`
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

  function initPrivacyFooter() {
    const a = document.querySelector('#privacy-footer-link');
    if (a && window.PRIVACY_POLICY_URL) a.href = window.PRIVACY_POLICY_URL;
  }

  async function main() {
    try {
      initPrivacyFooter();
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
