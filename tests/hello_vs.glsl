#version 330 core
in vec3 aPos; in vec3 aNrm; out vec3 c;
void main() { c = aNrm; gl_Position = vec4(aPos, 1.0); }
