/* ==========================================================================
   cnpj.js — Consulta de CNPJ (BrasilAPI)
   - Máscara com preservação do cursor
   - Validação local dos dígitos
   - Exibição dos dados em cards
   ========================================================================== */

   const esc = (s) => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
   const onlyDigits = v => (v || '').replace(/\D/g, '').slice(0, 14);
   
   // 14 dígitos -> 00.000.000/0000-00
   function formatCNPJDigits(d) {
     d = onlyDigits(d);
     if (d.length <= 2) return d;
     if (d.length <= 5) return d.replace(/^(\d{2})(\d+)/, '$1.$2');
     if (d.length <= 8) return d.replace(/^(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
     if (d.length <= 12) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4');
     return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2}).*$/, '$1.$2.$3/$4-$5');
   }
   
   // Dado um texto formatado e a quantidade de dígitos antes do cursor,
   // retorna a posição de caret equivalente no texto novo
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
     if (!iso) return '';
     const d = new Date(iso);
     return isNaN(d) ? String(iso) : d.toLocaleDateString('pt-BR');
   };
   
   document.addEventListener('DOMContentLoaded', () => {
     const yearEl = document.getElementById('year');
     if (yearEl) yearEl.textContent = new Date().getFullYear();
   
     const form = document.getElementById('cnpj-form');
     if (!form) return;
   
     const input   = document.getElementById('cnpj');
     const statusEl = document.getElementById('status');
     const results  = document.getElementById('results');
   
     // 🔧 MÁSCARA COM PRESERVAÇÃO DO CURSOR
     input.addEventListener('input', () => {
       const oldVal   = input.value;
       const caretPos = input.selectionStart || 0;
   
       // quantos DÍGITOS havia antes do cursor
       const digitsBefore = (oldVal.slice(0, caretPos).match(/\d/g) || []).length;
   
       const d = onlyDigits(oldVal);
       const formatted = formatCNPJDigits(d);
   
       // nova posição do cursor equivalente aos mesmos dígitos
       const newCaret = caretFromDigits(formatted, digitsBefore);
   
       input.value = formatted;
       input.setSelectionRange(newCaret, newCaret);
     });
   
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
   
   // Renderização dos cartões
   function render(d, container) {
     const end   = d.endereco || {};
     const sec   = Array.isArray(d.cnaes_secundarias) ? d.cnaes_secundarias : [];
     const socios= Array.isArray(d.socios) ? d.socios : [];
   
     const cards = [];
   
     cards.push(`
       <div class="col-12">
         <div class="card shadow-soft border-0 round-xl">
           <div class="card-body bg-surface text-light">
             <h5 class="card-title mb-3">Dados Cadastrais</h5>
             <div class="row row-cols-1 row-cols-md-2 g-2">
               <div><strong>CNPJ:</strong> <span class="badge bg-secondary">${esc(formatCNPJDigits(d.cnpj||''))}</span></div>
               <div><strong>Razão Social:</strong> ${esc(d.razao_social||'-')}</div>
               <div><strong>Nome Fantasia:</strong> ${esc(d.nome_fantasia||'-')}</div>
               <div><strong>Natureza Jurídica:</strong> ${esc(d.natureza_juridica||'-')}</div>
               <div><strong>Situação:</strong> ${esc(d.situacao||'-')}</div>
               <div><strong>Abertura:</strong> ${esc(fdate(d.abertura))}</div>
               <div><strong>Capital Social:</strong> ${d.capital_social ? 'R$ ' + esc(String(d.capital_social)) : '-'}</div>
             </div>
           </div>
         </div>
       </div>`);
   
     cards.push(`
       <div class="col-12 col-lg-6">
         <div class="card shadow-soft border-0 round-xl">
           <div class="card-body bg-surface text-light">
             <h6 class="card-title">Endereço</h6>
             <p class="mb-0">${esc([end.logradouro, end.numero].filter(Boolean).join(', '))}</p>
             <p class="text-muted-2">${esc([end.complemento, end.bairro].filter(Boolean).join(' - '))}</p>
             <p class="text-muted-2">${esc([end.municipio, end.uf].filter(Boolean).join('/'))} • ${esc(end.cep || '')}</p>
           </div>
         </div>
       </div>`);
   
     const cnaeSecHTML = sec.length
       ? `<ul class="mb-0">${sec.map(c => `<li><span class="badge bg-secondary me-1">${esc(c.codigo)}</span> ${esc(c.descricao)}</li>`).join('')}</ul>`
       : `<p class="text-muted-2 mb-0">Sem CNAEs secundárias.</p>`;
   
     cards.push(`
       <div class="col-12 col-lg-6">
         <div class="card shadow-soft border-0 round-xl">
           <div class="card-body bg-surface text-light">
             <h6 class="card-title">Atividades Econômicas (CNAE)</h6>
             <p><strong>Principal:</strong> <span class="badge bg-secondary me-1">${esc(d.cnae_principal?.codigo || '-')}</span> ${esc(d.cnae_principal?.descricao || '-')}</p>
             ${cnaeSecHTML}
           </div>
         </div>
       </div>`);
   
     const sociosHTML = socios.length
       ? `<ul class="mb-0">${socios.map(s => `<li>${esc(s.nome)} — <span class="text-muted-2">${esc(s.qualificacao || 'Sócio')}</span></li>`).join('')}</ul>`
       : `<p class="text-muted-2 mb-0">Não informado.</p>`;
   
     cards.push(`
       <div class="col-12">
         <div class="card shadow-soft border-0 round-xl">
           <div class="card-body bg-surface text-light">
             <h6 class="card-title">Quadro Societário</h6>
             ${sociosHTML}
           </div>
         </div>
       </div>`);
   
     container.innerHTML = cards.join('');
     container.classList.remove('d-none');
   }
   