<?php
declare(strict_types=1);
require __DIR__.'/bootstrap.php';
requireMethod('GET');
$subject=(string)($_GET['subject']??'');
if(!in_array($subject,['bm','math','science','english'],true)) jsonResponse(['success'=>false,'error'=>'Invalid subject.'],422);
$stmt=db()->prepare('SELECT id,subject,title,content,created_at FROM tips WHERE subject=:subject ORDER BY created_at DESC,id DESC');
$stmt->execute(['subject'=>$subject]);
jsonResponse(['success'=>true,'data'=>$stmt->fetchAll()]);
