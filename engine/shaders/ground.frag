// the ground: a dry yard of packed dirt -- its colour mottled over metres and centimetres (sun-bleached, damp darker in
// the hollows), patches of dry grass, a fine grain of sand in it; its surface from the same: the lie of the land, the
// small clods and ruts of trodden dirt, the grit (the normal from its height either side, the finest of it fading out
// before it's finer than a pixel)
in vec3 vWp;
float hash(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p, int oct) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 6; i++) { if (i >= oct) break; s += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return s;
}
// the ground's height (m) at p; fw: a pixel there (the detail finer than that left out)
float ht(vec2 p, float fw) {
  float h = (fbm(p * 0.35, 4) - 0.5) * 0.05;                       // the lie of the land: a few cm over metres
  h += (fbm(p * 2.2, 4) - 0.5) * 0.007 * (1.0 - smoothstep(0.02, 0.07, fw));          // (ruts, trodden lumps)
  h += (fbm(p * 11.0, 3) - 0.5) * 0.0028 * (1.0 - smoothstep(0.006, 0.02, fw));       // (small clods)
  h += (noise(p * 52.0) - 0.5) * 0.0011 * (1.0 - smoothstep(0.002, 0.007, fw));      // (the grit)
  return h;
}
void main() {
  vec2 p = vWp.xz;
  float fw = max(length(fwidth(p)), 1e-4);
  // ---- its colour (linear albedo)
  float m = fbm(p * 0.08, 5);
  float big = fbm(p * 0.35, 5);
  float fine = fbm(p * 2.4, 4);
  vec3 dirt = vec3(0.235, 0.185, 0.135) * (0.72 + 0.5 * big) * (0.88 + 0.24 * fine);
  dirt = mix(dirt, dirt * vec3(1.06, 0.98, 0.9), smoothstep(0.4, 0.7, fbm(p * 0.6 + 9.0, 3)));   // (sun-bleached)
  float clump = smoothstep(0.50, 0.66, m + (fbm(p * 1.3, 4) - 0.5) * 0.5);
  vec3 grass = mix(vec3(0.11, 0.115, 0.045), vec3(0.24, 0.21, 0.09), fbm(p * 3.0, 4)) * (0.7 + 0.6 * noise(p * 11.0));
  vec3 alb = mix(dirt, grass, clump);
  float hollow = smoothstep(0.55, 0.75, fbm(p * 0.22 + 5.0, 4));
  alb *= 1.0 - 0.3 * hollow;                                       // (damp: darker)
  // (the sand's grain: each speck its own shade, gone before it's finer than a pixel)
  alb *= 1.0 + (noise(p * 140.0) - 0.5) * 0.22 * (1.0 - smoothstep(0.0015, 0.005, fw));
  alb *= 1.0 + (noise(p * 31.0) - 0.5) * 0.16 * (1.0 - smoothstep(0.005, 0.02, fw));
  float occ = 1.0 - 0.2 * hollow;
  // ---- its surface
  float e = clamp(fw * 0.6, 0.0015, 0.05);
  float h0 = ht(p, fw);
  float hx = ht(p + vec2(e, 0.0), fw);
  float hz = ht(p + vec2(0.0, e), fw);
  vec3 n = normalize(vec3(-(hx - h0) / e, 1.0, -(hz - h0) / e));
  float rough = mix(0.96, 0.88, clump);
  rough = mix(rough, 0.9, hollow * 0.5);
  writeG(alb, occ, n, rough, 0.0, vec3(0.0), vWp);
}
