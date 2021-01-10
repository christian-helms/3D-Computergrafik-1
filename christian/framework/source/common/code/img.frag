precision lowp float;

@import ./facade.frag;

uniform sampler2D u_texture;

#if __VERSION__ == 100
    #define fragColor gl_FragColor
#else
    layout(location = 0) out vec4 fragColor;
    #define varying in
#endif

varying vec2 v_uv;

void main(void)
{
    fragColor = texture(u_texture, v_uv);
}
