precision mediump float;

// The default framebuffer expects the result color to be stored at location 0.
layout(location = 0) out vec4 fragColor;

void main()
{
    // Give the star a yellow color with full opacity.
    fragColor = vec4(0.8, 0.8, 0.0, 1.0);
}
