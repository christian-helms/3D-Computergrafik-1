precision mediump float;

uniform float u_radius;

layout(location = 0) out vec4 fragColor;

in vec2 v_uv;

void main(void)
{
    vec3 inner = vec3(0.8);
    vec3 outer = vec3(0.6);
    float isInRadius = step(length(v_uv), u_radius);
    vec3 color = mix(outer, inner, isInRadius);
    fragColor = vec4(color, 1.0);
}
