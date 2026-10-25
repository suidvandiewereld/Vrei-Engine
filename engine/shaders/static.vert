#version 330 core
// a static mesh (the extension: RX_STATIC_VS -- whatever it adds to the skinned meshes' varyings, set here too)
in vec3 aPos; in vec3 aNrm; in vec2 aUv;
uniform mat4 uModel;
uniform mat4 uViewProj;
out vec3 vWp; out vec3 vN; out vec2 vUv; out float vCav;
#pragma ext
void main() {
  vec4 wp = uModel * vec4(aPos, 1.0);
  vWp = wp.xyz;
  vN = normalize(mat3(uModel) * aNrm);
  vUv = aUv;
  vCav = 0.0;
  ext_vertex();
  gl_Position = uViewProj * wp;
}
