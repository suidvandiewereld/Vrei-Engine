# Mettle engine

A small game engine in Mettle, rendered with Vulkan 1.4 on Windows. It knows nothing about any game.

It needs a GPU and driver with Vulkan 1.3 or later (nothing 1.4-only is required), plus dynamic rendering, buffer
device addresses and bindless descriptors, which every current desktop driver has.

## Modules

| file | what |
|---|---|
| `engine/render.mettle`, `engine/shaders/` | sun shadow map (two cascades, PCF), sky, ground, blocks, `draw_skinned` / `draw_static`, a G-buffer, lighting (sun, sky, screen-space reflection), additive effects, HUD quads and text, GPU timestamps. Compute passes: ambient occlusion and its blur, the bloom chain down and up, the film (exposure, Reinhard, vignette, grain), FXAA |
| `engine/vk.mettle`, `engine/vkc.mettle` | the Vulkan layer: instance, device, swapchain, two frames in flight, a bindless descriptor set, a per-frame ring of host-visible memory read by address, pipelines, barriers, timestamps, runtime GLSL to SPIR-V (shaderc); the Vulkan constants, generated from the SDK headers by `tools/vkc_gen.c` |
| `engine/anim.mettle` | skeletal animation: clip sampling, the rest pose, forward kinematics, the skinning palette |
| `engine/assets.mettle` | loaders by file name from `assets\` beside the exe: a skinned mesh and its skeleton (RFSK), clip sets (RFCL), named static meshes (RFGN), a bitmap font (RFFN) |
| `engine/audio.mettle` | a software mixer on its own thread into winmm waveOut: 48 voices, pitch, pan, play regions, loop channels, a peak limiter |
| `engine/win.mettle`, `engine/math.mettle` | the window and input; vectors, quaternions, matrices |

## Using it from a game

Put a `mettle.deps` next to your entry file that maps `engine` to this folder (for example
`engine=C:/Projects/MettleEngine/engine`), then `import "engine/render";` and so on. The entry file should also
import `std/ui` and `std/math` (see the note at the top of `engine/math.mettle`). Ship `shaderc_shared.dll` (from the
Vulkan SDK's `Bin`) beside the exe: the engine compiles its GLSL, with your extensions spliced in, when it starts.

Startup: `win_open`, then `vk_create(IN->hwnd)`, then `render_init`. Set `METTLE_VK_VALIDATE=1` (or call
`vk_validation(1)` before `vk_create`) to run under the Khronos validation layer, which comes with the SDK.

The frame: `frame_begin` / `shadow_begin` x2 with draws / `main_begin` / draws / `draw_ground` / `light_pass` /
`fx_begin` / fx / `final_pass` / hud / `frame_end` / `vk_present`. `frame_begin` returns 0 when there is no frame to
draw (the window is minimised); every call until the next `frame_begin` then does nothing, so the loop needn't check.
See `tests/engine_only.mettle`.

**How a game extends the renderer, without editing it:**
- **Shader extensions:** each engine shader has a `#pragma ext` line. Pass your GLSL with `render_ext(RX_*, src)`
  before `render_init`. The no-op defaults in `engine/shaders/ext/` show the functions each slot has to define, and
  `engine/shaders/vk.glsl` (the prelude ahead of every shader) shows what they can read. Varyings you add take
  `layout(location = 8)` and up.
- **Hooks:** `render_hooks()` gives each skinned or static draw (`skin`, `stat`), the light pass (`light`) and the film
  (`film`) 256 bytes of your own data to fill. Shaders read it as `EX`. Put textures in it as their `T2[]` index (what
  `vk_texture_rgba` returns). `post` runs a pass of your own after the bloom: `render_compute` builds it, then
  `tgt_make`, `draw_block` and `post_dispatch` run it.
- **Object classes:** 3 is a block and 8 is the ground; number the rest yourself.
- **GPU zones:** the engine's are `GZ_*`; add your own with `gz_define`.

## Build

Install the [Vulkan SDK](https://vulkan.lunarg.com) (its installer sets `VULKAN_SDK`), then:

```bat
build.bat
tests\engine_only.exe
tests\hello_vk.exe
```

`build.bat` first runs `tools/embed_shaders.mettle`. It writes `engine/shader_src.mettle`, the shaders as Mettle
strings, which stands in for `import_str`: in the Mettle v0.17.0 builds, `import_str` embeds an empty string. Re-run
`build.bat` after editing a shader.
