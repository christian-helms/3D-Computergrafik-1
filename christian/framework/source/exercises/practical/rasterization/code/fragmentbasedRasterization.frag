precision lowp float;

layout(location = 0) out vec4 fragColor;

// position in texture [0.0, 1.0]^2
in vec2 v_uv;

// resolution of the canvas in pixels
uniform vec2 u_resolution;
// triangle points
uniform vec2 u_vertices[3];

// vertex colors
uniform vec3 u_colors[3];

void main(void)
{
     // Calculate the barycentric canvas coordinates of 
    // v_uv with respect to u_vertices.
    // Note that matrices in GLSL are column-major.
    vec2 V[3] = u_vertices;
    mat2 inv;
    inv[0] = vec2(V[1].y - V[2].y, V[2].y - V[0].y);
    inv[1] = vec2(V[2].x - V[1].x, V[0].x - V[2].x);
    float det = inv[0][0] * inv[1][1] - inv[1][0] * inv[0][1];
    vec2 bary = (inv / det) * vec2(v_uv[0] - V[2].x, v_uv[1] - V[2].y);
    // Render the texture coordinate if it is inside 
    // the triangle by a linear interpolation.
    vec3 convex = vec3(bary, 1.0 - bary.x - bary.y);
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    if (all(greaterThan(convex, vec3(0.0, 0.0, 0.0))))
        for (int vertex = 0; vertex < 3; ++vertex)
            fragColor.rgb += u_colors[vertex] * convex[vertex];
}
