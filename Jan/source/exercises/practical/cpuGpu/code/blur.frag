precision lowp float;

// uniform input values are shared between fragments
// input image
uniform sampler2D u_texture;
// resolution of input image
uniform vec2 u_resolution;
// radius for blur kernel
uniform float u_radius;

layout(location = 0) out vec4 fragColor;

// varying input values are set by the vertex shader
// texture coordinate of current fragment
in vec2 v_uv;

void main(void)
{
    vec3 sum;
    vec2 pixel_step = 1.0 / u_resolution;
    float kernel_size = 2.0 * u_radius + 1.0;
    int k = int(u_radius);
    // loop over kernel
    for (int i = -k; i <= k; ++i)
        for (int j = -k; j <= k; ++j) {
            vec2 sample_pos = v_uv + pixel_step * vec2(i, j);
            sum += texture(u_texture, sample_pos).rgb;
        }
    sum /= kernel_size * kernel_size;
    
    fragColor = vec4(clamp(sum, 0.0, 1.0), 1.0);
}

