precision mediump float;

// LUT resolution for one component (4, 8, 16, ...)
uniform float u_resolution;

layout(location = 0) out vec4 fragColor;

// texture coordinate of current fragment
in vec2 v_uv;

void main(void) {
  // TODO: generate a NxNxN color LUT, stored as N*N by N pixel 2D image
  fragColor = vec4(mod(float(int(u_resolution * u_resolution * v_uv.x)), u_resolution)/ u_resolution,
                   float(int(u_resolution * v_uv.y))/ u_resolution,
                   float(int(u_resolution * v_uv.x))/ u_resolution, 1.0);
}
