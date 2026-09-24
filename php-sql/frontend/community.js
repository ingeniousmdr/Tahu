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
    if (!response.ok || payload.success === false) throw new Error(payload.error || "Request failed.");
    return payload;
  }

  function token(key) {
    let value = localStorage.getItem(key);
    if (!value) {
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      value = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
      localStorage.setItem(key, value);
    }
    return value;
  }

  const ownerKey = type => `tahuOwnerToken:${type}`;
  const hasOwnerToken = (type, id) => Boolean(localStorage.getItem(ownerKey(`${type}:${id}`)));

  function escapeHTML(str) {
    return String(str ?? "").replace(/[&<>'"]/g, tag => ({
      "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
    })[tag]);
  }

  function showToast(message) {
    const toast = document.getElementById("toast-notification");
    const toastMessage = document.getElementById("toast-message");
    if (!toast || !toastMessage) return;
    toastMessage.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  }

  async function loadPosts() {
    const feedEl = document.getElementById("posts-feed");
    if (!feedEl) return;

    const voted = JSON.parse(localStorage.getItem("upvotedPosts") || "[]");

    try {
      const posts = await TahuDB.getPosts();

      if (!posts.length) {
        feedEl.innerHTML = '<div class="empty-state">No discussions yet. Be the first to share!</div>';
        return;
      }

      feedEl.innerHTML = posts.map(post => {
        const isVoted = voted.includes(Number(post.id));
        const comments = post.comments || [];

        const commentsMarkup = comments.map(c => {
          const canDelete = hasOwnerToken("comment", c.id);
          return `
            <div class="comment-item">
              <div class="comment-header">
                <span class="comment-author">${escapeHTML(c.username)}</span>
                ${canDelete ? `<button class="delete-btn" onclick="TahuCommunity.deleteComment(${c.id})" title="Delete comment"><i class="fa-solid fa-trash"></i></button>` : ""}
              </div>
              <p class="comment-text">${escapeHTML(c.content)}</p>
            </div>`;
        }).join("");

        const canDeletePost = hasOwnerToken("post", post.id);

        return `
          <div class="post-card">
            <div class="vote-box">
              <button class="vote-btn ${isVoted ? "voted" : ""}" onclick="TahuCommunity.upvotePost(${post.id})" ${isVoted ? "disabled" : ""}>
                <i class="fa-solid fa-arrow-up"></i>
              </button>
              <span class="vote-count" id="vote-count-${post.id}">${Number(post.upvotes)}</span>
            </div>
            <div class="post-main">
              <div class="post-meta">
                <div class="post-meta-left">
                  <span class="badge-tag">${escapeHTML(post.category)}</span>
                  <span class="post-author">• Posted by ${escapeHTML(post.username)}</span>
                </div>
                ${canDeletePost ? `<button class="delete-btn" onclick="TahuCommunity.deletePost(${post.id})" title="Delete post"><i class="fa-solid fa-trash"></i></button>` : ""}
              </div>
              <h3 class="post-title">${escapeHTML(post.title)}</h3>
              <p class="post-body">${escapeHTML(post.content)}</p>
              <button class="comment-toggle-btn" onclick="TahuCommunity.toggleComments(${post.id})">
                <i class="fa-regular fa-comment"></i> <span id="comment-count-${post.id}">${comments.length}</span> Comments
              </button>
              <div class="comments-section" id="comments-section-${post.id}">
                <div class="comments-list" id="comments-list-${post.id}">
                  ${commentsMarkup || '<p style="color:#94a3b8;font-size:.85rem;margin:4px 0 12px;">No comments yet. Be the first!</p>'}
                </div>
                <form class="comment-form" onsubmit="TahuCommunity.submitComment(event, ${post.id})">
                  <div class="comment-form-row">
                    <input type="text" class="form-control" id="comment-user-${post.id}" placeholder="Your Name" maxlength="80" required />
                    <input type="text" class="form-control" id="comment-text-${post.id}" placeholder="Write a comment..." maxlength="3000" required />
                  </div>
                  <button type="submit" class="btn-primary" style="padding:6px 14px;font-size:.85rem;align-self:flex-end;">Reply</button>
                </form>
              </div>
            </div>
          </div>`;
      }).join("");
    } catch (error) {
      console.error(error);
      feedEl.innerHTML = '<div class="empty-state">Error loading posts. Please try again later.</div>';
    }
  }

  async function submitComment(event, postId) {
    event.preventDefault();
    const usernameInput = document.getElementById(`comment-user-${postId}`);
    const textInput = document.getElementById(`comment-text-${postId}`);
    try {
      await TahuDB.createComment({
        post_id: Number(postId),
        username: usernameInput.value.trim(),
        content: textInput.value.trim()
      });
      usernameInput.value = "";
      textInput.value = "";
      showToast("Comment added!");
      await loadPosts();
    } catch (error) {
      showToast(error.message);
    }
  }

  let pendingDelete = { id: null, type: null };

  function askDelete(id, type) {
    pendingDelete = { id, type };
    const title = type === "post" ? "Delete Post?" : "Delete Comment?";
    const message = type === "post"
      ? "Are you sure you want to delete this post? This action cannot be undone."
      : "Are you sure you want to delete this comment?";
    document.querySelector("#confirm-modal h3").textContent = title;
    document.querySelector("#confirm-modal p").textContent = message;
    document.getElementById("confirm-modal").classList.add("show");
  }

  async function closeConfirmModal(confirmed) {
    document.getElementById("confirm-modal").classList.remove("show");
    if (!confirmed || pendingDelete.id === null) {
      pendingDelete = { id:null, type:null };
      return;
    }
    const { id, type } = pendingDelete;
    pendingDelete = { id:null, type:null };
    try {
      if (type === "post") await TahuDB.deletePost(id);
      else await TahuDB.deleteComment(id);
      showToast(type === "post" ? "Post deleted!" : "Comment deleted!");
      await loadPosts();
    } catch (error) {
      showToast(error.message);
    }
  }

  async function createPost(event) {
    event.preventDefault();
    const form = document.getElementById("create-post-form");
    const data = {
      username: document.getElementById("post-username").value.trim(),
      category: document.getElementById("post-category").value,
      title: document.getElementById("post-title").value.trim(),
      content: document.getElementById("post-content").value.trim()
    };

    try {
      await TahuDB.createPost(data);
      form.reset();
      toggleForm();
      showToast("Post published! +5 XP");
      if (typeof addXP === "function") addXP(5);
      await loadPosts();
    } catch (error) {
      showToast(error.message);
    }
  }

  async function upvotePost(id) {
    try {
      const result = await TahuDB.upvotePost(id);
      const voteEl = document.getElementById(`vote-count-${id}`);
      if (voteEl) voteEl.textContent = result.data.upvotes;
      const voted = JSON.parse(localStorage.getItem("upvotedPosts") || "[]");
      voted.push(Number(id));
      localStorage.setItem("upvotedPosts", JSON.stringify([...new Set(voted)]));
      await loadPosts();
    } catch (error) {
      showToast(error.message);
    }
  }

  function toggleComments(postId) {
    document.getElementById(`comments-section-${postId}`)?.classList.toggle("open");
  }

  function toggleForm() {
    const card = document.getElementById("post-form-card");
    if (card) card.style.display = card.style.display === "none" ? "block" : "none";
  }

  function openSidebar() {
    document.getElementById("single-sidebar")?.classList.add("active");
    document.getElementById("sidebar-overlay")?.classList.add("active");
  }
  function closeSidebar() {
    document.getElementById("single-sidebar")?.classList.remove("active");
    document.getElementById("sidebar-overlay")?.classList.remove("active");
  }

  window.closeConfirmModal = closeConfirmModal;
  window.toggleForm = toggleForm;

  window.TahuCommunity = {
    submitComment,
    deletePost: id => askDelete(id, "post"),
    deleteComment: id => askDelete(id, "comment"),
    closeConfirmModal,
    upvotePost,
    toggleComments,
    toggleForm
  };

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("open-sidebar-btn")?.addEventListener("click", openSidebar);
    document.getElementById("close-sidebar-btn")?.addEventListener("click", closeSidebar);
    document.getElementById("sidebar-overlay")?.addEventListener("click", closeSidebar);
    document.getElementById("create-post-form")?.addEventListener("submit", createPost);
    document.querySelector("#confirm-modal .btn-cancel")?.addEventListener("click", () => closeConfirmModal(false));
    document.querySelector("#confirm-modal .btn-delete")?.addEventListener("click", () => closeConfirmModal(true));
    loadPosts();
  });
})();