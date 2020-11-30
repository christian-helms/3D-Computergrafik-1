precision lowp float;

layout(location = 0) out vec4 fragColor;

// position in texture [0.0, 1.0]^2
in vec2 v_uv;

// factor to scale all metaballs
uniform float u_radiusFactor;
// resolution of the canvas in pixels
uniform vec2 u_resolution;
// visualization mode index
uniform int u_mode;
// metaballs
uniform vec3 u_metaballs[$NUMBER_OF_METABALLS];
const float PI = 3.1415926535897932384626433832795;

void main(void) {
  // TODO: implement metaball visualization
  // set fragColor to set the color of the pixel
  float density = 0.0;
  for (int i = 0; i < $NUMBER_OF_METABALLS; i++) {
    vec2 mb = u_metaballs[i].xy;
    vec2 dist = mb - v_uv;
    float tmp = u_radiusFactor / sqrt(dist.x * dist.x + dist.y * dist.y);
    density += tmp * tmp;
  }
  vec4 color = vec4(0, 0, 0, 1);
  if (density >= 250.0)
    color = vec4(1, 1, 1, 1);
  density = sqrt(density);
  if (u_mode == 1)
    color = vec4(sin(density), sin(density + 2.0 * PI / 3.0),
                 sin(density + 4.0 * PI / 3.0), 1);
  fragColor = color;
}
