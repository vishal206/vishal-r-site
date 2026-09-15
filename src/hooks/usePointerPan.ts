import { RefObject, useEffect, useRef } from "react";

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/**
 * Pans an oversized block around inside a fixed viewport by the wheel or
 * trackpad: both axes, no scrollbars, easing to a stop against the content's
 * own edges. Nothing moves unless you move it — there's deliberately no drift
 * that follows the cursor. Pinch and ctrl+wheel are handed to `onZoom`.
 *
 * Skipped entirely on touch (no wheel to read) — the caller is expected to
 * leave those a normal scrollable viewport. Under reduced motion the wheel
 * still pans (it's a direct response to input, not ambient motion) but lands
 * without smoothing.
 */
export const usePointerPan = (
  viewportRef: RefObject<HTMLDivElement | null>,
  contentRef: RefObject<HTMLDivElement | null>,
  /** Called with a factor to zoom by, for pinch and ctrl+wheel. */
  onZoom?: (factor: number) => void,
  /**
   * The block's current zoom. Only watched for changes: a CSS `zoom` doesn't
   * alter the block's own box, so the resize observer below never sees it,
   * and the limits have to be taken again by hand.
   */
  zoomLevel = 1,
) => {
  const remeasure = useRef<() => void>(() => {});
  useEffect(() => remeasure.current(), [zoomLevel]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;
    if (!window.matchMedia?.("(hover: hover)").matches) return;
    const reducedMotion = Boolean(
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    );

    // The content sits centred, so it spills equally either side and the
    // offset runs from -limit to +limit on each axis.
    let limitX = 0;
    let limitY = 0;
    let x = 0;
    let y = 0;
    let frame = 0;
    let last = 0;

    // Wheel deltas land here rather than on the offset directly, and the tick
    // eases them in — a trackpad flick arrives as a burst of events, and
    // applying them raw makes the wall judder.
    let pendingX = 0;
    let pendingY = 0;

    // The offset is kept in screen px, but a transform on a zoomed element is
    // zoomed along with it, so what's written is divided back out.
    let zoom = 1;
    const apply = () => {
      content.style.transform = `translate3d(${(x / zoom).toFixed(2)}px, ${(y / zoom).toFixed(2)}px, 0)`;
    };

    // The block's on-screen size, zoom included (its offset size isn't).
    const measure = () => {
      const box = content.getBoundingClientRect();
      zoom = content.offsetWidth ? box.width / content.offsetWidth : 1;
      limitX = Math.max(0, (box.width - viewport.clientWidth) / 2);
      limitY = Math.max(0, (box.height - viewport.clientHeight) / 2);
      x = clamp(x, -limitX, limitX);
      y = clamp(y, -limitY, limitY);
      pendingX = clamp(pendingX, -limitX - x, limitX - x);
      pendingY = clamp(pendingY, -limitY - y, limitY - y);
      apply();
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); // cap after a stalled tab
      last = now;

      // Whatever the wheel banked, paid out over ~a tenth of a second so a
      // flick reads as a glide rather than a jump.
      if (pendingX || pendingY) {
        const t = reducedMotion ? 1 : 1 - Math.exp(-dt * 14);
        const stepX = pendingX * t;
        const stepY = pendingY * t;
        pendingX = Math.abs(pendingX - stepX) < 0.1 ? 0 : pendingX - stepX;
        pendingY = Math.abs(pendingY - stepY) < 0.1 ? 0 : pendingY - stepY;
        x = clamp(x + stepX, -limitX, limitX);
        y = clamp(y + stepY, -limitY, limitY);
        apply();
      }
      frame = requestAnimationFrame(tick);
    };

    // Listen on the document rather than the viewport: the filter bar sits
    // over the wall as a sibling, and the wheel should still pan while the
    // cursor is on it.
    const onWheel = (e: WheelEvent) => {
      const rect = viewport.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      )
        return;

      // A pinch on a trackpad arrives as a wheel with ctrl held (and ctrl+
      // wheel on a mouse is the same gesture by convention): that's a zoom,
      // not a pan. Steady per notch, so a flick doesn't leap.
      if (e.ctrlKey && onZoom) {
        e.preventDefault();
        onZoom(Math.exp(-e.deltaY * 0.01));
        return;
      }
      if (!limitX && !limitY) return;

      // Firefox reports lines, and page-mode deltas are a viewport at a time.
      const step =
        e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? rect.height : 1;
      let dx = e.deltaX * step;
      let dy = e.deltaY * step;

      // Shift-wheel is the usual sideways gesture on a mouse; and a wall with
      // no vertical room to give would otherwise swallow the wheel entirely,
      // so send it sideways there too.
      if (e.shiftKey && !dx) {
        dx = dy;
        dy = 0;
      } else if (!limitY && limitX) {
        dx += dy;
        dy = 0;
      }

      // Banked against the remaining travel, so overscrolling at an edge
      // doesn't build up a debt that has to be unwound before the wall moves
      // back the other way.
      pendingX = clamp(pendingX - dx, -limitX - x, limitX - x);
      pendingY = clamp(pendingY - dy, -limitY - y, limitY - y);
      e.preventDefault(); // the sheet behind the wall must not scroll instead
    };

    measure();
    remeasure.current = measure;
    document.addEventListener("wheel", onWheel, { passive: false });
    last = performance.now();
    frame = requestAnimationFrame(tick);

    // Re-measure when the wall reflows: filter changes, window resize, or
    // posters finishing loading and settling at their real height.
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(content);

    return () => {
      remeasure.current = () => {};
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("wheel", onWheel);
    };
  }, [viewportRef, contentRef, onZoom]);
};
