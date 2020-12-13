precision lowp float;

// TODO: use vertex and fragment shader together to create the same result

layout(location = 0) out vec4 fragColor;

uniform vec3 u_colors[3];
in vec3 color;

void main(void)
{
    fragColor = vec4(color, 1.0);
}

