# my-2d-3d-video — Remotion + Three.js pipeline

Programmatic video: 2D React/Tailwind overlays composited over a Three.js scene, rendered deterministically frame by frame.

## Hard conventions

1. **Drive all animation from `useCurrentFrame()`** (from `remotion`). Never use R3F's `useFrame()`, `requestAnimationFrame`, `setInterval`, `Date.now()`, or `Math.random()` in scene code. Rendering is frame-by-frame and must be deterministic — a given frame number must always produce the same pixels.
2. **Use `<ThreeCanvas>` from `@remotion/three`**, never R3F's `<Canvas>`. Pass `width`/`height` from `useVideoConfig()` so the canvas matches the composition.
3. **Convert 3D models to components** with `npx gltfjsx public/model.glb`. Put `.glb`/`.gltf` files in `public/` and load with `staticFile()`.
4. **`Config.setChromiumOpenGlRenderer("angle")`** in `remotion.config.ts` is required for WebGL to work during render. Do not remove it. Pass `--gl=angle` for any raw CLI render outside the config.
5. Interpolate with `interpolate()` and `spring()` from `remotion`. `spring()` needs `fps` from `useVideoConfig()`.
6. **Any `<Sequence>` inside `<ThreeCanvas>` must set `layout="none"`.** Otherwise Sequence injects an absolutely-positioned div into the Three.js scene graph, which is invalid.
7. Register compositions in `src/Composition.tsx`; `src/Root.tsx` is the entry.

## Rigged models

`src/OldMan.tsx` is the working reference. Four rules, each learned from a failure:

1. **Seek, never advance.** Build an `AnimationMixer` once and call `mixer.setTime(frame / fps)`. Never `mixer.update(delta)` and never drei's `useAnimations` playback, both of which run on a realtime clock.
2. **Seek in a `useLayoutEffect`, not `useEffect`.** `<ThreeCanvas>` advances the canvas in a *passive* effect, and passive effects run after layout effects. Seeking in a passive effect renders the pose one frame stale.
3. **Gate the render on texture decode.** `useLoader` resolves when the FBX is *parsed*; `FBXLoader` then decodes embedded textures asynchronously. Without an explicit `delayRender()` held until every `texture.image` is complete, the first frame each render worker touches captures an unlit black silhouette. This shows up as N bad frames where N is the concurrency, and it is invisible in Studio.
4. **Do not trust `Box3.setFromObject` for horizontal centering of a skinned mesh.** It bounds unposed geometry, so its X/Z center is wrong and the subject slides sideways as a camera orbits. Take height from the box, but take horizontal position from a bone (`getWorldPosition` on the rig root).

Rendering a still looks correct while the full render is broken, because concurrency and worker startup only exist in the latter. Verify rigs with `npx remotion render`, not `npx remotion still`.

## Commands

- `npm start` — Remotion Studio preview with frame scrubbing
- `npm run lint` — eslint + tsc (run before committing)
- `npx remotion still <CompId> out/frame.png --frame=N` — single-frame check
- `npx remotion render <CompId>` — full video

## Reading the R3F skills

`.agents/skills/r3f-*/` are 6 vendored skills from [EnzeD/r3f-skills](https://github.com/EnzeD/r3f-skills) (MIT, upstream README at `.agents/R3F-SKILLS-UPSTREAM.md`): materials, lighting, textures, loaders, geometry, shaders. They are general React Three Fiber references, **not written for Remotion**. Two things must be translated on every use:

- They target R3F 8.x / drei 9.x / React 18. This project runs R3F 9.x / drei 10.x / React 19. Confirm signatures against `node_modules` before trusting a prop.
- Their examples use `<Canvas>` and `useFrame`. Both are banned here. Read them for the Three.js material/light/geometry/loader API only, and translate the surrounding scaffolding to `<ThreeCanvas>` + `useCurrentFrame()` per rules 1-2 above.

`fundamentals`, `animation`, `interaction`, `physics`, and `postprocessing` from that pack were deliberately not installed — they are the most `useFrame`-dependent and carry the most R3F v8-to-v9 breakage.

For the Remotion side of 3D, the authoritative source is the official skill at `.agents/skills/remotion-markup/3d.md`.

## Docs

`npx @remotion/mcp` exposes searchable Remotion docs as MCP tools. Remotion skills are also vendored in `.claude/skills/`.
