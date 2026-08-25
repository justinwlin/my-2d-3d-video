import { useLoader } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  AnimationMixer,
  Box3,
  Group,
  LoopRepeat,
  Mesh,
  Texture,
  Vector3,
} from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import {
  staticFile,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";

const TARGET_HEIGHT = 1.8;
const ROOT_BONE = "mixamorig:Hips";

/**
 * The rig is hunched forward, so its visual mass sits ahead of the hip bone.
 * Aligning on the hip alone leaves the subject ~77px off center at the side of
 * the orbit; this nudge puts the visual center on the orbit axis. Measured, not
 * derived -- see the silhouette check in the README.
 */
const VISUAL_CENTER_Z = -0.187;

/**
 * Mixamo rig. The FBX ships in centimeters and stands on the origin, so it is
 * rescaled to TARGET_HEIGHT and shifted down by half its height to sit centered.
 */
export const OldMan: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fbx = useLoader(FBXLoader, staticFile("old-man-idle.fbx"));

  // The loader caches per worker, so every frame shares one object. Deriving the
  // mixer from it is fine because we seek to an absolute time rather than advance.
  const { mixer, scale, offset } = useMemo(() => {
    const nextMixer = new AnimationMixer(fbx);
    const clip = fbx.animations[0];
    if (clip) {
      const action = nextMixer.clipAction(clip);
      action.setLoop(LoopRepeat, Infinity);
      action.play();
    }

    // Measure against the posed skeleton, not the raw object.
    nextMixer.setTime(0);
    fbx.updateMatrixWorld(true);

    const box = new Box3().setFromObject(fbx);
    const size = box.getSize(new Vector3());
    const nextScale = size.y === 0 ? 1 : TARGET_HEIGHT / size.y;

    // Height comes from the bounding box, but the horizontal center comes from
    // the hip bone. Box3.setFromObject bounds unposed geometry for skinned
    // meshes, so its X/Z center is wrong -- and this rig rests off the Z axis,
    // which reads as the model sliding sideways as the camera orbits.
    const root = fbx.getObjectByName(ROOT_BONE);
    const hip = new Vector3();
    root?.getWorldPosition(hip);

    return {
      mixer: nextMixer,
      scale: nextScale,
      offset: [
        -hip.x * nextScale,
        -(box.min.y + size.y / 2) * nextScale,
        -hip.z * nextScale + VISUAL_CENTER_Z,
      ] as [number, number, number],
    };
  }, [fbx]);

  // useLoader resolves as soon as the FBX is parsed, but FBXLoader decodes the
  // embedded textures asynchronously after that. Without this gate the first
  // frame each render worker touches captures an unlit black silhouette.
  const { delayRender, continueRender } = useDelayRender();
  const [textureHandle] = useState(() =>
    delayRender("Waiting for embedded FBX textures to decode"),
  );

  useEffect(() => {
    const images: HTMLImageElement[] = [];

    fbx.traverse((child) => {
      const { material } = child as Mesh;
      const materials = Array.isArray(material)
        ? material
        : material
          ? [material]
          : [];

      for (const entry of materials) {
        for (const value of Object.values(entry)) {
          const texture = value as Texture | null;
          if (texture?.isTexture && texture.image instanceof HTMLImageElement) {
            images.push(texture.image);
          }
        }
      }
    });

    Promise.all(
      images.map((image) =>
        image.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              image.addEventListener("load", () => resolve(), { once: true });
              image.addEventListener("error", () => resolve(), { once: true });
            }),
      ),
    ).then(() => continueRender(textureHandle));
  }, [fbx, textureHandle, continueRender]);

  // Must be a layout effect: <ThreeCanvas> advances the canvas in a passive
  // effect, which runs after this one. In a passive effect the pose would be one
  // frame stale.
  useLayoutEffect(() => {
    mixer.setTime(frame / fps);
  }, [mixer, frame, fps]);

  return (
    <group position={offset} scale={scale}>
      <primitive object={fbx as Group} />
    </group>
  );
};
