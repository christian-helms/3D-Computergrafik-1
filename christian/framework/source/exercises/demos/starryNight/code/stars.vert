precision mediump float;

// The attributes defined by the geometry. The vertex shader dows not care if
// these are based on the star geometry or the instances.
in vec2 a_vertex;
in vec2 a_position;
in float a_size;
in float a_rotation;

// Uniform input (same for all vertices), containing the canvas' aspect ratio
uniform float u_aspect;

// Helper function for rotation a vector by a given angle (in radians)
vec2 rotate(vec2 v, float angle)
{
    float s = sin(angle);
    float c = cos(angle);
    return vec2(
        c * v.x - s * v.y,
        s * v.x + c * v.y
    );
}

// The main function, which is called for each vertex.
void main()
{
    // Rotate the star around its center
    vec2 rotated = rotate(a_vertex, a_rotation);
    // Add a second size factor: Make the lower stars smaller.
    // Smoothstep gives a value between 0 and 1 depending if the y value is
    // closer to -1 or 1 (see https://en.wikipedia.org/wiki/Smoothstep).
    // sqrt is used to make the effect stronger.
    float heightFactor = sqrt(smoothstep(-1.0, 1.0, a_position.y));
    // Apply both the instance scale, as well as the height-based scale.
    // Values < 1 move the vertices closer to the star's center, bigger values
    // move them outwards.
    vec2 scaled = rotated * a_size * heightFactor;
    // Scale the y coord by the aspect ratio.
    // We generated the coord assuming the x and y axis are scaled identically.
    // As this is not the case (the canvas may have aspect ratios such as 16:9
    // or 4:3), we have to cancel this out.
    scaled.y *= u_aspect;
    // Lastly, move the star by the instance's position
    vec2 moved = scaled + a_position;

    // Store the calculated position. The z-value is set to 0, which sets
    // everything into the same screen-aligned plane.
    gl_Position = vec4(moved, 0.0, 1.0);
}
