interface Vec2 {
    x: number,
    y: number
}

export const getWallPositions = (mapWalls: Vec2[][], wallThickness: number): number[][] => {
    let positions = [];
    let normals = [];
    let lastSegPoint, segPoint;
    for (let iWall = 0; iWall<mapWalls.length; iWall++) {
        for (let iSeg = 0; iSeg<mapWalls[iWall].length; iSeg++) {
            if (iSeg == 0) {
                // first segment point, this is your anchor
                lastSegPoint = mapWalls[iWall][iSeg];
            } else {
                segPoint = mapWalls[iWall][iSeg];
                // fill two triangle or one quad
                let dx = segPoint.x-lastSegPoint.x;
                let dy = segPoint.y-lastSegPoint.y;
                let length = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
                dx /= length;
                dy /= length;
                let px = 0.5*wallThickness * -dy; // the change in x to the corner point
                let py = 0.5*wallThickness * dx; // the change in y to the corner point

                // Add to position buffer
                positions.push(...[
                    lastSegPoint.x + px, lastSegPoint.y + py,
                    segPoint.x + px, segPoint.y + py,
                    segPoint.x - px, segPoint.y - py,
                    lastSegPoint.x + px, lastSegPoint.y + py,
                    segPoint.x + px, segPoint.y + py,
                    segPoint.x - px, segPoint.y - py,
                    lastSegPoint.x + px, lastSegPoint.y + py,
                    segPoint.x - px, segPoint.y - py,
                    lastSegPoint.x - px, lastSegPoint.y - py,
                    lastSegPoint.x + px, lastSegPoint.y + py,
                    segPoint.x - px, segPoint.y - py,
                    lastSegPoint.x - px, lastSegPoint.y - py,
                ]); // wall segment via two triangles

                // quick hypotenuse maths
                let hypLen = Math.sqrt(Math.pow(dy-dx, 2) + Math.pow(dx+dy, 2));

                // Add to normal buffer
                normals.push(...[
                    -dy, dx,
                    dx, dy,
                    (dy-dx)/hypLen, -(dx+dy)/hypLen,
                    (dy-dx)/hypLen, -(dx+dy)/hypLen,
                    -dy, dx,
                    dx, dy,
                    -(dy-dx)/hypLen, (dx+dy)/hypLen,
                    dy, -dx,
                    -dx, -dy,
                    -dx, -dy,
                    -(dy-dx)/hypLen, (dx+dy)/hypLen,
                    dy, -dx,
                ]);

                // Set up for next
                lastSegPoint = segPoint;
            }
        }
    }

    return [positions, normals]
}