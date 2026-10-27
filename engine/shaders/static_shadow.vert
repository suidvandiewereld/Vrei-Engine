// a static mesh into the shadow map (the extension: RX_STATIC_SH_VS)
vec3 aPos;
#pragma ext
void main() {
  Floats V = Floats(DR.verts);
  uint o = uint(gl_VertexIndex) * 8u;
  aPos = vec3(V.f[o], V.f[o + 1u], V.f[o + 2u]);
  ext_vertex();
  gl_Position = vkClip(uViewProj * (uModel * vec4(aPos, 1.0)));
}
