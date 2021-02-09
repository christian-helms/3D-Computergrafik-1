precision lowp float;

in vec3 a_vertex;

uniform mat4 u_transform;

void main()
{
    vec4 pos = vec4(a_vertex, 1.0);
    pos = u_transform * pos;
    pos /= pos.w;
    gl_Position = pos;
    gl_PointSize = 10.0;
}
