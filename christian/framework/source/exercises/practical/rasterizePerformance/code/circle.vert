precision mediump float;

in vec2 a_vertex;

out vec2 v_uv;

void main(void)
{
    v_uv = a_vertex;
    gl_Position = vec4(a_vertex, 0.0, 1.0);
}
