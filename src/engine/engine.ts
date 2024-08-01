import vertexShader from '../shaders/vertexTest.vert';
import fragmentShader from '../shaders/fragmentTest.frag';

interface Vec3 {
    x: number;
    y: number;
    z: number;
}

class Engine {
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext | null;
    vertexShader: string = vertexShader;
    fragmentShader: string = fragmentShader;
    positionBuff: WebGLBuffer | null;
    startTime: number;
    frameCount: number;
    lastFrameCount: number;
    lastFrameTime: DOMHighResTimeStamp;
    setFPS: Dispatch<SetStateAction<number>>;


    constructor(canvas: HTMLCanvasElement, setFPS: Dispatch<SetStateAction<number>>) {
        this.positionBuff = null;
        this.startTime = Date.now();
        this.canvas = canvas;
        this.gl = this.canvas!.getContext('webgl');
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
        this.lastFrameCount = 0;
        this.setFPS = setFPS;
        this.init();
    }

    init(): void {

        const gl = this.gl;
        const canvas = this.canvas;

        // Check Null
        if (canvas === null) { throw Error('Cannot get canvas'); }
        if (gl===null) { throw Error("Cannot get webgl context from canvas"); }
        
        // Clear Canvas
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // Set Canvas Size
        canvas.width = canvas.clientWidth; // resize to client canvas
        canvas.height = canvas.clientHeight; // resize to client canvas
        console.log(canvas.width, canvas.height);
        gl.viewport(0, 0, canvas.width, canvas.height);

        // Time Function
        const startTime = Date.now();
        this.getTime = () => { return Date.now() - startTime; }

        // this.tMat.rotationX(0.1);

        let positions = [
            -1, -1,
            1, -1,
            1, 1,
            -1, -1,
            1, 1,
            -1, 1, 
        ];
        
        // Set up Position Attribute
        this.positionBuff = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuff);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        const posBuffSize = 2;
        const posBuffType = gl.FLOAT;

        // Compile the vertex shader
        const vShader = gl.createShader( gl['VERTEX_SHADER'] );
        if (vShader === null) {throw Error('Cannot create vertex shader');}
        gl.shaderSource(vShader, this.vertexShader);
        gl.compileShader(vShader);
        console.log(gl.getShaderInfoLog(vShader));

        // Compile the fragment shaders
        const fShader = gl.createShader( gl['FRAGMENT_SHADER'] );
        if (fShader === null) {throw Error('Cannot create fragment shader');}
        gl.shaderSource(fShader, this.fragmentShader);
        gl.compileShader(fShader);
        console.log(gl.getShaderInfoLog(fShader));

        // Create Program
        const setUpProgram = (fShader: WebGLShader) => {

            let program = gl.createProgram();
            if (program === null) {throw Error('Cannot create program');}
            gl.attachShader(program, vShader);
            gl.attachShader(program, fShader);
            gl.linkProgram(program);
            gl.useProgram(program);
            
            // Instruct Program how to use attribute data
            // Position
            const posAttribLocation = gl.getAttribLocation(program, 'aPosition');
            gl.enableVertexAttribArray(posAttribLocation);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuff);
            gl.vertexAttribPointer( posAttribLocation, posBuffSize, posBuffType, false, 0, 0);
            
            // Set up Uniforms
            let timeUniformLocation = gl.getUniformLocation(program, "uTime");
            gl.uniform1f(timeUniformLocation, this.getTime());

            let resUniformLocation = gl.getUniformLocation(program, "uResolution");
            gl.uniform2f(resUniformLocation, canvas.width, canvas.height);

            return program
        }

        let program = setUpProgram(fShader);
        // gl.useProgram(program);

        // Enable Depth Test
        // gl.enable(gl.DEPTH_TEST);
        // gl.depthFunc(gl.LEQUAL);

        // Cull back faces
        // gl.enable(gl.CULL_FACE);

        // Draw
        const count = Math.floor(positions.length/2);
        gl.drawArrays(gl.TRIANGLES, 0, count); //primitive, offset, count

        // Animate!
        const animate = () => {
            // update stats
            this.frameCount++;
            this.updateFPS();

            // clear
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // update time
            let currentTime = this.getTime()/1000
            let timeUniformLocation = gl.getUniformLocation(program, "uTime");
            gl.uniform1f(timeUniformLocation, currentTime);

            // Draw frame
            gl.drawArrays(gl.TRIANGLES, 0, count);
            requestAnimationFrame(animate);
        }

        window.addEventListener("resize", () => {
            let width = window.innerWidth;
            let height = window.innerHeight;
            canvas.style.height = height + 'px';
            canvas.style.width = width + 'px';
            canvas.width = canvas.clientWidth; // resize to client canvas
            canvas.height = canvas.clientHeight; // resize to client canvas
            let resUniformLocation = gl.getUniformLocation(program, "uResolution");
            gl.uniform2f(resUniformLocation, canvas.width, canvas.height);
        });

        animate();
    }

    getTime(): number {
        return Date.now() - this.startTime;
    }

    updatePosition(height: number, forward: number, rotation: Vec3): void {
        console.log('UDPATE')
        console.log(height, forward, rotation)
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
