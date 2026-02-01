



// 1st polyhedron vertex
const ZZZ=50;
const    Glenz1Vertex=[ /*14,*/              // "points" in original code 8 cubes summit + 1 point outside each cube faces => 14 values
        { x: -100*ZZZ,  y: -100*ZZZ, z: -100*ZZZ},
        { x:  100*ZZZ,  y: -100*ZZZ, z: -100*ZZZ},
        { x:  100*ZZZ,  y:  100*ZZZ, z: -100*ZZZ},
        { x: -100*ZZZ,  y:  100*ZZZ, z: -100*ZZZ},
        { x: -100*ZZZ,  y: -100*ZZZ, z:  100*ZZZ},
        { x:  100*ZZZ,  y: -100*ZZZ, z:  100*ZZZ},
        { x:  100*ZZZ,  y:  100*ZZZ, z:  100*ZZZ},
        { x: -100*ZZZ,  y:  100*ZZZ, z:  100*ZZZ},
        { x:    0*ZZZ,  y:    0*ZZZ, z: -170*ZZZ},
        { x:    0*ZZZ,  y:    0*ZZZ, z:  170*ZZZ},
        { x:  170*ZZZ,  y:    0*ZZZ, z:    0*ZZZ},
        { x: -170*ZZZ,  y:    0*ZZZ, z:    0*ZZZ},
        { x:    0*ZZZ,  y:  170*ZZZ, z:    0*ZZZ},
        { x:    0*ZZZ,  y: -170*ZZZ, z:    0*ZZZ}]; 


// 2nd polyhedron vertex (same shape as first one, just a different scale and different color scheme)
const QQQ=99;
const   Glenz2Vertex=[ /*14,*/              // "pointsb" in original code, 8 cubes summit + 1 point outside each cube faces => 14 values
        { x:  -60*QQQ,  y:  -60*QQQ, z:  -60*QQQ},
        { x:   60*QQQ,  y:  -60*QQQ, z:  -60*QQQ},
        { x:   60*QQQ,  y:   60*QQQ, z:  -60*QQQ},
        { x:  -60*QQQ,  y:   60*QQQ, z:  -60*QQQ},
        { x:  -60*QQQ,  y:  -60*QQQ, z:   60*QQQ},
        { x:   60*QQQ,  y:  -60*QQQ, z:   60*QQQ},
        { x:   60*QQQ,  y:   60*QQQ, z:   60*QQQ},
        { x:  -60*QQQ,  y:   60*QQQ, z:   60*QQQ},
        { x:    0*QQQ,  y:    0*QQQ, z: -105*QQQ},
        { x:    0*QQQ,  y:    0*QQQ, z:  105*QQQ},
        { x:  105*QQQ,  y:    0*QQQ, z:    0*QQQ},
        { x: -105*QQQ,  y:    0*QQQ, z:    0*QQQ},
        { x:    0*QQQ,  y:  105*QQQ, z:    0*QQQ},
        { x:    0*QQQ,  y: -105*QQQ, z:    0*QQQ}]; 

const Glenz1Polygons=[  //"epolys" in original code
    {color:0x01, PointsIndex:[0,1,8]},  //blue
    {color:0x02, PointsIndex:[1,2,8]},  //white
    {color:0x03, PointsIndex:[2,3,8]},  //blue
    {color:0x04, PointsIndex:[3,0,8]},  //white
    
    {color:0x05, PointsIndex:[2,1,10]}, //blue
    {color:0x06, PointsIndex:[1,5,10]}, //white
    {color:0x07, PointsIndex:[5,6,10]}, //blue
    {color:0x08, PointsIndex:[6,2,10]}, //white

    {color:0x09, PointsIndex:[2,6,12]}, //blue
    {color:0x0A, PointsIndex:[6,7,12]}, //white
    {color:0x0B, PointsIndex:[7,3,12]}, //blue
    {color:0x0C, PointsIndex:[3,2,12]}, //white

    {color:0x0D, PointsIndex:[0,3,11]}, //blue
    {color:0x0E, PointsIndex:[3,7,11]}, //white
    {color:0x0F, PointsIndex:[7,4,11]}, //blue
    {color:0x10, PointsIndex:[4,0,11]}, //white

    {color:0x11, PointsIndex:[5,1,13]}, //blue
    {color:0x12, PointsIndex:[1,0,13]}, //white
    {color:0x13, PointsIndex:[0,4,13]}, //blue
    {color:0x14, PointsIndex:[4,5,13]}, //white

    {color:0x15, PointsIndex:[5,4,9]}, //blue
    {color:0x16, PointsIndex:[4,7,9]}, //white
    {color:0x17, PointsIndex:[7,6,9]}, //blue
    {color:0x18, PointsIndex:[6,5,9]}  //white
];
    
const Glenz2Polygons=[ //"epolysb" in original code
    {color:0x04, PointsIndex:[0,1,8]},  // dark red (will result in color index 0 frontside, color index 4 backside)
    {color:0x02, PointsIndex:[1,2,8]},  // bright red (will result in color index 1 frontside, color index 2 backside)
    {color:0x04, PointsIndex:[2,3,8]}, 
    {color:0x02, PointsIndex:[3,0,8]},  
    
    {color:0x04, PointsIndex:[2,1,10]}, 
    {color:0x02, PointsIndex:[1,5,10]}, 
    {color:0x04, PointsIndex:[5,6,10]}, 
    {color:0x02, PointsIndex:[6,2,10]},  

    {color:0x04, PointsIndex:[2,6,12]}, 
    {color:0x02, PointsIndex:[6,7,12]}, 
    {color:0x04, PointsIndex:[7,3,12]}, 
    {color:0x02, PointsIndex:[3,2,12]},  

    {color:0x04, PointsIndex:[0,3,11]}, 
    {color:0x02, PointsIndex:[3,7,11]}, 
    {color:0x04, PointsIndex:[7,4,11]}, 
    {color:0x02, PointsIndex:[4,0,11]},  

    {color:0x04, PointsIndex:[5,1,13]}, 
    {color:0x02, PointsIndex:[1,0,13]}, 
    {color:0x04, PointsIndex:[0,4,13]}, 
    {color:0x02, PointsIndex:[4,5,13]}, 

    {color:0x04, PointsIndex:[5,4,9]},
    {color:0x02, PointsIndex:[4,7,9]}, 
    {color:0x04, PointsIndex:[7,6,9]}, 
    {color:0x02, PointsIndex:[6,5,9]}  
];    
