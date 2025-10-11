<?php
// qi/mp_webhook.php  (register this URL in Mercado Pago notifications - sandbox)
require_once __DIR__ . '/qi/config.php';

$payload = file_get_contents('php://input');
$decoded = json_decode($payload, true);

// log raw
file_put_contents(WEBHOOK_LOG, date('c') . " " . $payload . PHP_EOL, FILE_APPEND);

// Basic handling example:
// Mercado Pago sends different structures; in production, call MP API to get payment status.
// Here we'll just mark any external_reference found to paid=true in results.json

if (isset($decoded['data'])) {
    // different MP event shapes; try to extract external_reference or preference_id
    $data = $decoded['data'];
    $external = $data['id'] ?? ($data['external_reference'] ?? null);
} else {
    $external = $decoded['external_reference'] ?? null;
}

if (!$external && isset($decoded['id'])) $external = $decoded['id'];

// Try to update results.json by matching external_reference or id (best-effort)
$resultsFile = __DIR__ . '/qi/storage/results.json';
if (file_exists($resultsFile)) {
    $arr = json_decode(file_get_contents($resultsFile), true) ?: [];
    $changed = false;
    foreach ($arr as &$r) {
        if (($r['external_reference'] ?? '') === $external || ($r['id'] ?? '') === $external) {
            $r['paid'] = true;
            $r['paid_at'] = date('c');
            $changed = true;
        }
    }
    if ($changed) file_put_contents($resultsFile, json_encode($arr, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

http_response_code(200);
echo "ok";
