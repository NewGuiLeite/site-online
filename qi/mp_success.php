<?php
// qi/mp_success.php
require_once __DIR__ . '/qi/config.php';

// ext reference comes as ?ext=...
$ext = $_GET['ext'] ?? null;

// In production: verify payment with Mercado Pago API using payment_id or preference_id.
// Here we redirect user to certificado.php with ext ref; webhook should mark payment as paid when received.
if ($ext) {
    header('Location: ' . BASE_URL . '/certificado.php?ref=' . urlencode($ext));
} else {
    header('Location: ' . BASE_URL . '/resultado.php');
}
exit;
