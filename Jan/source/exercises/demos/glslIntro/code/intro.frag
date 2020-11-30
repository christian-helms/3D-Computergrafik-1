precision lowp float;

// shader stage outputs
layout(location = 0) out vec4 fragColor;

// uniform input values are shared between fragments
// input image
uniform sampler2D u_texture;
// resolution of input image
uniform vec2 u_resolution;

// varying input values are set by the vertex shader
// texture coordinate of current fragment
in vec2 v_uv;

// calculate normalized coordinates between lower and upper bounds
vec2 mixFac(vec2 lower, vec2 upper, vec2 value) {
    return (value - lower) / (upper - lower);
}

// interpolate between the surrounding color samples for smoother image
vec4 interpolate(sampler2D tex, vec2 pos) {
    // calculate uv coords of surrounding color samples
    vec2 uv = floor(pos * u_resolution) / u_resolution;
    vec2 UV = ceil(pos * u_resolution) / u_resolution;
    // normalized coordinates between surrounding color samples
    vec2 mixFactor = mixFac(uv, UV, pos);

    // fetch the 4 surrounding color samples
    vec4 uvColor = texture(tex, uv);
    vec4 uVColor = texture(tex, vec2(uv.x, UV.y));
    vec4 UvColor = texture(tex, vec2(UV.x, uv.y));
    vec4 UVColor = texture(tex, UV);

    // mix color samples based on y coord between bounds
    vec4 uColor = mix(uvColor, uVColor, mixFactor.y);
    vec4 UColor = mix(UvColor, UVColor, mixFactor.y);

    // mix color samples based on x coord between bounds
    vec4 resultColor = mix(uColor, UColor, mixFactor.x);

    return resultColor;
}

void main(void)
{
    vec4 raw = texture(u_texture, v_uv);
    fragColor = raw;

    vec4 interpolated = interpolate(u_texture, v_uv);
    fragColor = interpolated;
}
