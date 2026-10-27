// THE G-BUFFER: what every scene shader writes -- the surface, not its light (that's shaders/shade.frag's, once a pixel
// after): its albedo, its normal, how rough and how metal it is, what it is and how far, the light it gives off
// (uCamPos, uObj, uClass: the prelude's)
layout(location = 0) out vec4 gAlb;    // albedo (sRGB-encoded), a: its occlusion (creases, seams; 1 open)
layout(location = 1) out vec4 gNrm;    // world normal, a: roughness (perceptual: 0 a mirror .. 1)
layout(location = 2) out vec4 gObj;    // object id, class, metalness, distance (m)
layout(location = 3) out vec4 gEmi;    // the light it gives off (sRGB-encoded, an eighth of it), a: how much light it
                                       // carries under its surface (flesh: 0 none)

vec3 lin(vec3 c) { return pow(max(c, vec3(0.0)), vec3(2.2)); }
vec3 enc(vec3 c) { return pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2)); }
float h3(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
float n3(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
// a tight curve's normals spread over the pixel widen its highlight (Kaplanyan's specular antialiasing: no sparkle on
// the edges, the seams, the normal map's grain)
float specAA(vec3 n, float r) {
  vec3 du = dFdx(n), dv = dFdy(n);
  float k = min(0.5 * (dot(du, du) + dot(dv, dv)), 0.18);
  return sqrt(clamp(r * r + k, 0.0, 1.0));
}
void writeGs(vec3 albedo, float occ, vec3 n, float rough, float metal, vec3 emit, vec3 wp, float sss) {
  gAlb = vec4(enc(albedo), occ);
  gNrm = vec4(n, specAA(n, clamp(rough, 0.02, 1.0)));
  gObj = vec4(uObj, uClass, metal, length(uCamPos - wp));
  gEmi = vec4(enc(emit / 8.0), clamp(sss, 0.0, 1.0));
}
void writeG(vec3 albedo, float occ, vec3 n, float rough, float metal, vec3 emit, vec3 wp) {
  writeGs(albedo, occ, n, rough, metal, emit, wp, 0.0);
}
// the tangent frame from the screen's derivatives (Schuler, "Normal Mapping Without Precomputed Tangents"): a normal
// map read without tangents baked into the mesh
mat3 cotangentFrame(vec3 N, vec3 p, vec2 uv) {
  vec3 dp1 = dFdx(p), dp2 = dFdy(p);
  vec2 duv1 = dFdx(uv), duv2 = dFdy(uv);
  vec3 dp2perp = cross(dp2, N), dp1perp = cross(N, dp1);
  vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
  vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;
  float im = inversesqrt(max(max(dot(T, T), dot(B, B)), 1e-20));
  return mat3(T * im, B * im, N);
}
