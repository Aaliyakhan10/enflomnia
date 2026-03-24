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
        backgroundColor: colors.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Gradient backlight */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.accent}20 0%, transparent 60%)`,
          opacity: 0.8,
        }}
      />

      {/* Pulsing ring */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          border: `2px solid ${colors.accent}`,
          transform: `translate(-50%, -50%) scale(${pulseScale})`,
          opacity: pulseOpacity,
        }}
      />

      {/* "Your Move" label */}
      <div
        style={{
          opacity: interpolate(frame, [5, 15], [0, 1], { extrapolateRight: "clamp" }),
          marginBottom: 24,
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: "0.25em",
            textTransform: "uppercase" as const,
            background: colors.gradient,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontFamily: "'SF Mono', monospace",
          }}
        >
          YOUR MOVE
        </span>
      </div>

      {/* CTA Text */}
      <div
        style={{
          transform: `scale(${bounceScale})`,
          opacity,
          textAlign: "center",
          maxWidth: 800,
        }}
      >
        <p
          style={{
            fontSize: 52,
            fontWeight: 900,
            color: "#ffffff",
            lineHeight: 1.2,
            fontFamily: "'Inter', sans-serif",
            letterSpacing: "-0.02em",
          }}
        >
          {cta}
        </p>
      </div>

      {/* Gradient accent bar */}
      <div
        style={{
          width: interpolate(wipeProgress, [0, 100], [0, 200]),
          height: 4,
          background: colors.gradient,
          borderRadius: 2,
          marginTop: 40,
          opacity,
        }}
      />

      {/* Branding */}
      <p
        style={{
          position: "absolute",
          bottom: 50,
          fontSize: 14,
          fontWeight: 700,
          color: `${colors.accent}66`,
          fontFamily: "'Inter', sans-serif",
          letterSpacing: "0.15em",
          textTransform: "uppercase" as const,
          opacity: interpolate(frame, [20, 35], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        ENFLOMNIA
      </p>
    </div>
  );
};
