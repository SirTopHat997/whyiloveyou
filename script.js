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
const MUSIC_VOLUME      = 0.1;   // soft background level (0.0–1.0)
const AVOID_LAST_N      = 8;      // avoid repeating the last N reasons
const AVOID_LAST_SONGS  = 4;      // avoid repeating the last N songs
const TYPING_DELAY_MS   = 200;    // ms before typing indicator appears
const REPLY_DELAY_MS    = 2000;   // ms typing indicator shows before reply

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

// --- Session volume (resets on page load and when toggle is turned on) ---
let sessionVolume = MUSIC_VOLUME;

// --- State -----------------------------------------------------------
const state = {
  reasons: [],
  usedReasonIndices: [],
  isTyping: false,
  music: {
    isEnabled:    false,   // toggle switch on/off
    isPlaying:    false,   // actual playback state
    currentIndex: -1,
    playHistory:  [],      // newest-last; used to avoid recent songs
  },
};

// --- DOM refs (populated in init) ------------------------------------
let messagesEl, sendBtn, inputEl, audioEl;
let musicToggleEl, musicDetails, nowPlayingEl, prevBtn, nextBtn;
let playPauseBtn, iconPlay, iconPause;
let progressBar, albumArtEl, albumArtFallback;
let volDownBtn, volUpBtn, volumeLevelEl;

// --- Helpers ---------------------------------------------------------

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function scrollBottom() {
  requestAnimationFrame(() => {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });
}

// --- Message flow ----------------------------------------------------

async function handleSend() {
  if (state.isTyping || state.reasons.length === 0) return;

  state.isTyping = true;
  sendBtn.disabled = true;

  appendMessage("user", inputEl.value);
  scrollBottom();

  await sleep(TYPING_DELAY_MS);
  showTyping();
  scrollBottom();

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
  const avoidCount = Math.min(AVOID_LAST_N, total - 1);
  const recentlyUsed = state.usedReasonIndices.slice(-avoidCount);

  let idx;
  let guard = 0;
  do {
    idx = Math.floor(Math.random() * total);
    guard++;
  } while (recentlyUsed.includes(idx) && guard < 200);

  state.usedReasonIndices.push(idx);
  if (state.usedReasonIndices.length > AVOID_LAST_N + 4) {
    state.usedReasonIndices.shift();
  }

  return state.reasons[idx];
}

// --- Music player ----------------------------------------------------

function pickRandomSong() {
  if (SONGS.length === 0) return 0;
  const avoidCount = Math.min(AVOID_LAST_SONGS, SONGS.length - 1);
  const recent = [...new Set(state.music.playHistory.slice(-avoidCount))];

  let idx;
  let guard = 0;
  do {
    idx = Math.floor(Math.random() * SONGS.length);
    guard++;
  } while (recent.includes(idx) && guard < 200);

  return idx;
}

function playSong(idx) {
  if (SONGS.length === 0 || idx < 0 || idx >= SONGS.length) return;

  state.music.currentIndex = idx;
  state.music.playHistory.push(idx);
  if (state.music.playHistory.length > AVOID_LAST_SONGS + 4) {
    state.music.playHistory.shift();
  }

  audioEl.src = encodeURI(SONGS[idx].src);
  audioEl.volume = sessionVolume;

  audioEl.play()
    .then(() => {
      state.music.isPlaying = true;
      updatePlayPauseUI();
    })
    .catch(err => {
      console.warn("Audio playback blocked or file missing:", err);
      state.music.isPlaying = false;
      updatePlayPauseUI();
    });

  nowPlayingEl.textContent = SONGS[idx].title;
  resetProgressUI();
  extractAlbumArt(encodeURI(SONGS[idx].src));
}

function handleToggleChange() {
  state.music.isEnabled = musicToggleEl.checked;

  if (state.music.isEnabled) {
    sessionVolume = MUSIC_VOLUME;
    audioEl.volume = sessionVolume;
    updateVolumeUI();
    musicDetails.classList.add("visible");
    playSong(pickRandomSong());
  } else {
    musicDetails.classList.remove("visible");
    audioEl.pause();
    state.music.isPlaying = false;
    updatePlayPauseUI();
  }
}

function handlePlayPause() {
  if (!state.music.isEnabled || state.music.currentIndex === -1) return;

  if (state.music.isPlaying) {
    audioEl.pause();
    state.music.isPlaying = false;
  } else {
    audioEl.play()
      .then(() => { state.music.isPlaying = true; updatePlayPauseUI(); })
      .catch(() => {});
  }
  updatePlayPauseUI();
}

function nextSong() {
  if (SONGS.length === 0) return;
  playSong(pickRandomSong());
}

function prevSong() {
  if (SONGS.length === 0) return;
  // Go back to second-to-last entry in history, or pick random if no history
  const hist = state.music.playHistory;
  if (hist.length >= 2) {
    state.music.playHistory.pop(); // remove current
    const prev = state.music.playHistory.pop(); // remove and play previous
    playSong(prev);
  } else {
    playSong(pickRandomSong());
  }
}

function updatePlayPauseUI() {
  if (state.music.isPlaying) {
    iconPlay.style.display  = "none";
    iconPause.style.display = "block";
  } else {
    iconPlay.style.display  = "block";
    iconPause.style.display = "none";
  }
}

// --- Progress bar ----------------------------------------------------

function resetProgressUI() {
  progressBar.value = 0;
  progressBar.style.background = `linear-gradient(to right, var(--blue) 0%, #d1d1d6 0%)`;
}

function updateProgressUI() {
  if (!audioEl.duration) return;
  const pct = (audioEl.currentTime / audioEl.duration) * 100;
  progressBar.value = pct;
  progressBar.style.background =
    `linear-gradient(to right, var(--blue) ${pct}%, #d1d1d6 ${pct}%)`;
}

function handleScrub() {
  if (!audioEl.duration) return;
  audioEl.currentTime = (progressBar.value / 100) * audioEl.duration;
}

// --- Album art -------------------------------------------------------

async function extractAlbumArt(src) {
  albumArtEl.style.display = "none";
  albumArtFallback.style.display = "flex";

  try {
    // Fetch the first 512 KB — enough for any embedded cover art
    const res = await fetch(src, { headers: { Range: "bytes=0-524287" } });
    if (!res.ok) return;

    const buf = await res.arrayBuffer();
    const b   = new Uint8Array(buf);
    const dv  = new DataView(buf);

    // ID3v2 magic: 'I','D','3'
    if (b[0] !== 0x49 || b[1] !== 0x44 || b[2] !== 0x33) return;

    // Tag size is a 4-byte syncsafe integer at bytes 6-9
    const tagSize = ((b[6] & 0x7f) << 21) | ((b[7] & 0x7f) << 14) |
                    ((b[8] & 0x7f) << 7)  |  (b[9] & 0x7f);

    let pos = 10;
    const limit = Math.min(10 + tagSize, b.length);

    while (pos + 10 < limit) {
      const frameId   = String.fromCharCode(b[pos], b[pos+1], b[pos+2], b[pos+3]);
      const frameSize = dv.getUint32(pos + 4);   // big-endian, ID3v2.3 style
      const dataStart = pos + 10;

      if (frameId === "APIC" && frameSize > 0) {
        let i = dataStart;
        const enc = b[i++];                       // text encoding byte

        // MIME type: null-terminated Latin-1 string
        let mimeEnd = i;
        while (mimeEnd < limit && b[mimeEnd] !== 0) mimeEnd++;
        const mime = new TextDecoder().decode(b.slice(i, mimeEnd)) || "image/jpeg";
        i = mimeEnd + 1;

        i++;  // picture type byte

        // Description: null-terminated; double-null for UTF-16 (enc 1 or 2)
        if (enc === 1 || enc === 2) {
          while (i + 1 < limit && !(b[i] === 0 && b[i + 1] === 0)) i += 2;
          i += 2;
        } else {
          while (i < limit && b[i] !== 0) i++;
          i++;
        }

        const imgData = b.slice(i, dataStart + frameSize);
        const blob    = new Blob([imgData], { type: mime });
        const url     = URL.createObjectURL(blob);
        albumArtEl.onload = () => URL.revokeObjectURL(url);
        albumArtEl.src = url;
        albumArtEl.style.display = "block";
        albumArtFallback.style.display = "none";
        return;
      }

      // Guard against corrupt / zero-size frames to avoid infinite loop
      if (frameSize <= 0 || dataStart + frameSize > limit) break;
      pos = dataStart + frameSize;
    }
  } catch {
    // silently fall through — fallback is already visible
  }
}

// --- Volume controls -------------------------------------------------

function volumeDown() {
  sessionVolume = Math.max(0, sessionVolume - 0.05);
  audioEl.volume = sessionVolume;
  updateVolumeUI();
}

function volumeUp() {
  sessionVolume = Math.min(1, sessionVolume + 0.05);
  audioEl.volume = sessionVolume;
  updateVolumeUI();
}

function updateVolumeUI() {
  volumeLevelEl.textContent = Math.round(sessionVolume * 100) + "%";
}

// --- Initialization --------------------------------------------------

async function init() {
  messagesEl      = document.getElementById("messages");
  sendBtn         = document.getElementById("sendButton");
  inputEl         = document.getElementById("messageInput");
  audioEl         = document.getElementById("audioPlayer");
  musicToggleEl   = document.getElementById("musicToggle");
  musicDetails    = document.getElementById("musicDetails");
  nowPlayingEl    = document.getElementById("nowPlaying");
  prevBtn         = document.getElementById("prevSong");
  nextBtn         = document.getElementById("nextSong");
  playPauseBtn    = document.getElementById("playPauseBtn");
  iconPlay        = document.getElementById("iconPlay");
  iconPause       = document.getElementById("iconPause");
  progressBar     = document.getElementById("progressBar");
  albumArtEl       = document.getElementById("albumArt");
  albumArtFallback = document.getElementById("albumArtFallback");
  volDownBtn       = document.getElementById("volDown");
  volUpBtn         = document.getElementById("volUp");
  volumeLevelEl    = document.getElementById("volumeLevel");

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
    else { e.preventDefault(); }
  });
  inputEl.addEventListener("input", () => {
    inputEl.value = "Why do you love me, Ben?";
  });

  // Music controls
  audioEl.volume = MUSIC_VOLUME;

  musicToggleEl.checked = false;  // browser persists checkbox state across reloads; force off
  musicToggleEl.addEventListener("change", handleToggleChange);
  playPauseBtn.addEventListener("click", handlePlayPause);
  prevBtn.addEventListener("click", prevSong);
  nextBtn.addEventListener("click", nextSong);

  audioEl.addEventListener("timeupdate", updateProgressUI);
  progressBar.addEventListener("input", handleScrub);
  volDownBtn.addEventListener("click", volumeDown);
  volUpBtn.addEventListener("click", volumeUp);
  updateVolumeUI();

  audioEl.addEventListener("ended", () => {
    state.music.isPlaying = false;
    updatePlayPauseUI();
    if (state.music.isEnabled) nextSong();
  });

  updatePlayPauseUI();
}

document.addEventListener("DOMContentLoaded", init);
