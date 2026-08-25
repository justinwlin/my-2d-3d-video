import { ThreeCanvas } from "@remotion/three";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const HybridScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // 3D rotation driven by Remotion frame
  const rotationY = interpolate(frame, [0, 150], [0, Math.PI * 2]);

  // 2D UI entrance animation
  const titleScale = spring({ frame, fps, config: { damping: 12 } });

  return (
    <div className="relative w-full h-full bg-slate-950 flex items-center justify-center">
      {/* 3D Scene Layer */}
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [0, 0, 5], fov: 60 }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} />
        <mesh rotation={[0.4, rotationY, 0]}>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial
            color="#6366f1"
            roughness={0.3}
            metalness={0.2}
          />
        </mesh>
      </ThreeCanvas>

      {/* 2D Overlay Layer */}
      <div
        className="absolute top-16 left-16 text-white font-mono"
        style={{ transform: `scale(${titleScale})` }}
      >
        <h1 className="text-5xl font-extrabold tracking-tight">SYSTEM HYBRID</h1>
        <p className="text-slate-400 mt-2 text-xl">Frame: {frame}</p>
      </div>
    </div>
  );
};
