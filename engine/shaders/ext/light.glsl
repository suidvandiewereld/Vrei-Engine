// the default extension: nothing laid over the surfaces before they're lit
void ext_light_pre(vec3 wp, vec3 N, int cls, float D, vec3 dpx, vec3 dpy) {}
void ext_light_surface(vec3 wp, int cls, vec3 dpx, vec3 dpy, inout vec3 base, inout float rough, inout float metal, inout vec3 N) {}
float ext_light_mirror() { return 0.0; }
float ext_light_ground_mask() { return 0.0; }
vec3 ext_light_extra() { return vec3(0.0); }
