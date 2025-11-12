// assets/js/imc.js

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('imc-form');
    const statusEl = document.getElementById('imc-status');
    const resultadoWrapper = document.getElementById('imc-resultado');
  
    const faixaEtariaEl = document.getElementById('imc-faixa-etaria');
    const imcValorEl = document.getElementById('imc-valor');
    const classificacaoEl = document.getElementById('imc-classificacao');
    const observacaoEl = document.getElementById('imc-observacao');
  
    const tabelaAdulto = document.getElementById('tabela-adulto');
    const tabelaIdoso = document.getElementById('tabela-idoso');
  
    const idadeInput = document.getElementById('idade');
    const pesoInput = document.getElementById('peso');
    const alturaInput = document.getElementById('altura');
  
    function limparDestaques() {
      document
        .querySelectorAll('.imc-highlight')
        .forEach(tr => tr.classList.remove('imc-highlight'));
    }
  
    function limparResultado() {
      resultadoWrapper.classList.add('d-none');
      limparDestaques();
    }
  
    function setStatus(msg, tipo) {
      if (!statusEl) return;
  
      if (!msg) {
        statusEl.innerHTML = '';
        statusEl.className = '';
        return;
      }
  
      const base = 'mt-3 alert px-3 py-2 small ';
      let classe = 'alert-info';
  
      if (tipo === 'erro') classe = 'alert-danger';
      if (tipo === 'ok') classe = 'alert-success';
  
      statusEl.className = base + classe;
      statusEl.textContent = msg;
    }
  
    function parseNumero(valor) {
      if (!valor) return NaN;
      const normalizado = valor.toString().replace(',', '.').trim();
      return parseFloat(normalizado);
    }
  
    // Altura amigável: aceita metros ou centímetros
    function normalizarAltura(valorBruto) {
      let v = parseNumero(valorBruto);
      if (isNaN(v)) return NaN;
  
      // Usuário digitou em centímetros (ex: 175, 189)
      if (v > 10 && v <= 300) {
        v = v / 100;
      }
  
      return v;
    }
  
    function classificarAdulto(imc) {
      if (imc < 18.5) return { rotulo: 'Baixo peso', faixa: 'adulto-baixo', tipo: 'baixo' };
      if (imc < 25)   return { rotulo: 'Peso normal', faixa: 'adulto-normal', tipo: 'normal' };
      if (imc < 30)   return { rotulo: 'Sobrepeso', faixa: 'adulto-sobrepeso', tipo: 'sobrepeso' };
      if (imc < 35)   return { rotulo: 'Obesidade Classe I', faixa: 'adulto-ob1', tipo: 'obesidade' };
      if (imc < 40)   return { rotulo: 'Obesidade Classe II', faixa: 'adulto-ob2', tipo: 'obesidade' };
      return { rotulo: 'Obesidade Classe III', faixa: 'adulto-ob3', tipo: 'obesidade' };
    }
  
    function classificarIdoso(imc) {
      if (imc <= 22)  return { rotulo: 'Baixo peso', faixa: 'idoso-baixo', tipo: 'baixo' };
      if (imc < 27)   return { rotulo: 'Adequado / Eutrófico', faixa: 'idoso-adequado', tipo: 'normal' };
      return { rotulo: 'Sobrepeso', faixa: 'idoso-sobrepeso', tipo: 'sobrepeso' };
    }
  
    function aplicarDestaqueTabela(faixa, isIdoso) {
      limparDestaques();
      const tabela = isIdoso ? tabelaIdoso : tabelaAdulto;
      if (!tabela) return;
  
      const linha = tabela.querySelector(`tr[data-range="${faixa}"]`);
      if (linha) linha.classList.add('imc-highlight');
    }
  
    function aplicarClasseBadge(tipo) {
      classificacaoEl.classList.remove(
        'imc-status-baixo',
        'imc-status-normal',
        'imc-status-sobrepeso',
        'imc-status-obesidade'
      );
  
      if (tipo === 'baixo') {
        classificacaoEl.classList.add('imc-status-baixo');
      } else if (tipo === 'normal') {
        classificacaoEl.classList.add('imc-status-normal');
      } else if (tipo === 'sobrepeso') {
        classificacaoEl.classList.add('imc-status-sobrepeso');
      } else if (tipo === 'obesidade') {
        classificacaoEl.classList.add('imc-status-obesidade');
      }
    }
  
    /**
     * showErrors = true  -> usado no submit (mostra mensagens de erro)
     * showErrors = false -> usado na digitação (sem bronca, só calcula se der)
     */
    function calcularIMC(showErrors) {
      const idadeVal = idadeInput.value.trim();
      const pesoVal = pesoInput.value.trim();
      const alturaVal = alturaInput.value.trim();
  
      // Se estiver usando modo live e campos não estão preenchidos, só limpa tudo.
      if (!showErrors && (!idadeVal || !pesoVal || !alturaVal)) {
        setStatus('', '');
        limparResultado();
        return;
      }
  
      const idade = parseInt(idadeVal, 10);
      const peso = parseNumero(pesoVal);
      const altura = normalizarAltura(alturaVal);
  
      // Validações com mensagens apenas no submit
      if (!idade || idade < 1 || idade > 120) {
        if (showErrors) {
          setStatus('Informe uma idade válida entre 1 e 120 anos.', 'erro');
          limparResultado();
        }
        return;
      }
  
      if (isNaN(peso) || peso <= 0) {
        if (showErrors) {
          setStatus('Informe um peso válido em kg. Exemplo: 70.5', 'erro');
          limparResultado();
        }
        return;
      }
  
      if (isNaN(altura) || altura <= 0) {
        if (showErrors) {
          setStatus('Informe uma altura válida. Ex: 1.75 ou 175.', 'erro');
          limparResultado();
        }
        return;
      }
  
      // Alturas aceitáveis após normalização
      if (altura < 0.5 || altura > 2.5) {
        if (showErrors) {
          setStatus('Altura fora do padrão esperado. Use metros (ex: 1.65) ou centímetros (ex: 165).', 'erro');
          limparResultado();
        }
        return;
      }
  
      const imc = peso / (altura * altura);
      if (!isFinite(imc) || imc <= 0) {
        if (showErrors) {
          setStatus('Não foi possível calcular o IMC. Verifique os valores informados.', 'erro');
          limparResultado();
        }
        return;
      }
  
      const isIdoso = idade > 65;
      const faixaEtaria = isIdoso
        ? 'Idoso (critérios específicos > 65 anos)'
        : 'Adulto (critérios OMS ≤ 65 anos)';
  
      const resultado = isIdoso ? classificarIdoso(imc) : classificarAdulto(imc);
  
      faixaEtariaEl.textContent = faixaEtaria;
      imcValorEl.textContent = imc.toFixed(2).replace('.', ',');
      classificacaoEl.textContent = resultado.rotulo;
  
      aplicarClasseBadge(resultado.tipo);
      aplicarDestaqueTabela(resultado.faixa, isIdoso);
  
      let obs = '';
      if (resultado.tipo === 'normal') {
        obs = 'Seu IMC está dentro da faixa considerada adequada para sua faixa etária. Mantenha hábitos saudáveis.';
      } else if (resultado.tipo === 'baixo') {
        obs = 'IMC abaixo do recomendado. Em especial para idosos, isso pode indicar risco nutricional. Procure avaliação profissional.';
      } else if (resultado.tipo === 'sobrepeso') {
        obs = 'IMC acima do recomendado. É importante avaliar alimentação, rotina de exercícios e fatores clínicos com um profissional.';
      } else if (resultado.tipo === 'obesidade') {
        obs = 'IMC na faixa de obesidade. Recomenda-se acompanhamento com médico e nutricionista para avaliação individualizada.';
      }
  
      observacaoEl.textContent = obs;
  
      resultadoWrapper.classList.remove('d-none');
  
      if (showErrors) {
        setStatus('Cálculo realizado com base nos critérios técnicos para a sua faixa etária.', 'ok');
      } else {
        // modo live: sem alert verde grande, deixa limpo
        setStatus('', '');
      }
    }
  
    // Calcular ao enviar (com mensagens)
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      calcularIMC(true);
    });
  
    // Calcular automaticamente enquanto o usuário digita (sem mensagens de erro)
    [idadeInput, pesoInput, alturaInput].forEach(input => {
      input.addEventListener('input', function () {
        calcularIMC(false);
      });
    });
  });
  