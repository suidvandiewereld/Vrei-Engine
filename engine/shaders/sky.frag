// the sky: marked far off -- its light is the lighting pass's (shaders/shade.frag skyL: the game's own gradient, the
// sun's disc and glow)
in vec2 vNdc;
void main() {
  gAlb = vec4(0.0);
  gNrm = vec4(0.0);
  gObj = vec4(0.0, 0.0, 0.0, 1000.0);
  gEmi = vec4(0.0);
}
