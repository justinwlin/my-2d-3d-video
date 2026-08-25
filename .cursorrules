# my-2d-3d-video — Remotion + Three.js pipeline

Programmatic video: 2D React/Tailwind overlays composited over a Three.js scene, rendered deterministically frame by frame.

## Hard conventions

1. **Drive all animation from `useCurrentFrame()`** (from `remotion`). Never use R3F's `useFrame()`, `requestAnimationFrame`, `setInterval`, `Date.now()`, or `Math.random()` in scene code. Rendering is frame-by-frame and must be deterministic — a given frame number must always produce the same pixels.
2. **Use `<ThreeCanvas>` from `@remotion/three`**, never R3F's `<Canvas>`. Pass `width`/`height` from `useVideoConfig()` so the canvas matches the composition.
3. **Convert 3D models to components** with `npx gltfjsx public/model.glb`. Put `.glb`/`.gltf` files in `public/` and load with `staticFile()`.
4. **`Config.setChromiumOpenGlRenderer("angle")`** in `remotion.config.ts` is required for WebGL to work during render. Do not remove it. Pass `--gl=angle` for any raw CLI render outside the config.
5. Interpolate with `interpolate()` and `spring()` from `remotion`. `spring()` needs `fps` from `useVideoConfig()`.
6. Register compositions in `src/Composition.tsx`; `src/Root.tsx` is the entry.

## Commands

- `npm start` — Remotion Studio preview with frame scrubbing
- `npm run lint` — eslint + tsc (run before committing)
- `npx remotion still <CompId> out/frame.png --frame=N` — single-frame check
- `npx remotion render <CompId>` — full video

## Docs

`npx @remotion/mcp` exposes searchable Remotion docs as MCP tools. Remotion skills are also vendored in `.claude/skills/`.
