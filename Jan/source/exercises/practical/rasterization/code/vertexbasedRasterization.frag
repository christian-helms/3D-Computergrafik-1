precision lowp float;

// TODO: use vertex and fragment shader together to create the same result

layout(location = 0) out vec4 fragColor;

uniform vec3 u_colors[3];
in vec3 barycentric;

void main(void) {
  // TODO: return the correct color
  float r = barycentric.x * u_colors[0].r + barycentric.y * u_colors[1].r +
            barycentric.z * u_colors[2].r;
  float g = barycentric.x * u_colors[0].g + barycentric.y * u_colors[1].g +
            barycentric.z * u_colors[2].g;
  float b = barycentric.x * u_colors[0].b + barycentric.y * u_colors[1].b +
            barycentric.z * u_colors[2].b;
  fragColor = vec4(r, g, b, 1.0);
}
