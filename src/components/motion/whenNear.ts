/**
 * Runs `callback` once, after fonts are ready, when `element` comes within
 * `margin` of the viewport from either direction. Returns a cancel function.
 */
export function whenNear(element: Element, callback: () => void, margin = '60% 0px') {
  let done = false;
  let observer: IntersectionObserver | null = null;
  const run = () => {
    if (done) return;
    done = true;
    observer?.disconnect();
    callback();
  };
  void document.fonts.ready.then(() => {
    if (done) return;
    observer = new IntersectionObserver(entries => entries.some(e => e.isIntersecting) && run(), {
      rootMargin: margin,
    });
    observer.observe(element);
  });
  return () => {
    done = true;
    observer?.disconnect();
  };
}
