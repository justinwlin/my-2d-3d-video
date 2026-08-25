# my-2d-3d-video

An exploration of **Remotion + Three.js + rigged 3D models** as a pipeline for making videos with AI coding agents.

The premise: because Remotion renders video from React and Three.js runs in the same tree, an agent can author and iterate on a motion-graphics scene as ordinary code in a repo — no render farm, no timeline GUI, no proprietary project format. Scenes are diffable text. Frames are a pure function of a frame number.

This repo is the working proof of that, plus the non-obvious rules it took to get a rigged character rendering correctly.

## What's here

- `src/HybridScene.tsx` — a 2D Tailwind overlay composited over a 3D scene, with a camera orbiting a centered subject once per composition
- `src/OldMan.tsx` — a rigged Mixamo FBX with skeletal animation driven deterministically from the frame number
- `.agents/skills/` — 12 official Remotion skills (shipped with the template) plus 6 vendored React Three Fiber skills
- `CLAUDE.md` — the agent rule file, also symlinked as `AGENTS.md` and `KIMI.md`

Rendered output: 365 frames at 1920x1080, 30fps — one full camera revolution matched exactly to the 12.1667s animation clip, so both loop seamlessly.

## Quick start

```bash
npm i
npm start        # Remotion Studio at localhost:3000, with frame scrubbing
npm run lint     # eslint + tsc
```

Render:

```bash
npx remotion render HybridScene out/video.mp4
npx remotion still HybridScene out/frame.png --frame=91
```

## The core constraint

Every frame is rendered independently, out of order, in parallel across workers. So a frame must be a pure function of its frame number. `useCurrentFrame()` is the only clock. Anything that advances on its own — `useFrame`, `requestAnimationFrame`, `AnimationMixer.update(delta)`, `Date.now()`, `Math.random()` — produces flicker, because two workers reaching the same frame will disagree.

That single constraint is what makes the whole thing agent-friendly. Deterministic output means a change can be verified by rendering a frame and looking at it, or by measuring it in a script.

## What was actually hard

The technique for rigs is simple and worked immediately: build one `AnimationMixer` and **seek** it to an absolute time (`mixer.setTime(frame / fps)`) rather than advancing it. Neither Remotion's docs nor its official Three.js template covers rigged models, and a GitHub code search for this pattern turned up nothing — so it's undocumented, but not difficult.

The time went to two bugs that were invisible in the obvious check. Both are written up in `CLAUDE.md`:

1. **The first frames rendered as an unlit black silhouette.** `useLoader` resolves when the FBX is *parsed*, but `FBXLoader` decodes embedded textures asynchronously afterward. Fixed by holding a `delayRender()` handle until every `texture.image` reports complete. It was exactly four bad frames because concurrency was four — one per worker's first frame.

2. **The model slid sideways as the camera orbited.** `Box3.setFromObject` bounds *unposed* geometry on a skinned mesh, so its horizontal center is meaningless. Fixed by taking height from the box but horizontal position from the rig's hip bone via `getWorldPosition`.

Neither showed up in Remotion Studio, and neither showed up in a single-frame still render. **Verify rigs with `remotion render`, not `remotion still`** — concurrency and worker startup only exist in the former.

## Verification approach

Eyeballing frames was not reliable enough to catch either bug, so correctness was measured instead:

- silhouette bounding-box center sampled across the orbit — vertical center held 528-557 against a 540 target
- frame 0 and frame 364 matched within 1px, confirming the loop closes
- a re-rendered frame hashed byte-identical to the original, confirming determinism
- all 365 frames scanned for dropouts — zero, with max frame-to-frame area change 3.9%

The residual horizontal wander of roughly ±80px is the figure's own asymmetry (one arm swings wider), not a pivot error.

## Agent setup

Skills are auto-discovered from `.agents/skills/`, which both Claude Code and Kimi Code read, so no per-tool configuration is needed. `.claude/skills/` holds symlinks to the same directories.

The 6 vendored R3F skills come from [EnzeD/r3f-skills](https://github.com/EnzeD/r3f-skills) (MIT) and are **general React Three Fiber references, not written for Remotion** — their examples use `<Canvas>` and `useFrame`, both banned here, and they target R3F 8.x/React 18 while this project runs 9.x/React 19. `CLAUDE.md` tells the agent to read them for the Three.js API only and translate the scaffolding. The packs leaning hardest on `useFrame` were deliberately not installed.

For the Remotion side of 3D, the authoritative source is the official skill at `.agents/skills/remotion-markup/3d.md`. Remotion also ships searchable docs as MCP tools via `npx @remotion/mcp`.

## Notes

- `Config.setChromiumOpenGlRenderer("angle")` in `remotion.config.ts` is required — without it any WebGL render fails with `THREE.WebGLRenderer: Error creating WebGL context`.
- Despite its filename, `public/old-man-idle.fbx` contains Mixamo's **Mutant** character; the idle is retargeted onto that skin.
- That FBX is 21MB and committed directly. If more rigs get added, move to Git LFS.

## Stack

Remotion 4.0.516 · React 19.2.3 · Three.js 0.185 · @react-three/fiber 9.7 · @react-three/drei 10.7 · Tailwind CSS 4 · TypeScript 5.9
