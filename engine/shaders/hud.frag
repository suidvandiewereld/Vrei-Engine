#version 330 core
in vec2 vUv; in vec4 vCol;
uniform sampler2D uFont;
out vec4 oCol;
void main() {
  float a = vUv.x < 0.0 ? 1.0 : texture(uFont, vUv).a;
  oCol = vec4(vCol.rgb, vCol.a * a);
}
