precision mediump float;

layout(location = 0) out vec4 fragColor;

// Inputs are matching the vertex shader's output definition.
in float v_angle;
in vec2 v_pos;
in float v_height;
in vec3 v_color;

// Factor for controlling the hills' hilliness
const float c_hillSlope = 0.2;

void main()
{
    // calculate hill height by using sinus
    float s = sin(v_angle);
    // mix between full height (1.0) and sinus value using the slope strength
    s = mix(1.0, s, c_hillSlope);
    // same formula as for vertex height, both sin and the coords are in [-1, 1]
    float hillHeight = s * v_height + v_height - 1.0;
    // hardware optimized version of v_pos.y < hillHeight ? 1: 0
    float insideHill = step(v_pos.y, hillHeight);
    // full opacity if inside hill, zero opacity above -> sky stays
    fragColor = vec4(v_color, insideHill);
}
