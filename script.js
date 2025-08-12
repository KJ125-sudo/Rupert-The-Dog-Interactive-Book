// ---- CONFIG ----
const TOTAL_PAGES = 13;               // update when you add more
const IMAGE_DIR = 'images';
const AUDIO_DIR = 'audio';
const FILE_PREFIX = 'Page-';          // capital P for BOTH images & audio
const IMAGE_EXT = 'png';
const AUDIO_EXT = 'mp3';

// ---- HELPERS ----
const imgSrc   = n => `${IMAGE_DIR}/${FILE_PREFIX}${n}.${IMAGE_EXT}`;
const audioSrc = n => `${AUDIO_DIR}/${FILE_PREFIX}${n}.${AUDIO_EXT}`;

// ---- STATE ----
let mode = 'manual'; // 'manual' | 'auto'
let page = 1;
let muted = false;

// ---- ELEMENTS ----
const $ = s => document.querySelector(s);
const elPicker = $('#mode-picker');
const elReader = $('#reader');
const elPageImg = $('#page-img');
const elAudio = $('#narration');
const elPrev = $('#prev');
const elNext = $('#next');
const elPlayPause = $('#playpause');
const elPageNum = $('#page-num');
const elPageTotal = $('#page-total');
const elModeToggle = $('#mode-toggle');
const elMuteToggle = $('#mute-toggle');
const elRestart = $('#restart');
const startAutoBtn = $('#start-auto');
const startManualBtn = $('#start-manual');

// ---- INIT ----
elPageTotal.textContent = TOTAL_PAGES;

// Preload first few pages (bandwidth-friendly)
(function preload() {
  for (let i = 1; i <= Math.min(5, TOTAL_PAGES); i++) {
    const img = new Image();
    img.src = imgSrc(i);
  }
})();

function loadPage(n, opts = { play: false }) {
  page = Math.max(1, Math.min(TOTAL_PAGES, n));
  elPageNum.textContent = page;
  elPageImg.src = imgSrc(page);

  // Set audio for this page (if it exists)
  const src = audioSrc(page);
  elAudio.src = src;
  elAudio.load();

  elAudio.muted = muted;

  if (opts.play) {
    elAudio.play().catch(() => {
      // Autoplay may be blocked until a user gesture
    });
  }
}

function nextPage(opts = { play: mode === 'auto' }) {
  if (page < TOTAL_PAGES) {
    loadPage(page + 1, opts);
  } else {
    // End of book
    if (mode === 'auto') elPlayPause.textContent = 'Play';
  }
}

function prevPage(opts = { play: false }) {
  if (page > 1) {
    loadPage(page - 1, opts);
  }
}

function setMode(nextMode) {
  mode = nextMode;
  elModeToggle.textContent = mode === 'auto' ? 'Switch to Manual' : 'Switch to Auto';
  elPlayPause.textContent = mode === 'auto' ? 'Pause' : 'Play';
}

function startReader(initialMode) {
  setMode(initialMode);
  elPicker.classList.add('hidden');
  elReader.classList.remove('hidden');
  // First interaction satisfies audio policy
  loadPage(1, { play: initialMode === 'auto' });
}

// ---- EVENTS ----
startAutoBtn.addEventListener('click', () => startReader('auto'));
startManualBtn.addEventListener('click', () => startReader('manual'));

elNext.addEventListener('click', () => nextPage({ play: mode === 'auto' }));
elPrev.addEventListener('click', () => prevPage({ play: mode === 'auto' }));
elRestart.addEventListener('click', () => loadPage(1, { play: mode === 'auto' }));

elModeToggle.addEventListener('click', () => {
  const newMode = mode === 'auto' ? 'manual' : 'auto';
  setMode(newMode);
  if (newMode === 'auto') {
    elAudio.play().catch(() => {});
  } else {
    elAudio.pause();
  }
});

elMuteToggle.addEventListener('click', () => {
  muted = !muted;
  elAudio.muted = muted;
  elMuteToggle.textContent = muted ? 'Unmute' : 'Mute';
});

elPlayPause.addEventListener('click', () => {
  if (elAudio.paused) {
    elAudio.play().then(() => {
      elPlayPause.textContent = 'Pause';
    }).catch(() => {});
  } else {
    elAudio.pause();
    elPlayPause.textContent = 'Play';
  }
});

// Auto-advance when narration ends (auto mode only)
elAudio.addEventListener('ended', () => {
  if (mode === 'auto') nextPage({ play: true });
});

// Keyboard nav
window.addEventListener('keydown', (e) => {
  if (elReader.classList.contains('hidden')) return;
  if (e.key === 'ArrowRight') nextPage({ play: mode === 'auto' });
  if (e.key === 'ArrowLeft') prevPage({ play: mode === 'auto' });
  if (e.key.toLowerCase() === 'm') { muted = !muted; elAudio.muted = muted; }
});

// Tap the image to advance (handy on mobile)
elPageImg.addEventListener('click', () => nextPage({ play: mode === 'auto' }));
