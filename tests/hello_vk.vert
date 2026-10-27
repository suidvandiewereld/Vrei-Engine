#version 460
layout(location = 0) out vec3 vCol;
const vec2 P[3] = vec2[3](vec2(-0.6, -0.5), vec2(0.6, -0.5), vec2(0.0, 0.6));
const vec3 C[3] = vec3[3](vec3(1.0, 0.25, 0.2), vec3(0.2, 1.0, 0.3), vec3(0.25, 0.35, 1.0));
void main() { vCol = C[gl_VertexIndex]; gl_Position = vec4(P[gl_VertexIndex], 0.5, 1.0); }
