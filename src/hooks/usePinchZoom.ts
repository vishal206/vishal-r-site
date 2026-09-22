import { RefObject, useEffect } from "react";

/**
 * A two-finger pinch on `viewportRef`, reported as it happens: `onPinch` gets
 * the spread since the last report (a factor, >1 opening) and where the
 * fingers are centred on screen, so the caller can zoom its own content
 * about that point.
 *
 * Native listeners rather than React's: React attaches touch handlers
 * passively, and the browser has to be told *before* it starts that this
 * pinch is not the page's to zoom. Only two-finger moves are cancelled —
 * one finger still scrolls the viewport as usual.
 */
export const usePinchZoom = (
  viewportRef: RefObject<HTMLElement | null>,
  onPinch: (factor: number, mid: { x: number; y: number }) => void,
) => {
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    let last = 0;
    const spread = (t: TouchList) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

    const onStart = (e: TouchEvent) => {
      last = e.touches.length === 2 ? spread(e.touches) : 0;
    };
    const onMove = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      e.preventDefault();
      const now = spread(e.touches);
      if (!last || !now) {
        last = now;
        return;
      }
      const factor = now / last;
      last = now;
      onPinch(factor, {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      });
    };
    const onEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) last = 0;
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [viewportRef, onPinch]);
};
