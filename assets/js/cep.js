/* ==========================================================================
   cep.js — Consulta de CEP (BrasilAPI)
   - Máscara 00000-000, validação simples (8 dígitos)
   - Exibição em card
   ========================================================================== */
// cep.js — BrasilAPI + máscara com caret correto

const digits = v => (v || '').replace(/\D/g, '');

// Formata a partir APENAS dos dígitos
function formatCEPDigits(d) {
  d = digits(d).slice(0, 8);
  if (d.length <= 5) return d;
  return d.slice(0, 5) + '-' + d.slice(5);
}

document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const form = document.getElementById('cep-form');
  if (!form) return;

  const input    = document.getElementById('cep');
  const statusEl = document.getElementById('status');
  const results  = document.getElementById('results');

  // Botão "Copiar informações" (usa assets/js/copy.js)
  if (typeof addCopyButton === 'function') addCopyButton('#results', 'copy-btn');

  // ✅ MÁSCARA COM PRESERVAÇÃO DO CURSOR
  input.addEventListener('input', (e) => {
    const oldValue = input.value;
    const caretPos = input.selectionStart || 0;

    // Quantos DÍGITOS existiam antes do cursor
    const digitsBeforeCaret = digits(oldValue.slice(0, caretPos)).length;

    // Reformatar
    const d = digits(oldValue).slice(0, 8);
    const formatted = formatCEPDigits(d);

    // Onde o cursor deve cair no novo texto
    let newCaret;
    if (digitsBeforeCaret <= 5) {
      newCaret = digitsBeforeCaret;               // antes do hífen
    } else {
      newCaret = Math.min(formatted.length,       // depois do hífen soma +1
                          digitsBeforeCaret + 1);
    }

    input.value = formatted;
    input.setSelectionRange(newCaret, newCaret);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    results.classList.add('d-none');
    results.innerHTML = '';

    const cep = digits(input.value);
    if (cep.length !== 8) {
      statusEl.innerHTML = `<div class="alert alert-warning py-2">Informe 8 dígitos para o CEP.</div>`;
      return;
    }

    statusEl.innerHTML = `<div class="alert alert-info py-2">Consultando...</div>`;

    try {
      const r = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`, { cache: 'no-store' });
      if (!r.ok) throw new Error('CEP não encontrado');
      const j = await r.json();

      const card = `
        <div class="col-12">
          <div class="card shadow-soft border-0 round-xl">
            <div class="card-body bg-surface text-light">
              <h5 class="card-title mb-2">Endereço</h5>
              <p class="mb-0"><strong>Rua:</strong> ${j.street || '-'}</p>
              <p class="mb-0"><strong>Bairro:</strong> ${j.neighborhood || '-'}</p>
              <p class="mb-0"><strong>Cidade/UF:</strong> ${j.city || '-'} / ${j.state || '-'}</p>
              <p class="text-muted-2"><strong>CEP:</strong> ${formatCEPDigits(cep)}</p>
            </div>
          </div>
        </div>`;
      results.innerHTML = card;
      results.classList.remove('d-none');
      statusEl.innerHTML = '';
    } catch (err) {
      console.error(err);
      statusEl.innerHTML = `<div class="alert alert-danger py-2">Não foi possível consultar. Verifique o CEP.</div>`;
    }
  });
});
