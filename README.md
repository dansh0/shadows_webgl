# WebGL Occluded Shadows

Creating efficient shadow mapping of point/directional lights and occluders using WebGL

## Summary

This project is a subset of code I wrote for a client project, made public here with his approval. The client needed a dynamic deferred lighting system for his VTT (Virtual Tabletop) simulator/game that would run fast on essentially any modern laptop. The lighting needed to be functional, since players should only be able to see the map where it is lit. Lights can be point lights or directional lights, can flicker, have colors, etc.

I used an approach that utilizes WebGL to its fullest extent, making use of fragment shaders, vertex shaders, and stencil buffers amongst other standard tools. Vertex shaders are utilized to "stretch" the wall geometry outward from each light to form its shadow, which is then drawn to the stencil buffer. After that step drawing lights is as simple as drawing the light attentuation with the stencil as a mask. Lights are all drawn additively to a render target texture, which is then multiplied by the base map texture for best lighting effect.

## Live Demo

Run this code here:

[LIVE DEMO](https://shores.design/index.php/shadows-webgl-demo/)

## Image

![](https://github.com/dansh0/shadows_webgl/blob/main/public/Screenshot.png)

## Sources
All WebGL utilities are written by me, with plenty of guidance from the great guide at https://webglfundamentals.org/

For a great visual explanation of the vertex shadow shadow occlusion method, checkout this video: https://www.youtube.com/watch?v=R6vQ9VmMz2w&t=320s

## Run Instruction

```
npm install
npm run dev
```
