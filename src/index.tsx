import { useState } from "react";
import WebGLCanvas from "./engine/graphicsCanvas";
import RotationControls from "./controls";

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export default function Home() {
  const [rotation, setRotation] = useState<Vec3>({ x: 30, y: -135, z: 0 });
  const [vertical, setVertical] = useState<number>(3);
  const [horizontal, setHorizontal] = useState<number>(0);
  const [fps, setFPS] = useState<number>(0);

  const posProps = {
    rotation,
    setRotation,
    vertical,
    setVertical,
    horizontal, 
    setHorizontal,
    fps
  }

  return (
    <>
      <WebGLCanvas rotation={rotation} vertical={vertical} horizontal={horizontal} setFPS={setFPS}/>
      <RotationControls posProps={posProps}/>
    </>
  );
}
