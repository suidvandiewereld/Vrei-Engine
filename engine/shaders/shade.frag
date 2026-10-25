#version 330 core
// THE FRAME, 2: the light -- once a pixel, from the G-buffer, physically: every surface's albedo, normal, roughness
// and metalness lit by
//   the sun      a low warm sun, its light through two cascades of shadow map (soft-edged: sixteen taps on a rotated
//                disc), Lambert's diffuse and a GGX highlight (Smith's visibility, Schlick's Fresnel)
//   the sky      the game's own sky (its gradient, the sun's glow) as the light from everywhere else: the sky above,
//                the ground's bounce below (diffuse), the sky reflected along the mirror direction, blurred with
//                roughness (the split-sum's analytic fit), both shut out where the surface is occluded (ambient
//                occlusion, shaders/ao.frag, and the material's own creases)
//   the air      the haze with distance, lit toward the sun
// the extension (RX_LIGHT_FS) lays what it will over each surface before it's lit (ext_light_pre, before the sky's
// pixels leave -- their derivatives need every pixel; ext_light_surface), says where the surface is a mirror for the
// scene (ext_light_mirror: screen-space reflection off last frame), and adds light of its own (ext_light_extra).
// FLESH carries the light under its surface and gives it out red: its sun wraps past the terminator (the red furthest,
// the blue least), its creases not as dark
// The sky pixels: the sky itself.
// Out: the scene's light (HDR, linear).
in vec2 vNdc;
uniform sampler2D uAlbT;       // albedo (sRGB), occlusion
uniform sampler2D uNrmT;       // normal, roughness
uniform sampler2D uObjT;       // id, class, metalness, distance
uniform sampler2D uEmiT;       // the light given off (sRGB, an eighth)
uniform sampler2D uDepthT;
uniform sampler2D uAOT;        // ambient occlusion (shaders/ao.frag, blurred)
uniform sampler2D uPrevT;      // last frame's light (what the wet surfaces reflect)
uniform sampler2DShadow uShadow;   // the sun's shadow map: two cascades side by side
uniform mat4 uLightVP0;
uniform mat4 uLightVP1;
uniform vec2 uCascTexel;       // each cascade's texel (m)
uniform vec2 uScreen;
uniform mat4 uVP;
uniform mat4 uInvVP;
uniform mat4 uPrevVP;          // last frame's (where a point was on its frame)
uniform vec3 uCamPos;
uniform vec3 uSunDir;          // toward the sun
uniform vec3 uSunCol;          // its light (the irradiance it gives, over pi)
uniform vec3 uSkyCol;          // the sky's light from above, averaged
uniform vec3 uGndCol;          // the ground's from below
uniform vec3 uFogCol;
uniform float uFogDen;
out vec4 oC;

const float PI = 3.14159265;
vec3 lin(vec3 c) { return pow(max(c, vec3(0.0)), vec3(2.2)); }
ivec2 clampPx(ivec2 p) { return clamp(p, ivec2(0), ivec2(uScreen) - 1); }
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }

// ---------------------------------------------------------------- the sky
// the game's own sky (its gradient, the haze at the horizon, the ground below it, the sun's glow; disc: its disc too)
vec3 skyL(vec3 d, float disc) {
  float h = d.y;
  vec3 zen = vec3(0.16, 0.30, 0.62);
  vec3 hor = vec3(0.86, 0.74, 0.58);
  vec3 c = mix(hor, zen, pow(clamp(h, 0.0, 1.0), 0.45));
  c = mix(c, uFogCol, clamp(1.0 - h * 6.0, 0.0, 1.0) * 0.6);
  if (h < 0.0) c = mix(uFogCol, uGndCol * 0.6, clamp(-h * 4.0, 0.0, 1.0));
  float s = max(dot(d, uSunDir), 0.0);
  c += uSunCol * (pow(s, 900.0) * 6.0 * disc + pow(s, 12.0) * 0.12);
  return c;
}

// ---------------------------------------------------------------- the sun's shadow
const vec2 POISSON[16] = vec2[16](
  vec2(-0.94201624, -0.39906216), vec2(0.94558609, -0.76890725), vec2(-0.09418410, -0.92938870), vec2(0.34495938, 0.29387760),
  vec2(-0.91588581, 0.45771432), vec2(-0.81544232, -0.87912464), vec2(-0.38277543, 0.27676845), vec2(0.97484398, 0.75648379),
  vec2(0.44323325, -0.97511554), vec2(0.53742981, -0.47373420), vec2(-0.26496911, -0.41893023), vec2(0.79197514, 0.19090188),
  vec2(-0.24188840, 0.99706507), vec2(-0.81409955, 0.91437590), vec2(0.19984126, 0.78641367), vec2(0.14383161, -0.14100790));
// cascade k at wp (pushed out along its normal by its texels): -1 off it, else how much of the sun reaches
float cascade(int k, vec3 wp, vec3 n, float ndl, float rot) {
  float tx = k == 0 ? uCascTexel.x : uCascTexel.y;
  vec3 q = wp + n * tx * (1.2 + 2.5 * (1.0 - ndl));
  vec4 lp = (k == 0 ? uLightVP0 : uLightVP1) * vec4(q, 1.0);
  vec3 c = lp.xyz / lp.w * 0.5 + 0.5;
  if (c.x < 0.02 || c.x > 0.98 || c.y < 0.02 || c.y > 0.98 || c.z > 1.0) return -1.0;
  float bias = (k == 0 ? 0.00006 : 0.00025);
  float rad = k == 0 ? 1.9 : 1.4;
  vec2 ts = vec2(1.0 / 4096.0, 1.0 / 2048.0) * rad;
  float cs = cos(rot), sn = sin(rot);
  float s = 0.0;
  for (int i = 0; i < 16; i++) {
    vec2 o = vec2(cs * POISSON[i].x - sn * POISSON[i].y, sn * POISSON[i].x + cs * POISSON[i].y);
    s += texture(uShadow, vec3(vec2((c.x + float(k)) * 0.5, c.y) + o * ts, c.z - bias));
  }
  return s / 16.0;
}
float sunShadow(vec3 wp, vec3 n, float ndl, float rot) {
  float s0 = cascade(0, wp, n, ndl, rot);
  float s1 = cascade(1, wp, n, ndl, rot);
  if (s0 < 0.0) return s1 < 0.0 ? 1.0 : s1;
  // (across the near cascade's last stretch, into the far one)
  vec4 lp = uLightVP0 * vec4(wp, 1.0);
  vec2 c = abs(lp.xy / lp.w);
  float edge = smoothstep(0.82, 0.94, max(c.x, c.y));
  return s1 < 0.0 ? s0 : mix(s0, s1, edge);
}

// ---------------------------------------------------------------- the surface's response
float D_GGX(float nh, float a) { float a2 = a * a; float d = nh * nh * (a2 - 1.0) + 1.0; return a2 / (PI * d * d); }
float V_Smith(float nv, float nl, float a) {
  float a2 = a * a;
  float gv = nl * sqrt(nv * nv * (1.0 - a2) + a2);
  float gl = nv * sqrt(nl * nl * (1.0 - a2) + a2);
  return 0.5 / max(gv + gl, 1e-5);
}
vec3 F_Schlick(vec3 f0, float vh) { return f0 + (1.0 - f0) * pow(1.0 - vh, 5.0); }
// the split-sum's environment term, fitted (Karis / Lazarov): its scale and bias on F0
vec2 envBRDF(float nv, float r) {
  const vec4 c0 = vec4(-1.0, -0.0275, -0.572, 0.022);
  const vec4 c1 = vec4(1.0, 0.0425, 1.04, -0.04);
  vec4 r4 = r * c0 + c1;
  float a004 = min(r4.x * r4.x, exp2(-9.28 * nv)) * r4.x + r4.y;
  return vec2(-1.04, 1.04) * a004 + r4.zw;
}
// the sky's light from all round a normal (diffuse irradiance over pi): the sky above, the ground's bounce below
vec3 skyIrr(vec3 n) { return mix(uGndCol, uSkyCol, n.y * 0.5 + 0.5); }
// the sky along the mirror direction r, blurred as the surface is rough
vec3 skyRefl(vec3 r, float rough) {
  vec3 sharp = skyL(r, 0.0);
  return mix(sharp, skyIrr(r) * 1.1, smoothstep(0.15, 0.85, rough));
}

// the scene reflected along r from p: a march in screen space against this frame's depth, the light where it lands
// taken from last frame (where that point was on it); else the sky that way
vec3 reflection(vec3 p, vec3 r, float rough) {
  float t = 0.04;
  for (int i = 0; i < 26; i++) {
    vec3 x = p + r * t;
    vec4 cl = uVP * vec4(x, 1.0);
    if (cl.w <= 0.0) break;
    vec2 uv = cl.xy / cl.w * 0.5 + 0.5;
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) break;
    ivec2 q = ivec2(uv * uScreen);
    float sd = texelFetch(uObjT, q, 0).w;
    float rd = distance(x, uCamPos);
    if (sd < 900.0 && rd > sd + 0.01 && rd < sd + max(0.25, t * 0.3)) {
      vec4 pc = uPrevVP * vec4(x, 1.0);
      vec2 pv = pc.xy / pc.w * 0.5 + 0.5;
      vec2 e = smoothstep(vec2(0.0), vec2(0.07), uv) * smoothstep(vec2(1.0), vec2(0.93), uv);
      vec3 sky = skyRefl(r, rough);
      if (pc.w <= 0.0 || pv.x < 0.0 || pv.x > 1.0 || pv.y < 0.0 || pv.y > 1.0) return sky;
      return mix(sky, texture(uPrevT, pv).rgb, e.x * e.y);
    }
    t *= 1.32;
  }
  return skyRefl(r, rough);
}

#pragma ext

void main() {
  ivec2 ip = ivec2(gl_FragCoord.xy);
  vec4 ob = texelFetch(uObjT, ip, 0);
  float D = ob.w;
  int cls = int(ob.y + 0.5);
  vec4 ra = uInvVP * vec4(vNdc, -1.0, 1.0);
  vec4 rb = uInvVP * vec4(vNdc, 1.0, 1.0);
  vec3 vd = normalize(rb.xyz / rb.w - ra.xyz / ra.w);          // (the view ray, out from the eye)
  float dz = texelFetch(uDepthT, ip, 0).r;
  vec4 wq = uInvVP * vec4(vNdc, dz * 2.0 - 1.0, 1.0);
  vec3 wp = wq.xyz / wq.w;
  vec3 dpx = dFdx(wp), dpy = dFdy(wp);
  vec4 al = texelFetch(uAlbT, ip, 0);
  vec4 nr = texelFetch(uNrmT, ip, 0);
  vec3 N = normalize(nr.xyz + 1e-6);
  vec3 base = lin(al.rgb);
  float rough = nr.w;
  float metal = ob.z;
  float occ = al.a * texelFetch(uAOT, ip, 0).r;
  vec4 em = texelFetch(uEmiT, ip, 0);
  vec3 emit = lin(em.rgb) * 8.0;
  float sss = em.a;
  ext_light_pre(wp, N, cls, D, dpx, dpy);
  if (D > 900.0) { oC = vec4(skyL(vd, 1.0), 1.0); return; }
  ext_light_surface(wp, cls, dpx, dpy, base, rough, metal, N);
  // ---- the light
  vec3 V = -vd;
  float nv = max(dot(N, V), 1e-4);
  vec3 f0 = mix(vec3(0.04), base, metal);
  vec3 dif = base * (1.0 - metal);
  float a = max(rough * rough, 0.002);
  // the sun
  float ndl = dot(N, uSunDir);
  vec3 c = vec3(0.0);
  vec3 ww = vec3(0.6, 0.24, 0.16) * sss;                          // (the wrap: flesh's red reaches round furthest)
  vec3 dl = clamp((ndl + ww) / (1.0 + ww), 0.0, 1.0);
  if (dl.r > 0.0) {
    float nl = max(ndl, 0.0);
    float sh = sunShadow(wp, N, max(ndl, 0.05), ign(gl_FragCoord.xy) * 6.2831853);
    vec3 H = normalize(uSunDir + V);
    float nh = max(dot(N, H), 0.0);
    float vh = max(dot(V, H), 0.0);
    vec3 F = F_Schlick(f0, vh);
    float as = max(a, 0.004);                                    // (the sun's a disc, not a point: no infinite glint)
    vec3 spec = nl > 0.0 ? D_GGX(nh, as) * V_Smith(nv, nl, as) * F : vec3(0.0);
    // (the sun's irradiance: pi x its colour -- Lambert's 1 / pi cancels it on the diffuse)
    c += (dif * (1.0 - F) * dl + spec * PI * nl) * uSunCol * sh;
  }
  // the sky: diffuse from all round, the reflection along the mirror direction -- both shut out by the occlusion
  vec2 ab = envBRDF(nv, rough);
  vec3 Fe = f0 * ab.x + ab.y;
  vec3 docc = mix(vec3(occ), sqrt(vec3(occ)) * vec3(1.0, 0.8, 0.75), sss);   // (light under flesh's creases)
  c += dif * skyIrr(N) * docc * (1.0 - Fe);
  vec3 R = reflect(vd, N);
  float so = clamp(pow(nv + occ, exp2(-16.0 * rough - 1.0)) - 1.0 + occ, 0.0, 1.0);   // (Lagarde's specular occlusion)
  vec3 env = ext_light_mirror() > 0.01 ? reflection(wp + N * 0.01, R, rough) : skyRefl(R, rough);
  if (R.y < 0.0) env = mix(env, uGndCol * 0.9, clamp(-R.y * 3.0, 0.0, 1.0) * (1.0 - ext_light_ground_mask()));   // (the ground, not the sky)
  c += env * Fe * so;
  c += ext_light_extra();
  c += emit;
  // ---- the air: the haze with distance, lit toward the sun
  float fog = 1.0 - exp(-max(D - 6.0, 0.0) * uFogDen);
  vec3 fogC = uFogCol + uSunCol * 0.22 * pow(max(dot(vd, uSunDir), 0.0), 6.0);
  c = mix(c, fogC, clamp(fog, 0.0, 1.0));
  // (never past what a half float holds, never not a number: one bad pixel would spread through the glow's chain)
  if (any(isnan(c)) || any(isinf(c))) c = vec3(0.0);
  oC = vec4(min(c, vec3(30000.0)), 1.0);
}
