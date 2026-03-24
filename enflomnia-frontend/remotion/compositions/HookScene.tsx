import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig, Easing } from "remotion";

interface HookSceneProps {
  hook: string;
  tone: string;
}

const TONE_COLORS: Record<string, { bg: string; accent: string; text: string }> = {
  entertaining: { bg: "#0f0f0f", accent: "#f59e0b", text: "#ffffff" },
  educational: { bg: "#0c1222", accent: "#3b82f6", text: "#ffffff" },
  inspiring: { bg: "#0f0d1a", accent: "#a855f7", text: "#ffffff" },
};

export const HookScene: React.FC<HookSceneProps> = ({ hook, tone }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const colors = TONE_COLORS[tone] || TONE_COLORS.entertaining;

  // Punch-in zoom
  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });

  // Fade in
  const opacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  // Accent line width animation
  const lineWidth = spring({ frame: frame - 5, fps, config: { damping: 15, stiffness: 60 } });

  // Subtle grain shimmer
  const shimmer = interpolate(frame, [0, 30, 60, 90], [0, 0.03, 0, 0.03], {
    extrapolateRight: "clamp",
  });

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
      {/* Background radial glow */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.accent}22 0%, transparent 70%)`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          opacity: shimmer + 0.6,
        }}
      />

      {/* Accent line */}
      <div
        style={{
          width: interpolate(lineWidth, [0, 1], [0, 120]),
          height: 4,
          backgroundColor: colors.accent,
          borderRadius: 2,
          marginBottom: 40,
          opacity,
        }}
      />

      {/* Hook text */}
      <div
        style={{
          transform: `scale(${scale})`,
          opacity,
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: colors.text,
            lineHeight: 1.1,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            letterSpacing: "-0.02em",
            textShadow: `0 4px 30px ${colors.accent}44`,
          }}
        >
          {hook}
        </p>
      </div>

      {/* Bottom accent dot */}
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: colors.accent,
          marginTop: 50,
          opacity: interpolate(frame, [15, 25], [0, 1], { extrapolateRight: "clamp" }),
        }}
      />

      {/* Corner timestamp */}
      <p
        style={{
          position: "absolute",
          bottom: 40,
          right: 50,
          fontSize: 14,
          fontWeight: 700,
          color: `${colors.accent}88`,
          fontFamily: "'SF Mono', 'Fira Code', monospace",
          letterSpacing: "0.1em",
          opacity: interpolate(frame, [20, 30], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        00:00
      </p>
    </div>
  );
};
