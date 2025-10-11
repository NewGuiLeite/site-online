<?php
// certificado.php
require_once __DIR__ . '/qi/config.php';

$ref = $_GET['ref'] ?? null;
$record = null;
if ($ref && file_exists(RESULTS_FILE)) {
    $arr = json_decode(file_get_contents(RESULTS_FILE), true) ?: [];
    foreach ($arr as $r) {
        if (($r['external_reference'] ?? '') === $ref || ($r['id'] ?? '') === $ref) {
            $record = $r; break;
        }
    }
}
?>
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Certificado - Teste de QI</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="stylesheet" href="assets/css/qi.css" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
</head>
<body>
  <main class="container">
    <div class="certificate card" id="certCard">
      <div class="cert-header">
        <h2>Certificado de Participação</h2>
        <small>Instituto Simbólico de Avaliação Cognitiva</small>
      </div>

      <div class="cert-body" id="certContent">
        <p>Este documento atesta que</p>
        <h1 id="certName"><?php echo htmlspecialchars($record['name'] ?? '—'); ?></h1>
        <p>Nascido(a) em <span id="certDob"><?php echo htmlspecialchars($record['dob'] ?? '—'); ?></span></p>
        <p>Obteve a pontuação de <strong id="certQi"><?php echo htmlspecialchars($record['qi'] ?? $record['score'] ?? '—'); ?></strong> no Teste de QI aplicado eletronicamente.</p>

        <p class="small">Este certificado é simbólico e <strong>não possui reconhecimento ou validade oficial</strong>.</p>
        <p class="small">Emitido em <span id="certDate"><?php echo date('d/m/Y'); ?></span></p>
      </div>

      <div class="cert-actions">
        <button id="downloadPdf" class="btn">Baixar PDF</button>
        <a href="qi.html" class="btn ghost">Voltar ao início</a>
      </div>

    </div>
  </main>

<script>
(function(){
  let record = <?php echo json_encode($record ?: null); ?>;
  if (!record) {
    // fallback to localStorage (if saved client-side)
    record = JSON.parse(localStorage.getItem('qi_result') || 'null');
  }
  if (record) {
    document.getElementById('certName').innerText = record.name || '—';
    document.getElementById('certDob').innerText = record.dob || '—';
    document.getElementById('certQi').innerText = record.qi || record.score || '—';
    document.getElementById('certDate').innerText = new Date().toLocaleDateString();
  } else {
    document.getElementById('certContent').innerHTML = '<p>Nenhum registro encontrado. Volte ao teste.</p>';
    document.getElementById('downloadPdf').style.display = 'none';
  }

  document.getElementById('downloadPdf').addEventListener('click', function(){
    const element = document.getElementById('certContent');
    const filename = (record?.name ? record.name.replace(/\s+/g,'_') : 'certificado') + '.pdf';
    html2pdf().set({ margin:0.8, filename: filename, html2canvas:{scale:2} }).from(element).save();
  });
})();
</script>
</body>
</html>
