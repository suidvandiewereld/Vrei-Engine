#version 330 core
// THE FRAME, 3b: the glow's chain up: each smaller level spread by a 3x3 tent and added onto the one above it (the
// blend adds), so the glow has every width at once -- a tight core, a wide breath
uniform sampler2D uSrc;
uniform vec2 uTexel;           // the source's texel
uniform float uRadius;
in vec2 vNdc;
out vec4 oB;
void main() {
  vec2 uv = vNdc * 0.5 + 0.5;
  vec2 t = uTexel * uRadius;
  vec3 s = texture(uSrc, uv).rgb * 4.0;
  s += (texture(uSrc, uv + vec2(-t.x, 0)).rgb + texture(uSrc, uv + vec2(t.x, 0)).rgb
      + texture(uSrc, uv + vec2(0, -t.y)).rgb + texture(uSrc, uv + vec2(0, t.y)).rgb) * 2.0;
  s += texture(uSrc, uv + vec2(-t.x, -t.y)).rgb + texture(uSrc, uv + vec2(t.x, -t.y)).rgb
     + texture(uSrc, uv + vec2(-t.x, t.y)).rgb + texture(uSrc, uv + vec2(t.x, t.y)).rgb;
  oB = vec4(s / 16.0, 1.0);
}
