#version 330 core
// THE FRAME, 3a: the glow's chain down (Jimenez, "Next Generation Post Processing in Call of Duty: Advanced Warfare"):
// a 13-tap filter to half size; the first step keeps only what's bright (a soft knee) and weights its five blocks by
// their brightness (the Karis average: a single hot pixel doesn't flicker into a blob)
uniform sampler2D uSrc;
uniform vec2 uTexel;           // the source's texel
uniform int uFirst;
uniform float uThreshold;
uniform float uKnee;
in vec2 vNdc;
out vec4 oB;
float lum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
vec3 bright(vec3 c) {
  float l = lum(c);
  float soft = clamp(l - uThreshold + uKnee, 0.0, 2.0 * uKnee);
  soft = soft * soft / (4.0 * uKnee + 1e-5);
  return c * max(soft, l - uThreshold) / max(l, 1e-5);
}
vec3 tap(vec2 uv) {
  vec3 c = texture(uSrc, uv).rgb;
  return (any(isnan(c)) || any(isinf(c))) ? vec3(0.0) : clamp(c, 0.0, 30000.0);
}
void main() {
  vec2 uv = vNdc * 0.5 + 0.5;
  vec2 t = uTexel;
  vec3 a = tap(uv + t * vec2(-2, 2)), b = tap(uv + t * vec2(0, 2)), c = tap(uv + t * vec2(2, 2));
  vec3 d = tap(uv + t * vec2(-2, 0)), e = tap(uv), f = tap(uv + t * vec2(2, 0));
  vec3 g = tap(uv + t * vec2(-2, -2)), h = tap(uv + t * vec2(0, -2)), i = tap(uv + t * vec2(2, -2));
  vec3 j = tap(uv + t * vec2(-1, 1)), k = tap(uv + t * vec2(1, 1));
  vec3 l = tap(uv + t * vec2(-1, -1)), m = tap(uv + t * vec2(1, -1));
  vec3 o;
  if (uFirst != 0) {
    vec3 b0 = bright((j + k + l + m) * 0.25), b1 = bright((a + b + d + e) * 0.25), b2 = bright((b + c + e + f) * 0.25);
    vec3 b3 = bright((d + e + g + h) * 0.25), b4 = bright((e + f + h + i) * 0.25);
    float w0 = 1.0 / (1.0 + lum(b0)), w1 = 1.0 / (1.0 + lum(b1)), w2 = 1.0 / (1.0 + lum(b2));
    float w3 = 1.0 / (1.0 + lum(b3)), w4 = 1.0 / (1.0 + lum(b4));
    o = (b0 * w0 * 0.5 + (b1 * w1 + b2 * w2 + b3 * w3 + b4 * w4) * 0.125) / (w0 * 0.5 + (w1 + w2 + w3 + w4) * 0.125);
  } else {
    o = e * 0.125 + (a + c + g + i) * 0.03125 + (b + d + f + h) * 0.0625 + (j + k + l + m) * 0.125;
  }
  oB = vec4(o, 1.0);
}
