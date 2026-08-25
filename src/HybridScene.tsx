import { PerspectiveCamera } from "@react-three/drei";
import { ThreeCanvas } from "@remotion/three";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { OldMan } from "./OldMan";

export const HybridScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  // One full revolution over the composition, so the orbit loops seamlessly.
  const orbit = interpolate(frame, [0, durationInFrames], [0, Math.PI * 2]);

  const titleScale = spring({ frame, fps, config: { damping: 12 } });

  return (
    <div className="relative w-full h-full bg-slate-950 flex items-center justify-center">
      <ThreeCanvas width={width} height={height}>
        {/* Orbiting the camera rather than the model keeps the lighting fixed. */}
        <group rotation-y={orbit}>
          <PerspectiveCamera
            makeDefault
            fov={40}
            position={[0, 0.35, 3.6]}
            rotation={[-0.1, 0, 0]}
          />
        </group>

        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 6, 4]} intensity={2.2} />
        <directionalLight
          position={[-5, 2, -3]}
          intensity={0.8}
          color="#6366f1"
        />

        <OldMan />
      </ThreeCanvas>

      <div
        className="absolute top-16 left-16 text-white font-mono"
        style={{ transform: `scale(${titleScale})` }}
      >
        <h1 className="text-5xl font-extrabold tracking-tight">
          SYSTEM HYBRID
        </h1>
        <p className="text-slate-400 mt-2 text-xl">Frame: {frame}</p>
      </div>
    </div>
  );
};
