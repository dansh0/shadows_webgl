import vertexShader from '../shaders/vertexTest.vert';
import fragmentShader from '../shaders/fragmentTest.frag';
import wallVertShader from '../shaders/wallVert.vert';
import wallFragShader from '../shaders/wallFrag.frag';
import wallStencilVertShader from '../shaders/wallStencilVert.vert';
import wallStencilFragShader from '../shaders/wallStencilFrag.frag';
import lightVertShader from '../shaders/lightVert.vert';
import lightFragShader from '../shaders/lightFrag.frag';
import getMapData from './mapData';
import { setUpProgram, setUniform, setAttributes, getUniform } from './wglUtils';
import { getWallPositions } from './geoUtils';
import { Vec3, Vec2, Uniform, Package } from './types';



class Engine {
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext | null;
    vertexShader: string = vertexShader;
    fragmentShader: string = fragmentShader;
    mapSize: Vec2;
    packages: Package[];
    startTime: number;
    frameCount: number;
    lastFrameCount: number;
    lastFrameTime: DOMHighResTimeStamp;
    setFPS: Dispatch<SetStateAction<number>>;


    constructor(canvas: HTMLCanvasElement, setFPS: Dispatch<SetStateAction<number>>) {
        this.packages = [];
        this.mapSize = {x:1, y:1}
        this.startTime = Date.now();
        this.canvas = canvas;
        this.gl = this.canvas!.getContext('webgl', {stencil: true});
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
        this.lastFrameCount = 0;
        this.setFPS = setFPS;
        this.init();
    }

    init(): void {

        // PARAMETERS
        const wallThickness = 0.1; // Thickness of walls from zero thickness wall definition
        let lightRadius = 10; // Radius of light (in map units)

        const gl = this.gl;
        const canvas = this.canvas;

        // Check Null
        if (canvas === null) { throw Error('Cannot get canvas'); }
        if (gl===null) { throw Error("Cannot get webgl context from canvas"); }
        
        // Clear Canvas
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    
        // Enable Depth Test
        gl.enable(gl.BLEND);
        // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        // gl.enable(gl.DEPTH_TEST);
        // gl.depthFunc(gl.LEQUAL);

        // Cull back faces
        gl.enable(gl.CULL_FACE);

        // Setup Stencil
        gl.enable(gl.STENCIL_TEST);
        
        // Set Canvas Size
        canvas.width = canvas.clientWidth; // resize to client canvas
        canvas.height = canvas.clientHeight; // resize to client canvas
        console.log('CANVAS DIMENSIONS:')
        console.log(canvas.width, canvas.height);
        
        // Time Function
        const startTime = Date.now();
        //this.getTime = () => { return Date.now() - startTime; }
        
        // this.tMat.rotationX(0.1);
        
        // Get Map Data
        const mapData = getMapData();
        this.mapSize = mapData.map_size;
        const mapWalls = mapData.objects_line_of_sight;
        const mapLights = mapData.lights;
        gl.viewport(0, 0, canvas.width, canvas.height);

        // BACKGROUND PROGRAM
        let mapQuadPositions = [
            -1, -1,
            1, -1,
            1, 1,
            -1, -1,
            1, 1,
            -1, 1, 
        ];
        let mapQuadNormals = [
            0, 0,
            0, 0,
            0, 0,
            0, 0,
            0, 0,
            0, 0,
        ];
        
        // Set up Position Attribute
        let bgndBuffers = setAttributes(gl, mapQuadPositions, mapQuadNormals);

        // Define Uniforms
        let bgndUniforms: Uniform[] = [
            {
                name: 'uTime',
                val: this.getTime(),
                type: 'float',
                location: null
            },
            {
                name: 'uResolution',
                val: [canvas.width, canvas.height],
                type: 'vec2',
                location: null
            }
        ];

        // Create Program
        let bgndProgram = setUpProgram(gl, this.vertexShader, this.fragmentShader, bgndBuffers, bgndUniforms);

        // Package Program with Attributes and Uniforms
        let bgndPackage: Package = {
            name: 'background',
            active: true,
            attribs: bgndBuffers,
            uniforms: bgndUniforms,
            program: bgndProgram,
            hasNormals: false,
            stencil: 'none'
        }
        this.packages.push(bgndPackage);


        // WALLS PROGRAM

        // Get wall data ready for buffers
        const wallValues = getWallPositions(mapWalls, wallThickness, false);
        const wallPositions = wallValues[0];
        const wallNormals = wallValues[1];

        // Set up Position Attribute
        let wallBuffers = setAttributes(gl, wallPositions, wallNormals);

        // Define Uniforms
        let wallUniforms: Uniform[] = [
            {
                name: 'uMapSize',
                val: [this.mapSize.x, this.mapSize.y],
                type: 'vec2',
                location: null
            },
        ];

        // Create Program
        let wallProgram = setUpProgram(gl, wallVertShader, wallFragShader, wallBuffers, wallUniforms);

        // Package Program with Attributes and Uniforms
        let wallPackage: Package = {
            name: 'wall',
            active: true,
            attribs: wallBuffers,
            uniforms: wallUniforms,
            program: wallProgram,
            hasNormals: false,
            stencil: 'none'
        }
        this.packages.push(wallPackage);


        // WALLS STENCIL PROGRAM

        // Get wall data ready for buffers
        const wallStencilValues = getWallPositions(mapWalls, wallThickness, true);
        const wallStencilPositions = wallStencilValues[0];
        const wallStencilNormals = wallStencilValues[1];

        // Set up Position Attribute
        let wallStencilBuffers = setAttributes(gl, wallStencilPositions, wallStencilNormals);

        // Define Uniforms
        let wallStencilUniforms: Uniform[] = [
            {
                name: 'uMapSize',
                val: [this.mapSize.x, this.mapSize.y],
                type: 'vec2',
                location: null
            },
            {
                name: 'uLightPoint',
                val: [0, 0],
                type: 'vec2',
                location: null
            }

        ];

        // Create Program
        let wallStencilProgram = setUpProgram(gl, wallStencilVertShader, wallStencilFragShader, wallStencilBuffers, wallStencilUniforms);

        // Package Program with Attributes and Uniforms
        let wallStencilPackage: Package = {
            name: 'wallStencil',
            active: true,
            attribs: wallStencilBuffers,
            uniforms: wallStencilUniforms,
            program: wallStencilProgram,
            hasNormals: true,
            stencil: 'write'
        }
        this.packages.push(wallStencilPackage);
        

        // LIGHT PROGRAM
        let lightPositions = [
            -lightRadius, -lightRadius,
            lightRadius, -lightRadius,
            lightRadius, lightRadius,
            -lightRadius, -lightRadius,
            lightRadius, lightRadius,
            -lightRadius, lightRadius, 
        ];
        let lightNormals = [
            0, 0,
            0, 0,
            0, 0,
            0, 0,
            0, 0,
            0, 0,
        ];

        // Set up Position Attribute
        let lightBuffers = setAttributes(gl, lightPositions, lightNormals);

        // Define Uniforms
        let lightUniforms: Uniform[] = [
            {
                name: 'uTranslate',
                val: [0, 0],
                type: 'vec2',
                location: null
            },
            {
                name: 'uRadius',
                val: lightRadius,
                type: 'float',
                location: null
            },
            {
                name: 'uMapSize',
                val: [this.mapSize.x, this.mapSize.y],
                type: 'vec2',
                location: null
            },
            
        ];

        // Create Program
        let lightProgram = setUpProgram(gl, lightVertShader, lightFragShader, lightBuffers, lightUniforms);

        // Package Program with Attributes and Uniforms
        let lightPackage: Package = {
            name: 'light',
            active: true,
            attribs: lightBuffers,
            uniforms: lightUniforms,
            program: lightProgram,
            hasNormals: false,
            stencil: 'read'
        }
        this.packages.push(lightPackage);

        console.log('PACKAGES:')
        console.log(this.packages)

        window.addEventListener("resize", () => {
            if (!this.gl) { throw Error('Lost WebGL Render Context'); }
            let width = window.innerWidth;
            let height = window.innerHeight;
            canvas.style.height = height + 'px';
            canvas.style.width = width + 'px';
            canvas.width = canvas.clientWidth; // resize to client canvas
            canvas.height = canvas.clientHeight; // resize to client canvas
            
            let uResolution = getUniform(this.packages, 'background', 'uResolution');
            uResolution.val = [canvas.width, canvas.height]; // update uTime
            setUniform(this.gl, this.packages[0].uniforms[1]);
        });

        // Start animation loop
        this.animate();
    }

    // Animate!
    animate(): void {
        // update stats
        this.frameCount++;
        this.updateFPS();

        if (!this.gl) { throw Error('Lost WebGL Render Context') }
        const gl: WebGLRenderingContext = this.gl;

        // clear
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // update time
        let uTime = getUniform(this.packages, 'background', 'uTime');
        uTime.val = this.getTime()/1000; // update uTime
        
        // Draw each package one by one
        this.packages.forEach(pck => {
            this.drawPackage(gl, pck);
        })

        requestAnimationFrame(this.animate.bind(this));
    }

    drawPackage(gl: WebGLRenderingContext, pck: Package): void {
        if (!pck.active) { return }

        // Set Program
        gl.useProgram(pck.program);

        // Stencil Settings
        switch (pck.stencil) {
            case 'none':
                // For programs not related to the stencil
                gl.stencilFunc(gl.ALWAYS, 1, 0xFF); // Always pass
                gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP); // Do not change stencil buffer
                gl.colorMask(true, true, true, true); // Enable color writing
                break;
            case 'write':
                // For programs that write to the stencil buffer (e.g. shadow mask)
                gl.clear(gl.STENCIL_BUFFER_BIT); // Clear stencil buffer
                gl.stencilFunc(gl.ALWAYS, 1, 0xFF); // Always pass
                gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE); // Write to stencil buffer
                gl.colorMask(false, false, false, false); // Disable color writing
                break;
            case 'read':
                // For programs that want to be masked by the stencil buffer (e.g. light)
                gl.stencilFunc(gl.NOTEQUAL, 1, 0xFF); // Render where the stencil value is not 1
                gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP); // Do not change stencil buffer
                gl.colorMask(true, true, true, true); // Enable color writing
                break;
        }

        // Position Attributes
        let location = pck.attribs.aPosition.location;
        if (typeof location != 'number') { throw Error('Faulty attribute location')}
        gl.enableVertexAttribArray(location);
        gl.bindBuffer(gl.ARRAY_BUFFER, pck.attribs.aPosition.attribBuffer);
        gl.vertexAttribPointer( location, pck.attribs.aPosition.numComponents, pck.attribs.aPosition.type, false, 0, 0);

        // Normal Attributes
        if (pck.hasNormals) {
            // only add normals if they are used
            location = pck.attribs.aNormal.location;
            if (typeof location != 'number') { throw Error('Faulty attribute location')}
            gl.enableVertexAttribArray(location);
            gl.bindBuffer(gl.ARRAY_BUFFER, pck.attribs.aNormal.attribBuffer);
            gl.vertexAttribPointer( location, pck.attribs.aNormal.numComponents, pck.attribs.aNormal.type, false, 0, 0);
        }

        // Update Uniforms
        if (pck.name == 'background') {
            setUniform(gl, getUniform(this.packages, 'background', 'uResolution')); // update uResolution
            setUniform(gl, getUniform(this.packages, 'background', 'uTime')); // update uTime
        } else if (pck.name == 'wallStencil') {
            setUniform(gl, getUniform(this.packages, 'wallStencil', 'uLightPoint')); // update light position for walls
        } else if (pck.name == 'light') {
            setUniform(gl, getUniform(this.packages, 'light', 'uTranslate')); // update position
        }

        // Draw
        gl.drawArrays(gl.TRIANGLES, 0, pck.attribs.aPosition.count); //primitive, offset, count
    }

    getTime(): number {
        return Date.now() - this.startTime;
    }

    updatePosition(vertical: number, horizontal: number, rotation: Vec3): void {
        // Update light position
        let uTranslate = getUniform(this.packages, 'light', 'uTranslate');
        uTranslate.val = [horizontal, vertical]; // light position for light shader
        
        let uLightPoint = getUniform(this.packages, 'wallStencil', 'uLightPoint');
        uLightPoint.val = [horizontal, vertical] // light position for walls
    }

    updateFPS(): void {
        let currentTime = performance.now();
        let deltaTime = currentTime - this.lastFrameTime;
        let testTime = 1000;
        // only update after a second (or testTime if changed)
        if (deltaTime >= testTime) {
            // figure out how many frames passed and divide by time passed
            let deltaFrames = this.frameCount - this.lastFrameCount;
            let fps = (deltaFrames / deltaTime) * 1000;
            this.setFPS(fps.toFixed(0));

            // reset
            this.lastFrameTime = currentTime;
            this.lastFrameCount = this.frameCount;
        }
    }
}

export default Engine
