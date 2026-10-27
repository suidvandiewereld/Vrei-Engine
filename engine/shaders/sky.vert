// one triangle over the whole screen (the sky, and every full-screen pass): vNdc its NDC, far off
layout(location = 0) out vec2 vNdc;
const vec2 P[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
void main() { vNdc = P[gl_VertexIndex]; gl_Position = vkClip(vec4(vNdc, 0.9999, 1.0)); }
