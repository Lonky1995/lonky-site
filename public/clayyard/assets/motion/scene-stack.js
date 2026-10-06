(() => {
  const stack = document.querySelector('.scene-stack');
  if (!stack) return;
  const panels = [...stack.children];
  const motion = matchMedia('(min-width: 761px) and (prefers-reduced-motion: no-preference)');
  let frame = 0;

  // Fully covered panels must not expose invisible keyboard targets.
  const syncCovered = () => {
    frame = 0;
    const enabled = stack.classList.contains('is-stacking');
    const rects = panels.map(panel => panel.getBoundingClientRect());
    panels.forEach((panel, index) => {
      panel.inert = enabled && rects.slice(index + 1).some(next =>
        next.top <= rects[index].top + 1 && next.bottom >= rects[index].bottom - 1);
    });
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(syncCovered);
  };
  const measure = () => {
    const top = parseFloat(getComputedStyle(stack).getPropertyValue('--scene-top')) || 24;
    // A tall scene must scroll in full, including at browser zoom and short screens.
    stack.classList.toggle('is-stacking', motion.matches && panels.every(panel =>
      panel.getBoundingClientRect().height <= innerHeight - top - 24));
    schedule();
  };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', measure, { passive: true });
  motion.addEventListener('change', measure);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(measure);
    panels.forEach(panel => observer.observe(panel));
  }
  document.fonts?.ready.then(measure);
  measure();
})();
