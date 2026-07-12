// Each corner pile hides its items behind a sticker at rest, then fans them out
// diagonally away from the corner on hover (rabbit-from-a-bush). REST = near the
// corner (hidden); SPREAD = fanned toward the interior, covering the sticker.
export type Pos = { x: number; y: number; r: number };

// Bottom-row piles: items cluster behind the sticker at rest, fan upward on hover.
export const BOTTOM_REST: Pos[] = [
  { x: 42, y: 96, r: -6 },
  { x: 58, y: 104, r: 6 },
  { x: 50, y: 114, r: -3 },
];
export const BOTTOM_SPREAD: Pos[] = [
  { x: 2, y: 22, r: -12 },
  { x: 96, y: 26, r: 10 },
  { x: 48, y: -16, r: -4 },
];

// Blog: rest clustered behind the sticker, spread into a circular bunch above it.
export const bottomBlogRest = (i: number): Pos => ({
  x: 60 + ((i % 3) - 1) * 7,
  y: 96 + Math.floor(i / 3) * 3,
  r: i % 2 ? 5 : -5,
});

export const bunchPos = (i: number, n: number): Pos => {
  if (i < 3) {
    const spots: [number, number, number][] = [
      [0, 0, -5],
      [18, 12, 7],
      [-14, 16, -9],
    ];
    const [x, y, r] = spots[i];
    return { x, y, r };
  }
  const ringCount = Math.max(n - 3, 1);
  const k = i - 3;
  const ang = (k / ringCount) * Math.PI * 2 + 0.5;
  const rad = 60 + Math.sin(i * 53.3) * 16;
  const x = Math.cos(ang) * rad + Math.sin(i * 17.1) * 8;
  const y = Math.sin(ang) * rad + 28 + Math.cos(i * 11.7) * 8;
  const r = Math.sin(i * 12.9) * 18;
  return { x, y, r };
};

// Same bunch, shifted so it fans up and centred above the bottom-row sticker.
export const bottomBunch = (i: number, n: number): Pos => {
  const p = bunchPos(i, n);
  return { x: p.x + 56, y: p.y - 30, r: p.r };
};
