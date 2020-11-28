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
    vec3 sum;
    vec2 pixel_step = 1.0 / u_resolution;

    for (int i = 0; i < 3; ++i) {
        for (int j = 0; j < 3; ++j) {
            vec2 sample_pos = v_uv + vec2(i, j) * pixel_step;
            float kernel_value = kernel[j + 1][i + 1];
            sum += texture(u_texture, sample_pos).rgb * (-kernel_value);
        }
    }
    fragColor = vec4(clamp(sum, 0.0, 1.0), 1.0);
}
