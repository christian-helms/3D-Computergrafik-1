precision lowp float;

// TODO: use vertex and fragment shader together to create the same result

in vec2 a_vertex;
in vec3 a_color;

out vec3 color;

void main(void)
{
    color = a_color;
    gl_Position = vec4(a_vertex, 0.0, 1.0);
}
