import React from "react"

export const SketchStarIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block" style={{ verticalAlign: "-3px" }}>
    <defs>
      <filter id="xkcdify-star" filterUnits="userSpaceOnUse" x="-2" y="-2" width="28" height="28">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" result="noise" />
        <feDisplacementMap scale="3" xChannelSelector="R" yChannelSelector="G" in="SourceGraphic" in2="noise" />
      </filter>
    </defs>
    <g filter="url(#xkcdify-star)">
      <path
        d="M12 2L14.9 8.6L22 9.3L16.8 14L18.2 21L12 17.3L5.8 21L7.2 14L2 9.3L9.1 8.6Z"
        fill="#facc15"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
)

export const SketchExternalLinkIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
    <defs>
      <filter id="xkcdify-extlink" filterUnits="userSpaceOnUse" x="-2" y="-2" width="28" height="28">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" result="noise" />
        <feDisplacementMap scale="3" xChannelSelector="R" yChannelSelector="G" in="SourceGraphic" in2="noise" />
      </filter>
    </defs>
    <g filter="url(#xkcdify-extlink)">
      {/* Box (bottom-left portion) */}
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Arrow */}
      <path d="M13 3h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 3L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>
)
