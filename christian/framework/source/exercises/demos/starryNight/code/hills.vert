precision mediump float;

in vec2 a_vertex;
in float a_height;
in float a_angleOffset;
in vec3 a_color;

// Define the values which should be passed values to the fragment shader
out float v_angle;
out vec2 v_pos;
out float v_height;
out vec3 v_color;

const float c_pi = 3.12159;

void main()
{
    // x-value isn't changed, but y is adapted to the correct height
    // The height is used as proportion of the screens height, not in
    // vertex coordinate space (those range from -1 to 1).
    // Multiplying maps y to [-h, h], adding maps to [-1, -1+2h].
    // It is not necessary to calculate the height here, as this is again done
    // in the fragment shader, but by reducing the triangles' area, the
    // fragment shader will be run fewer times
    float x = a_vertex.x;
    float y = a_vertex.y * a_height + a_height - 1.0;

    // The first to outputs differ between vertices and will be interpolated.
    // Combine coords again and store for fragment shader.
    v_pos = vec2(x, y);
    // Angle is calculated based on the offset and the vertex' x position.
    v_angle = a_angleOffset + x * c_pi;
    // Height and color stay the same between vertices and are just passed on.
    v_height = a_height;
    v_color = a_color;

    gl_Position = vec4(v_pos, 0.0, 1.0);
}
