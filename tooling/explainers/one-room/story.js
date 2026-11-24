/* Progressive enhancement: the complete story and every visual begin inline. */
(() => {
  const root = document.documentElement;
  const chapters = [...document.querySelectorAll('.chapter')];
  const visuals = chapters.map(chapter => chapter.querySelector('.visual'));
  const stage = document.querySelector('.stage-body');
  const count = document.querySelector('#stage-count');
  const wide = matchMedia('(min-width: 1050px) and (prefers-reduced-motion: no-preference)');
  let active = 0;
  let frame = null;

  function select(index) {
    active = index;
    chapters.forEach((chapter, i) => chapter.classList.toggle('is-active', i === index));
    visuals.forEach((visual, i) => { visual.hidden = wide.matches && i !== index; });
    count.textContent = `${String(index + 1).padStart(2, '0')} / 07`;
  }

  function syncScroll() {
    frame = null;
    if (!wide.matches) return;
    const anchor = innerHeight * 0.45;
    let nearest = 0;
    let distance = Infinity;
    chapters.forEach((chapter, index) => {
      const rect = chapter.getBoundingClientRect();
      const delta = Math.abs(rect.top + rect.height / 2 - anchor);
      if (delta < distance) { nearest = index; distance = delta; }
    });
    select(nearest);
  }

  function layout() {
    if (wide.matches) {
      visuals.forEach(visual => stage.append(visual));
      root.classList.add('enhanced');
      syncScroll();
    } else {
      root.classList.remove('enhanced');
      visuals.forEach((visual, index) => {
        visual.hidden = false;
        chapters[index].prepend(visual);
      });
    }
  }

  addEventListener('scroll', () => {
    if (wide.matches && frame === null) frame = requestAnimationFrame(syncScroll);
  }, { passive: true });
  addEventListener('resize', () => {
    if (wide.matches && frame === null) frame = requestAnimationFrame(syncScroll);
  });
  wide.addEventListener('change', layout);

  const controls = document.querySelector('.comparison-controls');
  const buttons = [...controls.querySelectorAll('button')];
  const imageSets = [...document.querySelectorAll('[data-images]')];
  function compare(value) {
    imageSets.forEach(set => { set.hidden = set.dataset.images !== value; });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.compare === value)));
  }
  controls.hidden = false;
  buttons.forEach(button => button.addEventListener('click', () => compare(button.dataset.compare)));
  compare('before');
  layout();
})();
