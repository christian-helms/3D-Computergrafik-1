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
    // TODO - implement blur
    fragColor = texture(u_texture, v_uv);
}
