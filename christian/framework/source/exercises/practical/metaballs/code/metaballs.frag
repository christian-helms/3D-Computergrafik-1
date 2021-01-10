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

void main(void)
{
    // TODO: implement metaball visualization
    // set fragColor to set the color of the pixel
    fragColor = vec4(1.0, 0.0, 1.0, 1.0);
}
