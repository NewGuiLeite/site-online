document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-juros');
  const statusEl = document.getElementById('status-juros');
  const resultadoBox = document.getElementById('resultado-juros');

  const valorFinalEl = document.getElementById('valorFinal');
  const totalInvestidoEl = document.getElementById('totalInvestido');
  const totalJurosEl = document.getElementById('totalJuros');
  const resumoSimulacaoEl = document.getElementById('resumoSimulacao');

  function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function mostrarErro(mensagem) {
    resultadoBox.classList.add('d-none');
    statusEl.innerHTML = `
      <div class="alert alert-warning border-0 shadow-sm" role="alert">
        ${mensagem}
      </div>
    `;
  }

  function limparStatus() {
    statusEl.innerHTML = '';
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    limparStatus();

    const valorInicial = Number(document.getElementById('valorInicial').value || 0);
    const aporteMensal = Number(document.getElementById('aporteMensal').value || 0);
    const taxa = Number(document.getElementById('taxa').value || 0);
    const periodo = Number(document.getElementById('periodo').value || 0);
    const tipoPeriodo = document.getElementById('tipoPeriodo').value;

    if (periodo <= 0) {
      mostrarErro('Informe um período maior que zero.');
      return;
    }

    if (valorInicial <= 0 && aporteMensal <= 0) {
      mostrarErro('Informe pelo menos um valor: inicial ou aporte mensal.');
      return;
    }

    const taxaMes = taxa / 100;
    const meses = tipoPeriodo === 'anos' ? periodo * 12 : periodo;

    let valorFinal = 0;
    let totalInvestido = 0;

    const P = valorInicial;
    const PMT = aporteMensal;
    const n = meses;
    const i = taxaMes;

    if (i === 0) {
      // Sem juros
      valorFinal = P + PMT * n;
    } else {
      const fator = Math.pow(1 + i, n);
      const futuroInicial = P * fator;
      const futuroAportes = PMT * ((fator - 1) / i);
      valorFinal = futuroInicial + futuroAportes;
    }

    totalInvestido = P + PMT * n;
    const totalJuros = valorFinal - totalInvestido;

    const textoPeriodo = tipoPeriodo === 'anos'
      ? `${periodo} ano(s) (${meses} meses)`
      : `${meses} mês(es)`;

    const taxaTexto = taxaMes > 0
      ? `${taxa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}% ao mês`
      : '0% ao mês';

    resumoSimulacaoEl.textContent =
      `Com ${textoPeriodo}, taxa de ${taxaTexto}, valor inicial de ${formatarMoeda(P)} ` +
      `e aporte mensal de ${formatarMoeda(PMT)}, o resultado será:`;

    valorFinalEl.textContent = formatarMoeda(valorFinal);
    totalInvestidoEl.textContent = formatarMoeda(totalInvestido);
    totalJurosEl.textContent = formatarMoeda(totalJuros);

    resultadoBox.classList.remove('d-none');
  });
});
