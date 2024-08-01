import { useState } from "react";
import Head from "next/head";
import WebGLCanvas from "@/engine/graphicsCanvas";
import RotationControls from "./controls";

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export default function Home() {
  const [rotation, setRotation] = useState<Vec3>({ x: 20, y: 0, z: 0 });
  const [vertical, setVertical] = useState<number>(3);
  const [horizontal, setHorizontal] = useState<number>(0);
  const [fps, setFPS] = useState<number>(0);

  const posProps = {
    rotation,
    setRotation,
    vertical,
    setVertical,
    horizontal, 
    setHorizontal
  }

  return (
    <>
      <Head>
        <title>WebGL Shadows</title>
        <meta name="description" content="Shadows Demo with WebGL" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <WebGLCanvas rotation={rotation} vertical={vertical} horizontal={horizontal} setFPS={setFPS}/>
      <RotationControls posProps={posProps} fps={fps}/>
    </>
  );
}
