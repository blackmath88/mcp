// NOTE: Moving to another step or screen should start at its top. On a phone
// the route navigation sits below the content, and on desktop the workbench
// scrolls on its own, so without this the next page opens part-way down.
const NAVIGATING =
  '.nav-row, .route-step, .landing-actions button, .lib-station-head button, .story-nav button, .atlas-doors button, .brand'

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
