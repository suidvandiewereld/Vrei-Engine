#version 330 core
// the shadow map's depth (the extension: RX_DEPTH_FS -- what to leave out of it)
#pragma ext
void main() { ext_fragment(); }
