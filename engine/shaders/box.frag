// the blocks: cast concrete, weathered -- its colour stained over metres, rain streaked down from the top, the ground's
// grime soaked up its foot, cracks, pits, the corners chipped paler; its surface from the same: the sand's grain, the
// pits sunk into it, the cracks' grooves, the cast's corners rounded and chipped (the normal from its height either
// side, the finest of it fading out before it's finer than a pixel)
layout(location = 0) in vec3 vWp; layout(location = 1) in vec3 vN; layout(location = 2) in vec2 vUv;
layout(location = 3) in float vCav;  // (static.vert's: 0, the cube has no cavity)
float noise(vec3 p) { return n3(p); }
float fbm(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * noise(p); p *= 2.07; a *= 0.5; } return s; }
// the surface's height (m) along its normal at p; fw: a pixel there
float ht(vec3 p, float fw) {
  float h = (noise(p * 140.0) - 0.5) * 0.0006 * (1.0 - smoothstep(0.0015, 0.004, fw));   // (the sand's grain)
  h += (fbm(p * 9.0) - 0.5) * 0.0016 * (1.0 - smoothstep(0.006, 0.02, fw));
  float pit = smoothstep(0.9, 0.96, noise(p * 120.0));
  h -= pit * 0.0005 * (1.0 - smoothstep(0.0015, 0.005, fw));
  float cr = abs(fbm(p * 1.7 + vec3(3.1, 0.0, 7.7)) - 0.5);
  h -= 0.0008 * (1.0 - smoothstep(0.0, 0.012, cr)) * smoothstep(0.45, 0.6, noise(p * 0.8 + 11.0)) * (1.0 - smoothstep(0.006, 0.02, fw));
  return h;
}
void main() {
  vec3 n0 = normalize(vN);
  vec3 p = vWp;
  float fw = max(length(fwidth(p)), 1e-4);
  // ---- its colour (linear albedo)
  vec3 tint = lin(mix(uTint, vec3(0.62, 0.60, 0.56), 0.5));
  float stain = fbm(p * 0.55);
  float streak = fbm(vec3(p.x * 7.0, p.y * 0.45, p.z * 7.0));      // (the rain's runs: long down, fine across)
  float top = smoothstep(0.0, 1.2, p.y);
  float grime = 1.0 - smoothstep(0.0, 0.85, p.y + (noise(p * 2.2) - 0.5) * 0.35);
  float cr = abs(fbm(p * 1.7 + vec3(3.1, 0.0, 7.7)) - 0.5);
  float crack = (1.0 - smoothstep(0.0, 0.006, cr)) * smoothstep(0.5, 0.65, noise(p * 0.8 + 11.0));
  float pit = smoothstep(0.9, 0.96, noise(p * 120.0));
  vec3 alb = tint * (0.62 + 0.5 * stain) * (0.9 + 0.2 * noise(p * 23.0));
  alb *= 1.0 - 0.38 * smoothstep(0.45, 0.75, streak) * top;
  alb = mix(alb, alb * vec3(0.42, 0.36, 0.29), grime * 0.7);
  alb *= 1.0 - 0.06 * crack - 0.06 * pit;
  vec2 e2 = min(vUv, 1.0 - vUv);
  float edge = 1.0 - smoothstep(0.0, 0.035, min(e2.x, e2.y) + (noise(p * 9.0) - 0.5) * 0.03);
  alb = mix(alb, tint * 1.3, edge * 0.45);
  float occ = (1.0 - 0.12 * pit) * (1.0 - 0.75 * vCav);
  // ---- its surface: across the face (t1, t2), the height either side
  vec3 an = abs(n0);
  vec3 t1 = an.x > 0.5 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
  vec3 t2 = an.y > 0.5 ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 1.0, 0.0);
  float e = clamp(fw * 0.6, 0.0008, 0.03);
  float h0 = ht(p, fw);
  float h1 = ht(p + t1 * e, fw);
  float h2 = ht(p + t2 * e, fw);
  vec3 n = normalize(n0 - t1 * (h1 - h0) / e - t2 * (h2 - h0) / e);
  // (its corners rounded: the normal turned toward the edge it's near)
  vec2 toE = vec2(vUv.x < 0.5 ? -1.0 : 1.0, vUv.y < 0.5 ? -1.0 : 1.0);
  float ex = 1.0 - smoothstep(0.0, 0.012, e2.x), ey = 1.0 - smoothstep(0.0, 0.012, e2.y);
  vec3 dUx = dFdx(p) * dFdx(vUv).x + dFdy(p) * dFdy(vUv).x;          // (the face's u, v in the world)
  vec3 dUy = dFdx(p) * dFdx(vUv).y + dFdy(p) * dFdy(vUv).y;
  if (dot(dUx, dUx) > 1e-12) n = normalize(n + normalize(dUx) * toE.x * ex * 0.5);
  if (dot(dUy, dUy) > 1e-12) n = normalize(n + normalize(dUy) * toE.y * ey * 0.5);
  float rough = mix(0.9, 0.97, stain) - 0.12 * grime;
  writeG(alb, occ, n, rough, 0.0, vec3(0.0), vWp);
}
