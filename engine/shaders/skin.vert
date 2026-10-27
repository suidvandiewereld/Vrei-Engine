// a skinned mesh: four bones a vertex, the palette in the model's space, the mesh's frame on top. Its vertices pulled
// from the mesh's buffer (DR.verts: 11 words each -- position, normal, uv, joints, weights, shade). The game's extension
// (#pragma ext, RX_SKIN_VS) may set MAX_BONES and adds ext_vertex(): its own varyings (location 8 and up), from the
// same inputs (aPos ... aShade, set before it's called)
layout(location = 0) out vec3 vWp; layout(location = 1) out vec3 vN; layout(location = 2) out vec2 vUv;
layout(location = 3) out float vCav;
vec3 aPos; vec3 aNrm; vec2 aUv; vec4 aJnt; vec4 aWgt;
vec4 aShade;                   // x: the cel's cavity (the bake's shade_normals); aNrm is the cel's shading normal
#pragma ext
#ifndef MAX_BONES
#define MAX_BONES 64
#endif
#define uBones Mats(DR.bones).m
void skinVertex() {
  Uints V = Uints(DR.verts);
  uint o = uint(gl_VertexIndex) * 11u;
  aPos = uintBitsToFloat(uvec3(V.u[o], V.u[o + 1u], V.u[o + 2u]));
  aNrm = uintBitsToFloat(uvec3(V.u[o + 3u], V.u[o + 4u], V.u[o + 5u]));
  aUv = uintBitsToFloat(uvec2(V.u[o + 6u], V.u[o + 7u]));
  uint j = V.u[o + 8u];
  aJnt = vec4(float(j & 255u), float((j >> 8) & 255u), float((j >> 16) & 255u), float(j >> 24));
  aWgt = unpackUnorm4x8(V.u[o + 9u]);
  aShade = unpackUnorm4x8(V.u[o + 10u]);
}
void main() {
  skinVertex();
  mat4 s = uBones[int(aJnt.x)] * aWgt.x + uBones[int(aJnt.y)] * aWgt.y + uBones[int(aJnt.z)] * aWgt.z + uBones[int(aJnt.w)] * aWgt.w;
  vec4 wp = uModel * (s * vec4(aPos, 1.0));
  vWp = wp.xyz;
  vN = normalize(mat3(uModel) * (mat3(s) * aNrm));
  vUv = aUv;
  vCav = aShade.x;
  ext_vertex();
  gl_Position = vkClip(uViewProj * wp);
}
