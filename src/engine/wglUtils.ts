interface AttribBuffers {
    aPosition: Attrib,
    aNormal: Attrib
}

interface Attrib {
    attribBuffer: WebGLBuffer | null,
    numComponents: number,
    type: number,
    count: number,
    location: number | null
}

interface Uniform {
    name: string,
    val: number | number[],
    type: string,
    location: WebGLUniformLocation | null
}

interface Package {
    attribs: AttribBuffers,
    uniforms: Uniform[],
    program: WebGLProgram
}

export const setUpProgram = (gl: WebGLRenderingContext, vertexShader: string, fragmentShader: string, buffers: AttribBuffers, uniforms: Uniform[]): WebGLProgram => {
    // Sets a WebGL program based on attribute, uniform, and shader data

    // Compile the vertex shader
    const vShader = gl.createShader( gl['VERTEX_SHADER'] );
    if (vShader === null) {throw Error('Cannot create vertex shader');}
    gl.shaderSource(vShader, vertexShader);
    gl.compileShader(vShader);
    console.log(gl.getShaderInfoLog(vShader));

    // Compile the fragment shaders
    const fShader = gl.createShader( gl['FRAGMENT_SHADER'] );
    if (fShader === null) {throw Error('Cannot create fragment shader');}
    gl.shaderSource(fShader, fragmentShader);
    gl.compileShader(fShader);
    console.log(gl.getShaderInfoLog(fShader));
    
    let program = gl.createProgram();
    if (program === null) {throw Error('Cannot create program');}
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    gl.useProgram(program);
    
    // Instruct Program how to use attribute data
    // Position
    const posAttribLocation = gl.getAttribLocation(program, 'aPosition');
    buffers.aPosition.location = posAttribLocation;
    gl.enableVertexAttribArray(buffers.aPosition.location);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.aPosition.attribBuffer);
    gl.vertexAttribPointer( buffers.aPosition.location, buffers.aPosition.numComponents, buffers.aPosition.type, false, 0, 0);

    // Normal
    const normAttribLocation = gl.getAttribLocation(program, 'aNormal');
    buffers.aNormal.location = normAttribLocation;
    gl.enableVertexAttribArray(buffers.aNormal.location);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.aNormal.attribBuffer);
    gl.vertexAttribPointer( buffers.aNormal.location, buffers.aNormal.numComponents, buffers.aNormal.type, false, 0, 0);


    uniforms.forEach((uniform) => {
        uniform.location = gl.getUniformLocation(program, uniform.name)
        setUniform(gl, uniform);
    })

    return program
}

export const setUniform = (gl: WebGLRenderingContext, uniform: Uniform): void => {
    // Sets a WebGL uniform based on type
    switch (uniform.type) {
        case 'float':
            if (typeof uniform.val != 'number') { throw Error('float assigned to non-float value'); }
            gl.uniform1f(uniform.location, uniform.val);
            break;
        case 'vec2':
            if (typeof uniform.val == 'number' || uniform.val.length != 2 ) { throw Error('vec2 assigned to non-vec2 value'); }
            gl.uniform2f(uniform.location, uniform.val[0], uniform.val[1]);
            break;
        case 'vec3':
            if (typeof uniform.val == 'number' || uniform.val.length != 3 ) { throw Error('vec3 assigned to non-vec3 value'); }
            gl.uniform3f(uniform.location, uniform.val[0], uniform.val[1], uniform.val[2]);
            break;
        case 'vec4':
            if (typeof uniform.val == 'number' || uniform.val.length != 4 ) { throw Error('vec4 assigned to non-vec4 value'); }
            gl.uniform4f(uniform.location, uniform.val[0], uniform.val[1], uniform.val[2], uniform.val[4]);
            break;
        default:
            throw Error('Unknown Type for Uniform');
    }
}

export const setAttributes = (gl: WebGLRenderingContext, positions: number[], normals: number[]): AttribBuffers => {
    // Set up attributes and metadata
    
    let attribs: AttribBuffers = {
        aPosition: {
            numComponents: 2,
            type: gl.FLOAT,
            attribBuffer: gl.createBuffer(),
            count: Math.floor(positions.length/2),
            location: null
        },
        aNormal: {
            numComponents: 2,
            type: gl.FLOAT,
            attribBuffer: gl.createBuffer(),
            count: Math.floor(positions.length/2),
            location: null
        }
    };

    // Bind Positions
    gl.bindBuffer(gl.ARRAY_BUFFER, attribs.aPosition.attribBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Bind Normals
    gl.bindBuffer(gl.ARRAY_BUFFER, attribs.aNormal.attribBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

    return attribs
}