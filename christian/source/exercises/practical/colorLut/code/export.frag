precision mediump float;

// LUT resolution for one component (4, 8, 16, ...)
uniform float u_resolution;

layout(location = 0) out vec4 fragColor;

// texture coordinate of current fragment
in vec2 v_uv;

void main(void)
{
    // TODO: generate a NxNxN color LUT, stored as N*N by N pixel 2D image
    fragColor = vec4(v_uv.x, v_uv.y, 0.0, 1.0);
}
