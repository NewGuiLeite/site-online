document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-validador');
  const input = document.getElementById('inputDocumento');
  const statusEl = document.getElementById('status');

  const tipoCPFEl = document.getElementById('tipoCPF');
  const tipoCNPJEl = document.getElementById('tipoCNPJ');

  // --------- Funções utilitárias ---------

  function limparDocumento(valor) {
    return (valor || '').replace(/\D/g, '');
  }

  function getTipoSelecionado() {
    return form.querySelector('input[name="tipoDocumento"]:checked')?.value || 'cpf';
  }

  function todosDigitosIguais(digits) {
    return /^(\d)\1+$/.test(digits);
  }

  // --------- Máscaras (formatação visual) ---------

  function formatarCPF(digits) {
    let v = digits.slice(0, 11);
    if (v.length <= 3) return v;
    if (v.length <= 6) return v.replace(/(\d{3})(\d+)/, '$1.$2');
    if (v.length <= 9) return v.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  }

  function formatarCNPJ(digits) {
    let v = digits.slice(0, 14);
    if (v.length <= 2) return v;
    if (v.length <= 5) return v.replace(/(\d{2})(\d+)/, '$1.$2');
    if (v.length <= 8) return v.replace(/(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
    if (v.length <= 12) return v.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3\/$4');
    return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, '$1.$2.$3\/$4-$5');
  }

  function aplicarMascara() {
    const tipo = getTipoSelecionado();
    const digits = limparDocumento(input.value);

    if (!digits) {
      input.value = '';
      return;
    }

    if (tipo === 'cpf') {
      input.value = formatarCPF(digits);
    } else {
      input.value = formatarCNPJ(digits);
    }
  }

  // --------- Validação de CPF/CNPJ (lógica matemática) ---------

  function validarCPF(cpf) {
    cpf = limparDocumento(cpf);
    if (cpf.length !== 11) return false;
    if (todosDigitosIguais(cpf)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf[i], 10) * (10 - i);
    }
    let resto = soma % 11;
    let digito1 = resto < 2 ? 0 : 11 - resto;
    if (digito1 !== parseInt(cpf[9], 10)) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf[i], 10) * (11 - i);
    }
    resto = soma % 11;
    let digito2 = resto < 2 ? 0 : 11 - resto;
    if (digito2 !== parseInt(cpf[10], 10)) return false;

    return true;
  }

  function validarCNPJ(cnpj) {
    cnpj = limparDocumento(cnpj);
    if (cnpj.length !== 14) return false;
    if (todosDigitosIguais(cnpj)) return false;

    const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let soma = 0;
    for (let i = 0; i < 12; i++) {
      soma += parseInt(cnpj[i], 10) * pesos1[i];
    }
    let resto = soma % 11;
    let digito1 = resto < 2 ? 0 : 11 - resto;
    if (digito1 !== parseInt(cnpj[12], 10)) return false;

    soma = 0;
    for (let i = 0; i < 13; i++) {
      soma += parseInt(cnpj[i], 10) * pesos2[i];
    }
    resto = soma % 11;
    let digito2 = resto < 2 ? 0 : 11 - resto;
    if (digito2 !== parseInt(cnpj[13], 10)) return false;

    return true;
  }

  function mostrarResultado({ valido, tipo, documentoLimpo, mensagem }) {
    const classe = valido ? 'alert-success' : 'alert-warning';
    statusEl.innerHTML = `
      <div class="alert ${classe} border-0 shadow-sm" role="status">
        <div class="d-flex flex-column">
          <strong class="mb-1">
            ${valido ? 'Documento válido ✅' : 'Documento inválido ⚠️'}
          </strong>
          <div class="small mb-1">
            Tipo: <strong>${tipo.toUpperCase()}</strong> —
            Dígitos: <code>${documentoLimpo}</code>
          </div>
          <div class="small mb-0">
            ${mensagem}
          </div>
        </div>
      </div>
    `;
  }

  // --------- Eventos ---------

  // Máscara ao digitar / colar
  input.addEventListener('input', () => {
    aplicarMascara();
  });

  // Reaplicar máscara quando trocar CPF/CNPJ
  tipoCPFEl.addEventListener('change', aplicarMascara);
  tipoCNPJEl.addEventListener('change', aplicarMascara);

  // Validação no submit
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const tipo = getTipoSelecionado();
    const valor = input.value.trim();
    const limpo = limparDocumento(valor);

    if (!limpo) {
      mostrarResultado({
        valido: false,
        tipo,
        documentoLimpo: '—',
        mensagem: 'Digite um CPF ou CNPJ para validar.'
      });
      return;
    }

    let valido = false;
    if (tipo === 'cpf') {
      valido = validarCPF(limpo);
    } else {
      valido = validarCNPJ(limpo);
    }

    const mensagem = valido
      ? 'A estrutura do documento está correta de acordo com o algoritmo oficial de validação de dígitos verificadores.'
      : 'A estrutura do documento não é válida. Verifique se digitou todos os números corretamente.';

    mostrarResultado({
      valido,
      tipo,
      documentoLimpo: limpo,
      mensagem
    });
  });
});
