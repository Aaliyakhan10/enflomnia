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
        background: `linear-gradient(${interpolate(frame, [0, 90], [0, 180])}deg, ${colors.bg}, ${colors.accent})`,
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
          opacity: shimmer + 0.05,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Hook text in a TikTok-style sticker block */}
      <div
        style={{
          transform: `scale(${scale}) translateY(-40px)`,
          opacity,
          textAlign: "center",
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          padding: "24px 32px",
          borderRadius: "16px",
          border: `2px solid ${colors.accent}`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.5)`,
          maxWidth: "85%",
          backdropFilter: "blur(10px)",
        }}
      >
        <p
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: colors.text,
            lineHeight: 1.2,
            fontFamily: "'Inter', sans-serif",
            textTransform: "uppercase",
            textShadow: `2px 2px 0px ${colors.bg}`,
            margin: 0,
          }}
        >
          {hook}
        </p>
      </div>
    </div>
  );
};
