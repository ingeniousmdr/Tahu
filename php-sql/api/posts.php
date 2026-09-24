<?php
declare(strict_types=1);
require __DIR__.'/bootstrap.php';
$method=requireMethod('GET','POST','DELETE');

if($method==='GET'){
    $rows=db()->query('SELECT p.id,p.username,p.category,p.title,p.content,p.upvotes,p.created_at,
        c.id AS comment_id,c.username AS comment_username,c.content AS comment_content,c.created_at AS comment_created_at
        FROM posts p LEFT JOIN comments c ON c.post_id=p.id
        ORDER BY p.created_at DESC,p.id DESC,c.created_at ASC,c.id ASC')->fetchAll();
    $posts=[];
    foreach($rows as $row){
        $id=(int)$row['id'];
        if(!isset($posts[$id])) $posts[$id]=[
            'id'=>$id,'username'=>$row['username'],'category'=>$row['category'],
            'title'=>$row['title'],'content'=>$row['content'],'upvotes'=>(int)$row['upvotes'],
            'created_at'=>$row['created_at'],'comments'=>[]
        ];
        if($row['comment_id']!==null) $posts[$id]['comments'][]=[
            'id'=>(int)$row['comment_id'],'username'=>$row['comment_username'],
            'content'=>$row['comment_content'],'created_at'=>$row['comment_created_at']
        ];
    }
    jsonResponse(['success'=>true,'data'=>array_values($posts)]);
}

$input=inputJson();

if($method==='POST'){
    $username=textField($input,'username',80);
    $category=allowedValue($input,'category',['General','BM','Math','Science','English']);
    $title=textField($input,'title',180);
    $content=textField($input,'content',5000);
    $ownerToken=newToken();
    $stmt=db()->prepare('INSERT INTO posts(username,category,title,content,upvotes,owner_token_hash)
        VALUES(:username,:category,:title,:content,0,:owner_token_hash)');
    $stmt->execute(['username'=>$username,'category'=>$category,'title'=>$title,'content'=>$content,'owner_token_hash'=>tokenHash($ownerToken)]);
    jsonResponse(['success'=>true,'message'=>'Post published.','data'=>[
        'id'=>(int)db()->lastInsertId(),'owner_token'=>$ownerToken
    ]],201);
}

$postId=(int)($_GET['id']??0);
if($postId<1) jsonResponse(['success'=>false,'error'=>'Invalid post id.'],422);
$token=requestToken($input);
$stmt=db()->prepare('SELECT owner_token_hash FROM posts WHERE id=:id');
$stmt->execute(['id'=>$postId]);
$post=$stmt->fetch();
if(!$post||!verifyOwnerToken($post['owner_token_hash'],$token)) jsonResponse(['success'=>false,'error'=>'You are not allowed to delete this post.'],403);
$stmt=db()->prepare('DELETE FROM posts WHERE id=:id');
$stmt->execute(['id'=>$postId]);
jsonResponse(['success'=>true,'message'=>'Post deleted.']);
