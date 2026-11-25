// NOTE: The "What is MCP?" scenes switch their canvas as you scroll, the way
// the bridge-work articles do: a scene becomes current once its text crosses
// a line 45% down the scrolling area. This only sets `data-tell` on the
// section, `data-current` on the scene's text and `aria-current` on its
// button; the stacked canvases and the fade between them are CSS. Clicking a
// scene button scrolls its text into place, which then switches the canvas.

const LINE = 0.45

const scrollerOf = (tell: Element): Element | null => tell.closest('.intro')

const currentOf = (tell: Element): number => {
  // The part of the screen the scenes scroll through: the intro's own box
  // where it scrolls, the window where the page does.
  const box = scrollerOf(tell)?.getBoundingClientRect()
  const top = Math.max(box?.top ?? 0, 0)
  const bottom = Math.min(box?.bottom ?? window.innerHeight, window.innerHeight)
  const line = top + (bottom - top) * LINE
  let current = 1
  tell.querySelectorAll('[data-tell-beat]').forEach(beat => {
    if (beat.getBoundingClientRect().top <= line) {
      current = Number(beat.getAttribute('data-tell-beat')) || current
    }
  })
  return current
}

const apply = (tell: Element, current: number): void => {
  if (tell.getAttribute('data-tell') === String(current)) {
    return
  }
  tell.setAttribute('data-tell', String(current))
  tell.querySelectorAll('[data-tell-beat]').forEach(beat => {
    beat.toggleAttribute(
      'data-current',
      beat.getAttribute('data-tell-beat') === String(current),
    )
  })
  tell.querySelectorAll('[data-tell-go]').forEach(dot => {
    dot.setAttribute(
      'aria-current',
      dot.getAttribute('data-tell-go') === String(current) ? 'step' : 'false',
    )
  })
}

export const tellOnScroll = (root: Document): void => {
  let queued = false
  const update = (): void => {
    queued = false
    root.querySelectorAll('.tell').forEach(tell => apply(tell, currentOf(tell)))
  }
  const schedule = (): void => {
    if (!queued) {
      queued = true
      requestAnimationFrame(update)
    }
  }
  root.addEventListener('scroll', schedule, { capture: true, passive: true })
  window.addEventListener('resize', schedule, { passive: true })
  new MutationObserver(schedule).observe(root.body, {
    childList: true,
    subtree: true,
  })
  root.addEventListener('click', event => {
    const dot =
      event.target instanceof Element
        ? event.target.closest('[data-tell-go]')
        : null
    const tell = dot?.closest('.tell')
    if (
      dot === null ||
      dot === undefined ||
      tell === null ||
      tell === undefined
    ) {
      return
    }
    const beat = tell.querySelector(
      `[data-tell-beat="${dot.getAttribute('data-tell-go')}"]`,
    )
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    beat?.scrollIntoView({
      behavior: reduce ? 'auto' : 'smooth',
      block: 'center',
    })
  })
  schedule()
}
