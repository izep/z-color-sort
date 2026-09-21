import React from 'react';
import './LiquidStream.css';

interface LiquidStreamProps {
  fromRect: DOMRect;
  toRect: DOMRect;
  containerRect: DOMRect;
  color: string;
  direction: 'left' | 'right';
}

const LiquidStream: React.FC<LiquidStreamProps> = ({
  toRect,
  containerRect,
  color,
  direction
}) => {
  // Spout position is right above destination tube's mouth
  const isRight = direction === 'right';
  const targetCenterX = toRect.left + toRect.width / 2 - containerRect.left;
  const targetTopY = toRect.top - containerRect.top;

  const spoutX = targetCenterX + (isRight ? -18 : 18);
  const spoutY = targetTopY - 26;
  const entryX = targetCenterX;
  const entryY = targetTopY + 12;

  // Bezier curve path connecting the spout to the tube entry
  const ctrl1X = spoutX + (isRight ? 6 : -6);
  const ctrl1Y = spoutY + 12;
  const ctrl2X = entryX;
  const ctrl2Y = entryY - 8;

  const pathD = `M ${spoutX} ${spoutY} C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${entryX} ${entryY}`;

  return (
    <div 
      className="liquid-stream-container" 
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 95
      }}
    >
      <svg className="liquid-stream-svg" width="100%" height="100%">
        <defs>
          <linearGradient id="streamGloss" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0.6" />
            <stop offset="30%" stopColor={color} stopOpacity="0.95" />
            <stop offset="100%" stopColor={color} stopOpacity="0.8" />
          </linearGradient>
          <filter id="streamGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Thick main stream */}
        <path
          d={pathD}
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          className="stream-path-main"
          filter="url(#streamGlow)"
        />

        {/* Shiny highlight stream core */}
        <path
          d={pathD}
          stroke="url(#streamGloss)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          className="stream-path-core"
        />
      </svg>

      {/* Splash impact ripple & droplets at destination mouth */}
      <div 
        className="splash-zone"
        style={{
          position: 'absolute',
          left: `${entryX}px`,
          top: `${entryY}px`
        }}
      >
        <div className="splash-ripple" style={{ borderColor: color }} />
        <div className="splash-droplet d1" style={{ backgroundColor: color }} />
        <div className="splash-droplet d2" style={{ backgroundColor: color }} />
        <div className="splash-droplet d3" style={{ backgroundColor: color }} />
      </div>
    </div>
  );
};

export default LiquidStream;
