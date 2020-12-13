precision mediump float;

// uniform input values are shared between fragments
// input image
uniform sampler2D u_image;
// LUT
uniform sampler2D u_lut;
// LUT resolution for one component (4, 8, 16, ...)
uniform float u_resolution;

layout(location = 0) out vec4 fragColor;

// varying input values are set by the vertex shader
// texture coordinate of current fragment
in vec2 v_uv;

void main(void) {
  // TODO: use the LUT to apply effects to the input texture
  // hint: use texelFetch to get a texture value without interpolation
  // this will require an integer vector (ivec2)
  vec4 oldcol = texture(u_image, v_uv);
  fragColor = vec4(
      texture(u_lut,
              vec2(float(int(oldcol.b * u_resolution)) / u_resolution +
                       oldcol.r / u_resolution,
                   oldcol.g))
          .rgb,
      1.0);
}
