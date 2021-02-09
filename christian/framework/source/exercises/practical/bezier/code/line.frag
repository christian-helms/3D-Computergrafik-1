precision lowp float;

layout(location = 0) out vec4 fragColor;

uniform vec3 u_color;

void main(void)
{
    fragColor = vec4(u_color, 1.0);
}
