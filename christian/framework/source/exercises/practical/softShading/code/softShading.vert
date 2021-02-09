precision lowp float;

layout(location = 0) in vec3 a_vertex;
layout(location = 1) in vec3 a_normal;

uniform mat4 u_viewProjection;
uniform mat4 u_model;
uniform vec3 u_lightDir;

out vec3 v_position;
out vec3 v_normal;
out vec3 v_lightDir;

void main()
{
    vec4 position = u_model * vec4(a_vertex, 1.0);
    v_position = position.xyz / position.w;

    vec4 normal = u_model * vec4(a_normal, 1.0);
    v_normal = normal.xyz / normal.w;

    vec4 lightDir = vec4(u_lightDir, 1.0);
    lightDir = inverse(u_viewProjection) * lightDir;
    v_lightDir = normalize(lightDir.xyz / lightDir.w);

    gl_Position = u_viewProjection * position;
}
