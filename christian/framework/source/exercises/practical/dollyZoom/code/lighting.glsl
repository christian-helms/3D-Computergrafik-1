#line 2
uniform vec3 u_eye;

const vec3 lightDir = vec3(1.0, 1.0, 1.0);
const vec3 ambientColor = vec3(0.8, 0.8, 1.0);
const float ambientIntensity = 0.7;
const vec3 diffuseColor = vec3(1.0, 1.0, 0.8);
const float diffuseIntensity = 0.7;
const vec3 specularColor = vec3(1.2, 1.2, 1.2);
const float specularIntensity = 0.3;

vec3 lighting(
    vec3 vertex, vec3 interpolatedNormal,
    vec3 kAmbient, vec3 kDiffuse, vec3 kSpecular,
    float shininess)
{
    vec3 normal = normalize(interpolatedNormal);

    float diffuse = max(dot(lightDir, normal), 0.0);
    float specular = 0.0;

    if(diffuse > 0.0)
    {
        vec3 reflectDir = reflect(lightDir, normal);
        vec3 cameraToVertex = normalize(vertex - u_eye);
        float angle = max(dot(reflectDir, cameraToVertex), 0.0);
        specular = pow(angle, shininess);
    }

    float shadow = 1.0;

    vec3 a = kAmbient * ambientColor * ambientIntensity;
    vec3 d = shadow * kDiffuse * diffuse * diffuseColor * diffuseIntensity;
    vec3 s = shadow * kSpecular * specular * specularColor * specularIntensity;

    return a + s + d;
}

// overload for simple usage with one color and fixed shininess
vec3 lighting(
    vec3 vertex, vec3 interpolatedNormal,
    vec3 color)
{
    return lighting(vertex, interpolatedNormal, color, color, color * 0.3, 2.0);
}
