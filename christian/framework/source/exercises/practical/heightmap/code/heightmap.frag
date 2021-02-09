precision mediump float;

layout(location = 0) out vec4 fragColor;

uniform sampler2D u_normalmap;
uniform float u_lowestContourLine;
uniform float u_contourLineCount;
uniform float u_contourLineOpacity;
uniform vec3 u_heightColors[5];
uniform float u_heightColorHeights[5];

in vec2 v_uv;
in float v_height;
in vec3 v_pos;

@import ./lighting;

vec3 getNormal(vec2 pos)
{
    vec3 orig = texture(u_normalmap, pos).xzy;
    return normalize(orig * 2.0 - 1.0);
}

vec3 getHeightColor()
{
    /**
     * TODO: Calculate the correct color for the current height v_height using
     * u_heightColors (the colors) and u_heightColorHeights (height at which
     * the color should be strongest).
     */
    int i = 0;
    while (i < 4 && v_height >= u_heightColorHeights[i + 1]) ++i;
    vec3 color;
    if (i == 4)
        color = u_heightColors[4];
    else {
        float mix_factor = (v_height - u_heightColorHeights[i]) / 
                           (u_heightColorHeights[i + 1] - u_heightColorHeights[i]);
        color = mix(u_heightColors[i], u_heightColors[i + 1], mix_factor);
    }
    return color;
}

float getContourLineFactor()
{
    /**
     * TODO: Add horizontal lines. The return value is applied as a factor to
     * the color, this means a return value of 0 results in a black line, while
     * a return value of 1 does not change the color. You should use the
     * u_lowestContourLine and u_contourLineCount uniforms for this.
     */
    if (v_height < u_lowestContourLine)
        return 1.0;

    float proportion = (v_height - u_lowestContourLine) / (1.0 - u_lowestContourLine);
    float diff_to_line = fract(proportion * (u_contourLineCount - 1.0));

    float height_scale = v_pos.y / v_height;
    float line_width_factor = 0.02;
    float threshold = line_width_factor / height_scale * 0.01 * u_contourLineCount;
    if (diff_to_line <= line_width_factor / height_scale)
        return 1.0 - u_contourLineOpacity;
    return 1.0;
}

void main(void)
{
    vec3 normal = getNormal(v_uv);
    vec3 color = getHeightColor();
    color = lighting(v_pos, normal, color);
    color *= getContourLineFactor();
    fragColor = vec4(color, 1.0);
}
