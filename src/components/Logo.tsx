interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: { icon: 36, textMain: 20, textSub: 7.5 },
  md: { icon: 48, textMain: 26, textSub: 9.5 },
  lg: { icon: 64, textMain: 34, textSub: 12 },
};

export default function Logo({ size = "md", className = "" }: LogoProps) {
  const s = sizes[size];
  const iconW = s.icon;
  const iconH = s.icon;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* ICON */}
      <svg
        width={iconW}
        height={iconH}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle */}
        <circle cx="32" cy="32" r="32" fill="#221733" />

        {/* Radar arcs */}
        <circle cx="32" cy="32" r="22" stroke="#4e4161" strokeWidth="1.2" fill="none" />
        <circle cx="32" cy="32" r="14" stroke="#4e4161" strokeWidth="1" fill="none" />
        <circle cx="32" cy="32" r="6" stroke="#4e4161" strokeWidth="0.8" fill="none" />

        {/* Cross lines */}
        <line x1="10" y1="32" x2="54" y2="32" stroke="#4e4161" strokeWidth="0.8" />
        <line x1="32" y1="10" x2="32" y2="54" stroke="#4e4161" strokeWidth="0.8" />

        {/* Radar sweep — orange wedge */}
        <path
          d="M32 32 L32 10 A22 22 0 0 1 54 32 Z"
          fill="#5E17EB"
          opacity="0.18"
        />
        <line x1="32" y1="32" x2="54" y2="32" stroke="#5E17EB" strokeWidth="1.5" opacity="0.6" />
        <line x1="32" y1="32" x2="32" y2="10" stroke="#5E17EB" strokeWidth="1.5" opacity="0.6" />

        {/* Sweep tip dot */}
        <circle cx="54" cy="32" r="2.2" fill="#5E17EB" />

        {/* Gavel handle */}
        <rect
          x="33"
          y="33"
          width="14"
          height="4"
          rx="2"
          fill="#5E17EB"
          transform="rotate(45 40 35)"
        />

        {/* Gavel head */}
        <rect
          x="16"
          y="20"
          width="14"
          height="7"
          rx="2"
          fill="#f4ecff"
          transform="rotate(45 23 23.5)"
        />

        {/* Center dot */}
        <circle cx="32" cy="32" r="2.5" fill="#5E17EB" />

        {/* Ping dot (signal) */}
        <circle cx="50" cy="18" r="3" fill="#5E17EB" opacity="0.9" />
        <circle cx="50" cy="18" r="5.5" stroke="#5E17EB" strokeWidth="1" fill="none" opacity="0.4" />
      </svg>

      {/* TEXT */}
      <div className="flex flex-col leading-none">
        <span
          style={{ fontSize: s.textMain, fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}
          className="font-black text-[#171222]"
        >
          RADAR
        </span>
        <span
          style={{ fontSize: s.textSub, letterSpacing: "0.22em" }}
          className="mt-0.5 font-semibold text-[#5b4f73]"
        >
          LEILOES AUTO
        </span>
      </div>
    </div>
  );
}
