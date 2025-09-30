document.addEventListener('DOMContentLoaded', () => {
    const tipo = document.getElementById('tipo');
    const marca = document.getElementById('marca');
    const modelo = document.getElementById('modelo');
    const ano = document.getElementById('ano');
    const status = document.getElementById('status');
    const results = document.getElementById('results');
  
    const baseUrl = "https://parallelum.com.br/fipe/api/v1";
  
    // Carregar marcas
    tipo.addEventListener('change', async () => {
      marca.innerHTML = '';
      modelo.innerHTML = '';
      ano.innerHTML = '';
      results.classList.add('d-none');
  
      if (!tipo.value) return;
      status.innerHTML = 'Carregando marcas...';
  
      try {
        const r = await fetch(`${baseUrl}/${tipo.value}/marcas`);
        if (!r.ok) throw new Error(`Erro HTTP ${r.status}`);
        const data = await r.json();
  
        marca.innerHTML = '<option value="">Selecione...</option>' +
          data.map(m => `<option value="${m.codigo}">${m.nome}</option>`).join('');
        marca.disabled = false;
        status.innerHTML = '';
      } catch (err) {
        status.innerHTML = `<div class="alert alert-danger">Erro ao carregar marcas (${err.message}).</div>`;
      }
    });
  
    // Carregar modelos
    marca.addEventListener('change', async () => {
      modelo.innerHTML = '';
      ano.innerHTML = '';
      results.classList.add('d-none');
  
      if (!marca.value) return;
      status.innerHTML = 'Carregando modelos...';
  
      try {
        const r = await fetch(`${baseUrl}/${tipo.value}/marcas/${marca.value}/modelos`);
        if (!r.ok) throw new Error(`Erro HTTP ${r.status}`);
        const data = await r.json();
  
        modelo.innerHTML = '<option value="">Selecione...</option>' +
          data.modelos.map(m => `<option value="${m.codigo}">${m.nome}</option>`).join('');
        modelo.disabled = false;
        status.innerHTML = '';
      } catch (err) {
        status.innerHTML = `<div class="alert alert-danger">Erro ao carregar modelos (${err.message}).</div>`;
      }
    });
  
    // Carregar anos
    modelo.addEventListener('change', async () => {
      ano.innerHTML = '';
      results.classList.add('d-none');
  
      if (!modelo.value) return;
      status.innerHTML = 'Carregando anos...';
  
      try {
        const r = await fetch(`${baseUrl}/${tipo.value}/marcas/${marca.value}/modelos/${modelo.value}/anos`);
        if (!r.ok) throw new Error(`Erro HTTP ${r.status}`);
        const data = await r.json();
  
        ano.innerHTML = '<option value="">Selecione...</option>' +
          data.map(a => `<option value="${a.codigo}">${a.nome}</option>`).join('');
        ano.disabled = false;
        status.innerHTML = '';
      } catch (err) {
        status.innerHTML = `<div class="alert alert-danger">Erro ao carregar anos (${err.message}).</div>`;
      }
    });
  
    // Consultar preço final
    document.getElementById('fipe-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      results.classList.add('d-none');
      status.innerHTML = 'Consultando preço...';
  
      try {
        const r = await fetch(`${baseUrl}/${tipo.value}/marcas/${marca.value}/modelos/${modelo.value}/anos/${ano.value}`);
        if (!r.ok) throw new Error(`Erro HTTP ${r.status}`);
        const info = await r.json();
  
        results.innerHTML = `
          <div class="card bg-dark text-light">
            <div class="card-body">
              <h5 class="card-title">Resultado da FIPE</h5>
              <p><strong>Marca:</strong> ${info.Marca}</p>
              <p><strong>Modelo:</strong> ${info.Modelo}</p>
              <p><strong>Ano:</strong> ${info.AnoModelo} - ${info.Combustivel}</p>
              <p><strong>Preço:</strong> ${info.Valor}</p>
              <p><strong>Código FIPE:</strong> ${info.CodigoFipe}</p>
              <p><strong>Mês de referência:</strong> ${info.MesReferencia}</p>
            </div>
          </div>`;
        results.classList.remove('d-none');
        status.innerHTML = '';
      } catch (err) {
        status.innerHTML = `<div class="alert alert-danger">Erro ao consultar FIPE (${err.message}).</div>`;
      }
    });
  });
  