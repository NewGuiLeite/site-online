<?php
// qi/save_result.php
require_once __DIR__ . '/qi/config.php';
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error'=>'Método inválido']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true) ?: [];

$record = [
    'id' => uniqid('r_'),
    'name' => $body['name'] ?? '',
    'dob' => $body['dob'] ?? '',
    'gender' => $body['gender'] ?? '',
    'age' => $body['age'] ?? '',
    'email' => $body['email'] ?? '',
    'score' => $body['score'] ?? 0,
    'qi' => $body['qi'] ?? ($body['score'] ?? 0),
    'correct' => $body['correct'] ?? 0,
    'total' => $body['total'] ?? 30,
    'summary' => $body['summary'] ?? '',
    'external_reference' => $body['external_reference'] ?? uniqid('ext_'),
    'created_at' => date('c'),
    'paid' => false
];

$path = __DIR__ . '/qi/storage';
if (!is_dir($path)) mkdir($path, 0755, true);

$file = RESULTS_FILE;
$results = [];
if (file_exists($file)) $results = json_decode(file_get_contents($file), true) ?: [];
$results[] = $record;
file_put_contents($file, json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo json_encode($record);
