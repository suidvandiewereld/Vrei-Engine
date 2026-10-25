#version 330 core
// the screen's quads, in pixels from the top left
in vec3 aPos; in vec2 aUv; in vec4 aCol;
uniform vec2 uScreen;
out vec2 vUv; out vec4 vCol;
void main() {
  vUv = aUv; vCol = aCol;
  gl_Position = vec4(aPos.x / uScreen.x * 2.0 - 1.0, 1.0 - aPos.y / uScreen.y * 2.0, 0.0, 1.0);
}
