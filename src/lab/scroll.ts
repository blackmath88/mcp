// NOTE: Moving to another step or screen should start at its top. On a phone
// the route navigation sits below the content, and on desktop the workbench
// scrolls on its own, so without this the next page opens part-way down.
const NAVIGATING =
  '.nav-row, .route-step, .landing-actions button, .lib-station-head button, .story-nav button, .atlas-doors button, .brand, .crit-links .pop-btn'

const SCROLLERS = '.workbench, .atlas-main, .library, .intro'

export const scrollToTopOnNavigation = (root: Document): void => {
  root.addEventListener('click', event => {
    if (
      !(event.target instanceof Element) ||
      event.target.closest(NAVIGATING) === null
    ) {
      return
    }
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0 })
      root.querySelectorAll(SCROLLERS).forEach(scroller => {
        scroller.scrollTop = 0
      })
    })
  })
}

// NOTE: Picking a server in the library draws it in the canvas above the
// rail. Above this width the canvas is sticky beside the rail and already on
// screen; below it the two stack and the canvas can be far above the card
// that was tapped, so bring it back. Keep this in step with the .lib-stage
// breakpoint in styles.css.
const STACKED = '(max-width: 1300px)'

export const scrollToCanvasOnPick = (root: Document): void => {
  root.addEventListener('click', event => {
    if (
      !(event.target instanceof Element) ||
      event.target.closest('.lib-mini:not(.flat)') === null ||
      !window.matchMedia(STACKED).matches
    ) {
      return
    }
    const canvas = root.querySelector('.lib-canvas-col')
    if (canvas === null) {
      return
    }
    requestAnimationFrame(() => {
      canvas.scrollIntoView({ block: 'start' })
    })
  })
}
