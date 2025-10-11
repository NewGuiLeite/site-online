<?php
// qi/config.php
// Configurações do Teste de QI e Mercado Pago (modo SANDBOX por padrão)

// SECURITY: Prefer read keys from environment or .env (recommended).
// If you want to use .env file (not committed), create SITE-ONLINE/qi/.env with:
// MP_PUBLIC_KEY=APP_USR-XXXXXXXX
// MP_ACCESS_TOKEN=TEST-XXXXXXXX
// BASE_URL=https://seusite.com/qi

function env($k, $default = null) {
    if (getenv($k) !== false) return getenv($k);
    // try .env
    $dot = __DIR__ . '/.env';
    if (file_exists($dot)) {
        $lines = file($dot, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            [$kk, $vv] = array_map('trim', explode('=', $line, 2) + [1 => '']);
            if ($kk === $k) return $vv;
        }
    }
    return $default;
}

// Sandbox defaults (do NOT use in production). Replace via .env or environment variables.
define('MP_PUBLIC_KEY', env('MP_PUBLIC_KEY', 'APP_USR_SANDBOX_PUBLIC_KEY'));
define('MP_ACCESS_TOKEN', env('MP_ACCESS_TOKEN', 'TEST_SANDBOX_ACCESS_TOKEN'));
define('BASE_URL', rtrim(env('BASE_URL', 'http://localhost/SITE-ONLINE/qi'), '/'));
define('RESULTS_FILE', __DIR__ . '/storage/results.json');
define('WEBHOOK_LOG', __DIR__ . '/storage/webhook.log');

// Composer autoload (if you installed SDK via composer)
$possible = __DIR__ . '/../vendor/autoload.php';
if (file_exists($possible)) require_once $possible;
