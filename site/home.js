// MCP Lab landing: intro, demo video with chapters, and the "enter" transition into the workbench.
const $ = id => document.getElementById(id);
const root = document.documentElement;
const reduced = () => root.classList.contains('reduce');

/* ── intro ── */
const intro = $('intro');
function ready() { root.classList.add('ready'); startVideo(); }
if (!reduced() && !root.classList.contains('intro-seen') && intro) {
  setTimeout(() => {
    intro.classList.add('out');
    try { sessionStorage.setItem('mcplab-intro', '1'); } catch { /* storage blocked */ }
    setTimeout(ready, 120);
    intro.addEventListener('animationend', () => intro.remove(), { once: true });
  }, 1250);
} else { intro?.remove(); ready(); }

/* ── demo video ── */
const video = $('video'), frame = $('frame'), playBtn = $('play'), bar = $('progress');
const chapters = [...document.querySelectorAll('#chapters button')];
let wantPlay = !reduced();
function setPaused(p) {
  frame.classList.toggle('paused', p);
  playBtn.setAttribute('aria-label', p ? 'Play demo' : 'Pause demo');
}
function startVideo() {
  if (!wantPlay) { setPaused(true); return; }
  video.play().then(() => setPaused(false)).catch(() => setPaused(true));
}
playBtn.addEventListener('click', e => {
  e.stopPropagation();
  if (video.paused) { wantPlay = true; video.play(); setPaused(false); } else { wantPlay = false; video.pause(); setPaused(true); }
});
chapters.forEach(b => b.addEventListener('click', () => {
  video.currentTime = +b.dataset.t; wantPlay = true;
  video.play().then(() => setPaused(false)).catch(() => {});
}));
function tick() {
  if (video.duration) {
    bar.style.transform = `scaleX(${video.currentTime / video.duration})`;
    let cur = 0; chapters.forEach((b, i) => { if (video.currentTime >= +b.dataset.t - .2) cur = i; });
    chapters.forEach((b, i) => b.setAttribute('aria-current', String(i === cur)));
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
// Pause while off screen; resume only if the viewer had it playing.
new IntersectionObserver(([e]) => {
  if (!e.isIntersecting) { video.pause(); }
  else if (wantPlay && root.classList.contains('ready')) video.play().catch(() => {});
}, { threshold: 0.15 }).observe(video);

/* ── enter: grow the recording into the real screen, then navigate ── */
document.querySelectorAll('[data-enter="expand"]').forEach(a => a.addEventListener('click', e => {
  if (reduced() || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  const r = video.getBoundingClientRect(), wipe = $('wipe');
  Object.assign(wipe.style, { display: 'block', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
  const sx = innerWidth / r.width, sy = innerHeight / r.height;
  wipe.style.transformOrigin = '0 0';
  const anim = wipe.animate([
    { transform: 'none', borderRadius: '14px', opacity: .0 },
    { opacity: 1, offset: .25 },
    { transform: `translate(${-r.left}px, ${-r.top}px) scale(${sx}, ${sy})`, borderRadius: '0px', opacity: 1 },
  ], { duration: 480, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' });
  anim.onfinish = () => { location.href = a.href; };
}));
// When returning via Back, the page may be restored from cache with the wipe still showing.
addEventListener('pageshow', () => { const w = $('wipe'); w.getAnimations().forEach(a => a.cancel()); w.style.display = 'none'; });
