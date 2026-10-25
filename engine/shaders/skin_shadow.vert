#version 330 core
// a skinned mesh into the shadow map (the extension: RX_SKIN_SH_VS)
in vec3 aPos; in vec3 aNrm; in vec2 aUv; in vec4 aJnt; in vec4 aWgt;
#pragma ext
#ifndef MAX_BONES
#define MAX_BONES 64
#endif
uniform mat4 uBones[MAX_BONES];
uniform mat4 uModel;
uniform mat4 uViewProj;
void main() {
  ext_vertex();
  mat4 s = uBones[int(aJnt.x)] * aWgt.x + uBones[int(aJnt.y)] * aWgt.y + uBones[int(aJnt.z)] * aWgt.z + uBones[int(aJnt.w)] * aWgt.w;
  gl_Position = uViewProj * (uModel * (s * vec4(aPos, 1.0)));
}
