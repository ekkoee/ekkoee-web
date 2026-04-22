export default function GearLogo() {
  return (
    <svg
      className="gear-logo"
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* connecting lines */}
      <line x1="100" y1="100" x2="58" y2="58" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
      <line x1="100" y1="100" x2="148" y2="46" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
      <line x1="100" y1="100" x2="50" y2="170" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
      <line x1="100" y1="100" x2="176" y2="138" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.9" />

      {/* gear */}
      <g className="gear-spin">
        {/* teeth (8 stubs) */}
        <line x1="100" y1="64" x2="100" y2="56" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
        <line x1="125" y1="75" x2="130.7" y2="69.3" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
        <line x1="136" y1="100" x2="144" y2="100" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
        <line x1="125" y1="125" x2="130.7" y2="130.7" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
        <line x1="100" y1="136" x2="100" y2="144" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
        <line x1="75" y1="125" x2="69.3" y2="130.7" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
        <line x1="64" y1="100" x2="56" y2="100" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
        <line x1="75" y1="75" x2="69.3" y2="69.3" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
        {/* ring */}
        <circle cx="100" cy="100" r="24" fill="none" stroke="currentColor" strokeWidth="7" />
        {/* hub */}
        <circle cx="100" cy="100" r="5" fill="currentColor" />
      </g>

      {/* nodes */}
      <circle className="node-pulse" cx="58" cy="58" r="10" fill="currentColor" />
      <circle className="node-pulse node-pulse-2" cx="148" cy="46" r="14" fill="currentColor" />
      <circle className="node-pulse node-pulse-3" cx="50" cy="170" r="18" fill="currentColor" />
      <circle className="node-pulse node-pulse-4" cx="176" cy="138" r="20" fill="currentColor" />
    </svg>
  );
}
