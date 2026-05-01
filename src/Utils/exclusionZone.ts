let exclusionRect: DOMRect | null = null;

export const setExclusionRect = (rect: DOMRect | null) => {
  exclusionRect = rect;
};

export const getExclusionRect = () => exclusionRect;

/** If (mx, my) is inside the exclusion rect, return the nearest point on its border. */
export const clampOutsideRect = (
  mx: number,
  my: number,
  rect: DOMRect
): { x: number; y: number } => {
  if (mx < rect.left || mx > rect.right || my < rect.top || my > rect.bottom) {
    return { x: mx, y: my };
  }
  const dLeft = mx - rect.left;
  const dRight = rect.right - mx;
  const dTop = my - rect.top;
  const dBottom = rect.bottom - my;
  const min = Math.min(dLeft, dRight, dTop, dBottom);

  if (min === dLeft) return { x: rect.left - 1, y: my };
  if (min === dRight) return { x: rect.right + 1, y: my };
  if (min === dTop) return { x: mx, y: rect.top - 1 };
  return { x: mx, y: rect.bottom + 1 };
};
