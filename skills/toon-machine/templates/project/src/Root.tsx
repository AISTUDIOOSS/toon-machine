import React from "react";
import { Composition } from "remotion";
import { RatatouilleShort, RATATOUILLE_FRAMES } from "./videos/ratatouille/Ratatouille";
// one <Composition> per short; 1080x1920 vertical, 30 fps
export const Root: React.FC = () => (
  <>
    <Composition id="RatatouilleShort" component={RatatouilleShort} durationInFrames={RATATOUILLE_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
