// utilidades
const esc = (s) => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const onlyDigits = v => (v||'').replace(/\D/g,'');
const formatCNPJ = v => {
  const d = onlyDigits(v).slice(0,14);
  return d.replace(/^(\d{2})(\d)/,'$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d)/,'.$1/$2').replace(/(\d{4})(\d)/,'$1-$2');
};
const isValidCNPJ = v => {
  const c = onlyDigits(v);
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
  const calc = (b) => { let s=0,p=b.length-7; for(let i=b.length;i>=1;i--){ s += b[b.length-i]*p--; if(p<2) p=9; } const m=s%11; return (m<2)?0:11-m; };
  const b=c.slice(0,12), d1=calc(b), d2=calc(b+String(d1));
  return c === (b + d1 + d2);
};
const fdate = iso => { if(!iso) return ''; const d=new Date(iso); return isNaN(d)? String(iso) : d.toLocaleDateString('pt-BR'); };

document.getElementById('year').textContent = new Date().getFullYear();

const form = document.getElementById('cnpj-form');
const input = document.getElementById('cnpj');
const statusEl = document.getElementById('status');
const results = document.getElementById('results');

input.addEventListener('input', () => {
  const c = input.selectionStart;
  input.value = formatCNPJ(input.value);
  input.selectionStart = input.selectionEnd = c;
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  results.classList.add('d-none');
  results.innerHTML = '';
  const cnpj = onlyDigits(input.value);

  if (!isValidCNPJ(cnpj)){
    statusEl.innerHTML = `<div class="alert alert-warning py-2">CNPJ inválido. Verifique os dígitos.</div>`;
    return;
  }

  statusEl.innerHTML = `<div class="alert alert-info py-2">Consultando...</div>`;

  try{
    // Consulta pública (direto do navegador)
    const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, { cache:'no-store' });
    if (!r.ok) throw new Error('Falha na BrasilAPI');
    const j = await r.json();
    render(unifyFromBrasilApi(j));
    statusEl.innerHTML = '';
  }catch(err){
    console.error(err);
    statusEl.innerHTML = `<div class="alert alert-danger py-2">Não foi possível consultar agora. Tente novamente.</div>`;
  }
});

function unifyFromBrasilApi(j){
  return {
    cnpj: j.cnpj || '',
    razao_social: j.razao_social || j.razao || '',
    nome_fantasia: j.nome_fantasia || '',
    natureza_juridica: j.natureza_juridica || '',
    capital_social: j.capital_social || '',
    situacao: j.descricao_situacao_cadastral || j.situacao_cadastral || '',
    abertura: j.data_inicio_atividade || j.data_inicio_atividades || '',
    cnae_principal: { codigo: j.cnae_fiscal || '', descricao: j.cnae_fiscal_descricao || '' },
    cnaes_secundarias: (j.cnaes_secundarias||[]).map(c=>({codigo:c.codigo, descricao:c.descricao})),
    socios: (j.qsa||[]).map(s=>({nome:s.nome_socio||s.nome, qualificacao:s.qualificacao_socio||s.qualificacao})),
    endereco: { logradouro:j.logradouro, numero:j.numero, complemento:j.complemento, bairro:j.bairro, municipio:j.municipio||j.cidade, uf:j.uf, cep:j.cep }
  };
}

function render(d){
  const end = d.endereco || {};
  const sec = Array.isArray(d.cnaes_secundarias)? d.cnaes_secundarias : [];
  const socios = Array.isArray(d.socios)? d.socios : [];

  const cards = [];

  cards.push(`
    <div class="col-12">
      <div class="card shadow-sm border-0">
        <div class="card-body bg-dark-subtle text-light">
          <h5 class="card-title mb-3">Dados Cadastrais</h5>
          <div class="row row-cols-1 row-cols-md-2 g-2">
            <div><strong>CNPJ:</strong> <span class="badge bg-secondary">${esc(formatCNPJ(d.cnpj||''))}</span></div>
            <div><strong>Razão Social:</strong> ${esc(d.razao_social||'-')}</div>
            <div><strong>Nome Fantasia:</strong> ${esc(d.nome_fantasia||'-')}</div>
            <div><strong>Natureza Jurídica:</strong> ${esc(d.natureza_juridica||'-')}</div>
            <div><strong>Situação:</strong> ${esc(d.situacao||'-')}</div>
            <div><strong>Abertura:</strong> ${esc(fdate(d.abertura))}</div>
            <div><strong>Capital Social:</strong> ${d.capital_social? 'R$ '+esc(String(d.capital_social)) : '-'}</div>
          </div>
        </div>
      </div>
    </div>`);

  cards.push(`
    <div class="col-12 col-lg-6">
      <div class="card shadow-sm border-0">
        <div class="card-body bg-dark-subtle text-light">
          <h6 class="card-title">Endereço</h6>
          <p class="mb-0">${esc([end.logradouro,end.numero].filter(Boolean).join(', '))}</p>
          <p class="text-secondary">${esc([end.complemento,end.bairro].filter(Boolean).join(' - '))}</p>
          <p class="text-secondary">${esc([end.municipio,end.uf].filter(Boolean).join('/'))} • ${esc(end.cep||'')}</p>
        </div>
      </div>
    </div>`);

  const cnaeSecHTML = sec.length ? `<ul class="mb-0">${sec.map(c=>`<li><span class="badge bg-secondary me-1">${esc(c.codigo)}</span> ${esc(c.descricao)}</li>`).join('')}</ul>` : `<p class="text-secondary mb-0">Sem CNAEs secundárias.</p>`;

  cards.push(`
    <div class="col-12 col-lg-6">
      <div class="card shadow-sm border-0">
        <div class="card-body bg-dark-subtle text-light">
          <h6 class="card-title">Atividades Econômicas (CNAE)</h6>
          <p><strong>Principal:</strong> <span class="badge bg-secondary me-1">${esc(d.cnae_principal?.codigo||'-')}</span> ${esc(d.cnae_principal?.descricao||'-')}</p>
          ${cnaeSecHTML}
        </div>
      </div>
    </div>`);

  const sociosHTML = socios.length ? `<ul class="mb-0">${socios.map(s=>`<li>${esc(s.nome)} — <span class="text-secondary">${esc(s.qualificacao||'Sócio')}</span></li>`).join('')}</ul>` : `<p class="text-secondary mb-0">Não informado.</p>`;

  cards.push(`
    <div class="col-12">
      <div class="card shadow-sm border-0">
        <div class="card-body bg-dark-subtle text-light">
          <h6 class="card-title">Quadro Societário</h6>
          ${sociosHTML}
        </div>
      </div>
    </div>`);

  results.innerHTML = cards.join('');
  results.classList.remove('d-none');
}
