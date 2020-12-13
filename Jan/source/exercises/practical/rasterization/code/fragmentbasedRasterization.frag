precision lowp float;

layout(location = 0) out vec4 fragColor;

// position in texture [0.0, 1.0]^2
in vec2 v_uv;

// resolution of the canvas in pixels
uniform vec2 u_resolution;
// triangle points
uniform vec2 u_vertices[3];

// vertex colors
uniform vec3 u_colors[3];

void main(void) {
  // TODO: return the correct color
  vec2 v0v1 = u_vertices[1] - u_vertices[0];
  vec2 v0v2 = u_vertices[2] - u_vertices[0];

  float alpha = (v_uv.x * v0v2.y - v_uv.y * v0v2.x + u_vertices[0].y * v0v2.x -
                 u_vertices[0].x * v0v2.y) /
                (v0v1.x * v0v2.y - v0v2.x * v0v1.y);
  float beta = -(v_uv.x * v0v1.y - v_uv.y * v0v1.x + v0v1.x * u_vertices[0].y -
                 u_vertices[0].x * v0v1.y) /
               (v0v1.x * v0v2.y - v0v2.x * v0v1.y);
  float gamma = 1.0 - alpha - beta;
  if (alpha < 0.0 || beta < 0.0 || gamma < 0.0)
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
  else {
    float r =
        alpha * u_colors[0].r + beta * u_colors[1].r + gamma * u_colors[2].r;
    float g =
        alpha * u_colors[0].g + beta * u_colors[1].g + gamma * u_colors[2].g;
    float b =
        alpha * u_colors[0].b + beta * u_colors[1].b + gamma * u_colors[2].b;
    fragColor = vec4(r, g, b, 1.0);
  }
}
