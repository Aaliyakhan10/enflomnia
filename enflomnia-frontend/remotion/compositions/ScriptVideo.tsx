import React from "react";
import { Sequence, useVideoConfig } from "remotion";
import { HookScene } from "./HookScene";
import { BodyScene } from "./BodyScene";
import { CTAScene } from "./CTAScene";

export interface ScriptSection {
  section: string;
  content: string;
  tips?: string;
  duration_seconds?: number;
}

export interface ScriptVideoProps {
  hook: string;
  structure: ScriptSection[];
  cta: string;
  tone: string;
}

/**
 * Main Remotion composition for Enflomnia Script Videos.
 * Orchestrates: HookScene → BodyScenes → CTAScene
 *
 * Each scene is wrapped in a <Sequence> with frame-level timing.
 * Duration defaults: Hook=3s, each body section uses its duration_seconds, CTA=5s.
 */
export const ScriptVideo: React.FC<ScriptVideoProps> = ({
  hook,
  structure,
  cta,
  tone,
}) => {
  const { fps } = useVideoConfig();

  const HOOK_DURATION_S = 3;
  const CTA_DURATION_S = 5;
  const DEFAULT_BODY_DURATION_S = 8;

  // Calculate frame offsets
  const hookFrames = HOOK_DURATION_S * fps;
  let currentFrame = hookFrames;

  const bodySegments = (structure || []).map((section, index) => {
    const durationS = section.duration_seconds || DEFAULT_BODY_DURATION_S;
    const frames = durationS * fps;
    const startFrame = currentFrame;
    currentFrame += frames;
    return { ...section, startFrame, frames, durationS, index };
  });

  const ctaStartFrame = currentFrame;
  const ctaFrames = CTA_DURATION_S * fps;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Hook Scene */}
      <Sequence from={0} durationInFrames={hookFrames} name="Hook">
        <HookScene hook={hook || "Your Story Starts Here"} tone={tone} />
      </Sequence>

      {/* Body Scenes */}
      {bodySegments.map((seg) => (
        <Sequence
          key={seg.index}
          from={seg.startFrame}
          durationInFrames={seg.frames}
          name={seg.section}
        >
          <BodyScene
            section={seg.section}
            content={seg.content}
            tips={seg.tips}
            durationSeconds={seg.durationS}
            index={seg.index}
            tone={tone}
          />
        </Sequence>
      ))}

      {/* CTA Scene */}
      <Sequence from={ctaStartFrame} durationInFrames={ctaFrames} name="CTA">
        <CTAScene cta={cta || "Follow for more!"} tone={tone} />
      </Sequence>
    </div>
  );
};

/**
 * Utility: calculate the total duration in frames for a script.
 */
export function calculateTotalFrames(
  structure: ScriptSection[],
  fps: number = 30
): number {
  const HOOK_S = 3;
  const CTA_S = 5;
  const DEFAULT_BODY_S = 8;

  const bodyTotal = (structure || []).reduce(
    (acc, s) => acc + (s.duration_seconds || DEFAULT_BODY_S),
    0
  );

  return (HOOK_S + bodyTotal + CTA_S) * fps;
}
