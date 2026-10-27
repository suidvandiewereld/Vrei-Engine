// the screen's quads, in pixels from the top left (DR.verts: 9 floats a vertex -- x y z, u v, r g b a)
layout(location = 0) out vec2 vUv; layout(location = 1) out vec4 vCol;
void main() {
  Floats V = Floats(DR.verts);
  uint o = uint(gl_VertexIndex) * 9u;
  vec3 p = vec3(V.f[o], V.f[o + 1u], V.f[o + 2u]);
  vUv = vec2(V.f[o + 3u], V.f[o + 4u]);
  vCol = vec4(V.f[o + 5u], V.f[o + 6u], V.f[o + 7u], V.f[o + 8u]);
  gl_Position = vkClip(vec4(p.x / uScreen.x * 2.0 - 1.0, 1.0 - p.y / uScreen.y * 2.0, 0.0, 1.0));
}
