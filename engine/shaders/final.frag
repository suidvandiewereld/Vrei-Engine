#version 330 core
// THE FRAME, 3: the lens and the film -- the scene's light (HDR) as a camera would take it:
//   the glow      the bloom chain (shaders/bloom_*): a little of the light spread at every width, as a lens does
//   the extension what the game puts between the lens and the scene (RX_FINAL_FS): where each pixel is seen from
//                 (ext_final_offset), then the scene's light changed (ext_final)
//   the exposure  then Reinhard's operator (extended, on luminance) and the sRGB curve
//   the lens      its corners a little darker; a fine grain over it
// Out: the display colour, a: its luma (for FXAA).
in vec2 vNdc;
uniform sampler2D uHdrT;       // the scene's light
uniform sampler2D uBloomT;     // the glow's chain (half size, every level summed)
uniform vec2 uScreen;
uniform float uExposure;
uniform float uBloom;
uniform float uTime;
uniform vec3 uSunCol;
out vec4 oCol;

const vec3 L3 = vec3(0.2126, 0.7152, 0.0722);
// REINHARD (Reinhard et al. 2002, extended): the scene's luminance L to the display's, L (1 + L / W^2) / (1 + L) --
// the darks and the mids near as they are, the lights rolled off toward white, reaching it at W; the colour scaled
// with its luminance (its hue held), what goes past 1 in a channel clipped; then the sRGB curve
const float WHITE = 6.0;
vec3 reinhard(vec3 c) {
  float L = dot(c, L3);
  float Ld = L * (1.0 + L / (WHITE * WHITE)) / (1.0 + L);
  return clamp(c * (Ld / max(L, 1e-6)), 0.0, 1.0);
}
vec3 srgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
#pragma ext


void main() {
  ivec2 ip = ivec2(gl_FragCoord.xy);
  vec2 uv = gl_FragCoord.xy / uScreen;
  vec2 suv = clamp(uv + ext_final_offset(ip, uv), vec2(0.0), vec2(1.0));
  vec3 c = texture(uHdrT, suv).rgb;
  if (any(isnan(c)) || any(isinf(c))) c = vec3(0.0);
  // the glow: a little of every width of it (the chain sums its six levels)
  vec3 bloom = texture(uBloomT, suv).rgb / 6.0;
  c = mix(c, bloom, uBloom);
  c = ext_final(c, uv);
  // the lens: its corners darker (natural vignetting, gentle)
  vec2 uvc = uv - 0.5;
  float vig = dot(uvc * vec2(uScreen.x / uScreen.y, 1.0), uvc * vec2(uScreen.x / uScreen.y, 1.0));
  c *= 1.0 / (1.0 + vig * 0.55);
  vec3 d = srgb(reinhard(c * uExposure));
  // the film's grain, faint, finer in the lights
  float gn = fract(sin(dot(gl_FragCoord.xy + floor(uTime * 24.0) * vec2(17.3, 41.9), vec2(12.9898, 78.233))) * 43758.5453);
  d += (gn - 0.5) * 0.012 * (1.0 - 0.6 * dot(d, L3));
  d = clamp(d, 0.0, 1.0);
  oCol = vec4(d, dot(d, vec3(0.299, 0.587, 0.114)));
}
