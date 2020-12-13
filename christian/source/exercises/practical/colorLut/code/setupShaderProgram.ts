import { Context, Program, Shader } from 'webgl-operate';

/**
 * Helper functions for setting up the various shader programs.
 * @param context - rendering context to create the shaders in
 * @param vertexShader - source code for vertex shader
 * @param fragmentShader - source code for fragment shader
 */
export function setupShaderProgram(
    vertexShader: string, fragmentShader: string,
    context: Context, vertexLocation: number
): Program {
    // create shaders from source and initialize
    const vert = new Shader(context, context.gl.VERTEX_SHADER);
    vert.initialize(vertexShader);
    const frag = new Shader(context, context.gl.FRAGMENT_SHADER);
    frag.initialize(fragmentShader);

    // create program and initialize it with the prepared shaders
    const program = new Program(context);
    program.initialize([vert, frag], false);

    // connect the quad's vertex locations to the shader attribute
    program.attribute('a_vertex', vertexLocation);
    program.link();

    return program;
}
