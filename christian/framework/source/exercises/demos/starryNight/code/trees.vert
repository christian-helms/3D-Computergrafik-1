precision mediump float;

in vec2 a_vertex;
in vec3 a_color;

out vec3 v_color;

void main()
{
    v_color = a_color;

    gl_Position = vec4(a_vertex, 0.0, 1.0);
}
