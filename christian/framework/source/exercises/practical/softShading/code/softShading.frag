precision highp float;

// Adapted from https://github.com/KhronosGroup/glTF-WebGL-PBR

@import ./lighting;
#line 7

layout(location = 0) out vec4 fragColor;

uniform vec4 u_color;

in vec3 v_position;
in vec3 v_normal;
in vec3 v_lightDir;

void main(void)
{
    vec3 lightDir = v_lightDir;
    vec3 normal = normalize(v_normal);
    vec3 color = lighting(
        v_position,
        normal,
        u_color.rgb,
        u_color.rgb,
        vec3(0.8, 0.9, 1.0),
        10.0,
        lightDir
    );

    fragColor = vec4(color, 1.0);
}
