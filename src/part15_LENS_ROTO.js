//  'LENS' (original code by PSI) (result compiled in LNS&ZOOM.EXE)
// (picture display, see-through bouncing lens , roto zoomer)

// This files includes the port of "part3"  function in original LENS\MAIN.C
// Part3: Rotation and zoom in 160x100 video mode (tweaked 320x100 mode, using 2 pixels planes at a time)

// The original implementation is optimised x86 assembler with self modifying code
// and several optimisation (use of a 90 degree flipped picture to optimise memory/cache access according to rotation angle)
// Implementation here is simplified, (use of floating point, no self modified code), but gives same result.

// To produce destination image, main concept is to fill the screen row bo row from left to right,
// For each destination pixel, program computes the source coordinates in the source picture
// Source picture is read using a rotated rectangle shape. Rectangle size is determined by scale, rectangle orientation is determined by rotation angle
// With rotation angle and scale, you can determine a vector to go from one source pixel to the next (vector is floating point)
// A perpendicular vector is applied to go from one source line to the next.

// a 256x256 picture is used as source picture
// Using a 256x256 simplify computation of a pixel adress, and overflow management:
// X,Y pixel in source picture is at offset Y*256+X. Which can be written  as ( (Y<<8) | X )
// x86 instruction set makes those binary logic fast. Javascript is another story but optimisation here is not the main point


function LENS_ROTO() 
{

    let LENS_EXB;
    let palette,back,rotpic;
    let	d1,d2,d3,scale,scalea;
    let anim_param_d1,anim_param_d2,anim_param_scale,anim_param_fade;
    let x,y;  //used for lens path computation

// *******************************************<***********************************************************************************************************************************************

function PartInit()
{
	PartName = "LENS_ROTO";
    PartTargetFrameRate=70;  //originally based on a VGA Mode 13h timing (320x200@70Hz)

	//decode the files stored in base64
	LENS_EXB= Base64toArray(LENS_EXB_base64); //21258 bytes
    palette= LENS_EXB.slice(16,16+768);
    let back1= LENS_EXB.slice(16+768,16+768+64000);
    back= new Array(64000+1536);
    
    //Prepare image for rotation 
    //extend back image to make it 65535 bytes long , just duplicate last bytes (black)  
    for (let i=0;i<64000;i++)   back[i]=back1[i];
    for (let i=0;i<1536;i++) back[i+64000]=back[i+64000-1536];  //duplicate last lines of back to form a 65536 bytes buffer
   // build rotpic 256x256 image from 320x200 background image
   rotpic=new Array(256*256);
   for(x=0;x<256;x++)
	{
		for(y=0;y<256;y++)
		{
			a=Math.floor(y*10/11-36/2);
			if(a<0 || a>199) a=0;
			a=back[x+32+a*320];
			rotpic[x+y*256]=a;
		}
	}
    ComputeAnimationParameters();
    SetVGAPalette(palette);
}

//************************************************************************************************************************************************************************************************************
//called by main demo loop each time the screen has to be updated, time stamp is relative to part start
function PartRenderFrame()
{     
   	if (!IsDisSyncPointReached("LENS_ROTO")) 
	{
		ResetPartClock();  //let CurrentAnimationFrame to 0
		return;  //exit function until music point is reached
	}

    if (CurrentAnimationFrame<2000)    
    {
        Part3(CurrentAnimationFrame);
    }
    else HasPartEnded=true;
}

//************************************************************************************************************************************************************************************************************
function Part3(CurrentFrame)  // rotation/zoomer command, port of part3 in LENS\MAIN.C
{   
    //retrieve data for current frame (CurrentFrame is floating point, depending of actual refresh rate)
    let d1=InterpolateCycle(anim_param_d1,CurrentFrame);   // angle used to move first corner of the source rectangle
    let d2=InterpolateCycle(anim_param_d2,CurrentFrame);   //rotation angle
    let scale=InterpolateCycle(anim_param_scale,CurrentFrame);
    let fade_level=InterpolateCycle(anim_param_fade,CurrentFrame);

    //compute displacement vector (xa,ya), used to go from one pixel to the next in source image
    let xa= Math.floor(-1024.0*Math.sin(d2)*scale);
    let ya= Math.floor( 1024.0*Math.cos(d2)*scale);
    
    // first corner position (x,y) in the texture (follow  circle with diameter changing with scale)
    let x=Math.floor(70.0*Math.sin(d1)-30);
    let y=Math.floor(70.0*Math.cos(d1)+60);
    x-=Math.floor(xa/16);  
    y-=Math.floor(ya/16);

    rotate(x,y,xa,ya);  //generate the rotated/zoomed image
    SetVGAPaletteFadeToWhite(palette,fade_level);  //apply white fade level (modified at beginning and end)
    RenderIndexedModeFrame160x100();  //transfer to screen in the lower resolution mode
}

//************************************************************************************************************************************************************************************************************
// Compute rotation angle, scale, data and other parameters for each frame of the sequence, based on a 70Hz refresh rate
// Then by interpolation, we can adapt to any refresh rate and still provide same animation as original demo

function ComputeAnimationParameters()
{
    d1=0; 
    d2= 0.00007654321;  //initial rotation angle (nearly 0°)
    d3=0;
    scale=2;
    scalea=-0.01;
    anim_param_d1=new Array();
    anim_param_d2=new Array();
    anim_param_scale=new Array();
    anim_param_fade=new Array();
    //copy of original code:
    for (let frame=0;frame<=2000;frame++)
    {
        d1-=.005;
        d2+=d3;      //update rotation angle

        scale+=scalea;
        if(frame>25)
        {
            if(d3<.02) d3+=0.00005;
        }
        if(frame<270)
        {
            if(scale<.9)
            {
                if(scalea<1) scalea+=0.0001;
            }
        }
        else if(frame<400)
        {
            if(scalea>0.001) scalea-=0.0001;
        }
        else if(frame>1600)
        {
            if(scalea>-.1) scalea-=0.001;
        }
        else if(frame>1100)
        {
            let a=frame-900; if(a>100) a=100;
            if(scalea<256) scalea+=0.000001*a;
        }

        //manage palette change at begin and ebd
        let fadelevel=0; //default
        if(frame>2000-128)  //end: fade to white
            fadelevel= clip( (frame-(2000-128))/128, 0,1);
        else if(frame<16) // start: quickly fade from full white (1) to normal palette (0);
            fadelevel=1-clip (frame/15,0,1);
        //store the animation parameters
        anim_param_d1.push(d1);
        anim_param_d2.push(d2);
        anim_param_scale.push(scale);
        anim_param_fade.push(fadelevel);
    }
}
//************************************************************************************************************************************************************************************************************
// rotation/zoomer, port of _rotate function in LENS\ASM.ASM
// U0,V0, coordinate in the texture of the point from which we start the rendering (will be on top left of screen)
function rotate(U0,V0,displacement_vectorX,displacement_vectorY)
{
    let next_pixelU=  displacement_vectorY/1024;   //adjust axis to original _rotate function implementation
    let next_pixelV= -displacement_vectorX/1024;
    let next_lineU=-next_pixelV;  //line displacement vector is perpendicular to Pixel displacement vector
    let next_lineV=next_pixelU;
    const AspectRatio=307/256;  //~1.2
    next_lineU *= AspectRatio;  //We use a 320x200 mode on a "4:3" screen, pixels are not square, AspectRatio fixes this
    next_lineV *= AspectRatio;
    let u1 = U0; 
    let v1 = V0; 
    let u,v; // current source coordinates (floating point)
    let ofs=0;  //screen destination pointer
    //render each line
    for (let y = 0; y < 100; y++)  //for each line
    { 
        u= u1+next_lineU; //for each line add the "next line" vector
        v= v1+next_lineV;
        u1=u; v1=v;  //backup for next line
    
        for (let x = 0; x < 160; x++) //for each row of the line, add the "next pixel" vector to get the next source pixel coordinates, write it to screen
        {
            u += next_pixelU;  
            v += next_pixelV;  
            IndexedFrameBuffer[ofs++]= rotpic[(v & 0xFF)<<8 | (u & 0xFF)]; // u & 0xFF, will truncate (floor) to integer in the [0..255] range
        }

    }
}
//************************************************************************************************************************************************************************************************************
function PartLeave()
{
    anim_param_d1=anim_param_d2=path_scale=anim_param_fade=null;
    LENS_EXB=palette=back=rotpic=null;
}

//************************************************************************************************************************************************************************************************************
// Part Interface with main.js
return { init: () => { PartInit(); },   update: () => { PartRenderFrame();},  end: () => { PartLeave();}};
  

}