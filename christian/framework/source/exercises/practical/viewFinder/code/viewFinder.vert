precision lowp float;

uniform sampler2D u_texture;
uniform float u_geometryResolution;

// the position from where the image should look normal
uniform vec3 u_correctViewPosition;

// camera view projection
uniform mat4 u_viewProjection;

// the vertex position [-1, 1]^2
in vec2 a_vertex;

// the uv coordinates – must be set correctly in getPosition()
out vec2 v_uv;

// noise function returning a pseudo random number based on a seed
float rand(float seed){return fract(sin(seed) * 53728.5253123);}

vec2 unit(vec2 ndc) {
    return 0.5 * ndc + 0.5;
}

vec4 getPosition(
    float id,
    float distanceToCorrectViewPosition,
    vec2 resolution
) {
    // TODO: calculate the vertexPosition3d and also set v_uv correctly
    vec2 res_factor = resolution / max(resolution.x, resolution.y);

    int y = int(id) % int(u_geometryResolution);
    int x = int(id / u_geometryResolution);
    vec2 pos = vec2(float(x), float(y));
    v_uv = (pos + unit(a_vertex)) / u_geometryResolution;

    vec2 fragment_length = (2.0 / u_geometryResolution) * res_factor;
    vec3 vertexPosition3d = vec3(0.0, 0.0, 0.0);
    vertexPosition3d.xy = (pos + unit(a_vertex)) * fragment_length;
    vertexPosition3d.xy -= res_factor;

    vec3 eye = u_correctViewPosition;
    vec3 center = vertexPosition3d;
    center.xy -= 0.5 * fragment_length * a_vertex;

    float dist =  distanceToCorrectViewPosition * 
                  distance(vertexPosition3d, eye) / distance(center, eye);
    vertexPosition3d = eye + normalize(vertexPosition3d - eye) * dist;
    
    return vec4(vertexPosition3d, 1.0);
}

void main(void)
{
    // id of the instance [0, (u_geometryResolution * u_geometryResolution) - 1]
    float id = float(gl_InstanceID);
    // resolution of the texture in pixel
    vec2 resolution = vec2(textureSize(u_texture, 0));

    // the distance the center of the current rectangle instance shold have to
    // the correct view position
    float distanceToCorrectViewPosition = rand(id) * 2.0 + 1.0;

    // get the 3D position
    vec4 position = getPosition(
        id,
        distanceToCorrectViewPosition,
        resolution
    );

    // apply camera view projection
    gl_Position = u_viewProjection * position;
}
