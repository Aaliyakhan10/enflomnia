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
        backgroundColor: colors.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 80,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background gradient stripe */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 6,
          height: `${progress}%`,
          background: `linear-gradient(180deg, ${colors.accent}, ${colors.secondary})`,
          transition: "height 0.3s",
        }}
      />

      {/* Section number */}
      <div
        style={{
          opacity: interpolate(labelSlide, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(labelSlide, [0, 1], [-20, 0])}px)`,
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: colors.accent,
            letterSpacing: "0.2em",
            textTransform: "uppercase" as const,
            fontFamily: "'SF Mono', 'Fira Code', monospace",
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      {/* Section title */}
      <div
        style={{
          opacity,
          transform: `translateX(${translateX}px)`,
          marginBottom: 28,
        }}
      >
        <h2
          style={{
            fontSize: 36,
            fontWeight: 900,
            color: "#ffffff",
            lineHeight: 1.2,
            fontFamily: "'Inter', sans-serif",
            letterSpacing: "-0.01em",
          }}
        >
          {section}
        </h2>
      </div>

      {/* Content */}
      <div
        style={{
          opacity,
          transform: `translateX(${translateX * 0.7}px)`,
        }}
      >
        <p
          style={{
            fontSize: 28,
            fontWeight: 500,
            color: "#e5e5e5",
            lineHeight: 1.5,
            fontFamily: "'Inter', sans-serif",
            maxWidth: 850,
          }}
        >
          {content}
        </p>
      </div>

      {/* Tips */}
      {tips && (
        <div
          style={{
            opacity: tipsOpacity,
            marginTop: 40,
            padding: "16px 24px",
            borderRadius: 16,
            backgroundColor: `${colors.accent}15`,
            borderLeft: `3px solid ${colors.accent}`,
          }}
        >
          <p
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: colors.accent,
              fontStyle: "italic",
              fontFamily: "'Inter', sans-serif",
              lineHeight: 1.5,
            }}
          >
            💡 {tips}
          </p>
        </div>
      )}

      {/* Duration badge */}
      <div
        style={{
          position: "absolute",
          top: 50,
          right: 50,
          padding: "8px 16px",
          borderRadius: 24,
          backgroundColor: `${colors.accent}20`,
          border: `1px solid ${colors.accent}40`,
          opacity: interpolate(frame, [5, 12], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: colors.accent,
            fontFamily: "'SF Mono', monospace",
          }}
        >
          {durationSeconds}s
        </span>
      </div>

      {/* Timestamp */}
      <p
        style={{
          position: "absolute",
          bottom: 40,
          right: 50,
          fontSize: 14,
          fontWeight: 700,
          color: `${colors.accent}88`,
          fontFamily: "'SF Mono', monospace",
          letterSpacing: "0.1em",
        }}
      >
        {timestamp}
      </p>
    </div>
  );
};
