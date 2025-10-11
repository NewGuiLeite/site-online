<?php
// create_preference.php
require_once __DIR__ . '/qi/config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método inválido']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true) ?: [];

// Expect name, email, amount, external_reference
$name = $body['name'] ?? 'Participante';
$email = $body['email'] ?? 'cliente@example.com';
$amount = isset($body['amount']) ? floatval($body['amount']) : 3.99;
$ext = $body['external_reference'] ?? uniqid('ext_');

try {
    // If Mercadopago SDK available use it; otherwise create a quick redirect link to sandbox checkout preference
    if (class_exists('MercadoPago\SDK')) {
        \MercadoPago\SDK::setAccessToken(MP_ACCESS_TOKEN);
        $preference = new \MercadoPago\Preference();

        $item = new \MercadoPago\Item();
        $item->title = "Teste de QI - Resultado e Certificado";
        $item->quantity = 1;
        $item->unit_price = $amount;
        $item->currency_id = "BRL";

        $payer = new \MercadoPago\Payer();
        $payer->name = $name;
        $payer->email = $email;

        $preference->items = array($item);
        $preference->payer = $payer;
        $preference->external_reference = $ext;
        $preference->back_urls = array(
            "success" => BASE_URL . "/mp_success.php?ext=" . urlencode($ext),
            "failure" => BASE_URL . "/resultado.php?status=failure",
            "pending" => BASE_URL . "/resultado.php?status=pending"
        );
        $preference->auto_return = "approved";
        $preference->save();

        echo json_encode([
            'init_point' => $preference->init_point,
            'preference_id' => $preference->id
        ]);
        exit;
    } else {
        // If SDK not installed, return the Mercado Pago sandbox checkout with parameters (simple redirect)
        // Note: This is a convenience fallback for sandbox testing only.
        $sandbox_link = "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=" . urlencode($ext);
        // Not a real init_point; client should handle this fallback. We still return a fake init_point.
        echo json_encode([
            'init_point' => $sandbox_link,
            'preference_id' => $ext,
            'notice' => 'SDK não encontrado; instale o SDK para produção. Este link é apenas placeholder em sandbox.'
        ]);
        exit;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}
