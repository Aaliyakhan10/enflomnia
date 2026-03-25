import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

interface CTASceneProps {
  cta: string;
  tone: string;
}

const TONE_COLORS: Record<string, { bg: string; accent: string; gradient: string }> = {
  entertaining: {
    bg: "#0f0f0f",
    accent: "#f59e0b",
    gradient: "linear-gradient(135deg, #f59e0b, #ef4444)",
  },
  educational: {
    bg: "#0c1222",
    accent: "#3b82f6",
    gradient: "linear-gradient(135deg, #3b82f6, #06b6d4)",
  },
  inspiring: {
    bg: "#0f0d1a",
    accent: "#a855f7",
    gradient: "linear-gradient(135deg, #a855f7, #ec4899)",
  },
};

export const CTAScene: React.FC<CTASceneProps> = ({ cta, tone }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const colors = TONE_COLORS[tone] || TONE_COLORS.entertaining;

  // Bounce in
  const bounceScale = spring({
    frame,
    fps,
    config: { damping: 8, stiffness: 100, mass: 0.8 },
  });

  const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  // Gradient wipe
  const wipeProgress = interpolate(frame, [0, 20], [0, 100], { extrapolateRight: "clamp" });

  // Pulse ring
  const pulseScale = interpolate(frame % 60, [0, 30, 60], [1, 1.3, 1]);
  const pulseOpacity = interpolate(frame % 60, [0, 30, 60], [0.5, 0, 0.5]);

  return (
    <div
      style={{
        width,
        height,
        background: `linear-gradient(${interpolate(frame, [0, 90], [90, 270])}deg, ${colors.bg}, ${colors.accent})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Dynamic noise overlay for texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.05,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Pulsing background glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.bg} 0%, transparent 70%)`,
          opacity: pulseOpacity + 0.5,
        }}
      />

      {/* "Your Move" label */}
      <div
        style={{
          opacity: interpolate(frame, [5, 15], [0, 1], { extrapolateRight: "clamp" }),
          transform: `translateY(-30px)`,
          marginBottom: 16,
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: "0.25em",
            textTransform: "uppercase" as const,
            color: "#ffffff",
            fontFamily: "'Inter', sans-serif",
            textShadow: "0 2px 10px rgba(0,0,0,0.5)",
          }}
        >
          Your Move
        </span>
      </div>

      {/* CTA Text Box */}
      <div
        style={{
          transform: `scale(${bounceScale}) translateY(-30px)`,
          opacity,
          textAlign: "center",
          maxWidth: "85%",
          backgroundColor: "#ffffff",
          padding: "24px 32px",
          borderRadius: "16px",
          boxShadow: `0 10px 40px rgba(0,0,0,0.4)`,
          zIndex: 10,
        }}
      >
        <p
          style={{
            fontSize: 52,
            fontWeight: 900,
            color: colors.bg,
            lineHeight: 1.2,
            fontFamily: "'Inter', sans-serif",
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          {cta}
        </p>
      </div>

      {/* Follow arrow hint */}
      <div
        style={{
          position: "absolute",
          right: 32,
          top: "50%",
          transform: `translateY(-50%)`,
          opacity: interpolate(frame, [15, 30], [0, 1], { extrapolateRight: "clamp" }),
          zIndex: 10,
        }}
      >
        <div style={{ fontSize: 48, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))", animation: "bounceRight 1s infinite alternate" }}>
           👉
        </div>
      </div>
    </div>
  );
};
