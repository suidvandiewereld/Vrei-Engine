#version 330 core
in vec3 aPos;
out vec2 vNdc;
void main() { vNdc = aPos.xy; gl_Position = vec4(aPos.xy, 0.9999, 1.0); }
