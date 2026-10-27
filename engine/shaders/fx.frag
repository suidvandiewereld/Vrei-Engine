// a soft-edged streak / blob: uv in -1..1 across it; additive
layout(location = 0) in vec2 vUv; layout(location = 1) in vec4 vCol;
layout(location = 0) out vec4 oCol;
void main() {
  float r = length(vUv);
  float a = vCol.a * clamp(1.0 - r, 0.0, 1.0);
  a *= a;
  oCol = vec4(vCol.rgb * a, a);
}
