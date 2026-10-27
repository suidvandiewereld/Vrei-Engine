// a mesh as what it's made of: its colour, its roughness and metalness, its normal map (the surface texture's r g,
// b a), the sculpt's creases occluding the light (the cavity), a hit's flash. Back faces (double-sided meshes) take the
// flipped normal. The extension (RX_SURFACE_FS) may throw a fragment away first (ext_clip) and changes the surface
// after (ext_surface): what it's made of, the light it gives off, a height over it (m) that bends its normal.
layout(location = 0) in vec3 vWp; layout(location = 1) in vec3 vN; layout(location = 2) in vec2 vUv;
layout(location = 3) in float vCav;
#define uTex T2[DR.tex.x]      // the colour (sRGB)
#define uSurf T2[DR.tex.y]     // r roughness, g metalness, b a the normal map's x y
// a little height over the surface (m) bends its normal (Mikkelsen's surface gradient, by the screen's derivatives)
vec3 bumpH(vec3 n, float h) {
  vec3 dpx = dFdx(vWp), dpy = dFdy(vWp);
  vec3 r1 = cross(dpy, n), r2 = cross(n, dpx);
  float det = dot(dpx, r1);
  float dhx = dFdx(h), dhy = dFdy(h);
  if (abs(det) < 1e-14) return n;
  vec3 g = sign(det) * (dhx * r1 + dhy * r2);
  float gl = length(g), lim = 0.8 * abs(det);
  if (gl > lim) g *= lim / gl;
  return normalize(abs(det) * n - g);
}

#pragma ext

void main() {
  ext_clip();
  vec3 ng = normalize(gl_FrontFacing ? vN : -vN);
  vec4 sf = texture(uSurf, vUv);
  vec3 tn = vec3(sf.b * 2.0 - 1.0, sf.a * 2.0 - 1.0, 0.0);
  tn.z = sqrt(max(1.0 - dot(tn.xy, tn.xy), 0.0));
  vec3 n = normalize(cotangentFrame(ng, vWp, vUv) * tn + ng * 0.02);
  if (dot(n, ng) < 0.05) n = normalize(n + ng * (0.05 - dot(n, ng)));
  vec3 tc = texture(uTex, vUv).rgb;
  vec3 alb = lin(tc) * uTint;
  float rough = sf.r;
  float metal = sf.g;
  float occ = 1.0 - 0.75 * vCav;
  vec3 emit = vec3(1.0, 0.45, 0.15) * uGlow * 3.0;
  float H = 0.0;
  ext_surface(tc, alb, rough, metal, occ, emit, H);
  n = bumpH(n, H);
  writeG(alb, occ, n, rough, metal, emit, vWp);
}
