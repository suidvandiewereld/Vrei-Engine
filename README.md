# Mettle engine

A small game engine in Mettle, rendered with OpenGL 3.3 on Windows. It knows nothing about any game.

## Modules

| file | what |
|---|---|
| `engine/render.mettle`, `engine/shaders/` | sun shadow map (two cascades, PCF), sky, ground, blocks, `draw_skinned` / `draw_static`, a G-buffer, lighting (ambient occlusion, sun, sky, screen-space reflection), bloom, Reinhard, FXAA, additive effects, HUD quads and text, GPU timestamps |
| `engine/anim.mettle` | skeletal animation: clip sampling, the rest pose, forward kinematics, the skinning palette |
| `engine/assets.mettle` | loaders by file name from `assets\` beside the exe: a skinned mesh and its skeleton (RFSK), clip sets (RFCL), named static meshes (RFGN), a bitmap font (RFFN) |
| `engine/audio.mettle` | a software mixer on its own thread into winmm waveOut: 48 voices, pitch, pan, play regions, loop channels, a peak limiter |
| `engine/gl.mettle`, `engine/win.mettle`, `engine/math.mettle` | the GL context and entry points, GLSL splicing; the window and input; vectors, quaternions, matrices |

## Using it from a game

Put a `mettle.deps` next to your entry file that maps `engine` to this folder (for example
`engine=C:/Projects/MettleEngine/engine`), then `import "engine/render";` and so on. The entry file should also
import `std/ui` and `std/math` (see the note at the top of `engine/math.mettle`).

The frame: `frame_begin` / `shadow_begin` x2 with draws / `main_begin` / draws / `draw_ground` / `light_pass` /
`fx_begin` / fx / `final_pass` / hud / `frame_end` / `gl_swap`. See `tests/engine_only.mettle`.

**How a game extends the renderer, without editing it:**
- **Shader extensions:** each engine shader has a `#pragma ext` line. Pass your GLSL with `render_ext(RX_*, src)`
  before `render_init`. The no-op defaults in `engine/shaders/ext/` show the functions each slot has to define.
- **Hooks:** `render_hooks()` lets you set your own uniforms on skinned and static draws (`skin`, `stat`) and on the
  light pass (`light`), run a pass of your own after bloom (`post`), and set uniforms on the final pass (`film`).
- **Object classes:** 3 is a block and 8 is the ground; number the rest yourself.
- **GPU zones:** the engine's are `GZ_*`; add your own with `gz_define`.

## Build

```bat
build.bat
tests\engine_only.exe
```
