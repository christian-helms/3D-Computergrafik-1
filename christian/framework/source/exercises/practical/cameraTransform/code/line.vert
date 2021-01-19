precision lowp float;

in vec3 a_vertex;

uniform mat4 u_observedTransform;
uniform mat4 u_observerTransform;

void main()
{
    vec4 pos = vec4(a_vertex, 1.0);
    pos = u_observerTransform * u_observedTransform * pos;
    pos /= pos.w;
    gl_Position = pos;
}
