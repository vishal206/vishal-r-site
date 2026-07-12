import { useEffect, useState } from "react";

// A central agent core dispatching to — and hearing back from — its tools.
// Reads as an agent orchestration loop: reason → act → observe → remember.
const CORE: [number, number] = [120, 75];

const NODES: { pos: [number, number]; label: [number, number]; text: string }[] = [
  { pos: [120, 26], label: [120, 13], text: "Reason" },
  { pos: [212, 75], label: [212, 96], text: "Tools" },
  { pos: [120, 124], label: [120, 141], text: "Memory" },
  { pos: [28, 75], label: [28, 96], text: "RAG" },
];

const DUR = 2.6; // seconds for a full request→response round trip

const AgentGraph = () => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const [cx, cy] = CORE;

  return (
    <svg
      viewBox="0 0 240 150"
      role="img"
      aria-label="An AI agent core orchestrating calls to its tools, memory, and knowledge base"
      className="w-full max-w-sm h-auto"
    >
      {/* edges */}
      {NODES.map((n, i) => (
        <line
          key={`e${i}`}
          x1={cx}
          y1={cy}
          x2={n.pos[0]}
          y2={n.pos[1]}
          stroke="#2a2a2a"
          strokeWidth="1"
        />
      ))}

      {/* signal pulses — travel out to each node and back, staggered */}
      {!reduced &&
        NODES.map((n, i) => (
          <circle key={`p${i}`} r="2.6" fill="#4ade80">
            <animate
              attributeName="cx"
              values={`${cx};${n.pos[0]};${cx}`}
              keyTimes="0;0.5;1"
              dur={`${DUR}s`}
              begin={`${i * 0.55}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="cy"
              values={`${cy};${n.pos[1]};${cy}`}
              keyTimes="0;0.5;1"
              dur={`${DUR}s`}
              begin={`${i * 0.55}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              keyTimes="0;0.15;0.85;1"
              dur={`${DUR}s`}
              begin={`${i * 0.55}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}

      {/* tool / memory / knowledge nodes */}
      {NODES.map((n, i) => (
        <g key={`n${i}`}>
          <circle cx={n.pos[0]} cy={n.pos[1]} r="6" fill="#111111" stroke="#9ca3af" strokeWidth="1.25" />
          <text
            x={n.label[0]}
            y={n.label[1]}
            textAnchor="middle"
            fontSize="7.5"
            letterSpacing="1.5"
            fill="#6b7280"
            style={{ textTransform: "uppercase", fontFamily: "inherit" }}
          >
            {n.text}
          </text>
        </g>
      ))}

      {/* radar ping from the core */}
      {!reduced && (
        <circle cx={cx} cy={cy} fill="none" stroke="#4ade80" strokeWidth="1">
          <animate attributeName="r" values="16;30" dur="2.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0" dur="2.6s" repeatCount="indefinite" />
        </circle>
      )}

      {/* rotating orbit ring */}
      {!reduced && (
        <circle cx={cx} cy={cy} r="22" fill="none" stroke="#2a2a2a" strokeWidth="1" strokeDasharray="3 5">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`0 ${cx} ${cy}`}
            to={`360 ${cx} ${cy}`}
            dur="14s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* agent core */}
      <rect x={cx - 28} y={cy - 12} width="56" height="24" rx="12" fill="#111111" stroke="#4ade80" strokeWidth="1.5" />
      <text
        x={cx}
        y={cy + 3}
        textAnchor="middle"
        fontSize="9"
        letterSpacing="2.5"
        fill="#e8e3dc"
        fontWeight="700"
        style={{ textTransform: "uppercase", fontFamily: "inherit" }}
      >
        Agent
      </text>
    </svg>
  );
};

export default AgentGraph;
