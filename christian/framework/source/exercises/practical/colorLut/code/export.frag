precision mediump float;

// LUT resolution for one component (4, 8, 16, ...)
uniform float u_resolution;

layout(location = 0) out vec4 fragColor;

// texture coordinate of current fragment
in vec2 v_uv;

void main(void)
{
    // TODO: generate a NxNxN color LUT, stored as N*N by N pixel 2D image
    ivec2 pixel_coords = ivec2(
        v_uv.x * u_resolution * u_resolution,
        v_uv.y * u_resolution
    );
    int r = pixel_coords.x % int(u_resolution);
    int g = pixel_coords.y;
    int b = pixel_coords.x / int(u_resolution);
    vec3 color = vec3(r, g, b) / (u_resolution - 1.0);
    fragColor = vec4(color, 1.0);
}
