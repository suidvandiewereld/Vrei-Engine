#version 460
// THE PRELUDE: ahead of every engine shader (and so of every extension a game splices into one). What a shader sees:
//   textures      T2[i]: every texture and render target the engine has, by its index (a VkImg's tex); TS[i] the
//                 depth compared on lookup (the sun's shadow map); I16[i] / I8[i] the RGBA16F / RGBA8 targets a
//                 compute pass writes (a VkImg's stor)
//   the frame     FR: what the whole frame shares -- the camera, the sun's cascades, the light, the screen
//   the draw      DR: this draw's (or pass's) own -- its model, its view-projection, its textures, its parameters,
//                 its vertices' and bones' addresses
//   the game's    EX: the 256 bytes its hook filled for this draw (vec4 v[16]; or its own buffer_reference type over
//                 PC.ext)
// The uniforms the GL engine had keep their names (uSunDir, uModel ...) as macros over these.
// Varyings take explicit locations: the engine's 0..3; a game's extension 8 and up.
#extension GL_EXT_buffer_reference : require
#extension GL_EXT_buffer_reference_uvec2 : require
#extension GL_EXT_nonuniform_qualifier : require

layout(set = 0, binding = 0) uniform sampler2D T2[];
layout(set = 0, binding = 1) uniform sampler2DShadow TS[];
layout(set = 0, binding = 2, rgba16f) uniform image2D I16[];
layout(set = 0, binding = 3, rgba8) uniform image2D I8[];

layout(buffer_reference, std430, buffer_reference_align = 16) readonly buffer FrameB {
  mat4 vp;            // the camera's view-projection
  mat4 inv_vp;
  mat4 prev_vp;       // last frame's
  mat4 light_vp0;     // the sun's two cascades
  mat4 light_vp1;
  vec4 sun_dir;       // xyz toward the sun
  vec4 sun_col;
  vec4 sky_col;
  vec4 gnd_col;
  vec4 fog;           // rgb its colour, a its density
  vec4 cam;           // xyz the camera, w the time (s)
  vec4 screen;        // w, h, the projection's y scale, the exposure
  vec4 misc;          // xy each cascade's texel (m), z how much of the glow
};
layout(buffer_reference, std430, buffer_reference_align = 16) readonly buffer DrawB {
  mat4 model;
  mat4 vp;            // what it's drawn through (the camera, or a cascade of the sun)
  vec4 tint;          // rgb a tint, a a glow
  vec4 obj;           // x the object id, y its class
  ivec4 tex;          // textures (T2[] / TS[]; w a compute pass's target: I16[] / I8[])
  ivec4 tex2;
  vec4 p0;            // a pass's parameters
  vec4 p1;
  uvec2 bones;        // the skinning palette (mat4s)
  uvec2 verts;        // the vertices
};
layout(buffer_reference, std430, buffer_reference_align = 4) readonly buffer Floats { float f[]; };
layout(buffer_reference, std430, buffer_reference_align = 4) readonly buffer Uints { uint u[]; };
layout(buffer_reference, std430, buffer_reference_align = 16) readonly buffer Mats { mat4 m[]; };
layout(buffer_reference, std430, buffer_reference_align = 16) readonly buffer ExtB { vec4 v[16]; };
layout(push_constant) uniform Push { uvec2 frame; uvec2 draw; uvec2 ext; uvec2 pad; } PC;
#define FR FrameB(PC.frame)
#define DR DrawB(PC.draw)
#define EX ExtB(PC.ext)

// the frame's (the GL engine's uniforms, by their names)
#define uVP FR.vp
#define uInvVP FR.inv_vp
#define uPrevVP FR.prev_vp
#define uLightVP0 FR.light_vp0
#define uLightVP1 FR.light_vp1
#define uSunDir FR.sun_dir.xyz
#define uSunCol FR.sun_col.xyz
#define uSkyCol FR.sky_col.xyz
#define uGndCol FR.gnd_col.xyz
#define uFogCol FR.fog.xyz
#define uFogDen FR.fog.w
#define uCamPos FR.cam.xyz
#define uTime FR.cam.w
#define uScreen FR.screen.xy
#define uP11 FR.screen.z
#define uExposure FR.screen.w
#define uCascTexel FR.misc.xy
#define uBloom FR.misc.z
// the draw's
#define uModel DR.model
#define uViewProj DR.vp
#define uTint DR.tint.rgb
#define uGlow DR.tint.a
#define uObj DR.obj.x
#define uClass DR.obj.y

// GL's clip depth (-w..w) as Vulkan's (0..w): the depth stored is what GL stored, so every pass that reads it back
// (z * 2 - 1 into NDC) reads it as it did
vec4 vkClip(vec4 p) { return vec4(p.xy, (p.z + p.w) * 0.5, p.w); }
