<?php
declare(strict_types=1);
require __DIR__.'/bootstrap.php';
$method=requireMethod('POST','DELETE');
$input=inputJson();

if($method==='POST'){
    $postId=(int)($input['post_id']??0);
    if($postId<1) jsonResponse(['success'=>false,'error'=>'Invalid post id.'],422);
    $username=textField($input,'username',80);
    $content=textField($input,'content',3000);
    $check=db()->prepare('SELECT id FROM posts WHERE id=:id');
    $check->execute(['id'=>$postId]);
    if(!$check->fetch()) jsonResponse(['success'=>false,'error'=>'Post not found.'],404);
    $ownerToken=newToken();
    $stmt=db()->prepare('INSERT INTO comments(post_id,username,content,owner_token_hash)
        VALUES(:post_id,:username,:content,:owner_token_hash)');
    $stmt->execute(['post_id'=>$postId,'username'=>$username,'content'=>$content,'owner_token_hash'=>tokenHash($ownerToken)]);
    jsonResponse(['success'=>true,'message'=>'Comment added.','data'=>[
        'id'=>(int)db()->lastInsertId(),'owner_token'=>$ownerToken
    ]],201);
}

$commentId=(int)($_GET['id']??0);
if($commentId<1) jsonResponse(['success'=>false,'error'=>'Invalid comment id.'],422);
$token=requestToken($input);
$stmt=db()->prepare('SELECT owner_token_hash FROM comments WHERE id=:id');
$stmt->execute(['id'=>$commentId]);
$comment=$stmt->fetch();
if(!$comment||!verifyOwnerToken($comment['owner_token_hash'],$token)) jsonResponse(['success'=>false,'error'=>'You are not allowed to delete this comment.'],403);
$stmt=db()->prepare('DELETE FROM comments WHERE id=:id');
$stmt->execute(['id'=>$commentId]);
jsonResponse(['success'=>true,'message'=>'Comment deleted.']);
