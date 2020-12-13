precision lowp float;
layout(location = 0) out vec4 fragColor;

// position in texture [0.0, 1.0]^2
in vec2 v_uv;
// resolution of the canvas in pixels
uniform vec2 u_resolution;
// resolution of the tree in pixels
uniform vec2 u_treeResolution;

// milliseconds since program start
uniform float u_time;

vec3 effect(vec2 uv, vec2 resolution, float time) {
    // TODO: implement an interessting pattern/animation
    // use this effect for the live stream: no
    // set fragColor to set the color of the pixel
    vec3 color = vec3(1.0, 0.0, 1.0);
    return color;
}

void main(void)
{
    vec3 background = vec3(0.5);
    vec2 treeUv = v_uv;
    vec2 res = u_resolution;
    vec2 treeRes = u_treeResolution;
    vec2 size = vec2(1.0);
    size.x = (res.y / res.x) * (treeRes.x / treeRes.y);
    treeUv = treeUv - (1.0 - size) * 0.5;
    treeUv = treeUv / size;
    treeUv = floor(treeUv * u_treeResolution) / u_treeResolution;
    vec3 color = effect(treeUv, treeRes, u_time);
    color = mix(background, color, step(0.0, treeUv.x));
    color = mix(color, background, step(1.0, treeUv.x));
    color = mix(background, color, step(0.0, treeUv.y));
    color = mix(color, background, step(1.0, treeUv.y));
    fragColor = vec4(color, 1.0);
}
