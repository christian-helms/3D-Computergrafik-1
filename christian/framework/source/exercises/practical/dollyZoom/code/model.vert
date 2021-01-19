precision highp float;

// Adapted from https://github.com/KhronosGroup/glTF-WebGL-PBR

const int HAS_NORMALS           = 1;
const int HAS_UV                = 1 << 2;
const int HAS_COLORS            = 1 << 3;

layout (location = 0) in vec4 a_position;
layout (location = 1) in vec3 a_normal;
layout (location = 3) in vec2 a_texcoord_0;
layout (location = 8) in vec4 a_color;

uniform mat4 u_model;
uniform mat4 u_viewProjection;

uniform mediump int u_geometryFlags;

out vec2 v_uv;
out vec4 v_color;
out vec3 v_position;
out vec3 v_normal;

const float M_PI = 3.14159;

bool checkFlag(int flag) {
    return (u_geometryFlags & flag) == flag;
}

void main(void)
{
    vec4 pos = u_model * a_position;
    v_position = vec3(pos.xyz) / pos.w;

    if (checkFlag(HAS_NORMALS)) {
        v_normal = normalize(vec3(u_model * vec4(a_normal.xyz, 0.0)));
    }

    if (checkFlag(HAS_UV)) {
        v_uv = a_texcoord_0;
    } else {
        v_uv = vec2(0.0, 0.0);
    }

    if (checkFlag(HAS_COLORS)) {
        v_color = a_color;
    } else {
        v_color = vec4(1.0);
    }

    gl_Position = u_viewProjection * u_model * a_position;
}
