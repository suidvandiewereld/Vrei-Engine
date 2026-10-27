// a skinned mesh into the shadow map (the extension: RX_SKIN_SH_VS)
vec3 aPos; vec3 aNrm; vec2 aUv; vec4 aJnt; vec4 aWgt; vec4 aShade;
#pragma ext
#ifndef MAX_BONES
#define MAX_BONES 64
#endif
#define uBones Mats(DR.bones).m
void main() {
  Uints V = Uints(DR.verts);
  uint o = uint(gl_VertexIndex) * 11u;
  aPos = uintBitsToFloat(uvec3(V.u[o], V.u[o + 1u], V.u[o + 2u]));
  aNrm = uintBitsToFloat(uvec3(V.u[o + 3u], V.u[o + 4u], V.u[o + 5u]));
  aUv = uintBitsToFloat(uvec2(V.u[o + 6u], V.u[o + 7u]));
  uint j = V.u[o + 8u];
  aJnt = vec4(float(j & 255u), float((j >> 8) & 255u), float((j >> 16) & 255u), float(j >> 24));
  aWgt = unpackUnorm4x8(V.u[o + 9u]);
  aShade = unpackUnorm4x8(V.u[o + 10u]);
  ext_vertex();
  mat4 s = uBones[int(aJnt.x)] * aWgt.x + uBones[int(aJnt.y)] * aWgt.y + uBones[int(aJnt.z)] * aWgt.z + uBones[int(aJnt.w)] * aWgt.w;
  gl_Position = vkClip(uViewProj * (uModel * (s * vec4(aPos, 1.0))));
}
