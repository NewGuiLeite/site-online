/* ncm.js — Consulta NCM (BrasilAPI) com ATO LEGAL
   Mostra: código, descrição, vigência e {tipo_ato, numero_ato, ano_ato}
*/
const ncmDigits = v => (v || '').replace(/\D/g, '').slice(0, 8);

// 30039099 => 3003.90.99
const fmtNCM = code => String(code || '')
  .replace(/\D/g, '')
  .padEnd(8, '0')
  .replace(/^(\d{4})(\d{2})(\d{2}).*$/, '$1.$2.$3');

const fmtDate = iso => {
  if (!iso) return '—';
  // Alguns registros vêm com "9999-12-31" pra indicar "sem fim"
  if (/^9999-12-31/.test(iso)) return 'indeterminado';
  const d = new Date(iso);
  return isNaN(d) ? String(iso) : d.toLocaleDateString('pt-BR');
};

document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const form     = document.getElementById('ncm-form');
  const input    = document.getElementById('ncm');
  const statusEl = document.getElementById('status');
  const results  = document.getElementById('results');

  // Botão "Copiar informações"
  if (typeof addCopyButton === 'function') addCopyButton('#results', 'copy-btn');

  input.addEventListener('input', () => {
    input.value = ncmDigits(input.value);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    results.classList.add('d-none');
    results.innerHTML = '';

    const code = ncmDigits(input.value);
    if (code.length !== 8) {
      statusEl.innerHTML = `<div class="alert alert-warning py-2">Informe 8 dígitos de NCM.</div>`;
      return;
    }
    statusEl.innerHTML = `<div class="alert alert-info py-2">Consultando...</div>`;

    try {
      // 1) tenta endpoint por código
      let r = await fetch(`https://brasilapi.com.br/api/ncm/v1/${code}`, { cache: 'no-store' });
      let data;

      if (r.ok) {
        data = await r.json();
      } else {
        // 2) fallback: baixa lista e filtra
        r = await fetch(`https://brasilapi.com.br/api/ncm/v1`, { cache: 'no-store' });
        if (!r.ok) throw new Error('Falha na BrasilAPI');
        const list = await r.json();
        data = (list || []).find(x => (x.codigo || x.code) == code);
      }

      if (!data) throw new Error('NCM não encontrado');

      // Normaliza campos
      const codigo   = data.codigo || data.code || code;
      const desc     = data.descricao || data.description || '—';
      const ini      = data.data_inicio || data.start_date || '';
      const fim      = data.data_fim || data.end_date || '';
      const tipoAto  = data.tipo_ato || '';
      const numAto   = data.numero_ato || '';
      const anoAto   = data.ano_ato || '';

      // Se tiver qualquer parte do "ato legal", mostra o bloco
      const temAto = tipoAto || numAto || anoAto;

      const card = `
        <div class="col-12">
          <div class="card shadow-soft border-0 round-xl">
            <div class="card-body bg-surface text-light">
              <h5 class="card-title mb-2">NCM</h5>
              <p class="mb-1"><strong>Código:</strong> <span class="badge bg-secondary">${fmtNCM(codigo)}</span></p>
              <p class="mb-1"><strong>Descrição:</strong> ${desc}</p>
              <p class="mb-3 text-muted-2"><strong>Vigência:</strong> ${fmtDate(ini)} até ${fmtDate(fim)}</p>

              ${temAto ? `
              <div class="mt-2 pt-2 border-top border-secondary-subtle">
                <h6 class="mb-2">Ato legal</h6>
                <div class="row row-cols-1 row-cols-md-3 g-2">
                  <div><strong>Tipo:</strong> ${tipoAto || '—'}</div>
                  <div><strong>Número:</strong> ${numAto || '—'}</div>
                  <div><strong>Ano:</strong> ${anoAto || '—'}</div>
                </div>
              </div>` : ``}
            </div>
          </div>
        </div>
      `;

      results.innerHTML = card;
      results.classList.remove('d-none');
      statusEl.innerHTML = '';
    } catch (err) {
      console.error(err);
      statusEl.innerHTML = `<div class="alert alert-danger py-2">Não foi possível consultar este NCM.</div>`;
    }
  });
});
