import { useState, ReactNode, CSSProperties } from "react";
import { Pos } from "../Utils/pilePositions";

// Shared die-cut sticker chrome: thick white edge + lift shadow.
export const STICKER =
  "border-[3px] border-white bg-editorial-bg shadow-[0_12px_28px_-8px_rgba(0,0,0,0.8)]";

// A corner pile: items hidden behind a sticker at rest, fanned out on hover.
const CornerPile = ({
  wrapperClass,
  boxClass,
  items,
  rest,
  spread,
  sticker,
  stickerStyle,
  restScale = 0.85,
  hoverScale = 1.05,
}: {
  wrapperClass: string;
  boxClass: string;
  items: { key: string; title: string; onClick: () => void; node: ReactNode }[];
  rest: Pos[];
  spread: Pos[];
  sticker: ReactNode;
  stickerStyle: CSSProperties;
  restScale?: number;
  hoverScale?: number;
}) => {
  const [hover, setHover] = useState(false);
  return (
    <div className={wrapperClass}>
      <div className={boxClass}>
        {items.map((it, i) => {
          const p = hover ? spread[i % spread.length] : rest[i % rest.length];
          return (
            <div
              key={it.key}
              title={it.title}
              onClick={it.onClick}
              style={{
                zIndex: items.length - i,
                opacity: hover ? 1 : 0,
                pointerEvents: hover ? "auto" : "none",
                transform: `translate(${p.x}px, ${p.y}px) rotate(${p.r}deg) scale(${hover ? hoverScale : restScale})`,
              }}
              className="absolute top-0 left-0 cursor-pointer transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            >
              {it.node}
            </div>
          );
        })}
        <div
          className="absolute"
          style={stickerStyle}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          {sticker}
        </div>
      </div>
    </div>
  );
};

export default CornerPile;
