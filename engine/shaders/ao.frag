#version 330 core
// AMBIENT OCCLUSION (McGuire's Scalable Ambient Obscurance, in the world): how much of the sky a point's surroundings
// hide from it -- twelve samples on a spiral round it in screen space out to half a metre, each counted by how far it
// rises over the surface's plane and how near it is. The plane is the depth's own (each way, the nearer neighbour's
// difference: no edge's jump in it) -- the geometry's, not the normal maps' and the bullet holes' bumps (those are
// the light's to shade, not the occlusion's). Out: r the occlusion (1 open), g the distance (for the blur).
in vec2 vNdc;
uniform sampler2D uDepthT;
uniform sampler2D uNrmT;
uniform sampler2D uObjT;
uniform mat4 uInvVP;
uniform vec2 uScreen;
uniform float uP11;            // the projection's y scale
out vec4 oA;
vec3 wpos(ivec2 q) {
  float z = texelFetch(uDepthT, q, 0).r;
  vec2 ndc = (vec2(q) + 0.5) / uScreen * 2.0 - 1.0;
  vec4 w = uInvVP * vec4(ndc, z * 2.0 - 1.0, 1.0);
  return w.xyz / w.w;
}
void main() {
  ivec2 ip = ivec2(gl_FragCoord.xy);
  float D = texelFetch(uObjT, ip, 0).w;
  if (D > 900.0) { oA = vec4(1.0, D, 0.0, 1.0); return; }
  vec3 P = wpos(ip);
  ivec2 mx = ivec2(uScreen) - 1;
  vec3 l = wpos(clamp(ip - ivec2(1, 0), ivec2(0), mx)) - P, r = wpos(clamp(ip + ivec2(1, 0), ivec2(0), mx)) - P;
  vec3 b = wpos(clamp(ip - ivec2(0, 1), ivec2(0), mx)) - P, t = wpos(clamp(ip + ivec2(0, 1), ivec2(0), mx)) - P;
  vec3 dx = dot(l, l) < dot(r, r) ? -l : r;
  vec3 dy = dot(b, b) < dot(t, t) ? -b : t;
  vec3 N = cross(dx, dy);
  vec3 Ng = texelFetch(uNrmT, ip, 0).xyz;
  N = dot(N, N) > 1e-16 ? normalize(N) : normalize(Ng + 1e-6);
  if (dot(N, Ng) < 0.0) N = -N;
  const float RAD = 0.5;
  float rpx = RAD * uP11 * uScreen.y * 0.5 / max(D, 0.05);
  if (rpx < 1.0) { oA = vec4(1.0, D, 0.0, 1.0); return; }
  rpx = min(rpx, uScreen.y * 0.15);
  float rot = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) * 6.2831853;
  float sum = 0.0;
  const int NS = 12;
  for (int i = 0; i < NS; i++) {
    float u = (float(i) + 0.5) / float(NS);
    float an = u * 6.2831853 * 3.0 + rot;
    ivec2 q = clamp(ip + ivec2(vec2(cos(an), sin(an)) * rpx * u), ivec2(0), ivec2(uScreen) - 1);
    vec3 v = wpos(q) - P;
    float vv = dot(v, v);
    float vn = dot(v, N);
    float f = max(RAD * RAD - vv, 0.0);
    sum += f * f * f * max((vn - 0.012) / (vv + 0.004), 0.0);
  }
  float ao = max(0.0, 1.0 - sum * 5.0 / (pow(RAD, 6.0) * float(NS)));
  oA = vec4(ao, D, 0.0, 1.0);
}
