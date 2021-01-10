#line 2
uniform vec3 u_eye;

const vec3 lightDir = vec3(1.0, 1.0, 1.0);
const vec3 ambientColor = vec3(0.3, 0.3, 0.5);
const vec3 diffuseColor = vec3(1.0, 1.0, 0.9);
const vec3 specularColor = vec3(1.2, 1.2, 1.2);

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

    return kAmbient * ambientColor +
        shadow * kDiffuse * diffuse * diffuseColor +
        shadow * kSpecular * specular * specularColor;
}

// overload for simple usage with one color and fixed shininess
vec3 lighting(
    vec3 vertex, vec3 interpolatedNormal,
    vec3 color)
{
    return lighting(vertex, interpolatedNormal, color, color, color * 0.3, 5.0);
}
