precision mediump float;

// uniform input values are shared between fragments
// input image
uniform sampler2D u_image;
// LUT
uniform sampler2D u_lut;
// LUT resolution for one component (4, 8, 16, ...)
uniform float u_resolution;

layout(location = 0) out vec4 fragColor;

// varying input values are set by the vertex shader
// texture coordinate of current fragment
in vec2 v_uv;

ivec2 d3_to_d2(ivec3 position) {
    return ivec2(
        position.r + position.b * int(u_resolution),
        position.g
    );
}

void main(void)
{
    // TODO: use the LUT to apply effects to the input texture
    // hint: use texelFetch to get a texture value without interpolation
    // this will require an integer vector (ivec2)

    vec3 in_color = texture(u_image, v_uv).rgb;
    vec3 float_lut_pos_3d = in_color * (u_resolution - 1.0);
    ivec3 int_lut_pos = ivec3(float_lut_pos_3d);
    vec3 out_color = vec3(0.0, 0.0, 0.0);

    // manual interpolation
    vec3 mix_factor = fract(float_lut_pos_3d);

        // option 1 from class
        // vec3 c000 = texelFetch(u_lut, d3_to_d2(int_lut_pos + ivec3(0, 0, 0)),0).rgb;
        // vec3 c001 = texelFetch(u_lut, d3_to_d2(int_lut_pos + ivec3(0, 0, 1)),0).rgb;
        // vec3 c010 = texelFetch(u_lut, d3_to_d2(int_lut_pos + ivec3(0, 1, 0)),0).rgb;
        // vec3 c011 = texelFetch(u_lut, d3_to_d2(int_lut_pos + ivec3(0, 1, 1)),0).rgb;
        // vec3 c100 = texelFetch(u_lut, d3_to_d2(int_lut_pos + ivec3(1, 0, 0)),0).rgb;
        // vec3 c101 = texelFetch(u_lut, d3_to_d2(int_lut_pos + ivec3(1, 0, 1)),0).rgb;
        // vec3 c110 = texelFetch(u_lut, d3_to_d2(int_lut_pos + ivec3(1, 1, 0)),0).rgb;
        // vec3 c111 = texelFetch(u_lut, d3_to_d2(int_lut_pos + ivec3(1, 1, 1)),0).rgb;
        
        // vec3 c00 = mix(c000, c001, mix_factor.b);
        // vec3 c01 = mix(c010, c011, mix_factor.b);
        // vec3 c10 = mix(c100, c101, mix_factor.b);
        // vec3 c11 = mix(c110, c111, mix_factor.b);

        // vec3 c0 = mix(c00, c01, mix_factor.g);
        // vec3 c1 = mix(c10, c11, mix_factor.g);

        // out_color = mix(c0, c1, mix_factor.r);

        // own implementation
    for (int i = 0; i <= 1; ++i)
    for (int j = 0; j <= 1; ++j)
    for (int k = 0; k <= 1; ++k)
    {
        ivec3 vertex = ivec3(i, j, k);
        float factor = 1.0;
        for (int l = 0; l < 3; ++l)
            factor *= float(vertex[l]) * mix_factor[l] + (1.0 - float(vertex[l])) * (1.0 - mix_factor[l]);
        out_color += factor * texelFetch(u_lut, d3_to_d2(int_lut_pos + vertex), 0).rgb;
    }

    fragColor = vec4(out_color, 1.0);


    // GPU interpolation
    // vec3 new_pos = (float_lut_pos_3d + 0.5) / u_resolution;
    // fragColor = vec4(texture(u_lut, new_pos).rgb, 1.0);

}
