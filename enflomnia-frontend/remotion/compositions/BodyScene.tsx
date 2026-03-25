import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

interface BodySceneProps {
  section: string;
  content: string;
  tips?: string;
  durationSeconds: number;
  index: number;
  tone: string;
}

const TONE_COLORS: Record<string, { bg: string; accent: string; secondary: string }> = {
  entertaining: { bg: "#0f0f0f", accent: "#f59e0b", secondary: "#7c3aed" },
  educational: { bg: "#0c1222", accent: "#3b82f6", secondary: "#06b6d4" },
  inspiring: { bg: "#0f0d1a", accent: "#a855f7", secondary: "#ec4899" },
};

export const BodyScene: React.FC<BodySceneProps> = ({
  section,
  content,
  tips,
  durationSeconds,
  index,
  tone,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const colors = TONE_COLORS[tone] || TONE_COLORS.entertaining;

  // Slide in from right
  const slideX = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 70 },
  });
  const translateX = interpolate(slideX, [0, 1], [200, 0]);

  // Fade in
  const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  // Section label slide
  const labelSlide = spring({
    frame: frame - 3,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  // Tips fade in later
  const tipsOpacity = interpolate(frame, [20, 30], [0, 1], { extrapolateRight: "clamp" });

  // Progress bar
  const totalFrames = durationSeconds * fps;
  const progress = interpolate(frame, [0, totalFrames], [0, 100], { extrapolateRight: "clamp" });

  // Timestamp
  const currentSec = Math.floor(frame / fps);
  const timestamp = `00:${String(currentSec).padStart(2, "0")}`;

  return (
    <div
      style={{
        width,
        height,
        background: `linear-gradient(${interpolate(frame, [0, 90], [180, 0])}deg, ${colors.bg}, ${colors.secondary})`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 40px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Dynamic noise overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.05,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Progress bar at the top instead of side */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: 6,
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${colors.accent}, white)`,
          boxShadow: `0 0 10px ${colors.accent}`,
          transition: "width 0.3s",
          zIndex: 10,
        }}
      />

      {/* Text Container */}
      <div
        style={{
          opacity,
          transform: `translateX(${translateX * 0.5}px) translateY(-50px)`,
          backgroundColor: "rgba(0, 0, 0, 0.65)",
          padding: "32px 40px",
          borderRadius: "24px",
          border: `1px solid rgba(255,255,255,0.1)`,
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          backdropFilter: "blur(12px)",
          maxWidth: "85%",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
           <span
             style={{
               fontSize: 16,
               fontWeight: 900,
               color: colors.bg,
               backgroundColor: colors.accent,
               padding: "4px 12px",
               borderRadius: "8px",
               textTransform: "uppercase",
               fontFamily: "'Inter', sans-serif",
             }}
           >
             Step {index + 1}
           </span>
           <h2
             style={{
               fontSize: 32,
               fontWeight: 900,
               color: colors.accent,
               margin: 0,
               fontFamily: "'Inter', sans-serif",
               letterSpacing: "-0.01em",
             }}
           >
             {section}
           </h2>
        </div>

        <p
          style={{
            fontSize: 42,
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.3,
            fontFamily: "'Inter', sans-serif",
            margin: 0,
            textShadow: "0 2px 10px rgba(0,0,0,0.3)",
          }}
        >
          {content}
        </p>

        {tips && (
          <div
            style={{
              opacity: tipsOpacity,
              marginTop: 16,
              padding: "16px 20px",
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.1)",
              borderLeft: `4px solid ${colors.secondary}`,
            }}
          >
            <p
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: "#e5e5e5",
                fontStyle: "italic",
                fontFamily: "'Inter', sans-serif",
                margin: 0,
              }}
            >
              <span style={{ color: colors.secondary, marginRight: "8px" }}>💡 Tip:</span>
              {tips}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
