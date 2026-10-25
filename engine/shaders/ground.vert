#version 330 core
in vec3 aPos;
uniform mat4 uViewProj;
out vec3 vWp;
void main() { vWp = aPos; gl_Position = uViewProj * vec4(aPos, 1.0); }
