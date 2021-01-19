precision lowp float;
layout(location = 0) out vec4 fragColor;

// position in texture [0.0, 1.0]^2
in vec2 v_uv;
uniform sampler2D u_texture;

void main(void)
{
    fragColor = texture(u_texture, v_uv);
}
