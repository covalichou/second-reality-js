// DOTS Part "MiniVectorBalls" (Original code by PSI)
// Original source code in DOTS folder
// Original code mostly in C, assembly only for 2D projecting, drawing and erasing dots


// You can find already existing ports of this part here:
//  https://github.com/cmatsuoka/sr-port (by Claudio Matsuoka, implementation with assembly code converted to OpenGL)  
//  For this part, his implementation is more than a source of inspiration ! I just had to take original code for palette management and analyse how dots were drawn in video memory.

// Currently, very few comments in the code, as I mostly did a direct copy of the original C code to JavaScript (and it worked quickly!)
// (I just had to handle the palette and depth table,  to correctly get the dots displayed with the right colors)

// small simplifications : dottaul  is used in orignal code to randomize dot order to limit perception of flickering on low speed computer  (drawing / erasing is direct in frame buffer, no double buffering)
// we dont have a risk of flickering on dots here.



// TODO sync start to music
// TODO adjust to framerate


function DOTS() 
{

const MAXDOTS = 1024;
const BOTTOM = 8000;


let dropper;
let frame=0;
let rota=-1*64;
let bgpic;
let rot,rots;
let j;
let grav,gravd,f;
let dot;
let rotsin, rotcos;
let gravitybottom;
let gravity;
let dotnum;
let gravityd;
let pal,pal2;
const cols=[ 0,0 ,0,    //set of 4 RGB levels used for generating to create palette  for dots drawing at different depth levels
             4,25,30,
             8,40,45,
             16,55,60]; 
let depthtable1,depthtable2; 

//************************************************************************************************************************************************************************************************************
function PartInit()
{
	PartName = "DOTS";
    PartTargetFrameRate=70;  //originally based on a VGA Mode 13h timing (320x200@70Hz)


    frame=0;
    rota=-1*64;

    rot=0;rots=0;
    f=0;

    
    dot=new Array(1024);
    for (let i=0;i<MAXDOTS;i++) dot[i]= { x:0,y:0,z:0, oldpos:0, oldposshadow:0, yadd:0}

    for (let i=0;i<64000;i++) IndexedFrameBuffer[i]=0; 

    gravitybottom = BOTTOM;
    gravity = 0;
    gravityd = 16;   
    
    j=0;
    setup_dots();

    pal=new Array(768);  //256*3
    pal2=new Array(768);
    
    pal.fill(0);
    for(let a=0;a<16;a++)    // color index for DOTS are 0-63 ( 4 colors for 16 possible depth levels)
        for(let b=0;b<4;b++)
	    {
            let c=100+a*9;
            pal[(a*4+b)*3]  = Math.floor(cols[b*3+0]);
            pal[(a*4+b)*3+1]= Math.floor(cols[b*3+1]*c/256);
            pal[(a*4+b)*3+2]= Math.floor(cols[b*3+2]*c/256);
    	}
	pal [255*3]  =31;
	pal [255*3+1]=0;
    pal [255*3+2]=15;

    
	for(let a=0;a<100;a++)  // color index 64-163 for background greyscale
	{
        let c=64-256/(a+4);
		c=c*c/64;
		pal[(64+a)*3]  = Math.floor(c/4);
        pal[(64+a)*3+1]= Math.floor(c/4);
        pal[(64+a)*3+2]= Math.floor(c/4);
	}
    
    
    SetVGAPalette(pal);
    bgpic=new Array(320*200);
    bgpic.fill(0);
    //store and draw background
    for(let a=0;a<100;a++)
	    for (let x=0;x<320;x++) 
        {
            bgpic[(100+a)*320+x]=a+64;  //background image, stored for erasing dots
            IndexedFrameBuffer[(100+a)*320+x]=a+64; //background image drawn
	    }
    RenderIndexedMode13hFrame();  //initial pixels set, with black palette
}

//************************************************************************************************************************************************************************************************************
//called by main demo loop each time the screen has to be updated, time stamp is relative to part start
function PartRenderFrame()
{     
   	if (CurrentAnimationFrame<128)
    {
        SetVGAPaletteFadeByDec(pal, (128-CurrentAnimationFrame)/128);
    }
    else
    {        
        for (let i=0; (i<AnimationFramesToRender) ;i++) update_dots();  //to respect the 70Hz animation rate 
        draw_dots();                              
    }
    RenderIndexedMode13hFrame();  
    if (IsDisSyncPointReached("DOTS_END")) HasPartEnded=true; //end part 

}

//************************************************************************************************************************************************************************************************************
function setup_dots()
{
    dotnum=512;
    
    dropper=22000;
    for(let a=0;a<dotnum;a++)
    {
            dot[a].x=0;
            dot[a].y=2560-dropper;
            dot[a].z=0;
            dot[a].yadd=0;
    }

    grav=3;
    gravd=13;
    gravitybottom=8105;

    depthtable1=new Array(128*4);
    depthtable2=new Array(128*4);

    
    for(let a=0;a<128;a++)
    {
            let c=a-31;
            c=c*3/4;
            c+=8;
            c=Math.floor(c);
            if(c<0) c=0; else if(c>15) c=15;
            c=15-c; // invert brightness, so that near dots (lower index) are brighter. 
            // c is the depth level (0..15), 4*c index the palette area associated to this depth level, we have 4 colors per depth level, sprite is built using color 2 and 3
            depthtable1[a*4]  =2+4*c;  //top and bottom line of dot sprite
            depthtable1[a*4+1]=2+4*c;
            depthtable2[a*4  ]=2+4*c   //middle line of dot sprite
            depthtable2[a*4+1]=3+4*c
            depthtable2[a*4+2]=3+4*c;
            depthtable2[a*4+3]=2+4*c;
    }
}
//************************************************************************************************************************************************************************************************************
function update_gravity(dot)
{
	let bp = ( ((dot.z * rotcos - dot.x * rotsin) / 0x10000) + 9000) 
	let a = (dot.z * rotsin + dot.x * rotcos) / 0x100;
    
	let x = (a + a / 8) / bp + 160;
	if (x <= 319) 
    {
		let shadow_y = (0x80000 / bp) + 100;
		if (shadow_y <= 199) 
        {
			dot.yadd += gravity;
			let b = dot.y + dot.yadd;
			if (b >= gravitybottom) 
            {
				dot.yadd = (-dot.yadd * gravityd) / 0x10;
				b += dot.yadd;
			}
			dot.y = b;
		}
	}
}

//************************************************************************************************************************************************************************************************************
function update_dots()
{
//setborder(0);
//repeat=dis_waitb();

//if(frame>2300) setpalette(pal2);

//setborder(1);
    let a,b;
	if (frame<2450) frame++;
	if(frame==500) f=0;

	j++; j%=dotnum;
	if(frame<500)
	{
		dot[j].x=isin(f*11)*40;
		dot[j].y=icos(f*13)*10-dropper;
		dot[j].z=isin(f*17)*40;
		dot[j].yadd=0;
	}
	else if(frame<900)
	{
		dot[j].x=icos(f*15)*55;
		dot[j].y=dropper;
		dot[j].z=isin(f*15)*55;
		dot[j].yadd=-260;
	}
	else if(frame<1700)
	{	
        a= Math.floor (256*Math.sin( frame/1024*2*Math.PI)/8)   ;//sin1024[frame&1023]/8;  
		dot[j].x=icos(f*66)*a;
		dot[j].y=8000;
		dot[j].z=isin(f*66)*a;
		dot[j].yadd=-300;
	}
	else if(frame<2360)  //add new random dots
	{

		dot[j].x=(rand() % 0x7fff) -16384;
		dot[j].y=8000-(rand() % 0x7fff) /2;
		dot[j].z=(rand() % 0x7fff) -16384;
		dot[j].yadd=0;
		if(frame>1900 && !(frame&31) && grav>0) grav--;
	}
	else if(frame<2400)  //flash comes in
	{
        a=frame-2360;
        for(b=0;b<768;b+=3)
        {
            pal2[b+0]= clip ( pal[b+0] +a*3,0,63); // R
            pal2[b+1]= clip ( pal[b+1] +a*3,0,63); // G
            pal2[b+2]= clip ( pal[b+2] +a*4,0,63); // B stronger weight on blue=>blue-ish flash 
        }
        SetVGAPalette(pal2);
	}
	else if(frame<2440)  // then flash comes out to final fade
	{
        a=frame-2400;
        for(b=0;b<768;b++)
            pal2[b]=clip(63-a*2,0,63);
        SetVGAPalette(pal2);
	}
	if(dropper>4000) dropper-=100;
	rotcos=icos(rot)*64; rotsin=isin(rot)*64;
	rots+=2;
	if(frame>1900) 
	{
		rot+=rota/64;
		rota--;
	}
	else rot=isin(rots);
	f++;
	gravity=grav;
	gravityd=gravd;

	for (let i = 0; i < dotnum; i++) {
		update_gravity(dot[i]);
	}
}
//************************************************************************************************************************************************************************************************************
function draw_dots()
{
	let i;
	for (i = 0; i < dotnum; i++) erase_dot(dot[i]);     //proper implementation (erase all and draw, original code draw and erase in same loop, which may leave some freshly drawn pixels erased if case of dots overlap)
	for (i = 0; i < dotnum; i++) draw_dot(dot[i]);
}

//************************************************************************************************************************************************************************************************************
function erase_dot(dot)
{
    //erase dot and shadow from previous frame
    let ofs=dot.oldpos;
    if (ofs!=-1) 
    {
        IndexedFrameBuffer[ofs+1  ]=bgpic[ofs+1  ];  //erase dot by restoring background pixel
        IndexedFrameBuffer[ofs+2  ]=bgpic[ofs+2  ];  // 2 pixels on top line
        IndexedFrameBuffer[ofs+320]=bgpic[ofs+320];  // 4 pixels in middle line
        IndexedFrameBuffer[ofs+321]=bgpic[ofs+321];
        IndexedFrameBuffer[ofs+322]=bgpic[ofs+322];
        IndexedFrameBuffer[ofs+323]=bgpic[ofs+323];
        IndexedFrameBuffer[ofs+641]=bgpic[ofs+641];  // 2 pixels on bottom line
        IndexedFrameBuffer[ofs+642]=bgpic[ofs+642];
    }
    ofs=dot.oldposshadow;
    if (ofs!=-1) 
    {   
        IndexedFrameBuffer[ofs  ]=bgpic[ofs  ];
        IndexedFrameBuffer[ofs+1]=bgpic[ofs+1];
    }
}
//************************************************************************************************************************************************************************************************************
function draw_dot(dot)
{
    let ofs;
    let bp = Math.floor(((dot.z * rotcos - dot.x * rotsin) / 0x10000) + 9000) ;
	let a = (dot.z * rotsin + dot.x * rotcos) / 0x100;
	//let color2[3];

	let x = Math.floor((a + a / 8) / bp + 160);
	if (x <= 319) 
    {
		// Draw dot shadow 
        let shadow_y = Math.floor((0x80000 / bp) + 100);
		

        if (shadow_y <= 199) 
        {
			ofs=shadow_y*320+x; //base adress of shadow
            IndexedFrameBuffer[ofs] = 87;
            IndexedFrameBuffer[ofs +1] = 87;  //fixed color for shadow
            dot.oldposshadow=ofs;  //store position to erase next frame
        }
        else dot.oldposshadow=-1;
       // Draw dot 
		let y = Math.floor((dot.y * 64) / bp + 100);
        ofs=y*320+x; //base adress of dot
        let bpi= bp>>6; //shr bp,6 
        bpi&=~3; //clear 2 lowest bits to align to depthtable entry (4 bytes each)
		if (y <= 199)   
        { 
            IndexedFrameBuffer[ofs    +1 ] = depthtable1[bpi];   //Top line pixel 1
            IndexedFrameBuffer[ofs    +2 ] = depthtable1[bpi+1]; //Top line pixel 2
            IndexedFrameBuffer[ofs+320   ] = depthtable2[bpi];   //Middle line pixel 1
            IndexedFrameBuffer[ofs+320+1 ] = depthtable2[bpi+1]; //Middle line pixel 2
            IndexedFrameBuffer[ofs+320+2 ] = depthtable2[bpi+2]; //Middle line pixel 3
            IndexedFrameBuffer[ofs+320+3 ] = depthtable2[bpi+3]; //Middle line pixel 4
            IndexedFrameBuffer[ofs+640+1 ] = depthtable1[bpi];   //Bottom line pixel 1
            IndexedFrameBuffer[ofs+640+2 ] = depthtable1[bpi+1]; //Bottom line pixel 2
            dot.oldpos=ofs;     //store position to erase next frame
		}
        else dot.oldpos=-1;
	}
}

//************************************************************************************************************************************************************************************************************
function rand()
{
	return Math.floor(Math.random()*32768);
}

//************************************************************************************************************************************************************************************************************function SetVGAPaletteColor(c,r1,g1,b1)
function isin(deg)
{
	return Math.sin(Math.PI * deg / 512) * 255;
}

//************************************************************************************************************************************************************************************************************function SetVGAPaletteColor(c,r1,g1,b1)
function icos(deg)
{
	return Math.cos(Math.PI * deg / 512) * 255;
}

//************************************************************************************************************************************************************************************************************
function PartLeave()
{
    dot=pal=pal2=bgpic=depthtable1=depthtable2=null;

}

//************************************************************************************************************************************************************************************************************
// Part leterface with main.js


return { init: () => { PartInit(); },   update: () => { PartRenderFrame();},  end: () => { PartLeave();}};
  

}