<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');

function respond(int $status, bool $ok, string $message): void
{
    http_response_code($status);
    echo json_encode(['ok' => $ok, 'message' => $message]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, false, 'Method not allowed.');
}

// Honeypot
if (!empty($_POST['website'] ?? '')) {
    respond(200, true, 'Thank you. Your enquiry has been sent.');
}

$name    = trim((string) ($_POST['name']    ?? ''));
$contact = trim((string) ($_POST['contact'] ?? ''));
$message = trim((string) ($_POST['extra']   ?? ''));

if ($name === '' || $contact === '') {
    respond(422, false, 'Please fill in your name and phone number.');
}

if (strlen($name) > 100 || strlen($contact) > 150 || strlen($message) > 3000) {
    respond(422, false, 'One or more fields are too long.');
}

$cleanName    = preg_replace('/[\r\n]+/', ' ', $name)    ?? $name;
$cleanContact = preg_replace('/[\r\n]+/', ' ', $contact) ?? $contact;
$cleanMessage = $message;

$subject = 'Distributor Enquiry from ' . $cleanName;
$body    = "Name: {$cleanName}\nPhone: {$cleanContact}\n\n{$cleanMessage}\n";

$headers = [
    'From: Dostii Delight Website <contact@dostiidelight.com>',
    'Content-Type: text/plain; charset=UTF-8',
    'Reply-To: ' . $cleanContact,
];

$sent = mail(
    'dostiidelight@gmail.com',
    $subject,
    $body,
    implode("\r\n", $headers)
);

if (!$sent) {
    respond(500, false, 'Unable to send right now. Please call us directly.');
}

respond(200, true, 'Thank you! We\'ll be in touch within 24 hours.');
