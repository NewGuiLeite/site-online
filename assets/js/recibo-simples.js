// assets/js/recibo-simples.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('recibo-form');
  const preview = document.getElementById('recibo-preview');
  const btnImprimir = document.getElementById('btn-imprimir');
  const dataInput = document.getElementById('data');

  // Define data de hoje como padrão
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  dataInput.value = `${ano}-${mes}-${dia}`;

  // Formata valor em BRL
  function formatarMoeda(valorNumero) {
    if (isNaN(valorNumero)) return '';
    return valorNumero.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    });
  }

  // Formata data para dd/mm/aaaa
  function formatarDataBR(dataStr) {
    if (!dataStr) return '';
    const [y, m, d] = dataStr.split('-');
    if (!y || !m || !d) return dataStr;
    return `${d}/${m}/${y}`;
  }

  // Gera um "número" simples de recibo com base no timestamp
  function gerarNumeroRecibo() {
    const now = new Date();
    const parteData = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}`;
    const parteHora = `${String(now.getHours()).padStart(2, '0')}${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    return `${parteData}-${parteHora}`;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const pagador = document.getElementById('pagador').value.trim();
    const recebedor = document.getElementById('recebedor').value.trim();
    const valorStr = document.getElementById('valor').value.trim();
    const data = document.getElementById('data').value;
    const descricao = document.getElementById('descricao').value.trim();
    const local = document.getElementById('local').value.trim();

    if (!pagador || !recebedor || !valorStr || !data || !descricao) {
      alert('Preencha pelo menos: quem paga, quem recebe, valor, data e descrição do serviço.');
      return;
    }

    const valorNumero = Number(valorStr.replace(',', '.'));
    const valorFormatado = formatarMoeda(valorNumero);
    const dataFormatada = formatarDataBR(data);
    const numeroRecibo = gerarNumeroRecibo();

    const localDataTexto = local
      ? `${local}, ${dataFormatada}.`
      : `${dataFormatada}.`;

    const html = `
      <div class="recibo-doc">
        <header class="recibo-doc-header">
          <h2>RECIBO SIMPLES</h2>
          <div class="recibo-numero">Recibo nº ${numeroRecibo}</div>
        </header>

        <section class="recibo-doc-body">
          <p>
            Recebi de <strong>${pagador}</strong> a quantia de
            <strong>${valorFormatado}</strong>, referente a:
          </p>
          <p>
            <strong>${descricao}</strong>
          </p>
          <p>
            ${localDataTexto}
          </p>
        </section>

        <section class="recibo-doc-assinaturas">
          <div class="linha-assinatura">
            <div><strong>${recebedor}</strong></div>
            <div>Assinatura de quem recebeu</div>
          </div>
        </section>
      </div>
    `;

    preview.innerHTML = html;
    btnImprimir.disabled = false;
  });

  // Imprimir / salvar em PDF (usa @media print pra focar só no recibo)
  btnImprimir.addEventListener('click', () => {
    if (btnImprimir.disabled) return;
    window.print();
  });
});
