// =====================================================================
// Why Do You Love Me — script.js
// =====================================================================
// Edit SONGS below to add your own music. Replace reasons in reasons.json.
// =====================================================================

// --- Songs -----------------------------------------------------------
// Add your MP3 files to the /music folder and list them here.
const SONGS = [
  { title: "Acolyte",                 src: "music/acolyte.mp3"      },
  { title: "As We Fight",             src: "music/As We Fight.mp3"   }, 
  { title: "Ask - 2011 Remaster",     src: "music/Ask - 2011 Remaster.mp3"      },                                   
  { title: "Baby, I Love You",        src: "music/Baby, I Love You.mp3"    },  
  { title: "Cemetry Gates",           src: "music/Cemetry Gates.mp3"    },  
  { title: "Cut Your Bangs",          src: "music/Cut Your Bangs.mp3"    },  
  { title: "Go Away",                 src: "music/Go Away.mp3"    },  
  { title: "Just like Heaven",        src: "music/Just like Heaven.mp3"    },  
  { title: "Love 2 Fast",             src: "music/Love 2 Fast.mp3"    },  
  { title: "Restless",                src: "music/Restless.mp3"    },  
  { title: "you're so perfect",       src: "music/you're so perfect.mp3"    },  
];

// --- Config ----------------------------------------------------------
const MUSIC_VOLUME    = 0.12;   // soft background level (0.0–1.0)
const AVOID_LAST_N    = 8;      // avoid repeating the last N reasons
const TYPING_DELAY_MS = 2000;   // ms before typing indicator appears
const REPLY_DELAY_MS  = 2000;   // ms typing indicator shows before reply

// --- Fallback reasons (used if reasons.json fails to load) -----------
const FALLBACK_REASONS = [
  { text: "Your laugh makes my heart melt every single time.", category: "romantic" },
  { text: "You make terrible puns and I love you for it anyway.", category: "funny" },
  { text: "You're my favorite person to do absolutely nothing with.", category: "romantic" },
  { text: "You remember how I take my coffee and it makes me feel so seen.", category: "romantic" },
  { text: "The way you light up when you talk about things you love.", category: "romantic" },
  { text: "You somehow manage to be cute, funny, and wildly distracting all at once.", category: "funny" },
  { text: "You listen like nothing else in the world matters.", category: "romantic" },
  { text: "You sing in the shower and I pretend to hate it but I really, really love it.", category: "funny" },
  { text: "Because you're you — and that's more than enough for me.", category: "romantic" },
  { text: "You make ordinary days feel like something I'll remember forever.", category: "romantic" },
];

// --- State -----------------------------------------------------------
const state = {
  reasons: [],
  usedReasonIndices: [],  // circular buffer (keeps last AVOID_LAST_N)
  isTyping: false,
  music: {
    isPlaying:    false,
    currentIndex: -1,
    lastIndex:    -1,   // track last played to avoid back-to-back repeats
  },
};

// --- DOM refs (populated in init) ------------------------------------
let messagesEl, sendBtn, inputEl, audioEl;
let musicToggleBtn, musicDetails, nowPlayingEl, prevBtn, nextBtn;
let iconMusicOn, iconMusicOff;

// --- Helpers ---------------------------------------------------------

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function scrollBottom() {
  // rAF ensures DOM has updated before scrolling
  requestAnimationFrame(() => {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });
}

// --- Message flow ----------------------------------------------------

async function handleSend() {
  if (state.isTyping || state.reasons.length === 0) return;

  state.isTyping = true;
  sendBtn.disabled = true;

  // Outgoing bubble
  appendMessage("user", inputEl.value);
  scrollBottom();

  // Pause — then show typing indicator
  await sleep(TYPING_DELAY_MS);
  showTyping();
  scrollBottom();

  // Typing — then show Ben's reply
  await sleep(REPLY_DELAY_MS);
  hideTyping();

  const reason = pickReason();
  appendMessage("ben", reason.text);
  scrollBottom();

  state.isTyping = false;
  sendBtn.disabled = false;
}

function appendMessage(author, text) {
  const div = document.createElement("div");
  div.className = "message " + (author === "user" ? "outgoing" : "incoming");
  div.textContent = text;
  messagesEl.appendChild(div);
}

function showTyping() {
  const el = document.createElement("div");
  el.className = "typing-indicator";
  el.id = "typingIndicator";
  el.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
  messagesEl.appendChild(el);
}

function hideTyping() {
  const el = document.getElementById("typingIndicator");
  if (el) el.remove();
}

// --- Reason picker ---------------------------------------------------

function pickReason() {
  const total = state.reasons.length;
  // how many to avoid: min of AVOID_LAST_N and (total - 1) so we always have at least one option
  const avoidCount = Math.min(AVOID_LAST_N, total - 1);
  const recentlyUsed = state.usedReasonIndices.slice(-avoidCount);

  let idx;
  let guard = 0;
  do {
    idx = Math.floor(Math.random() * total);
    guard++;
  } while (recentlyUsed.includes(idx) && guard < 200);

  state.usedReasonIndices.push(idx);
  // trim buffer to avoid unbounded growth
  if (state.usedReasonIndices.length > AVOID_LAST_N + 4) {
    state.usedReasonIndices.shift();
  }

  return state.reasons[idx];
}

// --- Music player ----------------------------------------------------

function toggleMusic() {
  if (state.music.isPlaying) {
    audioEl.pause();
    state.music.isPlaying = false;
  } else {
    if (SONGS.length === 0) {
      alert("No songs configured yet! Add MP3s to /music and update SONGS in script.js.");
      return;
    }
    playRandomSong();
  }
  updateMusicUI();
}

function playRandomSong() {
  if (SONGS.length === 0) return;

  let idx;
  let guard = 0;
  do {
    idx = Math.floor(Math.random() * SONGS.length);
    guard++;
  } while (idx === state.music.lastIndex && SONGS.length > 1 && guard < 50);

  playSong(idx);
}

function playSong(idx) {
  if (idx < 0 || idx >= SONGS.length) return;

  state.music.currentIndex = idx;
  state.music.lastIndex    = idx;

  audioEl.src    = SONGS[idx].src;
  audioEl.volume = MUSIC_VOLUME;

  audioEl.play()
    .then(() => {
      state.music.isPlaying = true;
      updateMusicUI();
    })
    .catch(err => {
      console.warn("Audio playback blocked or file missing:", err);
      state.music.isPlaying = false;
      updateMusicUI();
    });
}

function nextSong() {
  if (SONGS.length === 0) return;
  let next = (state.music.currentIndex + 1) % SONGS.length;
  // if only one song, just restart it
  playSong(next);
}

function prevSong() {
  if (SONGS.length === 0) return;
  let prev = (state.music.currentIndex - 1 + SONGS.length) % SONGS.length;
  playSong(prev);
}

function updateMusicUI() {
  const { isPlaying, currentIndex } = state.music;

  if (isPlaying && currentIndex >= 0) {
    musicToggleBtn.classList.add("playing");
    iconMusicOn.style.display  = "none";
    iconMusicOff.style.display = "block";
    nowPlayingEl.textContent   = SONGS[currentIndex]?.title ?? "Unknown";
    musicDetails.classList.add("visible");
  } else {
    musicToggleBtn.classList.remove("playing");
    iconMusicOn.style.display  = "block";
    iconMusicOff.style.display = "none";
    nowPlayingEl.textContent   = "—";
    musicDetails.classList.remove("visible");
  }
}

// --- Initialization --------------------------------------------------

async function init() {
  // Cache DOM refs
  messagesEl      = document.getElementById("messages");
  sendBtn         = document.getElementById("sendButton");
  inputEl         = document.getElementById("messageInput");
  audioEl         = document.getElementById("audioPlayer");
  musicToggleBtn  = document.getElementById("musicToggle");
  musicDetails    = document.getElementById("musicDetails");
  nowPlayingEl    = document.getElementById("nowPlaying");
  prevBtn         = document.getElementById("prevSong");
  nextBtn         = document.getElementById("nextSong");
  iconMusicOn     = document.getElementById("iconMusicOn");
  iconMusicOff    = document.getElementById("iconMusicOff");

  // Load reasons
  try {
    const res = await fetch("reasons.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    state.reasons = await res.json();
    if (!Array.isArray(state.reasons) || state.reasons.length === 0) {
      throw new Error("Empty reasons array");
    }
  } catch (err) {
    console.warn("Could not load reasons.json — using built-in fallback.", err);
    state.reasons = FALLBACK_REASONS;
  }

  // Send button & Enter key
  sendBtn.addEventListener("click", handleSend);
  inputEl.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); handleSend(); }
    else { e.preventDefault(); } // block all typing in the readonly field
  });
  // Extra safety: reset value if something changes it
  inputEl.addEventListener("input", () => {
    inputEl.value = "Why do you love me, Ben?";
  });

  // Music controls
  audioEl.volume = MUSIC_VOLUME;
  audioEl.addEventListener("ended", () => {
    // Auto-advance: pick next song (avoid same one if possible)
    if (SONGS.length > 1) {
      nextSong();
    } else if (SONGS.length === 1) {
      playSong(0); // loop the only song
    } else {
      state.music.isPlaying = false;
      updateMusicUI();
    }
  });

  musicToggleBtn.addEventListener("click", toggleMusic);
  prevBtn.addEventListener("click", prevSong);
  nextBtn.addEventListener("click", nextSong);

  // Initial UI state
  updateMusicUI();
}

document.addEventListener("DOMContentLoaded", init);
