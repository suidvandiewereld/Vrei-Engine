layout(location = 0) in vec2 vUv; layout(location = 1) in vec4 vCol;
#define uFont T2[DR.tex.x]
layout(location = 0) out vec4 oCol;
void main() {
  float a = vUv.x < 0.0 ? 1.0 : texture(uFont, vUv).a;
  oCol = vec4(vCol.rgb, vCol.a * a);
}
