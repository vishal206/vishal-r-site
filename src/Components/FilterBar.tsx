import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type FilterOption<K extends string> = {
  key: K;
  label: string;
  count: number;
};

type Props<K extends string> = {
  options: FilterOption<K>[];
  value: K;
  onChange: (key: K) => void;
  className?: string;
  /**
   * Where the bar sits: across the top of the section, centred (the
   * default), or pinned in the top-right corner of its nearest positioned
   * ancestor, out of the way of what's behind it.
   */
  placement?: "center" | "corner";
  /** Smaller type and tighter padding at every breakpoint. */
  compact?: boolean;
};

/**
 * The section filter row: a floating pill bar with one white marker that slides
 * and stretches to whichever filter is active, rather than each button painting
 * its own background.
 *
 * The bar carries its own surface (dark, blurred) because sections can put
 * artwork directly behind it.
 *
 * Options after the first are dropped when their count is zero; the first is
 * always shown, since it's the section's default and can't be allowed to
 * vanish out from under the marker.
 */
function FilterBar<K extends string>({
  options,
  value,
  onChange,
  className = "",
  placement = "center",
  compact = false,
}: Props<K>) {
  const barRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef(new Map<K, HTMLButtonElement>());
  const [pill, setPill] = useState({ left: 0, top: 0, width: 0, height: 0 });
  // The first placement jumps into position; only later moves animate.
  const [ready, setReady] = useState(false);

  const shown = options.filter((o, i) => i === 0 || o.count > 0);

  // Park the marker on the active button. Offsets are relative to the bar,
  // which is the positioned parent, so this survives the row wrapping on narrow
  // screens as well as label widths changing with the counts.
  useLayoutEffect(() => {
    const button = buttonRefs.current.get(value);
    if (!button) return;
    const place = () =>
      setPill({
        left: button.offsetLeft,
        top: button.offsetTop,
        width: button.offsetWidth,
        height: button.offsetHeight,
      });
    place();

    const observer = new ResizeObserver(place);
    if (barRef.current) observer.observe(barRef.current);
    return () => observer.disconnect();
  }, [value, options]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const EASE = "cubic-bezier(0.22,1,0.36,1)";

  return (
    <div
      className={`z-10 flex ${
        placement === "corner"
          ? "absolute right-3 top-3 justify-end sm:right-4 sm:top-4"
          : "relative justify-center px-3 sm:px-6"
      } ${className}`}
    >
      <div
        ref={barRef}
        className="relative flex flex-wrap justify-center gap-1 p-1 sm:gap-2 sm:p-1.5 rounded-[26px] backdrop-blur-md"
        style={{
          background: "rgba(17,17,17,0.72)",
          boxShadow:
            "inset 0 0 0 1px rgba(232,227,220,0.10), 0 10px 30px -12px rgba(0,0,0,0.9)",
        }}
      >
        <span
          aria-hidden
          className="absolute left-0 top-0 rounded-full bg-editorial-text"
          style={{
            width: pill.width,
            height: pill.height,
            transform: `translate3d(${pill.left}px, ${pill.top}px, 0)`,
            opacity: pill.width ? 1 : 0,
            transition: ready
              ? `transform 560ms ${EASE}, width 560ms ${EASE}, height 560ms ${EASE}`
              : "none",
          }}
        />

        {shown.map(({ key, label, count }) => (
          <button
            key={key}
            ref={(el) => {
              if (el) buttonRefs.current.set(key, el);
              else buttonRefs.current.delete(key);
            }}
            onClick={() => onChange(key)}
            className={`relative z-10 rounded-full uppercase transition-colors duration-300 ${
              compact
                ? "px-2.5 py-1 text-[8px] tracking-[0.1em] sm:px-3 sm:text-[9px] sm:tracking-[0.14em]"
                : "px-2.5 py-1 text-[8px] tracking-[0.1em] sm:px-4 sm:py-1.5 sm:text-[11px] sm:tracking-[0.2em]"
            } ${
              value === key
                ? "text-editorial-bg"
                : "text-editorial-muted/70 hover:text-editorial-text"
            }`}
          >
            {label}
            <span className="ml-1.5 opacity-60">{count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default FilterBar;
