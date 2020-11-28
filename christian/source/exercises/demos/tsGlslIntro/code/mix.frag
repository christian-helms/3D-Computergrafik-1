precision lowp float;

// shader stage outputs
layout(location = 0) out vec4 fragColor;

// uniform input values are shared between fragments
// input images
uniform sampler2D u_textureA;
uniform sampler2D u_textureB;

// varying input values are set by the vertex shader
// texture coordinate of current fragment
in vec2 v_uv;

void main(void)
{
    vec4 a = texture(u_textureA, v_uv);
    vec4 b = texture(u_textureB, v_uv);

    fragColor = mix(a, b, 0.5);
}
