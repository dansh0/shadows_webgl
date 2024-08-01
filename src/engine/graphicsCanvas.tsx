import React, { useRef, useEffect } from 'react'
import Engine from './engine';

interface Vec3 {
    x: number;
    y: number;
    z: number;
  }

interface WGLCanvasProps {
    rotation: Vec3;
    vertical: number;
    horizontal: number;
    setFPS: Dispatch<SetStateAction<number>>;
}

const WebGLCanvas:React.FC<WGLCanvasProps> = (props) => {
    let rotation = props.rotation;
    let vertical = props.vertical;
    let horizontal = props.horizontal;
    let setFPS = props.setFPS;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engine = useRef<Engine | null>(null);

    // run once on mounted
    useEffect(() => {
        engine.current = new Engine(canvasRef.current, setFPS);
    }, []);

    // update parameters
    useEffect(() => {
        engine.current.updatePosition(vertical, horizontal, rotation);
    }, [vertical, horizontal, rotation]);
    
    return <canvas className="webglCanvas" ref={canvasRef} />
}


export default WebGLCanvas