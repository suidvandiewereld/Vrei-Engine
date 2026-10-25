#version 330 core
// a soft-edged streak / blob: uv in -1..1 across it; additive
in vec2 vUv; in vec4 vCol;
out vec4 oCol;
void main() {
  float r = length(vUv);
  float a = vCol.a * clamp(1.0 - r, 0.0, 1.0);
  a *= a;
  oCol = vec4(vCol.rgb * a, a);
}
