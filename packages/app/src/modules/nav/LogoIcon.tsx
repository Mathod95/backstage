// Brand color of the logo (emerald), see docs/backstage/personnalisation/reglages.md
export const LOGO_COLOR = '#10b981';

// Terminal window with a prompt, drawn in a 40x40 box
export const LogoIconShapes = () => (
  <>
    <rect
      x="2"
      y="4"
      width="36"
      height="32"
      rx="7"
      fill="none"
      stroke={LOGO_COLOR}
      strokeWidth="2.6"
    />
    <polyline
      points="10,14 16,20 10,26"
      fill="none"
      stroke={LOGO_COLOR}
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="19"
      y1="27"
      x2="30"
      y2="27"
      stroke={LOGO_COLOR}
      strokeWidth="2.8"
      strokeLinecap="round"
    />
  </>
);

export const LogoIcon = () => (
  <svg
    width={28}
    height={28}
    viewBox="0 0 40 40"
    role="img"
    aria-label="mathod"
  >
    <LogoIconShapes />
  </svg>
);
