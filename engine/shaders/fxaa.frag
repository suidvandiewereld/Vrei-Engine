#version 330 core
// FXAA (Lottes): the frame's edges smoothed -- the luma's gradient across each pixel finds the edge's direction, two
// taps along it either side blend it, kept only if they don't overshoot the neighbourhood's range
in vec2 vNdc;
uniform sampler2D uSrc;        // the display colour, a: its luma
uniform vec2 uScreen;
out vec4 oCol;
void main() {
  vec2 rcp = 1.0 / uScreen;
  vec2 uv = gl_FragCoord.xy * rcp;
  float lNW = texture(uSrc, uv + vec2(-1.0, -1.0) * rcp).a;
  float lNE = texture(uSrc, uv + vec2(1.0, -1.0) * rcp).a;
  float lSW = texture(uSrc, uv + vec2(-1.0, 1.0) * rcp).a;
  float lSE = texture(uSrc, uv + vec2(1.0, 1.0) * rcp).a;
  vec4 M = texture(uSrc, uv);
  float lM = M.a;
  float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE)));
  float lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
  if (lMax - lMin < max(0.0312, lMax * 0.125)) { oCol = vec4(M.rgb, 1.0); return; }
  vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), (lNW + lSW) - (lNE + lSE));
  float red = max((lNW + lNE + lSW + lSE) * 0.25 * 0.125, 1.0 / 128.0);
  float rmin = 1.0 / (min(abs(dir.x), abs(dir.y)) + red);
  dir = clamp(dir * rmin, vec2(-8.0), vec2(8.0)) * rcp;
  vec3 A = 0.5 * (texture(uSrc, uv + dir * (1.0 / 3.0 - 0.5)).rgb + texture(uSrc, uv + dir * (2.0 / 3.0 - 0.5)).rgb);
  vec3 B = A * 0.5 + 0.25 * (texture(uSrc, uv - dir * 0.5).rgb + texture(uSrc, uv + dir * 0.5).rgb);
  float lB = dot(B, vec3(0.299, 0.587, 0.114));
  oCol = vec4((lB < lMin || lB > lMax) ? A : B, 1.0);
}
