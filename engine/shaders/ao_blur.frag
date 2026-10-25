#version 330 core
// the occlusion smoothed one way (uDir), across the same surface only: each tap weighted by a Gaussian and by how near
// its distance is to this pixel's (an edge between near and far isn't blurred over)
in vec2 vNdc;
uniform sampler2D uSrc;        // r the occlusion, g the distance
uniform vec2 uScreen;
uniform vec2 uDir;
out vec4 oA;
void main() {
  ivec2 ip = ivec2(gl_FragCoord.xy);
  vec4 c0 = texelFetch(uSrc, ip, 0);
  float D = c0.g;
  float s = c0.r, w = 1.0;
  for (int k = -4; k <= 4; k++) {
    if (k == 0) continue;
    ivec2 q = clamp(ip + ivec2(uDir * float(k) * 1.5), ivec2(0), ivec2(uScreen) - 1);
    vec4 cq = texelFetch(uSrc, q, 0);
    float g = exp(-float(k * k) / 9.0);
    float wd = max(0.0, 1.0 - abs(cq.g - D) / (0.03 * D + 0.05));
    s += cq.r * g * wd;
    w += g * wd;
  }
  oA = vec4(s / w, D, 0.0, 1.0);
}
