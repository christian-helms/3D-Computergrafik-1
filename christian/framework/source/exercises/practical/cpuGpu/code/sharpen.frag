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

// kernel for weighting the neighboring pixels
const mat3 kernel = mat3(
    0, -1, 0, // first column
    -1, 5, -1, // second column
    0, -1, 0 // third column
);

void main(void)
{
    // prepare sum
    vec3 sum;

    // calculate the size of a pixel in texture coordinates
    vec2 pixelStep = 1.0 / u_resolution;

    // storage for intermediate values
    vec2 samplePos;
    float kernelValue;

    // loop over kernel
    for(int i = -1; i <= 1; i++) {
        for(int j = -1; j <= 1; j++) {
            // position to be sampled - center plus offset
            samplePos = pixelStep * vec2(i, j) + v_uv;
            // read pixel weight from kernel
            kernelValue = kernel[j + 1][i + 1];
            // sample pixel, apply weight and add to sum
            sum += texture(u_texture, samplePos).rgb * kernelValue;
        }
    }

    // clamp the output to avoid artifacts and store it as output
    fragColor = vec4(clamp(sum, 0.0, 1.0), 1.0);
}
