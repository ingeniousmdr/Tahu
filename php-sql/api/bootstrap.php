<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$configPath = dirname(__DIR__) . '/config.php';
if (!is_file($configPath)) {
    http_response_code(500);
    echo json_encode(['success'=>false,'error'=>'Server is not configured. Copy config.example.php to config.php.']);
    exit;
}
$config = require $configPath;

function db(): PDO {
    static $pdo = null;
    global $config;
    if ($pdo instanceof PDO) return $pdo;
    $d=$config['db'];
    $dsn="mysql:host={$d['host']};port=".(int)$d['port'].";dbname={$d['name']};charset={$d['charset']}";
    $pdo=new PDO($dsn,$d['user'],$d['pass'],[
        PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES=>false,
    ]);
    return $pdo;
}
function jsonResponse(mixed $data,int $status=200): never {
    http_response_code($status);
    echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    exit;
}
function requireMethod(string ...$allowed): string {
    $method=$_SERVER['REQUEST_METHOD']??'GET';
    if(!in_array($method,$allowed,true)){
        header('Allow: '.implode(', ',$allowed));
        jsonResponse(['success'=>false,'error'=>'Method not allowed.'],405);
    }
    return $method;
}
function inputJson(): array {
    $raw=file_get_contents('php://input');
    if($raw===false||trim($raw)==='') return [];
    try {$data=json_decode($raw,true,512,JSON_THROW_ON_ERROR);}
    catch(JsonException){jsonResponse(['success'=>false,'error'=>'Invalid JSON.'],400);}
    return is_array($data)?$data:[];
}
function textField(array $input,string $key,int $max,bool $required=true): ?string {
    $value=isset($input[$key])?trim((string)$input[$key]):'';
    if($value===''){
        if($required) jsonResponse(['success'=>false,'error'=>$key.' is required.'],422);
        return null;
    }
    if(mb_strlen($value)>$max) jsonResponse(['success'=>false,'error'=>$key.' is too long.'],422);
    return $value;
}
function allowedValue(array $input,string $key,array $allowed): string {
    $value=(string)($input[$key]??'');
    if(!in_array($value,$allowed,true)) jsonResponse(['success'=>false,'error'=>'Invalid '.$key.'.'],422);
    return $value;
}
function newToken(): string { return bin2hex(random_bytes(32)); }
function tokenHash(string $token): string { return hash('sha256',$token); }
function verifyOwnerToken(string $storedHash,string $token): bool {
    return $token!=='' && hash_equals($storedHash,tokenHash($token));
}
function requestToken(array $input): string {
    $token=trim((string)($input['owner_token']??''));
    if($token===''||strlen($token)<32) jsonResponse(['success'=>false,'error'=>'A valid owner token is required.'],403);
    return $token;
}
set_exception_handler(function(Throwable $e): void {
    error_log((string)$e);
    jsonResponse(['success'=>false,'error'=>'Internal server error.'],500);
});
