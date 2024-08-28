import vertexShader from '../shaders/vertexTest.vert';
import fragmentShader from '../shaders/fragmentTest.frag';
import wallVertShader from '../shaders/wallVert.vert';
import wallFragShader from '../shaders/wallFrag.frag';
import wallStencilVertShader from '../shaders/wallStencilVert.vert';
import wallStencilFragShader from '../shaders/wallStencilFrag.frag';
import lightVertShader from '../shaders/lightVert.vert';
import lightFragShader from '../shaders/lightFrag.frag';
import getMapData from './mapData';
import { Dispatch, SetStateAction } from 'react';
import { setUpProgram, setUniform, setAttributes, getUniform, makeRenderTarget, updateRenderTarget } from './wglUtils';
import { getWallPositions } from './geoUtils';
import { Vec3, Vec2, Uniform, Package, Light, RenderTarget } from './types';



class Engine {
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext | null;
    vertexShader: string = vertexShader;
    fragmentShader: string = fragmentShader;
    renderTarget: RenderTarget | null = null;
    mapSize: Vec2;
    mapLights: Light[];
    mapWalls: Vec2[][];
    packages: Package[];
    startTime: number;
    frameCount: number;
    lastFrameCount: number;
    lastFrameTime: DOMHighResTimeStamp;
    setFPS: Dispatch<SetStateAction<number>>;
    renderCount: number;
    img: HTMLImageElement;
    renderLightsBool: boolean = true;
    wallStencilValues: number[][] = [[]];


    constructor(canvas: HTMLCanvasElement, setFPS: Dispatch<SetStateAction<number>>) {
        this.packages = [];
        this.mapSize = {x:1, y:1};
        this.mapLights = [];
        this.mapWalls = [];
        this.startTime = Date.now();
        this.canvas = canvas;
        this.gl = this.canvas!.getContext('webgl', {stencil: true});
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
        this.lastFrameCount = 0;
        this.setFPS = setFPS;
        this.renderCount = 0;
        this.img = new Image();

        this.img.src = './PigAndWhistle.png';
        this.img.onload = () => {
            this.init();
        }
    }

    init(): void {

        // PARAMETERS
        const wallThickness = 0.1; // Thickness of walls from zero thickness wall definition
        const lightRadius = 15; // Radius of light (in map units)
        const stressTest = false;

        const gl = this.gl;
        const canvas = this.canvas;
        
        // Check Null
        if (canvas === null) { throw Error('Cannot get canvas'); }
        if (gl===null) { throw Error("Cannot get webgl context from canvas"); }
        
        console.log(this.img)

        // Cheap UI Controller
        let isRotating = false;

        document.addEventListener('mousemove', (event: MouseEvent) => {
            const mouseX = event.clientX/canvas.width * this.mapSize.x - this.mapSize.x/2;
            const mouseY = (1 - event.clientY/canvas.height) * this.mapSize.y - this.mapSize.y/2;
            
            if (!isRotating) {
                // move light
                this.updateMousePosition(mouseY, mouseX);
            } else {
                // rotate light
                let controllableLight = this.mapLights[this.mapLights.length-1];
                let controllableLightPos = {
                    x: controllableLight.position.x - this.mapSize.x/2,
                    y: controllableLight.position.y - this.mapSize.y/2,
                }
                const angle = Math.atan2(mouseX - controllableLightPos.x, mouseY - controllableLightPos.y);
                controllableLight.rotation = -angle + Math.PI/2;

                const cheapLength = (Math.abs(mouseX - controllableLightPos.x) + Math.abs(mouseY - controllableLightPos.y)) / 2;
                controllableLight.angle = cheapLength / (2*Math.PI);
            }
        });

        window.addEventListener('resize', () => {
            canvas.width = canvas.clientWidth; // resize to client canvas
            canvas.height = canvas.clientHeight; // resize to client canvas
            gl.viewport(0, 0, canvas.width, canvas.height);
            if (this.renderTarget) {
                updateRenderTarget(gl, this.renderTarget, canvas.width, canvas.height)
            }
        });


        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.key === 'r' || event.key === 'R') {
                isRotating = true;
            }
        });
        
        document.addEventListener('keyup', (event: KeyboardEvent) => {
            if (event.key === 'r' || event.key === 'R') {
                isRotating = false;
            }
        });
        
        // Clear Canvas
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // Enable Depth Test
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        //gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        
        // gl.enable(gl.DEPTH_TEST);
        // gl.depthFunc(gl.LEQUAL);
        
        // Cull back faces
        gl.enable(gl.CULL_FACE);
        
        // Setup Stencil
        gl.enable(gl.STENCIL_TEST);
        
        // Set Canvas Size
        canvas.width = canvas.clientWidth; // resize to client canvas
        canvas.height = canvas.clientHeight; // resize to client canvas
        gl.viewport(0, 0, canvas.width, canvas.height);
        console.log('CANVAS DIMENSIONS:')
        console.log(canvas.width, canvas.height);
        
        // Time Function
        const startTime = Date.now();
        //this.getTime = () => { return Date.now() - startTime; }
        
        // this.tMat.rotationX(0.1);
        
        // Get Map Data
        const mapData = getMapData();
        this.mapSize = mapData.map_size;
        this.mapWalls = mapData.objects_line_of_sight;
        this.mapLights = [];
        mapData.lights.forEach((light) => {
            this.mapLights.push({
                ...light,
                "angle": 0,
                "rotation": 0
            })
        })
        if (stressTest) {
            mapData.lights.forEach((light) => {
                this.mapLights.push({
                    ...light,
                    "position": {'x': light.position.x + 2, 'y': light.position.y - 2},
                    "angle": 0,
                    "rotation": 0
                })
                this.mapLights.push({
                    ...light,
                    "position": {'x': light.position.x + 5, 'y': light.position.y - 1},
                    "angle": 0,
                    "rotation": 0
                })
                this.mapLights.push({
                    ...light,
                    "position": {'x': light.position.x - 4, 'y': light.position.y + 2},
                    "angle": 0,
                    "rotation": 0
                })
            })
            this.mapWalls.push(...mapData.objects_line_of_sight)
            this.mapWalls.push(...mapData.objects_line_of_sight)
        }
        console.log('Number of Lights: ', this.mapLights.length+1)
        console.log('Number of wall segments: ', this.mapWalls.reduce((acc, row) => acc + row.length, 0))

        // Add a controllable light
        this.mapLights.push({
            "position": { "x": this.mapSize.x/2, "y": this.mapSize.y/2 },
            "range": lightRadius,
            "intensity": 1.0,
            "color": "ffffff",
            "angle": 30 * Math.PI/180,
            "rotation": -135 * Math.PI/180,
            "shadows": true
        }); 

        // Init two render targets: one static that only re-renders when needed, another dynamic that renders every frame
        this.renderTarget = makeRenderTarget(gl, canvas.width, canvas.height)

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

        // Add background texture
        const bgndImage = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, bgndImage);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.img);
        gl.generateMipmap(gl.TEXTURE_2D);
        const uImage = gl.getUniformLocation(bgndProgram, 'uImage');
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, bgndImage);
        gl.uniform1i(uImage, 0);

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
        const wallValues = getWallPositions(this.mapWalls, wallThickness, false);
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
            active: false,
            attribs: wallBuffers,
            uniforms: wallUniforms,
            program: wallProgram,
            hasNormals: false,
            stencil: 'none'
        }
        this.packages.push(wallPackage);


        // WALLS STENCIL PROGRAM

        // Get wall data ready for buffers
        this.wallStencilValues = getWallPositions(this.mapWalls, wallThickness, true);
        const wallStencilPositions = this.wallStencilValues[0];
        const wallStencilNormals = this.wallStencilValues[1];

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
            -1, -1,
            1, -1,
            1, 1,
            -1, -1,
            1, 1,
            -1, 1, 
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
            { name: 'uTranslate', val: [0, 0], type: 'vec2', location: null},
            { name: 'uRadius', val: lightRadius, type: 'float', location: null},
            { name: 'uAngle', val: 0, type: 'float', location: null},
            { name: 'uRotation', val: 0, type: 'float', location: null},
            { name: 'uColor', val: [1, 1, 1], type: 'vec3', location: null},
            { name: 'uIntensity', val: 0.5, type: 'float', location: null},
            { name: 'uMapSize', val: [this.mapSize.x, this.mapSize.y], type: 'vec2', location: null},
            
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
        this.renderCount = 0; // reset number of renders per animate frame

        if (!this.gl) { throw Error('Lost WebGL Render Context') }
        const gl: WebGLRenderingContext = this.gl;

        if (!this.renderTarget?.framebuffer) { return; }

        // clear
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // update time
        let uTime = getUniform(this.packages, 'background', 'uTime');
        uTime.val = this.getTime()/1000; // update uTime

        // update wall segments
        const wallStencilPositions = this.wallStencilValues[0];
        const wallStencilNormals = this.wallStencilValues[1];
        let wallStencilIndex = this.packages.map(pck => pck.name).indexOf('wallStencil');

        // Bind Positions
        gl.bindBuffer(gl.ARRAY_BUFFER, this.packages[wallStencilIndex].attribs.aPosition.attribBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(wallStencilPositions), gl.STATIC_DRAW);

        // Bind Normals
        gl.bindBuffer(gl.ARRAY_BUFFER, this.packages[wallStencilIndex].attribs.aNormal.attribBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(wallStencilNormals), gl.STATIC_DRAW);
            
        // let wallStencilIndex = this.packages.map(pck => pck.name).indexOf('wallStencil');
        let lightIndex = this.packages.map(pck => pck.name).indexOf('light');
        
        // Uniform References
        let uTranslate = getUniform(this.packages, 'light', 'uTranslate');
        let uRadius = getUniform(this.packages, 'light', 'uRadius');
        let uColor = getUniform(this.packages, 'light', 'uColor');
        let uIntensity = getUniform(this.packages, 'light', 'uIntensity');
        let uAngle = getUniform(this.packages, 'light', 'uAngle');
        let uRotation = getUniform(this.packages, 'light', 'uRotation');
        let uLightPoint = getUniform(this.packages, 'wallStencil', 'uLightPoint');
        
        // Draw to frame buffer instead of canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.renderTarget.framebuffer);
        const ambient = (this.renderLightsBool) ? 0.3 : 1.0;
        gl.clearColor(ambient, ambient, ambient, 1); 
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

        for (let iLight=0; iLight<this.mapLights.length; iLight++) {
            let light = this.mapLights[iLight];
            let position = light.position;
            let centeredPos = [
                position.x - this.mapSize.x/2,
                position.y - this.mapSize.y/2,
            ]
            let lightColor = [
                parseInt(light.color.substring(0, 2), 16) / 255, 
                parseInt(light.color.substring(2, 4), 16) / 255, 
                parseInt(light.color.substring(4, 6), 16) / 255
            ]
            uRadius.val = light.range*1.75; // light radius
            uTranslate.val = centeredPos; // light position for light shader
            uLightPoint.val = centeredPos; // light position for walls
            uColor.val = lightColor;
            uIntensity.val = light.intensity;
            uAngle.val = light.angle;
            uRotation.val = light.rotation;

            // draw stencil and light
            this.drawPackage(gl, this.packages[wallStencilIndex]);
            this.drawPackage(gl, this.packages[lightIndex]);
        }

        // Draw frame buffer to canvas
        let bgndIndex = this.packages.map(pck => pck.name).indexOf('background');
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.blendFunc(gl.ONE, gl.ZERO);
        this.drawPackage(gl, this.packages[bgndIndex]);
        

        if (this.frameCount % 100 == 0) {
            // console.log('Renders per frame:', this.renderCount)
            // console.log(this.mapSize)
            // console.log()
        }

        requestAnimationFrame(this.animate.bind(this));
    }

    drawPackage(gl: WebGLRenderingContext, pck: Package): void {
        if (!pck.active) { return }

        this.renderCount++;

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
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.renderTarget!.texture);
            gl.uniform1i(gl.getUniformLocation(pck.program, "uRenderTarget"), 1);
            setUniform(gl, getUniform(this.packages, 'background', 'uResolution')); // update uResolution
            setUniform(gl, getUniform(this.packages, 'background', 'uTime')); // update uTime
        } else if (pck.name == 'wallStencil') {
            setUniform(gl, getUniform(this.packages, 'wallStencil', 'uLightPoint')); // update light position for walls
        } else if (pck.name == 'light') {
            setUniform(gl, getUniform(this.packages, 'light', 'uRadius')); // update light range
            setUniform(gl, getUniform(this.packages, 'light', 'uTranslate')); // update position
            setUniform(gl, getUniform(this.packages, 'light', 'uColor')); // update color
            setUniform(gl, getUniform(this.packages, 'light', 'uIntensity')); // update intensity
            setUniform(gl, getUniform(this.packages, 'light', 'uAngle')); // update cone angle
            setUniform(gl, getUniform(this.packages, 'light', 'uRotation')); // update rotation of cone
        }

        // Draw
        gl.drawArrays(gl.TRIANGLES, 0, pck.attribs.aPosition.count); //primitive, offset, count
    }

    getTime(): number {
        return Date.now() - this.startTime;
    }

    updatePosition(vertical: number, horizontal: number, rotation: Vec3): void {
        if (!this.mapLights || this.mapLights.length == 0) { return }
        // Update light position
        let controllableLight = this.mapLights[this.mapLights.length-1];
        controllableLight.position = {
            x: horizontal + this.mapSize.x/2,
            y: vertical + this.mapSize.y/2
        }
        controllableLight.angle = rotation.x * (Math.PI/180);
        controllableLight.rotation = rotation.y * (Math.PI/180);
        let lightPackageIndex = this.packages.map(pck => pck.name).indexOf('light');
        if (rotation.z > 180) { this.renderLightsBool = false }
        else {  this.renderLightsBool = true }
    }

    updateMousePosition(vertical: number, horizontal: number): void {
        if (!this.mapLights || this.mapLights.length == 0) { return }
        // Update light position
        let controllableLight = this.mapLights[this.mapLights.length-1];
        controllableLight.position = {
            x: horizontal + this.mapSize.x/2,
            y: vertical + this.mapSize.y/2
        }
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
            this.setFPS(fps);

            // reset
            this.lastFrameTime = currentTime;
            this.lastFrameCount = this.frameCount;
        }
    }
}

export default Engine
