(() => {
  "use strict";

  function subjectFromPath() {
    const name = location.pathname.split("/").pop().toLowerCase();
    return ({ "bm.html":"bm", "math.html":"math", "science.html":"science", "english.html":"english" })[name] || "";
  }

  function escapeHTML(str) {
    return String(str ?? "").replace(/[&<>'"]/g, tag => ({
      "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
    })[tag]);
  }

  function renderTips(tips) {
    const container = document.getElementById("tips-container");
    if (!container) return;

    if (!tips.length) {
      container.innerHTML = '<div class="empty-state">No tips are available yet.</div>';
      return;
    }

    container.innerHTML = "";
    tips.forEach(tip => {
      const card = document.createElement("div");
      card.className = "tip-card";
      card.innerHTML = `
        <div class="tip-header">
          <span class="subject-tag">${escapeHTML(tip.subject)}</span>
          <span class="xp-tag">+10 XP</span>
        </div>
        <h3>${escapeHTML(tip.title)}</h3>
        <div class="interactive-prompt">
          <div class="tip-answer hidden">
            <p class="explanation">${escapeHTML(tip.content)}</p>
          </div>
          <button class="reveal-btn" onclick="toggleTipAnswer(this)">
            <i class="fa-solid fa-eye"></i> Reveal Memory Trick
          </button>
        </div>
        <div class="card-footer">
          <button class="complete-btn" onclick="markTipComplete('${escapeHTML(tip.subject)}', 'tip-db-${Number(tip.id)}', this)">
            <i class="fa-regular fa-circle-check"></i> Mark as Learned (+10 XP)
          </button>
        </div>`;
      container.appendChild(card);
    });

    if (typeof restoreCompletedTips === "function") restoreCompletedTips();
    if (typeof updateBadgeProgress === "function") updateBadgeProgress();
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const subject = subjectFromPath();
    if (!subject || !window.TahuDB) return;
    const container = document.getElementById("tips-container");
    if (!container) return;

    try {
      const tips = await TahuDB.getTips(subject);
      renderTips(tips);
    } catch (error) {
      console.error(error);
      container.innerHTML = '<div class="empty-state">Unable to load tips. Please try again later.</div>';
    }
  });
})();