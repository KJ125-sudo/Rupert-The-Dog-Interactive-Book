// ===== CONFIG =====
const TOTAL_PAGES = 13;             // update when you add more
const IMAGE_DIR = 'images';
const AUDIO_DIR = 'audio';
const FILE_PREFIX = 'Page-';         // capital P for BOTH images & audio
const IMAGE_EXT = 'png';
const AUDIO_EXT = 'mp3';

// ===== HELPERS =====
const imgSrc   = n => `${IMAGE_DIR}/${FILE_PREFIX}${n}.${IMAGE_EXT}`;
const audioSrc = n => `${AUDIO_DIR}/${FILE_PREFIX}${n}.${AUDIO_EXT}`;
const $ = s => document.querySelector(s);

// ===== STATE =====
let mode = 'manual';   // 'manual' | 'auto'
let page = 1;
let muted = false;
let touchStartX = 0;

// ===== EL =====
const elCover = $('#cover');
const elReader = $('#reader');
const elLoader = $('#loader');
const elImg = $('#page-img');
const elAudio = $('#narration');
const elPageNum = $('#page-num');
const elPageTotal = $('#page-total');
const elBar = $('#bar');

const btnStartAuto = $('#start-auto');
const btnStartManual = $('#start-manual');
const btnPrev = $('#prev');
const btnNext = $('#next');
const btnRestart = $('#restart');
const btnMode = $('#mode-toggle');
const btnMute = $('#mute-toggle');
const btnPlayPause = $('#playpause');

// ===== INIT =====
elPageTotal.textContent = TOTAL_PAGES;

// Preload cover + first few pages
(function preload() {
  const list = [imgSrc(1), 'images/Cover-Page.png'];
  for (let i = 2; i <= Math.min(5, TOTAL_PAGES); i++) list.push(imgSrc(i));
  list.forEach(src => { const im = new Image(); im.src = src; });
})();

function setProgress(n){
  const pct = Math.max(0, Math.min(100, (n-1)/(TOTAL_PAGES-1)*100));
  elBar.style.width = `${pct}%`;
}

function showLoader(show=true){
  elLoader.classList.toggle('hidden', !show);
}

function fadeInImage(){
  elImg.classList.remove('show'); // reset
  requestAnimationFrame(()=> requestAnimationFrame(()=> elImg.classList.add('show')));
}

function loadPage(n, opts={ play:false }){
  page = Math.max(1, Math.min(TOTAL_PAGES, n));
  elPageNum.textContent = page;
  setProgress(page);

  // display loader briefly while switching heavy assets
  showLoader(true);
  elImg.src = imgSrc(page);
  elImg.onload = () => {
    showLoader(false);
    fadeInImage();
  };

  // prepare audio (if file exists)
  elAudio.src = audioSrc(page);
  elAudio.load();
  elAudio.muted = muted;

  // warm preload of next image & audio
  if (page < TOTAL_PAGES) {
    const im = new Image(); im.src = imgSrc(page+1);
  }

  if (opts.play) {
    elAudio.play().catch(()=>{});
  }
}

function nextPage(opts={ play: mode==='auto' }){
  if (page < TOTAL_PAGES) loadPage(page+1, opts);
  else if (mode==='auto') btnPlayPause.textContent = 'Play';
}
function prevPage(opts={ play:false }){ if (page>1) loadPage(page-1, opts); }

function setMode(next){
  mode = next;
  btnMode.textContent = mode==='auto' ? 'Switch to Manual' : 'Switch to Auto';
  btnPlayPause.textContent = mode==='auto' ? 'Pause' : 'Play';
}

function startReader(initialMode){
  setMode(initialMode);
  elCover.classList.add('hidden');
  elReader.classList.remove('hidden');
  loadPage(1, { play: initialMode==='auto' });
}

// ===== EVENTS =====
btnStartAuto.addEventListener('click', ()=> startReader('auto'));
btnStartManual.addEventListener('click', ()=> startReader('manual'));

btnNext.addEventListener('click', ()=> nextPage({ play: mode==='auto' }));
btnPrev.addEventListener('click', ()=> prevPage({ play: mode==='auto' }));
btnRestart.addEventListener('click', ()=> loadPage(1, { play: mode==='auto' }));

btnMode.addEventListener('click', ()=>{
  const newMode = mode==='auto' ? 'manual' : 'auto';
  setMode(newMode);
  if (newMode==='auto') elAudio.play().catch(()=>{});
  else elAudio.pause();
});

btnMute.addEventListener('click', ()=>{
  muted = !muted;
  elAudio.muted = muted;
  btnMute.textContent = muted ? 'Unmute' : 'Mute';
});

btnPlayPause.addEventListener('click', ()=>{
  if (elAudio.paused) { elAudio.play().then(()=> btnPlayPause.textContent='Pause').catch(()=>{}); }
  else { elAudio.pause(); btnPlayPause.textContent='Play'; }
});

// auto-advance when narration ends
elAudio.addEventListener('ended', ()=>{
  if (mode==='auto') nextPage({ play:true });
});

// keyboard nav
window.addEventListener('keydown', (e)=>{
  if (elReader.classList.contains('hidden')) return;
  if (e.key==='ArrowRight') nextPage({ play: mode==='auto' });
  if (e.key==='ArrowLeft')  prevPage({ play: mode==='auto' });
});

// tap to advance + swipe
elImg.addEventListener('click', ()=> nextPage({ play: mode==='auto' }));
elImg.addEventListener('touchstart', e=> { touchStartX = e.changedTouches[0].clientX; }, {passive:true});
elImg.addEventListener('touchend', e=>{
  const dx = e.changedTouches[0].clientX - touchStartX;
  const THRESH = 50;
  if (dx > THRESH) prevPage({ play: mode==='auto' });
  else if (dx < -THRESH) nextPage({ play: mode==='auto' });
}, {passive:true});
