#version 330 core
// tracers, flashes, puffs: world-space quads built on the CPU, already facing the camera
in vec3 aPos; in vec2 aUv; in vec4 aCol;
uniform mat4 uViewProj;
out vec2 vUv; out vec4 vCol;
void main() { vUv = aUv; vCol = aCol; gl_Position = uViewProj * vec4(aPos, 1.0); }
