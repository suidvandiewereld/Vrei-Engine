#version 330 core
// a static mesh into the shadow map (the extension: RX_STATIC_SH_VS)
in vec3 aPos;
uniform mat4 uModel;
uniform mat4 uViewProj;
#pragma ext
void main() { ext_vertex(); gl_Position = uViewProj * (uModel * vec4(aPos, 1.0)); }
