precision lowp float;

layout(location = 0) out vec4 fragColor;

uniform vec3 u_color;

void main(void)
{
    vec2 pos = gl_PointCoord * 2.0 - 1.0;
    float dist = length(pos);
    fragColor = vec4(u_color, step(dist, 1.0));
}
