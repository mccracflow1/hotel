/**
 * Widget chat web (009). Requiere window.CHAT_WEBHOOK_URL y DOMPurify global (cargar antes).
 */
(function () {
  function $(sel) {
    return document.querySelector(sel);
  }

  class HotelChatWidget {
    constructor() {
      let sid = sessionStorage.getItem('hotel_session');
      if (!sid) {
        sid = crypto.randomUUID();
        sessionStorage.setItem('hotel_session', sid);
      }
      this.sessionId = sid;
      this.root = null;
      this.panelOpen = false;
      this.buildUI();
      this.bindEvents();
    }

    buildUI() {
      const wrap = document.createElement('div');
      wrap.className = 'fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2';
      wrap.innerHTML = `
        <div id="hw-panel" class="hidden w-[min(100vw-2rem,22rem)] max-h-[min(70vh,28rem)] flex flex-col rounded-lg border border-slate-600 bg-slate-900 shadow-xl">
          <div class="border-b border-slate-700 px-3 py-2 text-sm font-medium text-amber-400">Sofia</div>
          <div id="hw-msgs" class="flex-1 overflow-y-auto p-3 space-y-2 text-sm"></div>
          <div id="hw-typing" class="hidden px-3 text-xs text-slate-500">Sofia está escribiendo…</div>
          <form id="hw-form" class="flex gap-2 border-t border-slate-700 p-2">
            <input id="hw-input" class="flex-1 rounded bg-slate-800 border border-slate-600 px-2 py-1 text-sm" placeholder="Escribí tu mensaje…" autocomplete="off" />
            <button type="submit" class="rounded bg-amber-500 px-3 py-1 text-sm font-semibold text-slate-900">Enviar</button>
          </form>
        </div>
        <button type="button" id="hw-toggle" class="rounded-full bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg hover:bg-amber-400">Chat</button>
      `;
      document.body.appendChild(wrap);
      this.root = wrap;
    }

    bindEvents() {
      $('#hw-toggle').addEventListener('click', () => {
        this.panelOpen = !this.panelOpen;
        $('#hw-panel').classList.toggle('hidden', !this.panelOpen);
      });
      $('#hw-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = $('#hw-input');
        const text = (input.value || '').trim();
        if (!text) return;
        input.value = '';
        this.sendMessage(text);
      });
    }

    addBubble(text, who) {
      const div = document.createElement('div');
      div.className =
        who === 'user'
          ? 'ml-8 rounded-lg bg-amber-500/20 px-3 py-2 text-right text-slate-100'
          : 'mr-8 rounded-lg bg-slate-800 px-3 py-2 text-slate-200';
      if (who === 'bot' && typeof DOMPurify !== 'undefined') {
        div.innerHTML = DOMPurify.sanitize(text, { USE_PROFILES: { html: true } });
      } else {
        div.textContent = text;
      }
      $('#hw-msgs').appendChild(div);
      $('#hw-msgs').scrollTop = $('#hw-msgs').scrollHeight;
    }

    showTyping() {
      $('#hw-typing').classList.remove('hidden');
    }

    hideTyping() {
      $('#hw-typing').classList.add('hidden');
    }

    showPaymentCard(url, number, amount) {
      const card = document.createElement('div');
      card.className = 'mr-8 rounded-lg border border-emerald-600/50 bg-emerald-950/40 p-3 text-sm';
      const p1 = document.createElement('p');
      p1.className = 'font-medium text-emerald-300';
      p1.textContent = `Reserva ${number || ''}`;
      card.appendChild(p1);
      if (amount != null) {
        const p2 = document.createElement('p');
        p2.className = 'text-slate-300';
        p2.textContent = `Total: ${amount}`;
        card.appendChild(p2);
      }
      const a = document.createElement('a');
      a.className = 'mt-2 inline-block rounded bg-emerald-500 px-3 py-1 font-semibold text-slate-900';
      a.textContent = 'Pagar';
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      card.appendChild(a);
      $('#hw-msgs').appendChild(card);
    }

    async sendMessage(text) {
      const url = window.CHAT_WEBHOOK_URL;
      if (!url) {
        this.addBubble('CHAT_WEBHOOK_URL no configurada.', 'bot');
        return;
      }
      this.addBubble(text, 'user');
      this.showTyping();
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: this.sessionId, message: text, channel: 'web' }),
        });
        const data = await res.json().catch(() => ({}));
        this.hideTyping();
        const reply = data.response || data.message || '(sin respuesta)';
        this.addBubble(reply, 'bot');
        if (data.payment_url && data.reservation_number) {
          this.showPaymentCard(data.payment_url, data.reservation_number, data.total_amount);
        }
      } catch {
        this.hideTyping();
        this.addBubble('Error de red al contactar el asistente.', 'bot');
      }
    }
  }

  window.HotelChatWidget = HotelChatWidget;

  document.addEventListener('DOMContentLoaded', () => {
    try {
      new HotelChatWidget();
    } catch (e) {
      console.warn('HotelChatWidget', e);
    }
  });
})();

