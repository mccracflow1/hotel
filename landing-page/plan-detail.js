/**
 * Detalle de plan + reserva pública (009).
 * Rutas canónicas: specs/009-landing-week9/contracts/README.md
 */
(function () {
  const API_BASE_URL = (window.API_BASE_URL || 'http://localhost:3000/api/v1').replace(/\/$/, '');
  const PUBLIC_RESERVATIONS_PATH = '/public/reservations';
  const PUBLIC_PAYMENTS_PATH = '/public/payments/create';

  function $(sel) {
    return document.querySelector(sel);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function planSlug() {
    const q = new URLSearchParams(window.location.search).get('slug');
    if (q) return q.trim();
    const m = window.location.pathname.match(/\/planes\/([^/]+)\/?$/);
    return m ? decodeURIComponent(m[1]) : '';
  }

  function computeTotal(plan, optionalIds) {
    let t = Number(plan.base_price || 0);
    for (const act of plan.base_activities || []) {
      t += Number(act.extra_cost || 0);
    }
    const optMap = new Map((plan.optional_activities || []).map((o) => [o.optional_activity_id, o]));
    for (const id of optionalIds) {
      const o = optMap.get(id);
      if (o) t += Number(o.price || 0);
    }
    return Math.round(t * 100) / 100;
  }

  async function fetchJson(path, options) {
    const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
    const r = await fetch(url, options || {});
    let body = {};
    try {
      body = await r.json();
    } catch {
      /* ignore */
    }
    if (!r.ok) {
      const err = new Error(`${path} → ${r.status}`);
      err.status = r.status;
      err.body = body;
      throw err;
    }
    return body;
  }

  function setPrivacyLink() {
    const a = $('#privacy-link');
    if (a && window.PRIVACY_POLICY_URL) a.href = window.PRIVACY_POLICY_URL;
  }

  function render(plan) {
    const optHtml = (plan.optional_activities || [])
      .filter((o) => o.is_active !== false)
      .map(
        (o) => `<label class="group flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-emerald-500 hover:shadow-md">
          <div class="flex h-5 items-center">
            <input type="checkbox" name="opt" value="${escapeHtml(o.optional_activity_id)}" class="opt-cb h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600" />
          </div>
          <div class="flex flex-col">
            <span class="font-bold text-slate-900">${escapeHtml(o.name)}</span>
            <span class="text-sm font-medium text-emerald-600">+ $${Number(o.price).toLocaleString('es-CO')}</span>
          </div>
        </label>`,
      )
      .join('');

    const baseActs = (plan.base_activities || [])
      .map(
        (a) =>
          `<li class="flex items-start gap-3 rounded-lg bg-slate-50 p-4 border border-slate-100">
            <svg class="h-6 w-6 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <div class="flex flex-col">
              <span class="font-bold text-slate-900">${escapeHtml(a.name)}</span>
              ${a.description ? `<span class="mt-1 text-sm text-slate-600">${escapeHtml(a.description)}</span>` : ''}
              ${Number(a.extra_cost) > 0 ? `<span class="mt-1 text-xs font-semibold text-emerald-600">+ $${Number(a.extra_cost).toLocaleString('es-CO')} base</span>` : ''}
            </div>
          </li>`,
      )
      .join('');

    const mediaTiles = (plan.media || [])
      .map(
        (m, i) =>
          `<div class="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
            <img src="${escapeHtml(m.thumbnail_url || m.original_url)}" alt="" class="h-full w-full object-cover transition-transform duration-500 hover:scale-110" loading="${i > 0 ? 'lazy' : 'eager'}" />
          </div>`,
      )
      .join('');

    const videoBlock = (plan.media || []).find((m) => m.file_type === 'video' || (m.mime_type || '').startsWith('video/'));
    const videoHtml = videoBlock
      ? `<div class="mt-8 overflow-hidden rounded-2xl bg-slate-900 shadow-lg"><video controls class="w-full max-h-[500px]" src="${escapeHtml(videoBlock.original_url)}"></video></div>`
      : '';

    const room = plan.room;
    const roomHtml = room
      ? `<div class="mt-8 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-6 shadow-sm">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <p class="text-xs font-bold uppercase tracking-widest text-emerald-600">Alojamiento</p>
            <p class="text-lg font-bold text-slate-900">${escapeHtml(room.name)}</p>
            <p class="text-sm font-medium text-slate-600">Capacidad para ${room.capacity} personas</p>
          </div>
        </div>`
      : '';

    const html = `
      <div class="grid gap-12 lg:grid-cols-12">
        <div class="lg:col-span-7 xl:col-span-8">
          <div class="mb-4 inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Experiencia</div>
          <h1 class="text-4xl font-extrabold text-slate-900 sm:text-5xl">${escapeHtml(plan.name)}</h1>
          <p class="mt-4 text-xl leading-8 text-slate-600">${escapeHtml(plan.short_desc || '')}</p>

          ${mediaTiles ? `<div class="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3">${mediaTiles}</div>` : ''}
          ${videoHtml}
          ${roomHtml}

          ${plan.long_desc ? `<div class="prose prose-slate mt-10 max-w-none text-slate-700 whitespace-pre-wrap">${escapeHtml(plan.long_desc)}</div>` : ''}

          <div class="mt-12 border-t border-slate-200 pt-10">
            <h2 class="text-2xl font-bold text-slate-900">¿Qué incluye?</h2>
            <ul class="mt-6 grid gap-4 sm:grid-cols-2">${baseActs || '<li class="text-slate-500">Sin actividades base listadas.</li>'}</ul>
          </div>

          <div class="mt-12 border-t border-slate-200 pt-10">
            <h2 class="text-2xl font-bold text-slate-900">Mejora tu experiencia</h2>
            <p class="mt-2 text-slate-600">Añade actividades opcionales a tu reserva.</p>
            <div class="mt-6 grid gap-4 sm:grid-cols-2">${optHtml || '<p class="text-slate-500">No hay opcionales disponibles.</p>'}</div>
          </div>
        </div>

        <!-- Sidebar Reserva -->
        <div class="lg:col-span-5 xl:col-span-4">
          <div class="sticky top-24 rounded-3xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100">
            <div class="mb-6 border-b border-slate-100 pb-6 text-center">
              <p class="text-sm font-bold uppercase tracking-widest text-emerald-600">Total estimado</p>
              <p id="total-display" class="mt-2 text-5xl font-extrabold text-slate-900" aria-live="polite">$0</p>
              <p class="mt-2 text-xs font-medium text-slate-500">Tasas e impuestos calculados en el siguiente paso.</p>
            </div>

            <form id="res-form" class="space-y-5">
              <input type="hidden" name="plan_id" value="${escapeHtml(plan.id)}" />

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-slate-700">Check-in</label>
                  <input required name="date_start" type="date" class="mt-2 block w-full rounded-xl border-slate-200 bg-slate-50 py-3 px-4 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-slate-700">Check-out <span class="text-slate-400 font-normal">(Opcional)</span></label>
                  <input name="date_end" type="date" class="mt-2 block w-full rounded-xl border-slate-200 bg-slate-50 py-3 px-4 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-slate-700">Adultos</label>
                  <input required name="adults" type="number" min="1" value="2" class="mt-2 block w-full rounded-xl border-slate-200 bg-slate-50 py-3 px-4 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-slate-700">Niños</label>
                  <input name="children" type="number" min="0" value="0" class="mt-2 block w-full rounded-xl border-slate-200 bg-slate-50 py-3 px-4 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" />
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-slate-700">Nombre completo</label>
                <input required name="customer_name" placeholder="Ej. Juan Pérez" class="mt-2 block w-full rounded-xl border-slate-200 bg-slate-50 py-3 px-4 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" />
              </div>

              <div>
                <label class="block text-sm font-semibold text-slate-700">Documento de identidad</label>
                <input required name="customer_document" placeholder="Número de documento" class="mt-2 block w-full rounded-xl border-slate-200 bg-slate-50 py-3 px-4 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" />
              </div>

              <div>
                <label class="block text-sm font-semibold text-slate-700">Teléfono (WhatsApp)</label>
                <input required name="customer_phone" type="tel" placeholder="+57 300..." class="mt-2 block w-full rounded-xl border-slate-200 bg-slate-50 py-3 px-4 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" />
              </div>

              <div>
                <label class="block text-sm font-semibold text-slate-700">Correo electrónico</label>
                <input name="customer_email" type="email" placeholder="correo@ejemplo.com" class="mt-2 block w-full rounded-xl border-slate-200 bg-slate-50 py-3 px-4 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" />
              </div>

              <div id="form-err" class="hidden rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100"></div>

              <button type="submit" class="mt-6 flex w-full items-center justify-center rounded-xl bg-emerald-600 px-8 py-4 text-lg font-bold text-white shadow-lg hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 transition-all hover:-translate-y-0.5">
                Continuar al Pago
                <svg class="ml-2 -mr-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>`;
    $('#plan-root').innerHTML = html;

    const totalEl = $('#total-display');
    const cbs = () => Array.from(document.querySelectorAll('.opt-cb:checked')).map((x) => x.value);

    function refreshTotal() {
      totalEl.textContent = '$' + computeTotal(plan, cbs()).toLocaleString('es-CO');
    }
    document.querySelectorAll('.opt-cb').forEach((el) => el.addEventListener('change', refreshTotal));
    refreshTotal();

    $('#res-form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const errEl = $('#form-err');
      errEl.classList.add('hidden');
      const fd = new FormData(ev.target);
      const optional_activity_ids = cbs();
      const body = {
        plan_id: fd.get('plan_id'),
        room_id: null,
        customer_name: fd.get('customer_name'),
        customer_document: fd.get('customer_document'),
        customer_email: fd.get('customer_email') || null,
        customer_phone: fd.get('customer_phone'),
        date_start: fd.get('date_start'),
        date_end: fd.get('date_end') || null,
        adults: Number(fd.get('adults')),
        children: Number(fd.get('children') || 0),
        notes: null,
        optional_activity_ids,
      };
      const idemRes = crypto.randomUUID();
      try {
        const res = await fetchJson(PUBLIC_RESERVATIONS_PATH, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idemRes },
          body: JSON.stringify(body),
        });
        const d = res.data;
        const idemPay = crypto.randomUUID();
        const pay = await fetchJson(PUBLIC_PAYMENTS_PATH, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idemPay },
          body: JSON.stringify({
            reservation_id: d.id,
            amount: d.total_amount,
            payment_intent_token: d.payment_intent_token,
          }),
        });
        if (pay.data?.checkout_url) window.location.href = pay.data.checkout_url;
        else errEl.textContent = 'No se recibió checkout_url.';
        errEl.classList.remove('hidden');
      } catch (e) {
        const msg =
          e.status === 409
            ? 'Sin disponibilidad para esas fechas.'
            : e.status === 429
              ? 'Demasiados intentos. Probá más tarde.'
              : e.body?.error?.message || e.message || 'Error al reservar.';
        errEl.textContent = msg;
        errEl.classList.remove('hidden');
      }
    });
  }

  async function main() {
    setPrivacyLink();
    const slug = planSlug();
    if (!slug) {
      $('#plan-root').innerHTML = '<p class="text-red-400">Falta el slug del plan (?slug=mi-plan).</p>';
      return;
    }
    try {
      const bundle = await fetchJson('/plans/by-slug/' + encodeURIComponent(slug));
      render(bundle.data);
    } catch (e) {
      $('#plan-root').innerHTML =
        '<p class="text-red-400">No se encontró el plan o la API no responde. Verificá API_BASE_URL y CORS.</p>';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
  else main();
})();
