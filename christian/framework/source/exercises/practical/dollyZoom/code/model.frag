precision highp float;

// Adapted from https://github.com/KhronosGroup/glTF-WebGL-PBR

@import ./lighting;
#line 7

layout(location = 0) out vec4 fragColor;

const int HAS_NORMALS           = 1;
const int HAS_UV                = 1 << 2;
const int HAS_COLORS            = 1 << 3;
const int HAS_BASECOLORMAP      = 1 << 5;
const int HAS_NORMALMAP         = 1 << 6;

const float M_PI = 3.14159;

uniform sampler2D u_baseColor;
uniform sampler2D u_normal;

uniform vec4 u_baseColorFactor;

uniform mediump int u_geometryFlags;
uniform mediump int u_pbrFlags;

in vec2 v_uv;
in vec4 v_color;
in vec3 v_position;
in vec3 v_normal;

bool checkGeometryFlag(int flag) {
    return (u_geometryFlags & flag) == flag;
}

bool checkFlag(int flag) {
    return (u_pbrFlags & flag) == flag;
}

// Find the normal for this fragment, pulling either from a predefined normal
// map or from the interpolated mesh normal and tangent attributes.
vec3 getNormal()
{
    // Retrieve the tangent space matrix
    vec3 pos_dx = dFdx(v_position);
    vec3 pos_dy = dFdy(v_position);
    vec3 tex_dx = dFdx(vec3(v_uv, 0.0));
    vec3 tex_dy = dFdy(vec3(v_uv, 0.0));
    vec3 t = (tex_dy.t * pos_dx - tex_dx.t * pos_dy) /
        (tex_dx.s * tex_dy.t - tex_dy.s * tex_dx.t);

    vec3 ng;
    if (checkGeometryFlag(HAS_NORMALS))
    {
        ng = normalize(v_normal);
    }
    else
    {
        ng = cross(pos_dx, pos_dy);
    }

    t = normalize(t - ng * dot(ng, t));
    vec3 b = normalize(cross(ng, t));
    mat3 tbn = mat3(t, b, ng);

    vec3 n = normalize(tbn[2].xyz);
    // reverse backface normals
    n *= (2.0 * float(gl_FrontFacing) - 1.0);

    return n;
}

void main(void)
{
    // The albedo may be defined from a base texture or a flat color
    vec4 baseColor = vec4(1.0);
    if (checkFlag(HAS_BASECOLORMAP)) {
        baseColor = texture(u_baseColor, v_uv) * u_baseColorFactor;
    } else {
        baseColor = u_baseColorFactor;
    }

    baseColor *= vec4(v_color.rgb, 1.0);

    vec3 color = lighting(v_position, getNormal(), baseColor.rgb);

    fragColor = vec4(color, baseColor.a);
}
