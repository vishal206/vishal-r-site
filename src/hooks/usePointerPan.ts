import { RefObject, useEffect } from "react";

type Options = {
  /** Fraction of the viewport at each edge that pans. 0.3 = outer 30%. */
  edge?: number;
  /** Top speed at the very edge, px per second. */
  maxSpeed?: number;
};

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/**
 * How hard this axis is panning, from the pointer's position along it (0..1).
 * Nothing happens through the middle; inside an edge band the pull ramps up
 * quadratically, so it creeps as you approach and only races at the very edge.
 */
const pull = (p: number, edge: number) => {
  if (p < edge) {
    const t = (edge - p) / edge;
    return -t * t;
  }
  if (p > 1 - edge) {
    const t = (p - (1 - edge)) / edge;
    return t * t;
  }
  return 0;
};

/**
 * Pans an oversized block around inside a fixed viewport by pointer proximity:
 * the closer the cursor gets to an edge, the faster the content slides that
 * way, easing to a stop against the content's own edges. Both axes, no
 * scrollbars, and the offset stays put whenever the pointer leaves the
 * viewport or rests on anything marked `data-no-pan`.
 *
 * Skipped entirely on touch (no hover to read) and under reduced motion — the
 * caller is expected to leave those a normal scrollable viewport.
 */
export const usePointerPan = (
  viewportRef: RefObject<HTMLDivElement | null>,
  contentRef: RefObject<HTMLDivElement | null>,
  { edge = 0.3, maxSpeed = 900 }: Options = {},
) => {
  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;
    if (!window.matchMedia?.("(hover: hover)").matches) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    // The content sits centred, so it spills equally either side and the
    // offset runs from -limit to +limit on each axis.
    let limitX = 0;
    let limitY = 0;
    let x = 0;
    let y = 0;
    let pointerX = 0.5;
    let pointerY = 0.5;
    let paused = false;
    let frame = 0;
    let last = 0;

    const apply = () => {
      content.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    };

    const measure = () => {
      limitX = Math.max(0, (content.offsetWidth - viewport.clientWidth) / 2);
      limitY = Math.max(0, (content.offsetHeight - viewport.clientHeight) / 2);
      x = clamp(x, -limitX, limitX);
      y = clamp(y, -limitY, limitY);
      apply();
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); // cap after a stalled tab
      last = now;

      // Pointer left of centre pulls the content right, revealing what's off
      // that side — hence the negated push.
      const dx = paused ? 0 : -pull(pointerX, edge) * maxSpeed * dt;
      const dy = paused ? 0 : -pull(pointerY, edge) * maxSpeed * dt;
      if (dx || dy) {
        x = clamp(x + dx, -limitX, limitX);
        y = clamp(y + dy, -limitY, limitY);
        apply();
      }
      frame = requestAnimationFrame(tick);
    };

    // Read the pointer from the document rather than the viewport: anything
    // layered over the viewport (the filter bar, the dock) is a sibling, not a
    // child, so its events would never reach a listener on the viewport — and
    // the pan would carry on from the last position it saw.
    const onMove = (e: PointerEvent) => {
      const rect = viewport.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      pointerX = clamp(x, 0, 1);
      pointerY = clamp(y, 0, 1);

      const outside = x < 0 || x > 1 || y < 0 || y > 1;
      // Controls laid over the wall opt out with `data-no-pan`, so aiming at
      // one doesn't send the content sliding out from under the cursor.
      const overControl =
        e.target instanceof Element && Boolean(e.target.closest("[data-no-pan]"));
      paused = outside || overControl;
    };

    measure();
    document.addEventListener("pointermove", onMove, { passive: true });
    last = performance.now();
    frame = requestAnimationFrame(tick);

    // Re-measure when the wall reflows: filter changes, window resize, or
    // posters finishing loading and settling at their real height.
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(content);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("pointermove", onMove);
    };
  }, [viewportRef, contentRef, edge, maxSpeed]);
};
