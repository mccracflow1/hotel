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
        (o) => `<label class="flex cursor-pointer items-start gap-2 border border-slate-700 rounded p-3">
          <input type="checkbox" name="opt" value="${escapeHtml(o.optional_activity_id)}" class="mt-1 opt-cb" />
          <span><span class="font-medium">${escapeHtml(o.name)}</span>
          <span class="text-slate-400 text-sm">+ $${Number(o.price).toLocaleString('es-CO')}</span></span>
        </label>`,
      )
      .join('');

    const baseActs = (plan.base_activities || [])
      .map(
        (a) =>
          `<li class="border-l-2 border-amber-500/60 pl-3"><span class="font-medium">${escapeHtml(a.name)}</span>
          ${a.description ? `<p class="text-slate-400 text-sm">${escapeHtml(a.description)}</p>` : ''}
          ${Number(a.extra_cost) > 0 ? `<span class="text-xs text-amber-200">+ $${Number(a.extra_cost).toLocaleString('es-CO')}</span>` : ''}</li>`,
      )
      .join('');

    const mediaTiles = (plan.media || [])
      .map(
        (m, i) =>
          `<img src="${escapeHtml(m.thumbnail_url || m.original_url)}" alt="" class="rounded border border-slate-700 h-32 w-full object-cover" loading="${i > 0 ? 'lazy' : 'eager'}" />`,
      )
      .join('');

    const videoBlock = (plan.media || []).find((m) => m.file_type === 'video' || (m.mime_type || '').startsWith('video/'));
    const videoHtml = videoBlock
      ? `<div class="mt-4"><video controls class="w-full max-h-96 rounded border border-slate-700" src="${escapeHtml(videoBlock.original_url)}"></video></div>`
      : '';

    const room = plan.room;
    const roomHtml = room
      ? `<div class="rounded border border-slate-700 p-4 mt-4">
          <p class="text-xs uppercase text-amber-400">Alojamiento</p>
          <p class="font-semibold">${escapeHtml(room.name)}</p>
          <p class="text-slate-400 text-sm">Capacidad ${room.capacity}</p>
        </div>`
      : '';

    const html = `
      <div class="grid gap-8 lg:grid-cols-3">
        <div class="lg:col-span-2">
          <h1 class="text-3xl font-bold">${escapeHtml(plan.name)}</h1>
          <p class="mt-2 text-slate-300">${escapeHtml(plan.short_desc || '')}</p>
          ${plan.long_desc ? `<div class="prose prose-invert mt-4 max-w-none text-slate-300 whitespace-pre-wrap">${escapeHtml(plan.long_desc)}</div>` : ''}
          ${mediaTiles ? `<div class="mt-6 grid gap-2 sm:grid-cols-3">${mediaTiles}</div>` : ''}
          ${videoHtml}
          ${roomHtml}
          <h2 class="mt-8 text-xl font-semibold">Incluye</h2>
          <ul class="mt-3 space-y-2">${baseActs || '<li class="text-slate-500">Sin actividades base listadas.</li>'}</ul>
          <h2 class="mt-8 text-xl font-semibold">Opcionales</h2>
          <div class="mt-3 space-y-2">${optHtml || '<p class="text-slate-500">Sin opcionales.</p>'}</div>
        </div>
        <div class="lg:col-span-1">
          <div class="sticky top-4 rounded border border-slate-700 bg-slate-900/80 p-4">
            <p class="text-xs uppercase text-amber-400">Total estimado</p>
            <p id="total-display" class="text-2xl font-bold" aria-live="polite">$0</p>
            <p class="mt-1 text-xs text-slate-500">Confirmación final al enviar la reserva.</p>
            <form id="res-form" class="mt-6 space-y-3 text-sm">
              <input type="hidden" name="plan_id" value="${escapeHtml(plan.id)}" />
              <div>
                <label class="block text-slate-400">Desde</label>
                <input required name="date_start" type="date" class="mt-1 w-full rounded bg-slate-800 border border-slate-600 px-2 py-1" />
              </div>
              <div>
                <label class="block text-slate-400">Hasta (opcional)</label>
                <input name="date_end" type="date" class="mt-1 w-full rounded bg-slate-800 border border-slate-600 px-2 py-1" />
              </div>
              <div>
                <label class="block text-slate-400">Adultos</label>
                <input required name="adults" type="number" min="1" value="2" class="mt-1 w-full rounded bg-slate-800 border border-slate-600 px-2 py-1" />
              </div>
              <div>
                <label class="block text-slate-400">Niños</label>
                <input name="children" type="number" min="0" value="0" class="mt-1 w-full rounded bg-slate-800 border border-slate-600 px-2 py-1" />
              </div>
              <div>
                <label class="block text-slate-400">Nombre completo</label>
                <input required name="customer_name" class="mt-1 w-full rounded bg-slate-800 border border-slate-600 px-2 py-1" />
              </div>
              <div>
                <label class="block text-slate-400">Documento</label>
                <input required name="customer_document" class="mt-1 w-full rounded bg-slate-800 border border-slate-600 px-2 py-1" />
              </div>
              <div>
                <label class="block text-slate-400">Teléfono</label>
                <input required name="customer_phone" class="mt-1 w-full rounded bg-slate-800 border border-slate-600 px-2 py-1" />
              </div>
              <div>
                <label class="block text-slate-400">Email</label>
                <input name="customer_email" type="email" class="mt-1 w-full rounded bg-slate-800 border border-slate-600 px-2 py-1" />
              </div>
              <p id="form-err" class="hidden text-red-400 text-xs"></p>
              <button type="submit" class="w-full rounded bg-amber-500 py-2 font-semibold text-slate-900 hover:bg-amber-400">Reservar</button>
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
