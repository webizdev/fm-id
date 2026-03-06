<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$dataFile = 'data.json';

if (!file_exists($dataFile)) {
    file_put_contents($dataFile, json_encode(['destinations' => [], 'accommodations' => []]));
}

$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $data = json_decode(file_get_contents($dataFile), true);
    if ($action === 'get_all') {
        echo json_encode(['status' => 'success', 'data' => $data]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $inputJSON = file_get_contents('php://input');
    $input = json_decode($inputJSON, true);
    
    if ($action === 'save_all') {
        if (isset($input['destinations']) && isset($input['accommodations'])) {
            file_put_contents($dataFile, json_encode($input, JSON_PRETTY_PRINT));
            echo json_encode(['status' => 'success', 'message' => 'Data saved successfully']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Invalid data format']);
        }
    } else {
         echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
}
?>
