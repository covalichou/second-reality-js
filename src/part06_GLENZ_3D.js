
//TODO implement rotation according to time and not floored frame number (to make things smoother)

//PART06: 3D GLENZ part : 
//PART06 is dependent of PART05 data (Final Checkerboard picture and palette, reuse the offscreen buffer) (TODO CONFIRM THESE)
// original code in GLENZ folder of source code release.
// original code by PSI

//  320x200 for checkerboard display and glenz vectors 

// Main concepts:

// 2 parts:  
// 1st part, one blue/white translucide polyhedron ("glenz" solid), is rotating and bouncing on a checkerboard.  This first solid colors are shaded according to a frontal light source
// 2nd part, boucing stops, the checkerboard is removed, and a bigger red polyhedron is rotating behind the first one. This one is translucid but not light shaded.

// Both Polyhedrons are based  on a "Tetrakis hexahedron" shape (see https://en.wikipedia.org/wiki/Tetrakis_hexahedron)

//  _ polygons are drawn using an OR write mode => with appropriate palette adjustment, the transparency effect happens.
//  _ to limit writing in VRAM, original code use seems to use a "delta fill" algorithm (not analysed or implemented here):
//      it lists all horizontal lines ("scan lines") of each polygon and only write in VRAM the changes between two frames, in most cases only a few pixels per lines are changed
//  _ 1st solid face shading is performed by palette change (to limit number of VRAM changes between two frames)

// To fill polygon, this implementation uses the polygon clipping and fill routine of U2A/U2E part, adapted for transparency management (write pixel with OR logical function)
// This was for me the quickest way to get the expected result without analysing a new long/complex x86 assembly clipping/fill routine 

//  Details of implementation (similar to orginal code, a bit simplified as there are some useless color management provision in original part) :
// 
//  Checkerboard: color uses color index 0..7 (3 lowest bits, with color 0 black)
//
//  1st glenz object: (white and blue)
    //  _ white and blue glenz, 24 faces 
    //  _ frontside faces are shaded according to their orientation (using palette change)
    //  _ transparency with checkerboard is managed by palette changes and by writing pixels index in VRAM with OR combination

    //  backside faces colors can be:
    //      _ black (fully transparent) 
    //      _ color index 4 for backside blue faces (which is color used by clear square of checkerboard)

    // front side (blue or white face)
    //      _ each face has a unique color index area (according to its blue/white base color and lighting level)
    //      _ by geometry 2 frontside faces will never be mixed together, 1 frontside face can only be mixed with one backside one
    //      _ for each face 8 colors index are needed to cover all possible transparency cases (with either checkerboard or a backside face)
    //      _ original code can manage more than needed, it dynamically allocates color index slot to faces (rolcol / rolused), based on a 16 color/face scheme.
    //        But with 1 checkerboard, 24 faces, 8 color index per face and 8 checkerboard colors, only 25*8=200 color index are needed (this simplification is implemented here!)

//  2nd glenz object: (dark/bright red, similar shape as the 1st glenz)
    //  the checkerboard color index area (0..7) is no longer in use. 2nd glenz will use this color index area:
    //   Color index 0 : dark red face frontside (black, but will always be mixed with a backside face)
    //   Color index 1 : bright red face frontside
    //   Color index 2 : bright red face backside
    //   Color index 4 : dark red face backside 

    //  palette of 1st glenz takes in accound this new red palette (stored in backpal) instead checkerboard palette,  to adjust colors with shading


function GLENZ_3D()
{ 





let BackgroundRGBPalette= new Array (8*3);  //"backpal" in original code, only 8 colors array is needed
let CurrentVGAPalette=new Array(256*3);
let lightshift;



const projxmul = 256;
const projymul = 213;
const projxadd = 160;
const projyadd = 130;



let zpos,ypos;
let boingm,boingd;
let jello,jelloa; 
let Glenz1ScaleX,Glenz1ScaleY,Glenz1ScaleZ;  // xscale,yscale,zscale in original code
let Glenz2Scale; //bscale in original code
let Glenz1TranslateX,Glenz1TranslateY,Glenz1TranslateZ;  //oxp,oyp,ozp in original code
let Glenz2TranslateX,Glenz2TranslateY,Glenz2TranslateZ;  //oxb,oyb,ozb in original code

let Matrix=new Array(9);
let NullTranslationVector= {x:0,y:0,z:0};
let CurrentTranslationVector= {x:0,y:0,z:0};


let ScaledTranslatedGlenzVertex= new Array (Glenz1Vertex.length);
for (let i=0;i<ScaledTranslatedGlenzVertex.length;i++) ScaledTranslatedGlenzVertex[i]= {};
let RotatedGlenzVertex= new Array (Glenz1Vertex.length);
for (let i=0;i<RotatedGlenzVertex.length;i++) RotatedGlenzVertex[i]= {};
let	ProjectedVertex=new Array (Glenz1Vertex.length);
for (let i=0;i<ProjectedVertex.length;i++) ProjectedVertex[i]= {};



//************************************************************************************************************************************************************************************************************

function PartInit()
{
	if (!CHECKERBOARD) GLENZ_TRANSITION().init();  //load the data if not already done by previous part (Do it early to avoid PartName overwrite)

    PartName = "GLENZ_3D";
    PartTargetFrameRate=70;  //originally based on a VGA Mode 13h (320x200@70Hz)   


	//this part reuses data from part GLENZ_Transition (the checkerboard image)
	
    
    //Build palette
    let r,g,b,a,c;
    for(a=0;a<8*3;a++) BackgroundRGBPalette[a]=CHECKERBOARD[16+a]; //original code GLENZ/MAIN.C:357, only useful code kept
    for(a=0;a<8*3;a++) CurrentVGAPalette[a]=BackgroundRGBPalette[a];  //original code GLENZ/MAIN.C:366, only useful code kept

    lightshift=9;
    rx=ry=rz=0;
    ypos=-9000; yposa=0;

    ClippingY	=	[0,199] ;	 //for polygon fill routine (which is common with U2A/U2E 3d parts and use other clipping limit)
  
    zpos=7500;
    boingm=6;
    boingd=7;
    jello=0;
    jelloa=0; 
    Glenz1ScaleX=120;
    Glenz1ScaleY=120;
    Glenz1ScaleZ=120;  // xscale,yscale,zscale in original code
    Glenz2Scale=0; //bscale in original code
    Glenz1TranslateX=0;Glenz1TranslateY=0;Glenz1TranslateZ=0;  //oxp,oyp,ozp in original code
    Glenz2TranslateX=0;Glenz2TranslateY=0;Glenz2TranslateZ=0;  //oxb,oyb,ozb in original code        
  }

//************************************************************************************************************************************************************************************************************
//called by main demo loop each time the screen has to be updated, time stamp is relative to part start
function PartRenderFrame()
{
    DrawBackground();  //clear screen and redraw checkerboard (which will be cleared in second half of part)
       
    //wait for music sync event to start animation
	if (!IsDisSyncPointReached("GLENZ_START")) 
	{
		ResetPartClock();  //let CurrentAnimationFrame to 0
		return;  //exit function until music point is reached
	}

    //Update animation and video frame at correct rate
    for (let i=0;i<AnimationFramesToRender;i++)
         AnimateOneGlenzFrame(CurrentAnimationFrame-AnimationFramesToRender+i,CurrentAnimationFrameFloored-AnimationFramesToRender+i); //update animation parameters up to the expected animation frame number (be sure to run all individual frame animation)
  
    // render the 3D objects
    RenderGlenzScene(CurrentAnimationFrame);  // now render the Glenz vectors
	
    
    SetVGAPalette(CurrentVGAPalette);
    
    RenderIndexedMode13hFrame();

    if (CurrentAnimationFrame>2070+64+30) HasPartEnded=true;  //done when image has faded in
}

//************************************************************************************************************************************************************************************************************
function DrawBackground()
{
    //redraw background image (at the beginning: checkerboard image from part05, then, later in the part, checkerboard is erased)
    for (let i=0;i<320*200;i++) IndexedFrameBuffer[i]=LastCHECKERBOARD[i]; 
}
//************************************************************************************************************************************************************************************************************
function RenderGlenzScene(frame)
{

    // Render 1st glenz object (white and blue) with shading
    if(Glenz1ScaleX>4)  //original code GLENZ/MAIN.C: 595
    {
        ComputeRotationMatrix(rx,ry,rz,Matrix);  //build rotation matrix
        RotateTranslateVertexList(RotatedGlenzVertex,Glenz1Vertex,Matrix, NullTranslationVector);  //Rotate Vertex (without scaling / translation)
        
        Matrix.fill(0);
        Matrix[0]=Glenz1ScaleX*64/32768;
        Matrix[4]=Glenz1ScaleY*64/32768;
        Matrix[8]=Glenz1ScaleZ*64/32768;  //build diagonal matrix to  get a zoom  (different x,y,z scale value according to jelly effect) 
        CurrentTranslationVector.x=Glenz1TranslateX;
        CurrentTranslationVector.y=ypos+1500+Glenz1TranslateY;
        CurrentTranslationVector.z=zpos+Glenz1TranslateZ;
        RotateTranslateVertexList(ScaledTranslatedGlenzVertex,RotatedGlenzVertex,Matrix, CurrentTranslationVector); //Scale for jelly effect and translate object
        if(frame<800) VerticalClipVertexList(ScaledTranslatedGlenzVertex);  //when glenz1 boucing, Y size has to be limited
        Projection2DVertexList(ProjectedVertex,ScaledTranslatedGlenzVertex);
        RenderGlenzObject(Glenz1Polygons,ProjectedVertex,0);  //draw polygons of the object, with Glenz 1 color scheme (blue/white)
    }

    // Render 2nd glenz object (red) without shading
    if(frame>800 && Glenz2Scale>4)
    {       
        ComputeRotationMatrix(3600-rx/3,3600-ry/3,3600-rz/3,Matrix);
        RotateTranslateVertexList(RotatedGlenzVertex,Glenz2Vertex,Matrix, NullTranslationVector); //Rotate Vertex (without scaling / translation)
        
        Matrix.fill(0);
        Matrix[0]=Glenz2Scale*64/32768;
        Matrix[4]=Glenz2Scale*64/32768;
        Matrix[8]=Glenz2Scale*64/32768;  //diagonal matrix to just get a zoom after rotation
        CurrentTranslationVector.x=Glenz2TranslateX;
        CurrentTranslationVector.y=ypos+1500+Glenz2TranslateY;
        CurrentTranslationVector.z=zpos+Glenz2TranslateZ;
        RotateTranslateVertexList(ScaledTranslatedGlenzVertex,RotatedGlenzVertex,Matrix, CurrentTranslationVector);  //Scale and translate object
        Projection2DVertexList(ProjectedVertex,ScaledTranslatedGlenzVertex);
        RenderGlenzObject(Glenz2Polygons,ProjectedVertex,1); //draw polygons of the object, with Glenz 2 color scheme (red)
    }
}

//************************************************************************************************************************************************************************************************************
function UpdateGlenz1PositionAndScalePart1(frame)  //Update 1st glenz position according to frame number during first half of the part (when Glenz 1 is alone and boucing)
{
    if (frame<800)    
    {
        if(frame<640+70)   // frame 1-709: bounce
        {
            yposa+=31;
            ypos+=yposa/40; 
            if(ypos>-300)
            {
                ypos-=yposa/40;
                yposa=-yposa*boingm/boingd;
                boingm+=2; boingd++;
            }
            if(ypos>-900 && yposa>0)
            {
                jello=(ypos+900)*5/3;
                jelloa=0;
            }
        }
        else  //frame //710-799
        {
            if(ypos>-2800) ypos-=16;
            else if(ypos<-2800) ypos+=16;
        }
        Glenz1ScaleY=Glenz1ScaleX=120+jello/30;
        Glenz1ScaleZ=120-jello/30;
        a=jello;
        jello+=jelloa;
        if((a<0 && jello>0) || (a>0 && jello<0)) jelloa=jelloa*5/6;
        a=jello/20;
        jelloa-=a;
    }
}

//************************************************************************************************************************************************************************************************************
function UpdateGlenz1PositionAndScalePart2(frame)  //Update 1st glenz position according to frame number during second half of the part (when Glenz 2 has came)
{
    if(frame>900)   //when glenz2 is here: small x,y,z translation
    {
        let a=frame-900;
        let b=frame-900; 
        if(b>50) b=50;
        Glenz1TranslateX= Math.sin(a*3/1024*2*Math.PI)*255*b/10;          //  sin1024[(a*3)&1023]*b/10;    
        Glenz1TranslateY= Math.sin(a*5/1024*2*Math.PI)*255*b/10;          //  sin1024[(a*5)&1023]*b/10;
        Glenz1TranslateZ=(Math.sin(a*4/1024*2*Math.PI)*255/2+128)*b/16;   // (sin1024[(a*4)&1023]/2+128)*b/16;
    }
    if(frame>1800) //End of part (Glenz1 will leave by top of picture, and size will decrease)
    {
        let b=1800-frame;
        if(b<-99) b=-99;
        Glenz1TranslateY-=b*b/2;  //translate to top
        if(frame>1220+789)
        {
            if(Glenz1ScaleX>0) Glenz1ScaleX-=1;  //1st glenz scale
            if(Glenz1ScaleY>0) Glenz1ScaleY-=1;
            if(Glenz1ScaleZ>0) Glenz1ScaleZ-=1;
        }  
    }     
}

//************************************************************************************************************************************************************************************************************
function UpdateGlenz2PositionAndScale(frame)
{
    //manage Position
    if(frame>1800) //increase amplitude of Glenz2 translation motion at end of part
    {
        let a=frame-1800+64;
        Glenz2TranslateX= -Math.sin(a*6/1024*2*Math.PI)*255*a/40;  //2nd glenz position    //(-sin1024[(a*6)&1023])*a/40;
        Glenz2TranslateY= -Math.sin(a*7/1024*2*Math.PI)*255*a/40;                          //(-sin1024[(a*7)&1023])*a/40;
        Glenz2TranslateZ=( Math.sin(a*8/1024*2*Math.PI)*255+128)*a/40;                     //( sin1024[(a*8)&1023]+128)*a/40; 
    }
    else if(frame>900)  // small x,y,z translation
    {
        let a=frame-900;
        Glenz2TranslateX=-Math.sin(a*6/1024*2*Math.PI)*255;         //2nd glenz position   // -sin1024[(a*6)&1023];
        Glenz2TranslateY=-Math.sin(a*7/1024*2*Math.PI)*255;                                // -sin1024[(a*7)&1023];
        Glenz2TranslateZ= Math.sin(a*8/1024*2*Math.PI)*255;+128;                           //  sin1024[(a*8)&1023]+128; 
    }
    //Manage scale
    if((frame>800) && (frame<=890)) Glenz2Scale+=2;//frame 801-890: increase 2nd Glenz bscale from 0 to to 180, 
    if(frame>1220+789)
    {
        if(Glenz2Scale>0) Glenz2Scale-=1;  // Slowly Reduce 2nd glenz scale
    }
    else if(frame>1400+789)
    {
        if(Glenz2Scale>0) Glenz2Scale-=8; // Reduce 2nd glenz scale faster
        if(Glenz2Scale<0) Glenz2Scale=0;
    }
    if(Glenz2Scale>Glenz1ScaleX) lightshift=10;  //adjust Glenz1 shading when glenz1 bigger
}

//************************************************************************************************************************************************************************************************************
function UpdateCheckerboardAndPalette (frame)  //manage palette changes and checkerboard removal
{
    let a,b;
    if(frame>700)   //frame 700 to 2069
    {
        if(frame<765)  //frame 700 to 764: fade out the checkerboard 
        {
            b=764-frame;
            if(b<0) b=0;
            for(a=0;a<8*3;a++) CurrentVGAPalette[a]=Math.floor(BackgroundRGBPalette[a]*b/64);
        }
        else if(frame==765)  //frame 765 clear checkerboard after fade out 
        {
            for (i=150*320;i<200*320;i++) LastCHECKERBOARD[i]=0; //memset(bgpic+y*320,0,640); //  memset(vram+y*320,0,640);
        }
        else if(frame==790) //frame 790 prepare palette to support glenz2 mixing with glenz1
        {
            for(a=0;a<8;a++)
            {
                r=g=b=0;
                if(a&1) r+=10;  //mixing with bright red frontside face (will be mixed with backside face too, will look bright)
                if(a&2) r+=30;  //mixing with bright red face backside face
                if(a&4) r+=20;  //mixing with dark red face backside face
                CurrentVGAPalette[a*3+0]=BackgroundRGBPalette[a*3+0]=clip(r,0,63);
                CurrentVGAPalette[a*3+1]=BackgroundRGBPalette[a*3+1]=clip(g,0,63);
                CurrentVGAPalette[a*3+2]=BackgroundRGBPalette[a*3+2]=clip(b,0,63);
            }
        }
        else if(frame>1280+789)  //frame 2070-to end, final fade out (fully faded at frame 2133)
        {
            b=1280+789+64-frame;
            if(b<0) b=0;
            for(a=0;a<8*3;a++) CurrentVGAPalette[a]=Math.floor(BackgroundRGBPalette[a]*b/64);
        }
    }
}
//************************************************************************************************************************************************************************************************************
function AnimateOneGlenzFrame(Unflooredframe, frame)   // based on code in MAIN.C (~line 450 and below), split in different functions to clarify
{
    //Update rotation angles base variables
    rx=32*Unflooredframe;  //make rotation a bit smoother
    ry=7*Unflooredframe;
    rx%=3*3600; ry%=3*3600; 
    // Update size / position of glenz objects
    UpdateGlenz1PositionAndScalePart1(frame);
    UpdateGlenz1PositionAndScalePart2(frame);
    UpdateGlenz2PositionAndScale(frame);
    UpdateCheckerboardAndPalette(frame);
}
//************************************************************************************************************************************************************************************************************
// code highly inspired from SR-PORT!
function ComputeRotationMatrix(roty,rotx,rotz,matrix)  // "cmatrix_yxz" in original code
{
   	/*
	 * matrix equations: rY*rX*rZ
	 *  0=Ycos*Zcos-		 1=Xsin*Ysin*Zcos+	 2=-Xcos*Ysin
	 *    Xsin*Ysin*Zsin	   Ycos*Zsin
	 *  3=-Xcos*Zsin		 4=Xcos*Zcos		 5=Xsin
	 *  
	 *  6=Xsin*Ycos*Zsin+	 7=Ysin*Zsin- 	     8=Xcos*Ycos
	 *    Ysin*Zcos			   Xsin*Ycos*Zcos
	 */
    let temp;
	rxsin = Math.sin(rotx/10.0*Math.PI/180.0) ;  /* ROT-X */
	rxcos = Math.cos(rotx/10.0*Math.PI/180.0) ;  /* ROT-X */
	rysin = Math.sin(roty/10.0*Math.PI/180.0) ;  /* ROT-Y */
	rycos = Math.cos(roty/10.0*Math.PI/180.0) ;  /* ROT-Y */
	rzsin = Math.sin(rotz/10.0*Math.PI/180.0) ;  /* ROT-Z */
	rzcos = Math.cos(rotz/10.0*Math.PI/180.0) ;  /* ROT-Z */

	matrix[7] = (rysin * rzsin) ;     	/* 0 & 7 */
	temp = (rycos * rzcos) ;	        /* 0 & 7 */
	matrix[0] = temp;                   /* 0 & 7 */
	matrix[7] -= (temp * rxsin) ;	    /* 0 & 7 */
	temp = (rxsin * rysin) ;	        /* 0 & 7 */
	matrix[0] -= (rzsin * temp) ;	    /* 0 & 7 */
	matrix[1] = (rzcos * temp) ;        /* 1 */
	temp = (rycos * rzsin);             /* 1 */
	matrix[1] += temp;                  /* 1 */
    matrix[2] = -(rxcos * rysin) ; 	    /* 2 */
	matrix[3] = -(rxcos * rzsin) ; 	    /* 3 */
	matrix[4] = (rxcos * rzcos) ; 	    /* 4 */
	matrix[5] = rxsin;                  /* 5 */
    matrix[6] = (rxsin * temp) ;   	    /* 6 */
	matrix[6] += (rysin * rzcos) ;	    /* 6 */
	matrix[8] = (rxcos * rycos) ; 	    /* 8 */
}

//************************************************************************************************************************************************************************************************************
// code highly inspired from SR-PORT!
function  RotateTranslateVertexList(RotatedVertex,SourceVertex,RotationMatrix,TranslationVector)  // "crotlist" in original code
{
    for (let i=0;i<SourceVertex.length;i++)
    {
        let sv=SourceVertex[i];
        let dv=RotatedVertex[i];
        dv.x = ((RotationMatrix[0] * sv.x + RotationMatrix[1] * sv.y + RotationMatrix[2] * sv.z) ) + TranslationVector.x;
        dv.y = ((RotationMatrix[3] * sv.x + RotationMatrix[4] * sv.y + RotationMatrix[5] * sv.z) ) + TranslationVector.y;
        dv.z = ((RotationMatrix[6] * sv.x + RotationMatrix[7] * sv.y + RotationMatrix[8] * sv.z) ) + TranslationVector.z;
    }
 }

//************************************************************************************************************************************************************************************************************
function VerticalClipVertexList(points)  // "ccliplist" in original code, limit vertical size when glenz1 is bouncing
{
	for (let i=0;i< points.length;i++) 
		if (points[i].y > 1500) points[i].y = 1500;
}

//************************************************************************************************************************************************************************************************************
function GetFaceShadingLevel(mypoly,index)  // "checkhiddenbx" in original code.
{
	let x1 = mypoly.vertices2D[0].x;
	let y1 = mypoly.vertices2D[0].y;
	let x2 = mypoly.vertices2D[1].x;
	let y2 = mypoly.vertices2D[1].y;
	let x3 = mypoly.vertices2D[2].x;
	let y3 = mypoly.vertices2D[2].y;
	//  compute Z component of cross product (compute the Z component of face normal vector to check face orientation and get shading level)
	return (x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3);   // >0 if face frontside, <0 if face backside
}


//************************************************************************************************************************************************************************************************************
// code highly inspired from SR-PORT!
function Projection2DVertexList(ProjectedVertexList, SourceVertexList)  // "cprojlist" in original code
{
    for (let i=0;i<SourceVertexList.length;i++) 
    {
		let sv=SourceVertexList[i];
		ProjectedVertexList[i].x = sv.x * projxmul / sv.z + projxadd;  //projected X		
		ProjectedVertexList[i].y = sv.y * projymul / sv.z + projyadd;  //projected Y
	}
}

//************************************************************************************************************************************************************************************************************
function RenderGlenzObject(PolygonList, ProjectedVertexList, GlenzObjectNumber) //"ceasypolylist" in original code, draw all polygons of one glenz object
{
	let num;
	let i, normal;


    let points3index=0;
    
	points3index++;		// numv
    let count=PolygonList.length
	for (let p=0; p<count;p++)
    {	// @@2 prepare polygon data
        let mypoly={};
		mypoly.vertices2D=new Array(num);
		mypoly.colorindex = PolygonList[p].color;		
        
        let numpoints=  PolygonList[p].PointsIndex.length;
		for (i = 0; i < numpoints; i++) 
        {	// @@3
			let v = PolygonList[p].PointsIndex[i];	// get index in vertex index list
            mypoly.vertices2D[i]={};
            mypoly.vertices2D[i].x =Math.floor(ProjectedVertexList[v].x);
            mypoly.vertices2D[i].y =Math.floor(ProjectedVertexList[v].y);
		}
		normal = GetFaceShadingLevel(mypoly); 
        
        //render the Polygon with suitable rendering function:
		if (GlenzObjectNumber==0) RenderGlenz1Polygon(normal, mypoly); // in original code: call demo_glz or demo_glz2 according to current "demomode"
        else  RenderGlenz2Polygon(normal, mypoly); 
	}
	return 0;
}

//************************************************************************************************************************************************************************************************************
function RenderGlenz1Polygon(normal, poly)  // "demo_glz" manage drawing one side of the Glenz 1 (white/blue polyhedron) with light shading (palette is adjusted to shading)
{
    
    let FaceColorIndex = poly.colorindex;  //each face has a unique color index
    // Manage back faces: -----------------------------
    if (normal <0 ) //polygon backface, no shading
    {
        if ((FaceColorIndex & 1)!=0)  poly.colorindex=4;  //clear face (blue), constant color value
        else return;   //backside white face are not drawn  (can be added because we don't implement delta filling else we would have to clear some pixels)
    }
    // Manage front faces: -----------------------------
    else  //normal >=0, polygon on front, shading, and palette needs to be adapted accordingly
    {
        let ShadingValue,r,g,b;
        
        if (lightshift==9) ShadingValue = normal/128 ; // normal >> 7;   //@@x9
        else ShadingValue = normal/170;     //when Glenz 2 becomes bigger, make Glenz 1 darker, (normal >> 8) + (normal >> 9) means (normal *3/512), in case of large  Glenz2  scale to reduce Glenz lighting value
        
        ShadingValue=clip(ShadingValue,0,63);

        poly.colorindex= (FaceColorIndex)*8;  // 8 color area is reserved for this face

        //adapt the palette of the reserved color area, according to the face base color (white/blue) and the shading value
        if((FaceColorIndex & 1) == 0)  //white face (goto @@b1)
        {
            r = g = b = ShadingValue;    
        } 
        else  //blue face (goto @@b2 )
        {
            r = 7; // in most cases r=7 due to code in @@x9, but when rolcol allocation occurs it will be in [0..15] interval, this may result in a slight red value variation bug for one face in one frame, not implemented here
            g = ShadingValue /2 ; //ah = ah >> 1
            b = ShadingValue ; //B
        }
     
        for (i = 0; i < 8; i++) // (Mix the face current color with other possible mixed colors)
        {
            let a=poly.colorindex + i;
            CurrentVGAPalette[a*3+0]=Math.floor(clip(r+BackgroundRGBPalette[i * 3 + 0]/4,0,63));
            CurrentVGAPalette[a*3+1]=Math.floor(clip(g+BackgroundRGBPalette[i * 3 + 1]/4,0,63));
            CurrentVGAPalette[a*3+2]=Math.floor(clip(b+BackgroundRGBPalette[i * 3 + 2]/4,0,63));
        }
    }
 
    //************** 
    poly.color=poly.colorindex;
    poly=ClipPolygonUp(poly);  //with actual Glenz1 Path and scale, only Top  clipping is needed
    FillConvexPolygon(poly,false,true, IndexedFrameBuffer); //Draw the polygon
}

//************************************************************************************************************************************************************************************************************
function RenderGlenz2Polygon(normal, poly) //  "demo_glz2" ; manage drawing of one side of Glenz 2 (bright/dark red polyhedron) (no shading applied)
{   
    {
		let colorindex = poly.colorindex;
		if (normal >= 0) poly.color=( colorindex>>1 )& 0x01;  //face is frontside, will result in color 1 (bright red) or 0 (dark red face, not drawn)
        else poly.color=colorindex; //backside (color 2 or 4)
        if (poly.color==0) return;  // don't draw black polygons  (added because we don't implement delta filling else we would have to clear some pixels)

        poly=ClipPolygonUp(poly);    //with actual Glenz2 Path and scale, only Top and Left clipping is needed
        poly=ClipPolygonLeft(poly);   
        FillConvexPolygon(poly,false,true, IndexedFrameBuffer);
	}
}

//************************************************************************************************************************************************************************************************************
function PartLeave()
{
	CHECKERBOARD=0;  //clear "big" data arrays (no longer need)
    LastCHECKERBOARD=0;
}

// Part Interface with main.js
return { init: () => { PartInit(); },   update: () => { PartRenderFrame();},  end: () => { PartLeave();}};

}