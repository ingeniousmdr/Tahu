<?php
declare(strict_types=1);
require __DIR__.'/bootstrap.php';
requireMethod('POST');
$input=inputJson();
$postId=(int)($input['post_id']??0);
$visitorToken=trim((string)($input['visitor_token']??''));
if($postId<1||strlen($visitorToken)<32) jsonResponse(['success'=>false,'error'=>'Invalid vote request.'],422);
$pdo=db();
$pdo->beginTransaction();
try{
    $s=$pdo->prepare('SELECT id FROM posts WHERE id=:id FOR UPDATE');
    $s->execute(['id'=>$postId]);
    if(!$s->fetch()){ $pdo->rollBack(); jsonResponse(['success'=>false,'error'=>'Post not found.'],404); }
    $hash=tokenHash($visitorToken);
    $s=$pdo->prepare('SELECT id FROM post_votes WHERE post_id=:post_id AND visitor_token_hash=:hash');
    $s->execute(['post_id'=>$postId,'hash'=>$hash]);
    if($s->fetch()){ $pdo->rollBack(); jsonResponse(['success'=>false,'error'=>'You have already upvoted this post.'],409); }
    $s=$pdo->prepare('INSERT INTO post_votes(post_id,visitor_token_hash) VALUES(:post_id,:hash)');
    $s->execute(['post_id'=>$postId,'hash'=>$hash]);
    $s=$pdo->prepare('UPDATE posts SET upvotes=upvotes+1 WHERE id=:id');
    $s->execute(['id'=>$postId]);
    $s=$pdo->prepare('SELECT upvotes FROM posts WHERE id=:id');
    $s->execute(['id'=>$postId]);
    $upvotes=(int)$s->fetchColumn();
    $pdo->commit();
    jsonResponse(['success'=>true,'message'=>'Upvote recorded.','data'=>['upvotes'=>$upvotes]]);
}catch(Throwable $e){
    if($pdo->inTransaction()) $pdo->rollBack();
    throw $e;
}
