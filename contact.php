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

if (!empty($_POST['website'] ?? '')) {
    respond(200, true, 'Thank you. Your enquiry has been sent.');
}

$name = trim((string) ($_POST['name'] ?? ''));
$contact = trim((string) ($_POST['contact'] ?? ''));
$message = trim((string) ($_POST['message'] ?? ''));

if ($name === '' || $contact === '' || $message === '') {
    respond(422, false, 'Please complete all required fields.');
}

if (strlen($name) > 100 || strlen($contact) > 150 || strlen($message) > 3000) {
    respond(422, false, 'One or more fields are too long.');
}

$cleanName = preg_replace('/[\r\n]+/', ' ', $name) ?? $name;
$cleanContact = preg_replace('/[\r\n]+/', ' ', $contact) ?? $contact;
$subject = 'Website enquiry from ' . $cleanName;
$body = "Name: {$cleanName}\nContact: {$cleanContact}\n\nMessage:\n{$message}\n";
$headers = [
    'From: Dostii Delight Website <contact@dostiidelight.com>',
    'Content-Type: text/plain; charset=UTF-8'
];

if (filter_var($cleanContact, FILTER_VALIDATE_EMAIL)) {
    $headers[] = 'Reply-To: ' . $cleanContact;
}

$sent = mail(
    'dostiidelight@gmail.com',
    $subject,
    $body,
    implode("\r\n", $headers)
);

if (!$sent) {
    respond(500, false, 'Unable to send right now. Please call or email us directly.');
}

respond(200, true, 'Thank you. Your enquiry has been sent.');
