interface Vec2 {
    x: number,
    y: number
}

export const getWallPositions = (mapWalls: Vec2[][], wallThickness: number, shadow: boolean): number[][] => {
    let positions = [];
    let normals = [];

    // DEBUG
    let debug = false;
    if (debug) {
        // positions = [ 
        //     10, 10,  20, 10,  20, 20, 
        //     10, 10,  20, 20,  10, 20,
        //     10, 10, 10, 10, 20, 10,
        //     20, 10, 20, 10, 20, 20,
        //     20, 20, 20, 20, 10, 20,
        //     10, 20, 10, 20, 10, 10,
        // ];
        // normals = [
        //     -1, 0, 0, -1, 1, 0,
        //     -1, 0, 1, 0, 0, 1,
        //     -1, 0, 0, -1, 0, -1,
        //     0, -1, 1, 0, 1, 0,
        //     1, 0, 0, 1, 0, 1,
        //     0, 1, -1, 0, -1, 0,
        // ];
        // return [positions, normals]
        mapWalls = [[
            {x: 10, y: 10},
            {x: 20, y: 10},
            {x: 20, y: 20}
        ]]
    }


    let lastSegPoint, segPoint;
    for (let iWall = 0; iWall<mapWalls.length; iWall++) {
        for (let iSeg = 0; iSeg<mapWalls[iWall].length; iSeg++) {
            if (iSeg == 0) {
                // first segment point, this is your anchor
                lastSegPoint = mapWalls[iWall][iSeg];
            } else {
                segPoint = mapWalls[iWall][iSeg];

                if (!lastSegPoint) {continue}
                
                // Fill two triangle

                // Find slope and partials of the line
                let dx = segPoint.x-lastSegPoint.x;
                let dy = segPoint.y-lastSegPoint.y;
                let length = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
                dx /= length;
                dy /= length;

                // Add wall thickness to extend off edge as well
                let px = 0.5*wallThickness * -dy; // the change in x to the corner point
                let py = 0.5*wallThickness * dx; // the change in y to the corner point

                let extended = 0;//wallThickness;
                let seg0 = {
                    x: lastSegPoint.x - dx*0.5*extended,
                    y: lastSegPoint.y - dy*0.5*extended
                }
                let seg1 = {
                    x: segPoint.x + dx*0.5*extended,
                    y: segPoint.y + dy*0.5*extended
                }

                // Solve for rectangle vertices
                let vert0 = [seg0.x - px, seg0.y - py]; // First corner vertex
                let vert1 = [seg1.x - px, seg1.y - py];
                let vert2 = [seg1.x + px, seg1.y + py];
                let vert3 = [seg0.x + px, seg0.y + py];

                // Add to position buffer
                // First two tris are the main rect, the each tri after is a zero-area tri for edge normals for shadow mask
                positions.push(...[
                    ...vert0, ...vert1, ...vert2,
                    ...vert0, ...vert2, ...vert3,                    
                ]);

                if (shadow) {
                    positions.push(...[                   
                        ...vert0, ...vert0, ...vert1,
                        ...vert1, ...vert1, ...vert2,
                        ...vert2, ...vert2, ...vert3,
                        ...vert3, ...vert3, ...vert0
                    ]);
                }

            // quick hypotenuse maths
            let hypLen = Math.sqrt(Math.pow(dy-dx, 2) + Math.pow(dx+dy, 2));


                let upNorm = [-dy, dx]; // normal of 0_1 edge
                let rightNorm = [dx, dy]; // normal of 1_2 edge
                let downNorm = [dy, -dx]; // normal of 2_3 edge
                let leftNorm = [-dx, -dy]; // normal of 3_0 edge

                // Add to normal buffer
                normals.push(...[
                    ...leftNorm, ...downNorm, ...rightNorm,
                    ...leftNorm, ...rightNorm, ...upNorm,
                ]);

                if (shadow) {
                    normals.push(...[
                        ...leftNorm, ...downNorm, ...downNorm,
                        ...downNorm, ...rightNorm, ...rightNorm,
                        ...rightNorm, ...upNorm, ...upNorm,
                        ...upNorm, ...leftNorm, ...leftNorm
                    ]);
                }

                // Set up for next
                lastSegPoint = segPoint;
            }
        }
    }

    return [positions, normals]
}