// the ground: one big quad, 600 m each way (the grid and the noise are the shader's)
layout(location = 0) out vec3 vWp;
const vec2 G[6] = vec2[6](vec2(-1.0, -1.0), vec2(-1.0, 1.0), vec2(1.0, 1.0), vec2(-1.0, -1.0), vec2(1.0, 1.0), vec2(1.0, -1.0));
void main() {
  vec2 g = G[gl_VertexIndex] * 600.0;
  vWp = vec3(g.x, 0.0, g.y);
  gl_Position = vkClip(uViewProj * vec4(vWp, 1.0));
}
