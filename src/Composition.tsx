import { Composition } from "remotion";
import { HybridScene } from "./HybridScene";

export const MyComposition = () => {
  return (
    <Composition
      id="HybridScene"
      component={HybridScene}
      durationInFrames={365}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
