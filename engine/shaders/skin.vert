#version 330 core
// a skinned mesh: four bones a vertex, the palette in the model's space, the mesh's frame on top. The game's extension
// (#pragma ext, RX_SKIN_VS) may set MAX_BONES and adds ext_vertex(): its own varyings, from the same inputs
in vec3 aPos; in vec3 aNrm; in vec2 aUv; in vec4 aJnt; in vec4 aWgt;
in vec4 aShade;                // x: the cel's cavity (the bake's shade_normals); aNrm is the cel's shading normal
#pragma ext
#ifndef MAX_BONES
#define MAX_BONES 64
#endif
uniform mat4 uBones[MAX_BONES];
uniform mat4 uModel;
uniform mat4 uViewProj;
out vec3 vWp; out vec3 vN; out vec2 vUv; out float vCav;
void main() {
  mat4 s = uBones[int(aJnt.x)] * aWgt.x + uBones[int(aJnt.y)] * aWgt.y + uBones[int(aJnt.z)] * aWgt.z + uBones[int(aJnt.w)] * aWgt.w;
  vec4 wp = uModel * (s * vec4(aPos, 1.0));
  vWp = wp.xyz;
  vN = normalize(mat3(uModel) * (mat3(s) * aNrm));
  vUv = aUv;
  vCav = aShade.x;
  ext_vertex();
  gl_Position = uViewProj * wp;
}
