// a static mesh, its vertices pulled from its buffer (DR.verts: 8 floats each -- position, normal, uv; the blocks' cube
// the same). The extension: RX_STATIC_VS -- whatever it adds to the skinned meshes' varyings, set here too
layout(location = 0) out vec3 vWp; layout(location = 1) out vec3 vN; layout(location = 2) out vec2 vUv;
layout(location = 3) out float vCav;
vec3 aPos; vec3 aNrm; vec2 aUv;
#pragma ext
void main() {
  Floats V = Floats(DR.verts);
  uint o = uint(gl_VertexIndex) * 8u;
  aPos = vec3(V.f[o], V.f[o + 1u], V.f[o + 2u]);
  aNrm = vec3(V.f[o + 3u], V.f[o + 4u], V.f[o + 5u]);
  aUv = vec2(V.f[o + 6u], V.f[o + 7u]);
  vec4 wp = uModel * vec4(aPos, 1.0);
  vWp = wp.xyz;
  vN = normalize(mat3(uModel) * aNrm);
  vUv = aUv;
  vCav = 0.0;
  ext_vertex();
  gl_Position = vkClip(uViewProj * wp);
}
