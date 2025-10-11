<?php
// resultado.php (página que mostra o resumo e aciona o checkout)
require_once __DIR__ . '/qi/config.php';
?>
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Resultado - Teste de QI</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="stylesheet" href="assets/css/qi.css" />
</head>
<body>
  <main class="container">
    <div class="card" id="summary">
      <h1>Resultado pronto — Acesse seu QI e certificado</h1>
      <p>Para ver sua pontuação completa e gerar o certificado simbólico, finalize o pagamento de <strong>R$ 3,99</strong>.</p>

      <div id="purchase-area">
        <button id="payBtn" class="btn">Pagar e Liberar Resultado (R$ 3,99)</button>
      </div>

      <div id="afterPay" style="display:none;">
        <h2>QI: <span id="qiValue">—</span></h2>
        <p id="msg"></p>
        <a id="certLink" class="btn" href="#">Gerar Certificado</a>
      </div>
    </div>
  </main>

<script>
(async function(){
  const result = JSON.parse(localStorage.getItem('qi_result') || 'null');
  if (!result) {
    document.getElementById('summary').innerHTML = '<p>Nenhum resultado encontrado. Faça o teste primeiro.</p>';
    return;
  }

  document.getElementById('payBtn').addEventListener('click', async () => {
    const payload = {
      name: result.name || 'Participante',
      email: result.email || (result.name ? result.name.replace(/\s+/g,'').toLowerCase()+'@example.com' : 'cliente@example.com'),
      amount: 3.99,
      external_reference: result.external_reference || ('ext_' + Date.now())
    };

    // Save ext ref in result (local)
    result.external_reference = payload.external_reference;
    localStorage.setItem('qi_result', JSON.stringify(result));

    // Create preference
    const res = await fetch('create_preference.php', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.init_point) {
      // Redirect to Mercado Pago Checkout (sandbox)
      window.location.href = json.init_point;
    } else {
      alert('Erro ao iniciar pagamento. Confira o console.');
      console.error(json);
    }
  });

  // If you want to show result for testing, uncomment the lines below:
  // document.getElementById('afterPay').style.display='block';
  // document.getElementById('qiValue').innerText = result.qi || result.score || '—';
  // document.getElementById('certLink').href = 'certificado.php?ref=' + (result.external_reference || '');
})();
</script>
</body>
</html>
