/**
 * Geometry for the mount a poster hangs in — shared so the frame is only ever
 * defined once. It lives outside MoviePoster because a component file that
 * also exports helpers breaks fast refresh.
 */

export type MountChrome = {
  /** The space the mount stands off its neighbours — half on each side. */
  gap: number;
  /** Thickness of the black edge around the whole mount, even on all sides. */
  edge: number;
  /** Thickness of the frame on the three even sides. */
  frame: number;
  /** Type size for a note set on the plate. */
  ink: number;
  /** Depth of the plate along the foot — deeper than the frame, as a mount is. */
  plate: number;
};

/**
 * Everything a mount takes for itself, worked out from the width of the poster
 * it holds. A share of that width rather than a fixed number of pixels, so a
 * small picture gets the same look as a big one instead of a hairline.
 *
 * On a wall this is worked out once from the wall's nominal poster width and
 * handed to every mount, rather than each one deriving its own. It has to be:
 * the packing can't size a column until it knows what the chrome will take,
 * and the chrome can't be sized from a column width that doesn't exist yet.
 * One thickness throughout is also how a room of pictures is actually hung.
 */
export const mountChrome = (width: number): MountChrome => {
  const frame = Math.round(Math.min(24, Math.max(10, width * 0.075)));
  const ink = Math.round(Math.min(13, Math.max(9, width * 0.05)));
  return {
    gap: MOUNT_GAP,
    edge: Math.max(2, Math.round(frame * 0.3)),
    frame,
    ink,
    plate: Math.max(Math.round(frame * 1.9), Math.round(ink * 4.4)),
  };
};

/** What the mount's black edge is painted in. */
export const MOUNT_EDGE_COLOR = "#000";

/**
 * The space a mounted poster leaves around itself on a wall by default, so
 * neighbouring mounts read as separate pictures instead of merging into one
 * white field. A wall can set its own per mount (`MountChrome.gap`).
 *
 * It's taken out of the cell the packing already handed the poster — half on
 * each side — so the wall's geometry is untouched and this is the whole gap
 * between any two mounts. Only the artwork inside gives up the space.
 */
export const MOUNT_GAP = 8;
