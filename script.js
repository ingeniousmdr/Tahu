/* ==========================================
   1. CONSTANTS & CONFIGURATION
   ========================================== */

// Rank Thresholds
const RANKS = [
  { minXp: 0, title: "Squire" },
  { minXp: 100, title: "Knight" },
  { minXp: 300, title: "Baron" },
  { minXp: 600, title: "Count" },
  { minXp: 1000, title: "Duke" },
  { minXp: 1500, title: "Prince" },
  { minXp: 2500, title: "Monarch" }
];

// Target XP for Certificate Fill Ring
const CERTIFICATE_GOAL_XP = 1000;

// Daily Tips List
const TIPS = [
  "Use the 2-Minute Rule: If a task takes less than two minutes to finish, do it immediately!",
  "Try the Pomodoro Technique: Work for 25 minutes, then take a 5-minute break.",
  "Eliminate distractions: Put your phone in another room while studying.",
  "Active Recall: Test yourself on material instead of just re-reading notes.",
  "Spaced Repetition: Review main concepts periodically over several days.",
  "Break large goals into small, manageable bite-sized steps.",
  "Teach someone else what you've learned to solidify your understanding.",
  "Karangan yang berlandaskan IMBAKUP adalah yang TERBAIK."
];

// Unified LocalStorage Keys
const XP_KEY = "userXP";
const STREAK_KEY = "streakCount";
const LAST_ACTIVE_KEY = "lastActiveDate";
const COMPLETED_TIPS_KEY = "completed_tips_list";
const COMPLETED_QUIZZES_KEY = "completedQuizzes";
const QUIZ_SCORES_KEY = "quizScores";

// Subject-Specific Counter Keys (Fallback support)
const BADGE_BM_KEY = "tips_bm_completed";
const BADGE_MATH_KEY = "tips_math_completed";
const BADGE_SCI_KEY = "tips_sci_completed";
const BADGE_ENG_KEY = "tips_eng_completed";

// Pomodoro Timer Keys
const TIMER_KEY = "tips_pomodoro_end_time";
const STATUS_KEY = "tips_pomodoro_status"; // "running", "paused", "idle"
const MODE_KEY = "tips_pomodoro_mode";     // "work" or "break"
const PAUSED_TIME_KEY = "tips_pomodoro_paused_seconds";

let timerInterval = null;
let currentLang = 'en';

/* ==========================================
   2. STREAK MANAGEMENT
   ========================================== */

function initializeStreak() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActiveStr = localStorage.getItem(LAST_ACTIVE_KEY);
  let streak = parseInt(localStorage.getItem(STREAK_KEY), 10) || 0;
  let isStreakLost = false;

  if (!lastActiveStr) {
    // First-time user setup
    streak = 1;
    localStorage.setItem(LAST_ACTIVE_KEY, today.toDateString());
  } else {
    const lastActive = new Date(lastActiveStr);
    lastActive.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - lastActive.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak += 1;
      localStorage.setItem(LAST_ACTIVE_KEY, today.toDateString());
    } else if (diffDays > 1) {
      streak = 1;
      isStreakLost = true;
      localStorage.setItem(LAST_ACTIVE_KEY, today.toDateString());
    }
  }

  localStorage.setItem(STREAK_KEY, streak);

  // Update Navigation Bar & Dashboard Streak Display
// New code to target both desktop and mobile IDs
const streakDesktop = document.getElementById("streak-count-desktop");
if (streakDesktop) streakDesktop.textContent = `${streak} Day${streak > 1 ? "s" : ""}`;

const streakMobile = document.getElementById("streak-count-mobile");
if (streakMobile) streakMobile.textContent = `${streak} Day${streak > 1 ? "s" : ""}`;
  const streakDisplayCard = document.getElementById("streak-count-card");
  if (streakDisplayCard) streakDisplayCard.textContent = `${streak} Day${streak > 1 ? "s" : ""}`;

  if (isStreakLost) {
    showStreakLostModal();
  }
}

function showStreakLostModal() {
  const modal = document.getElementById("streak-modal");
  const closeBtn = document.getElementById("close-modal-btn");

  if (modal) modal.classList.remove("hidden");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.classList.add("hidden");
    });
  }
}

/* ==========================================
   3. DAILY TIPS SYSTEM
   ========================================== */

function getDailyTip() {
  const today = new Date();
  const dayOfYear = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
  const tipIndex = dayOfYear % TIPS.length;

  const tipElement = document.getElementById("daily-tip");
  if (tipElement) {
    tipElement.textContent = `"${TIPS[tipIndex]}"`;
  }
}

/* ==========================================
   4. XP, RANK & CERTIFICATE SYSTEM
   ========================================== */

function updateXpAndRank(newXp) {
  localStorage.setItem(XP_KEY, newXp);

  const xpElement = document.getElementById("user-xp");
  if (xpElement) {
    xpElement.textContent = `${newXp} XP`;
  }

  let currentRank = RANKS[0].title;
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (newXp >= RANKS[i].minXp) {
      currentRank = RANKS[i].title;
      break;
    }
  }

  const rankElement = document.getElementById("user-rank");
  if (rankElement) {
    rankElement.textContent = currentRank;
  }

  const certBtn = document.getElementById("cert-btn");
  if (certBtn) {
    let progressPercent = Math.min((newXp / CERTIFICATE_GOAL_XP) * 100, 100);
    certBtn.style.setProperty("--progress", `${progressPercent}%`);
  }

  // Live update XP badge
  updateBadgeProgress();
}

function addXP(points) {
  let currentXp = parseInt(localStorage.getItem(XP_KEY), 10) || 0;
  currentXp += points;
  updateXpAndRank(currentXp);
}

/* ==========================================
   5. SUBJECT TIPS & XP ACTIONS
   ========================================== */

function markTipComplete(subject, tipId, buttonElement) {
  if (!buttonElement) return;

  const completedTips = JSON.parse(localStorage.getItem(COMPLETED_TIPS_KEY) || "[]");

  if (!completedTips.includes(tipId)) {
    // 1. Save completed tip ID
    completedTips.push(tipId);
    localStorage.setItem(COMPLETED_TIPS_KEY, JSON.stringify(completedTips));

    // 2. Increment subject badge counter
    incrementSubjectCount(subject);

    // 3. Award XP
    addXP(10);

    // 4. Update Button State visually
    applyCompletedState(buttonElement);

    // 5. Refresh Badge UI
    updateBadgeProgress();
  }
}

function incrementSubjectCount(subject) {
  const keyMap = {
    bm: BADGE_BM_KEY,
    math: BADGE_MATH_KEY,
    sci: BADGE_SCI_KEY,
    science: BADGE_SCI_KEY,
    eng: BADGE_ENG_KEY,
    english: BADGE_ENG_KEY
  };

  const storageKey = keyMap[subject.toLowerCase()];
  if (storageKey) {
    let count = parseInt(localStorage.getItem(storageKey) || "0", 10);
    localStorage.setItem(storageKey, (count + 1).toString());
  }
}

// Fallback generic function for simple markDone(this) calls
function markDone(buttonElement) {
  if (!buttonElement || buttonElement.classList.contains("completed")) return;
  
  const card = buttonElement.closest(".tip-card");
  const tipTitle = card ? card.querySelector("h3")?.innerText || "generic_tip" : "generic_tip";
  
  markTipComplete("general", tipTitle, buttonElement);
}

// Helper to visually convert a button to completed
function applyCompletedState(buttonElement) {
  buttonElement.classList.add("completed");
  buttonElement.innerHTML = '<i class="fa-solid fa-circle-check"></i> Completed!';
  buttonElement.disabled = true;
}

// Restore completed buttons state when page loads
function restoreCompletedTips() {
  const completedTips = JSON.parse(localStorage.getItem(COMPLETED_TIPS_KEY) || "[]");
  
  document.querySelectorAll(".complete-btn").forEach((btn) => {
    const card = btn.closest(".tip-card");
    const tipTitle = card ? card.querySelector("h3")?.innerText : null;
    const onclickAttr = btn.getAttribute("onclick") || "";

    if (completedTips.some(id => (tipTitle && id.includes(tipTitle)) || onclickAttr.includes(id))) {
      applyCompletedState(btn);
    }
  });
}

/* ==========================================
   6. BADGES & MILESTONES (UNIFIED SYSTEM)
   ========================================== */

function updateBadgeProgress() {
  const completedTips = JSON.parse(localStorage.getItem(COMPLETED_TIPS_KEY) || "[]");
  const completedQuizzes = JSON.parse(localStorage.getItem(COMPLETED_QUIZZES_KEY) || "[]");
  const quizScores = JSON.parse(localStorage.getItem(QUIZ_SCORES_KEY) || "{}");
  const currentXP = parseInt(localStorage.getItem(XP_KEY) || "0", 10);
  const currentStreak = parseInt(localStorage.getItem(STREAK_KEY) || "1", 10);

  // Helper function to update single badge progress
  function setBadge(cardId, progressId, current, target) {
    const card = document.getElementById(cardId);
    const fill = document.getElementById(progressId);
    if (!card || !fill) return;

    const percentage = Math.min(100, Math.round((current / target) * 100));
    fill.style.width = percentage + "%";

    if (percentage >= 100) {
      card.classList.remove("locked");
      card.classList.add("unlocked");
    } else {
      card.classList.add("locked");
      card.classList.remove("unlocked");
    }
  }

  // Calculate tip counts by ID prefix OR fallback explicit storage key
  const bmCount = Math.max(
    completedTips.filter(id => id.startsWith("bm_")).length,
    parseInt(localStorage.getItem(BADGE_BM_KEY) || "0", 10)
  );

  const mathCount = Math.max(
    completedTips.filter(id => id.startsWith("math_")).length,
    parseInt(localStorage.getItem(BADGE_MATH_KEY) || "0", 10)
  );

  const sciCount = Math.max(
    completedTips.filter(id => id.startsWith("sci_") || id.startsWith("science_")).length,
    parseInt(localStorage.getItem(BADGE_SCI_KEY) || "0", 10)
  );

  const engCount = Math.max(
    completedTips.filter(id => id.startsWith("eng_") || id.startsWith("english_")).length,
    parseInt(localStorage.getItem(BADGE_ENG_KEY) || "0", 10)
  );

  // Check if user has scored 100% (3/3) on any quiz
  const hasPerfectScore = Object.values(quizScores).some(score => score >= 3);

  // Update All 8 Badges
  setBadge("badge-bm", "progress-bm", bmCount, 5);
  setBadge("badge-math", "progress-math", mathCount, 5);
  setBadge("badge-science", "progress-science", sciCount, 5);
  setBadge("badge-english", "progress-english", engCount, 5);
  setBadge("badge-quizzes", "progress-quizzes", completedQuizzes.length, 5);
  setBadge("badge-streak", "progress-streak", currentStreak, 7);
  setBadge("badge-xp", "progress-xp", currentXP, 100);
  setBadge("badge-perfection", "progress-perfection", hasPerfectScore ? 1 : 0, 1);
}

function checkStreakMilestone() {
  const currentStreak = parseInt(localStorage.getItem(STREAK_KEY) || "0", 10);
  const celebrated = localStorage.getItem("streak_celebrated_" + currentStreak);

  if (currentStreak >= 7 && !celebrated) {
    const modal = document.getElementById("celebration-modal");
    if (modal) {
      modal.classList.remove("hidden");
      localStorage.setItem("streak_celebrated_" + currentStreak, "true");
    }
  }
}

function closeCelebrationModal() {
  const modal = document.getElementById("celebration-modal");
  if (modal) modal.classList.add("hidden");
}

/* ==========================================
   7. FLOATING POMODORO WIDGET
   ========================================== */

function getRemainingSeconds() {
  const status = localStorage.getItem(STATUS_KEY);

  if (status === "paused") {
    return parseInt(localStorage.getItem(PAUSED_TIME_KEY) || "1500", 10);
  }

  if (status === "running") {
    const endTime = parseInt(localStorage.getItem(TIMER_KEY), 10);
    const now = Date.now();
    const remaining = Math.round((endTime - now) / 1000);
    return remaining > 0 ? remaining : 0;
  }

  const mode = localStorage.getItem(MODE_KEY) || "work";
  return mode === "work" ? 25 * 60 : 5 * 60;
}

function updateTimerUI() {
  const secondsLeft = getRemainingSeconds();
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const displayString = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const displayEl = document.getElementById("timer-display");
  if (displayEl) displayEl.textContent = displayString;

  const minDisplayEl = document.getElementById("widget-min-display");
  if (minDisplayEl) minDisplayEl.textContent = displayString;

  const status = localStorage.getItem(STATUS_KEY) || "idle";
  const mode = localStorage.getItem(MODE_KEY) || "work";

  const startBtn = document.getElementById("start-btn");
  const pauseBtn = document.getElementById("pause-btn");
  const statusText = document.getElementById("timer-status");

  if (startBtn && pauseBtn && statusText) {
    if (status === "running") {
      startBtn.classList.add("hidden");
      pauseBtn.classList.remove("hidden");
      statusText.textContent = mode === "work" ? "Focus Mode! Stay on task." : "Break Time! Relax.";
    } else if (status === "paused") {
      startBtn.classList.remove("hidden");
      pauseBtn.classList.add("hidden");
      statusText.textContent = "Paused";
    } else {
      startBtn.classList.remove("hidden");
      pauseBtn.classList.add("hidden");
      statusText.textContent = "Ready to study?";
    }
  }
}

function startTimer() {
  const status = localStorage.getItem(STATUS_KEY);
  let secondsToRun = getRemainingSeconds();

  if (status === "idle" || secondsToRun <= 0) {
    const mode = localStorage.getItem(MODE_KEY) || "work";
    secondsToRun = mode === "work" ? 25 * 60 : 5 * 60;
  }

  const endTime = Date.now() + secondsToRun * 1000;
  localStorage.setItem(TIMER_KEY, endTime.toString());
  localStorage.setItem(STATUS_KEY, "running");

  updateTimerUI();
  runTimer();
}

function runTimer() {
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    updateTimerUI();
    const remaining = getRemainingSeconds();

    if (remaining <= 0) {
      clearInterval(timerInterval);

      const currentMode = localStorage.getItem(MODE_KEY) || "work";
      const newMode = currentMode === "work" ? "break" : "work";

      localStorage.setItem(MODE_KEY, newMode);
      localStorage.setItem(STATUS_KEY, "idle");
      localStorage.removeItem(TIMER_KEY);
      localStorage.removeItem(PAUSED_TIME_KEY);

      updateTimerUI();

      alert(
        newMode === "break"
          ? "Great session! Time for a 5-minute break."
          : "Break over! Time to focus."
      );
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  const remaining = getRemainingSeconds();

  localStorage.setItem(PAUSED_TIME_KEY, remaining.toString());
  localStorage.setItem(STATUS_KEY, "paused");
  updateTimerUI();
}

function resetTimer() {
  clearInterval(timerInterval);
  localStorage.setItem(STATUS_KEY, "idle");
  localStorage.setItem(MODE_KEY, "work");
  localStorage.removeItem(TIMER_KEY);
  localStorage.removeItem(PAUSED_TIME_KEY);
  updateTimerUI();
}

function toggleWidget() {
  const card = document.getElementById("widget-card");
  if (card) {
    card.classList.toggle("hidden");
  }
}

/* ==========================================
   8. GOOGLE TRANSLATE INTEGRATION
   ========================================== */

function googleTranslateElementInit() {
  new google.translate.TranslateElement(
    { pageLanguage: 'en', autoDisplay: false },
    'google_translate_element'
  );
}

function translatePage(langCode) {
  const selectElement = document.querySelector('.goog-te-combo');
  if (selectElement) {
    selectElement.value = langCode;
    selectElement.dispatchEvent(new Event('change'));
  }
}

function toggleLanguage() {
  const btn = document.getElementById('translate-btn');

  if (currentLang === 'en') {
    translatePage('ms');
    currentLang = 'ms';
    if (btn) btn.textContent = '🌐 Switch to English';
  } else {
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=" + document.domain + "; path=/;";

    translatePage('en');
    currentLang = 'en';
    if (btn) btn.textContent = '🌐 Switch to Malay';
  }
}

/* ==========================================
   9. SINGLE UNIFIED INITIALIZATION
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Clear Google Translate state cookie on fresh load
  document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=" + document.domain + "; path=/;";

  // 2. Core App Initialization
  initializeStreak();
  getDailyTip();

  // 3. XP & Rank System Setup
  let savedXp = parseInt(localStorage.getItem(XP_KEY), 10) || 0;
  updateXpAndRank(savedXp);

  // 4. Restore Tip Buttons State
  restoreCompletedTips();

  // 5. Render All Badges & Check Milestones
  updateBadgeProgress();
  checkStreakMilestone();

  // 6. Pomodoro Timer Sync
  updateTimerUI();
  if (localStorage.getItem(STATUS_KEY) === "running") {
    runTimer();
  }
});
// --- AUDIO PLAYER DATA & CONFIGURATION ---
const tracks = [
  { title: "Zelda Lullaby", src: "zelda.mp3" },
  { title: "Saria's Song", src: "saria.mp3" },
  { title: "Song Of Healing", src: "healing.mp3" },
  { title: "Great Fairy Fountain", src: "great.mp3" },
  { title: "Mipha Theme", src: "mipha.mp3" }
];

let currentTrackIndex = parseInt(localStorage.getItem("music_track_index")) || 0;

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("focus-audio");
  const widget = document.getElementById("music-widget");
  if (!audio) return;

  // 1. Restore Audio State
  loadTrack(currentTrackIndex, false);
  const savedTime = parseFloat(localStorage.getItem("music_current_time"));
  if (!isNaN(savedTime)) audio.currentTime = savedTime;

  if (localStorage.getItem("music_is_playing") === "true") {
    playAudio();
  }

  // 2. Restore Playlist & Widget States
  applyPlaylistState(localStorage.getItem("playlist_collapsed") !== "false");
  
  const isMinimized = localStorage.getItem("music_widget_minimized") !== "false";
  if (widget) widget.classList.toggle("minimized", isMinimized);

  // 3. Audio Event Listeners
  audio.addEventListener("timeupdate", () => localStorage.setItem("music_current_time", audio.currentTime));
  audio.addEventListener("ended", nextTrack);

  // 4. Setup Sync for Videos
  setupVideoSync();
});

// --- MUTUAL EXCLUSION (VIDEO & MUSIC INTERACTION) ---
function setupVideoSync() {
  document.querySelectorAll("video").forEach((video) => {
    video.addEventListener("play", pauseAudio);
    video.addEventListener("pause", () => {
      const wrapper = video.closest(".video-preview-wrapper");
      if (wrapper) wrapper.classList.remove("is-playing");
    });
  });

  document.querySelectorAll(".lab-video").forEach((video) => {
    video.addEventListener("play", () => {
      const wrapper = video.closest(".video-preview-wrapper");
      if (wrapper) wrapper.classList.add("is-playing");
      pauseAudio();
    });
  });
}

function pauseAllVideos() {
  document.querySelectorAll("video").forEach((video) => {
    if (!video.paused) video.pause();
  });
}

function playLabVideo(wrapperElement) {
  const video = wrapperElement.querySelector("video");
  if (!video) return;
  if (video.paused) {
    video.play();
    wrapperElement.classList.add("is-playing");
  } else {
    video.pause();
    wrapperElement.classList.remove("is-playing");
  }
}

// --- PLAYLIST COLLAPSE LOGIC ---
function applyPlaylistState(isCollapsed) {
  const container = document.getElementById("playlist-container");
  const icon = document.getElementById("collapse-icon");
  if (!container) return;

  container.classList.toggle("collapsed", isCollapsed);
  if (icon) {
    icon.className = isCollapsed ? "fa-solid fa-chevron-down" : "fa-solid fa-chevron-up";
  }
}

function togglePlaylist(e) {
  if (e) e.stopPropagation();
  const container = document.getElementById("playlist-container");
  if (!container) return;

  const isCollapsed = container.classList.toggle("collapsed");
  applyPlaylistState(isCollapsed);
  localStorage.setItem("playlist_collapsed", isCollapsed ? "true" : "false");
}

// --- WIDGET EXPAND / MINIMIZE LOGIC ---
function toggleWidgetExpand(e) {
  if (e) e.stopPropagation();
  const widget = document.getElementById("music-widget");
  if (!widget) return;

  const isMinimized = widget.classList.toggle("minimized");
  localStorage.setItem("music_widget_minimized", isMinimized);
}

// Clicking the minimized circle expands it back to a box
document.addEventListener("click", (e) => {
  const widget = document.getElementById("music-widget");
  if (widget && widget.classList.contains("minimized") && widget.contains(e.target)) {
    widget.classList.remove("minimized");
    localStorage.setItem("music_widget_minimized", "false");
  }
});

// --- CORE PLAYER FUNCTIONS ---
function loadTrack(index, shouldPlay = false) {
  const audio = document.getElementById("focus-audio");
  const titleDisplay = document.getElementById("current-title");
  const playlistItems = document.querySelectorAll(".playlist-item");

  if (!audio) return;

  if (index < 0) index = tracks.length - 1;
  if (index >= tracks.length) index = 0;

  if (currentTrackIndex !== index) {
    localStorage.setItem("music_current_time", 0);
  }

  currentTrackIndex = index;
  localStorage.setItem("music_track_index", currentTrackIndex);
  audio.src = tracks[index].src;

  if (titleDisplay) titleDisplay.innerText = tracks[index].title;

  playlistItems.forEach((item, idx) => {
    item.classList.toggle("active", idx === currentTrackIndex);
  });

  if (shouldPlay) playAudio();
}

function playAudio() {
  const audio = document.getElementById("focus-audio");
  const playIcon = document.getElementById("play-icon");
  const statusText = document.getElementById("audio-status");
  const discIcon = document.querySelector(".disc-icon");

  if (!audio) return;
  pauseAllVideos();

  audio.play()
    .then(() => {
      localStorage.setItem("music_is_playing", "true");
      if (playIcon) playIcon.className = "fa-solid fa-pause";
      if (statusText) statusText.innerText = "Playing...";
      if (discIcon) discIcon.classList.add("playing");
    })
    .catch((error) => console.warn("Audio playback issue:", error));
}

function pauseAudio() {
  const audio = document.getElementById("focus-audio");
  const playIcon = document.getElementById("play-icon");
  const statusText = document.getElementById("audio-status");
  const discIcon = document.querySelector(".disc-icon");

  if (!audio) return;

  audio.pause();
  localStorage.setItem("music_is_playing", "false");
  if (playIcon) playIcon.className = "fa-solid fa-play";
  if (statusText) statusText.innerText = "Paused";
  if (discIcon) discIcon.classList.remove("playing");
}

function toggleCustomAudio() {
  const audio = document.getElementById("focus-audio");
  if (!audio) return;
  audio.paused ? playAudio() : pauseAudio();
}

function playSelectedTrack(index) { loadTrack(index, true); }
function nextTrack() { loadTrack((currentTrackIndex + 1) % tracks.length, true); }
function prevTrack() { loadTrack((currentTrackIndex - 1 + tracks.length) % tracks.length, true); }

// Expand or Minimize Widget
function toggleWidgetExpand(e) {
  if (e) e.stopPropagation();
  
  const widget = document.getElementById("music-widget");
  if (!widget) return;

  const isMinimized = widget.classList.toggle("minimized");
  localStorage.setItem("music_widget_minimized", isMinimized ? "true" : "false");
}