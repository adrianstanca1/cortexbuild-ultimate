import React from 'react';

// Generate SVG data URIs for repeating grid patterns
const BASE_GRID_SIZE = 40;
const MICRO_GRID_SIZE = 8;
const ACCENT_GRID_SIZE = 200;

function makeGridSVG(size: number, color: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>
    <rect width='${size}' height='${size}' fill='none'/>
    <path d='M ${size} 0 L 0 0 0 ${size}' fill='none' stroke='${color}' stroke-width='1'/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const baseGridBg = makeGridSVG(BASE_GRID_SIZE, 'rgba(59,83,120,0.08)');
const microGridBg = makeGridSVG(MICRO_GRID_SIZE, 'rgba(59,83,120,0.04)');
const accentGridBg = makeGridSVG(ACCENT_GRID_SIZE, 'rgba(245,158,11,0.04)');

interface CrosshairProps {
  size?: number;
}

function CornerCrosshair({ size = 60 }: CrosshairProps) {
  const color = 'rgba(245,158,11,0.5)';
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block' }}
    >
      {/* Outer circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 4}
        fill="none"
        stroke={color}
        strokeWidth="1"
      />
      {/* Inner circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 4}
        fill="none"
        stroke={color}
        strokeWidth="0.5"
      />
      {/* Horizontal line */}
      <line
        x1="4"
        y1={size / 2}
        x2={size - 4}
        y2={size / 2}
        stroke={color}
        strokeWidth="1"
      />
      {/* Vertical line */}
      <line
        x1={size / 2}
        y1="4"
        x2={size / 2}
        y2={size - 4}
        stroke={color}
        strokeWidth="1"
      />
      {/* Center dot */}
      <circle cx={size / 2} cy={size / 2} r="2" fill={color} />
    </svg>
  );
}

interface RulerMarkProps {
  x: number;
  y: number;
  label?: string;
  isMajor?: boolean;
}

function RulerMark({ x, y, label, isMajor }: RulerMarkProps) {
  const markLength = isMajor ? 12 : 6;
  return (
    <g>
      <line
        x1={x}
        y1={y}
        x2={x}
        y2={y + markLength}
        stroke="rgba(245,158,11,0.4)"
        strokeWidth={isMajor ? 1 : 0.5}
      />
      {label && isMajor && (
        <text
          x={x}
          y={y + 22}
          textAnchor="middle"
          fill="rgba(245,158,11,0.6)"
          fontSize="8"
          fontFamily="JetBrains Mono, monospace"
        >
          {label}
        </text>
      )}
    </g>
  );
}

function HorizontalRuler() {
  const marks = [];
  for (let i = 0; i <= 2000; i += 50) {
    marks.push(
      <RulerMark
        key={i}
        x={i}
        y={0}
        label={String(i)}
        isMajor={i % 100 === 0}
      />
    );
  }
  return (
    <svg
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: 40,
        overflow: 'visible',
      }}
    >
      <rect
        x="0"
        y="0"
        width="100%"
        height="40"
        fill="rgba(12,18,32,0.6)"
      />
      {marks}
    </svg>
  );
}

function VerticalRuler() {
  const marks = [];
  for (let i = 0; i <= 2000; i += 50) {
    marks.push(
      <RulerMark
        key={i}
        x={0}
        y={i}
        label={String(i)}
        isMajor={i % 100 === 0}
      />
    );
  }
  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 40,
        height: '100%',
        overflow: 'visible',
      }}
    >
      <rect
        x="0"
        y="0"
        width="40"
        height="100%"
        fill="rgba(12,18,32,0.6)"
      />
      {marks}
    </svg>
  );
}

interface AnnotationProps {
  text: string;
  position: { top?: string; bottom?: string; left?: string; right?: string };
  driftRange?: { x?: number; y?: number };
  delay?: number;
}

function FloatingAnnotation({
  text,
  position,
  driftRange = { x: 20, y: 20 },
  delay = 0,
}: AnnotationProps) {
  return (
    <div
      style={{
        position: 'absolute',
        ...position,
        animation: `annotationDrift-${text.replace(/[^a-zA-Z]/g, '')} ${45 + Math.random() * 20}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        willChange: 'transform',
      }}
    >
      <svg width="120" height="32" viewBox="0 0 120 32">
        <rect
          x="0"
          y="0"
          width="120"
          height="32"
          fill="rgba(12,18,32,0.7)"
          stroke="rgba(245,158,11,0.3)"
          strokeWidth="1"
          rx="2"
        />
        <text
          x="60"
          y="21"
          textAnchor="middle"
          fill="rgba(245,158,11,0.8)"
          fontSize="11"
          fontFamily="JetBrains Mono, monospace"
          fontWeight="500"
        >
          {text}
        </text>
      </svg>
    </div>
  );
}

export function BlueprintBackground({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        backgroundColor: '#0c1220',
      }}
    >
      {/* Grid layers */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: microGridBg,
          backgroundSize: `${MICRO_GRID_SIZE}px ${MICRO_GRID_SIZE}px`,
          opacity: 1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: baseGridBg,
          backgroundSize: `${BASE_GRID_SIZE}px ${BASE_GRID_SIZE}px`,
          opacity: 1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: accentGridBg,
          backgroundSize: `${ACCENT_GRID_SIZE}px ${ACCENT_GRID_SIZE}px`,
          opacity: 1,
        }}
      />

      {/* Vignette overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, transparent 30%, rgba(12,18,32,0.7) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Measurement rulers */}
      <VerticalRuler />
      <HorizontalRuler />

      {/* Corner crosshairs */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          animation: 'gentlePulse 4s ease-in-out infinite',
        }}
      >
        <CornerCrosshair />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          animation: 'gentlePulse 4s ease-in-out infinite',
          animationDelay: '1s',
        }}
      >
        <CornerCrosshair />
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: 20,
          animation: 'gentlePulse 4s ease-in-out infinite',
          animationDelay: '2s',
        }}
      >
        <CornerCrosshair />
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          right: 20,
          animation: 'gentlePulse 4s ease-in-out infinite',
          animationDelay: '3s',
        }}
      >
        <CornerCrosshair />
      </div>

      {/* Animated scan line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '2px',
          background:
            'linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.1) 10%, rgba(245,158,11,0.8) 50%, rgba(245,158,11,0.1) 90%, transparent 100%)',
          boxShadow:
            '0 0 20px 5px rgba(245,158,11,0.3), 0 0 40px 10px rgba(245,158,11,0.1)',
          animation: 'scanLine 8s linear infinite',
          willChange: 'transform',
        }}
      />

      {/* Floating annotations */}
      <FloatingAnnotation
        text="FL 01 +3,600"
        position={{ top: '12%', right: '8%' }}
        delay={0}
      />
      <FloatingAnnotation
        text="GRID A-A"
        position={{ bottom: '18%', left: '6%' }}
        delay={5}
      />
      <FloatingAnnotation
        text="BM: 24.500"
        position={{ top: '8%', left: '8%' }}
        delay={10}
      />
      <FloatingAnnotation
        text="ELEV. 00.00"
        position={{ top: '45%', right: '3%' }}
        delay={15}
      />

      {/* CSS Keyframes */}
      <style>{`
        @keyframes scanLine {
          0% {
            transform: translateY(0);
            opacity: 0;
          }
          2% {
            opacity: 1;
          }
          98% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }

        @keyframes gentlePulse {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
        }

        @keyframes annotationDriftFL013600 {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            transform: translate(15px, -10px) rotate(0.5deg);
          }
          50% {
            transform: translate(5px, -20px) rotate(-0.3deg);
          }
          75% {
            transform: translate(-10px, -8px) rotate(0.2deg);
          }
        }

        @keyframes annotationDriftGRIDA {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            transform: translate(-12px, 8px) rotate(-0.4deg);
          }
          50% {
            transform: translate(-5px, 18px) rotate(0.3deg);
          }
          75% {
            transform: translate(10px, 5px) rotate(-0.2deg);
          }
        }

        @keyframes annotationDriftBM24500 {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            transform: translate(-8px, 12px) rotate(0.3deg);
          }
          50% {
            transform: translate(8px, 5px) rotate(-0.2deg);
          }
          75% {
            transform: translate(3px, -10px) rotate(0.4deg);
          }
        }

        @keyframes annotationDriftELEV0000 {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            transform: translate(10px, 15px) rotate(-0.3deg);
          }
          50% {
            transform: translate(-5px, 8px) rotate(0.2deg);
          }
          75% {
            transform: translate(8px, -12px) rotate(-0.4deg);
          }
        }
      `}</style>

      {/* Children wrapper */}
      {children && (
        <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      )}
    </div>
  );
}
