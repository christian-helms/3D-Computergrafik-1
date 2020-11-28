precision lowp float;

layout(location = 0) out vec4 fragColor;

// position in texture [0.0, 1.0]^2
in vec2 v_uv;

// factor to scale all metaballs
uniform float u_radiusFactor;
// resolution of the canvas in pixels
uniform vec2 u_resolution;
// visualization mode index
uniform int u_mode;
// metaballs
uniform vec3 u_metaballs[$NUMBER_OF_METABALLS];

vec3 HSV_to_RGB(float H, float S, float V) {
    vec3 rgb = vec3(0.0, 0.0, 0.0);
    float h_i = floor(H / 60.0);
    float f = (H / 60.0) - h_i;
    float p = V * (1.0 - S);
    float q = V * (1.0 - S * f);
    float t = V * (1.0 - S * (1.0 - f));
    switch (int(h_i)) {
        case 0:
            rgb = vec3(V, t, p);
            break;
        case 1:
            rgb = vec3(q, V, p);
            break;
        case 2:
            rgb = vec3(p, V, t);
            break;
        case 3:
            rgb = vec3(p, q, V);
            break;
        case 4:
            rgb = vec3(t, p, V);
            break;
        case 5:
            rgb = vec3(V, p, q);
            break;
    }
    return rgb;
}

void main(void)
{
    float sum = 0.0, threshold = 2e-6;
    for (int i = 0; i < u_metaballs.length(); ++i) {
        vec3 m = u_metaballs[i];
        vec2 pixel_pos = v_uv * u_resolution;
        vec2 ball_pos = m.xy * u_resolution;
        float radius = m.z * u_radiusFactor;
        float temp = radius / distance(pixel_pos, ball_pos);
        sum += temp * temp;
    }
    
    if (u_mode == 0)
        if (sum > threshold)
            fragColor = vec4(1.0, 1.0, 1.0, 1.0);
        else
            fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    else if (u_mode == 1) {
        float hue = float(int(1.0 / (sum * 2e3)) % 360);
        fragColor = vec4(HSV_to_RGB(hue, 1.0, 1.0), 1.0);
    }
}
