// NOTE: Popovers are plain <details> elements; whether one is open is page
// state the browser keeps, not lab state. This closes an open popover when
// the person clicks elsewhere or presses Escape, the way menus behave.
export const closePopoversOnOutsideClick = (root: Document): void => {
  const closeAll = (except: Element | null): void => {
    root.querySelectorAll('details.pop[open]').forEach(open => {
      if (except === null || !open.contains(except)) {
        open.removeAttribute('open')
      }
    })
  }
  root.addEventListener('click', event => {
    closeAll(event.target instanceof Element ? event.target : null)
  })
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeAll(null)
    }
  })
}
