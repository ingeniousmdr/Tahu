(() => {
  "use strict";
  const API_BASE = "php-sql/api";
  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE}/${path}`, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
    let payload;
    try { payload = await response.json(); }
    catch { throw new Error(`Server returned HTTP ${response.status} with invalid JSON.`); }
    if (!response.ok || payload.success === false)
      throw new Error(payload.error || `Request failed (HTTP ${response.status}).`);
    return payload;
  }
  function token(key) {
    let value=localStorage.getItem(key);
    if(!value){
      const bytes=new Uint8Array(32);
      crypto.getRandomValues(bytes);
      value=Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");
      localStorage.setItem(key,value);
    }
    return value;
  }
  const ownerKey=type=>`tahuOwnerToken:${type}`;
  window.TahuDB={
    getTips:async subject=>(await request(`tips.php?subject=${encodeURIComponent(subject)}`)).data,
    getPosts:async()=>(await request("posts.php")).data,
    createPost:async data=>{
      const result=await request("posts.php",{method:"POST",body:JSON.stringify(data)});
      if(result.data?.owner_token) localStorage.setItem(ownerKey(`post:${result.data.id}`),result.data.owner_token);
      return result.data;
    },
    deletePost:async id=>{
      const key=ownerKey(`post:${id}`), owner_token=localStorage.getItem(key);
      if(!owner_token) throw new Error("This browser does not have the owner token for that post.");
      return request(`posts.php?id=${encodeURIComponent(id)}`,{method:"DELETE",body:JSON.stringify({owner_token})});
    },
    createComment:async data=>{
      const result=await request("comments.php",{method:"POST",body:JSON.stringify(data)});
      if(result.data?.owner_token) localStorage.setItem(ownerKey(`comment:${result.data.id}`),result.data.owner_token);
      return result.data;
    },
    deleteComment:async id=>{
      const key=ownerKey(`comment:${id}`), owner_token=localStorage.getItem(key);
      if(!owner_token) throw new Error("This browser does not have the owner token for that comment.");
      return request(`comments.php?id=${encodeURIComponent(id)}`,{method:"DELETE",body:JSON.stringify({owner_token})});
    },
    upvotePost:async id=>{
      const visitor_token=token("tahuVisitorToken");
      return request("vote.php",{method:"POST",body:JSON.stringify({post_id:Number(id),visitor_token})});
    }
  };
})();
