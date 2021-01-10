precision lowp float;

// uniform input values are shared between fragments
// input image
uniform sampler2D u_texture;
// resolution of input image
uniform vec2 u_resolution;

layout(location = 0) out vec4 fragColor;

// varying input values are set by the vertex shader
// texture coordinate of current fragment
in vec2 v_uv;
// TODO: set correct kernel
// kernel for weighting the neighboring pixels
const mat3 kernel = mat3(
    1, 1, 1, // first column
    1, -8, 1, // second column
    1, 1, 1 // third column
);

void main(void)
{
    // TODO - implement laplace
    fragColor = texture(u_texture, v_uv);
}
