in vec2 a_vertex;

uniform mat4 u_transform;
uniform sampler2D u_heightmap;
uniform float u_heightScale;

out vec2 v_uv;
out float v_height;
out vec3 v_pos;

void main()
{
    /**
     * TODO: properly set v_uv (the texture coordinate for the current vertex),
     * v_height (the height, read from the heightmap) and v_pos (the position
     * of the vertex, with adjusted height).
     */

    v_uv = 0.5 * (a_vertex + 1.0);
    v_height = texture(u_heightmap, v_uv).x;
    v_pos = vec3(a_vertex.x, v_height * u_heightScale, a_vertex.y);
    gl_Position = u_transform * vec4(v_pos, 1.0);
}
