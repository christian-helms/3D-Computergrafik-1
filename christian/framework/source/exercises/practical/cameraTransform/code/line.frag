precision lowp float;

layout(location = 0) out vec4 fragColor;

uniform vec3 u_lineColor;

void main(void)
{
    fragColor = vec4(u_lineColor, 1.0);
}
