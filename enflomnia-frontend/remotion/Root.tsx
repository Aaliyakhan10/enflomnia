import React from "react";
import { Composition, registerRoot } from "remotion";
import { ScriptVideo } from "./compositions/ScriptVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ScriptVideo"
        component={ScriptVideo as any}
        durationInFrames={300} // Default value, will be overridden by the renderer using inputProps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          hook: "Your Content Starts Here",
          structure: [],
          cta: "Follow for more!",
          tone: "professional"
        }}
      />
    </>
  );
};

registerRoot(RemotionRoot);
