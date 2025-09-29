/* ==========================================================================
   cnpj.js — Consulta de CNPJ (BrasilAPI)
   - Máscara com preservação do cursor
   - Validação local dos dígitos
   - Exibição dos dados em LINHAS com botão "Copiar"
   ========================================================================== */

   const esc = (s) => String(s).replace(/[&<>"']/g, m => (
    {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]
  ));
  const onlyDigits = v => (v || '').replace(/\D/g, '').slice(0, 14);
  
  // 14 dígitos -> 00.000.000/0000-00
  function formatCNPJDigits(d) {
    d = onlyDigits(d);
    if (d.length <= 2)  return d;
    if (d.length <= 5)  return d.replace(/^(\d{2})(\d+)/, '$1.$2');
    if (d.length <= 8)  return d.replace(/^(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
    if (d.length <= 12) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4');
    return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2}).*$/, '$1.$2.$3/$4-$5');
  }
  
  // Calcula a posição do cursor após a formatação
  function caretFromDigits(formatted, digitsBefore) {
    let count = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) count++;
      if (count >= digitsBefore) return i + 1;
    }
    return formatted.length;
  }
  
  // Validação local de CNPJ
  function isValidCNPJ(v) {
    const c = onlyDigits(v);
    if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
    const calc = (b) => {
      let s = 0, p = b.length - 7;
      for (let i = b.length; i >= 1; i--) {
        s += b[b.length - i] * p--;
        if (p < 2) p = 9;
      }
      const m = s % 11;
      return (m < 2) ? 0 : 11 - m;
    };
    const b = c.slice(0, 12), d1 = calc(b), d2 = calc(b + String(d1));
    return c === (b + d1 + d2);
  }
  
  const fdate = iso => {
    if (!iso) return '-';
    const d = new Date(iso);
    return isNaN(d) ? String(iso) : d.toLocaleDateString('pt-BR');
  };
  
  // ===== helpers para as LINHAS com botão "Copiar" =====
  let __rowSeq = 0;
  function makeRow(label, text) {
    const id = `val-${++__rowSeq}`;
    return `
      <div class="info-row">
        <div class="info-label">${esc(label)}</div>
        <div class="info-value"><span id="${id}">${esc(text || '-')}</span></div>
        <button class="btn btn-outline-secondary btn-sm copy-line" data-target="${id}" type="button" title="Copiar ${esc(label)}">
          Copiar
        </button>
      </div>`;
  }
  function addrStr(end = {}) {
    const p1 = [end.logradouro, end.numero].filter(Boolean).join(', ');
    const p2 = [end.complemento, end.bairro].filter(Boolean).join(' - ');
    const p3 = [end.municipio, end.uf].filter(Boolean).join('/');
    const p4 = end.cep || '';
    return [p1, p2, [p3, p4].filter(Boolean).join(' • ')].filter(Boolean).join(' | ');
  }
  function moneyBR(v) {
    if (v == null || v === '') return '-';
    const n = Number(String(v).replace(',', '.'));
    if (Number.isNaN(n)) return String(v);
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  
    const form = document.getElementById('cnpj-form');
    if (!form) return;
  
    const input    = document.getElementById('cnpj');
    const statusEl = document.getElementById('status');
    const results  = document.getElementById('results');
  
    // Máscara com preservação do cursor
    input.addEventListener('input', () => {
      const oldVal   = input.value;
      const caretPos = input.selectionStart || 0;
      const digitsBefore = (oldVal.slice(0, caretPos).match(/\d/g) || []).length;
      const formatted = formatCNPJDigits(oldVal);
      const newCaret  = caretFromDigits(formatted, digitsBefore);
      input.value = formatted;
      input.setSelectionRange(newCaret, newCaret);
    });
  
    // Submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      results.classList.add('d-none');
      results.innerHTML = '';
  
      const cnpj = onlyDigits(input.value);
      if (!isValidCNPJ(cnpj)) {
        statusEl.innerHTML = `<div class="alert alert-warning py-2">CNPJ inválido. Verifique os dígitos.</div>`;
        return;
      }
      statusEl.innerHTML = `<div class="alert alert-info py-2">Consultando...</div>`;
  
      try {
        const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, { cache: 'no-store' });
        if (!r.ok) throw new Error('Falha na BrasilAPI');
        const j = await r.json();
        render(unifyFromBrasilApi(j), results);
        statusEl.innerHTML = '';
      } catch (err) {
        console.error(err);
        statusEl.innerHTML = `<div class="alert alert-danger py-2">Não foi possível consultar agora. Tente novamente.</div>`;
      }
    });
  
    // Delegação de evento para botões "Copiar"
    results.addEventListener('click', async (e) => {
      const btn = e.target.closest('.copy-line');
      if (!btn) return;
      const targetId = btn.getAttribute('data-target');
      const el = document.getElementById(targetId);
      if (!el) return;
      const txt = el.textContent.trim();
      try {
        await navigator.clipboard.writeText(txt);
        const old = btn.textContent;
        btn.textContent = 'Copiado!';
        btn.classList.remove('btn-outline-secondary');
        btn.classList.add('btn-success');
        setTimeout(() => {
          btn.textContent = old.trim() || 'Copiar';
          btn.classList.remove('btn-success');
          btn.classList.add('btn-outline-secondary');
        }, 1200);
      } catch (_) {
        const r = document.createRange();
        r.selectNodeContents(el);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
      }
    });
  });
  
  // Normalização dos campos da BrasilAPI
  function unifyFromBrasilApi(j) {
    return {
      cnpj: j.cnpj || '',
      razao_social: j.razao_social || j.razao || '',
      nome_fantasia: j.nome_fantasia || '',
      natureza_juridica: j.natureza_juridica || '',
      capital_social: j.capital_social || '',
      situacao: j.descricao_situacao_cadastral || j.situacao_cadastral || '',
      abertura: j.data_inicio_atividade || j.data_inicio_atividades || '',
      cnae_principal: { codigo: j.cnae_fiscal || '', descricao: j.cnae_fiscal_descricao || '' },
      cnaes_secundarias: (j.cnaes_secundarias || []).map(c => ({ codigo: c.codigo, descricao: c.descricao })),
      socios: (j.qsa || []).map(s => ({ nome: s.nome_socio || s.nome, qualificacao: s.qualificacao_socio || s.qualificacao })),
      endereco: {
        logradouro: j.logradouro, numero: j.numero, complemento: j.complemento,
        bairro: j.bairro, municipio: j.municipio || j.cidade, uf: j.uf, cep: j.cep
      }
    };
  }
  
  // ===== Renderização em LINHAS (ordem: CNPJ, Razão, Nome, Endereço detalhado...) =====
function render(d, container) {
  __rowSeq = 0;
  const end    = d.endereco || {};
  const sec    = Array.isArray(d.cnaes_secundarias) ? d.cnaes_secundarias : [];
  const socios = Array.isArray(d.socios) ? d.socios : [];

  // Topo (ordem pedida)
  const blocoTopo = [
    makeRow('CNPJ',            d.cnpj ? formatCNPJDigits(d.cnpj) : '-'),
    makeRow('Razão Social',    d.razao_social),
    makeRow('Nome Fantasia',   d.nome_fantasia),
  ].join('');

  // Endereço separado em várias linhas
  const blocoEndereco = [
    makeRow('Rua / Número', [end.logradouro, end.numero].filter(Boolean).join(', ')),
    makeRow('Bairro',       end.bairro),
    makeRow('Complemento',  end.complemento),
    makeRow('Cidade / UF',  [end.municipio, end.uf].filter(Boolean).join(' / ')),
    makeRow('CEP',          end.cep),
  ].join('');

  // Demais dados
  const blocoMais = [
    makeRow('Natureza Jurídica', d.natureza_juridica),
    makeRow('Situação',          d.situacao),
    makeRow('Abertura',          fdate(d.abertura)),
    makeRow('Capital Social',    moneyBR(d.capital_social)),
  ].join('');

  // CNAE
  const cnaePrincipal = d.cnae_principal
    ? `${d.cnae_principal.codigo || '-'} — ${d.cnae_principal.descricao || '-'}`
    : '-';
  const blocoCnae = [
    makeRow('CNAE Principal', cnaePrincipal),
    (sec.length
      ? sec.map(c => makeRow('CNAE Secundária', `${c.codigo || '-'} — ${c.descricao || '-'}`)).join('')
      : makeRow('CNAEs Secundárias', 'Sem CNAEs secundárias.')
    )
  ].join('');

  // Sócios
  const blocoSocios = (socios.length
    ? socios.map(s => makeRow('Sócio', `${s.nome || '-'} — ${s.qualificacao || 'Sócio'}`)).join('')
    : makeRow('Quadro Societário', 'Não informado.')
  );

  container.innerHTML = `
    <div class="col-12">
      <div class="card shadow-soft border-0 round-xl info-card">
        <div class="card-body bg-surface text-light">
          <h5 class="card-title mb-3">Dados Cadastrais</h5>
          ${blocoTopo}
          <hr class="my-3 opacity-25">
          ${blocoEndereco}
          <hr class="my-3 opacity-25">
          ${blocoMais}
        </div>
      </div>
    </div>

    <div class="col-12">
      <div class="card shadow-soft border-0 round-xl info-card">
        <div class="card-body bg-surface text-light">
          <h5 class="card-title mb-3">Atividades Econômicas (CNAE)</h5>
          ${blocoCnae}
        </div>
      </div>
    </div>

    <div class="col-12">
      <div class="card shadow-soft border-0 round-xl info-card">
        <div class="card-body bg-surface text-light">
          <h5 class="card-title mb-3">Quadro Societário</h5>
          ${blocoSocios}
        </div>
      </div>
    </div>
  `;
  container.classList.remove('d-none');
}

  