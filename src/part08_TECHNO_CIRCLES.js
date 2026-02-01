//TECHNO PART
// Original code in TECHNO folder
// Original code by PSI
// Circles data have been dumped from unpacked EXE.

// This part has several sequences. This file implements the circle interference sequence.
// First KOEB, which is a simple palette shifting effect
//  then KOEA, which is a more complex interference effect with two circles images. 
// (Original effect is achieved using a, EGA or VGA 16 color mode tricks to get OR combination of pixel):
// This mode uses 1 byte for 8 pixels, the 8 pixels index value is spread on 4 plans. By selecting the plan(s) you can change one or multiple bits on multiple pixels in one write


function TECHNO_CIRCLES() 
{


//************************************************************************************************************************************************************************************************************
//internal variables kept between frames




let power0;
let circle1bytes;
let circle2bytes;
let pal;
let patdir;
let shft;  //todo (palanimc)?


//************************************************************************************************************************************************************************************************************
//Data
//palettes are two times longer to simplify circular reading
const pal0=[  0,30,40,   //palette for KOEB (blue circle, shifted)
		0,0 ,0 ,
		0,0 ,0 ,
		0,0 ,0 ,
		0,0 ,0 ,
		0,0 ,0 ,
		0,0 ,0 ,
		0,0 ,0 ,
		0,30,40,
		0,0 ,0 ,
		0,0 ,0 ,
		0,0 ,0 ,
		0,0 ,0 ,
		0,0 ,0 ,
		0,0 ,0 ,
		0,0 ,0 ];

 const pal2=[    0, 0*7/9, 0,
        	10,10*7/9,10,
        	20,20*7/9,20,
        	30,30*7/9,30,
        	40,40*7/9,40,
        	50,50*7/9,50,
        	60,60*7/9,60,
        	30,30*7/9,30,
        	 0, 0*7/9, 0,
        	10,10*7/9,10,
        	20,20*7/9,20,
        	30,30*7/9,30,
        	40,40*7/9,40,
        	50,50*7/9,50,
        	60,60*7/9,60,
        	30,30*7/9,30];
    
 const pal1=[
        	30,30*8/9,30,
        	60,60*8/9,60,
        	50,50*8/9,50,
        	40,40*8/9,40,
        	30,30*8/9,30,
        	20,20*8/9,20,
        	10,10*8/9,10,
        	 0, 0*8/9, 0,
        	30,30*8/9,30,
        	60,60*8/9,60,
        	50,50*8/9,50,
        	40,40*8/9,40,
        	30,30*8/9,30,
        	20,20*8/9,20,
        	10,10*8/9,10,
        	 0, 0*8/9, 0 ];     
//************************************************************************************************************************************************************************************************************

function PartInit()
{
	PartName = "Techno Interference";
    PartTargetFrameRate=70;  //originally based on a VGA Mode 13h (320x200@70Hz)
    console.log("PartInit Techno Interference");
    // pre compute, and prepare data
    pal=new Array(32);
    patdir=shft=0;
    BaseTechnoPalette= new Array(3*256); //768 bytes
    power0= new Array(256*16); //4096 bytes
    circle1bytes=new Array(640*400);
    circle2bytes=new Array(640*400);
    singen();
    Power0Generation();
    InitInterference();
  }


//************************************************************************************************************************************************************************************************************
//called by main demo loop each time the screen has to be updated, time stamp is relative to part start
function PartRenderFrame()
{     
  RenderOneTechno1Frame(CurrentAnimationFrame);

  RenderIndexedMode13hFrame();
  if (IsDisSyncPointReached("TECHNO_CIRCLES2_END")) HasPartEnded=true;  

}


//************************************************************************************************************************************************************************************************************
function PartLeave()
{
  power0= circle1bytes= circle2bytes=pal=0;
}


//************************************************************************************************************************************************************************************************************
let KOEA_initialised=0;
function RenderOneTechno1Frame(ExpectedFrame)
{
    if (ExpectedFrame<256) do_interference_KOEB(ExpectedFrame);
    else do_interference_KOEA(ExpectedFrame-256);
}



//************************************************************************************************************************************************************************************************************
function Power0Generation()
{
    //simplified code for readiness. (same result as power0 table generation in actual code KOE.C:174)
    let index=0;
    for(let b=0;b<16;b++)
    {
        for(let c=0;c<128;c++)  power0[index++]=Math.floor(c*b/15);
        for(let c=-128;c<0;c++) power0[index++]=Math.floor(c*b/15);
    }
}

//************************************************************************************************************************************************************************************************************
function InitInterference ()
{

    //For KOEA and KOEB (KOEB is run first)
    PrepareCircle1Bytes();

    //For KOEA:
    PrepareCircle2Bytes();


    pal.fill(0);
    for (let y=0;y<200;y++)
    {
        {
            for (x=0;x<320;x++)
              IndexedFrameBuffer[y*320+x]=  circle1bytes[(y+100)*640+(x+160)]  ;
        }
    }
}



//************************************************************************************************************************************************************************************************************
function PrepareCircle2Bytes ()
{
    //circle2 in original code is a 320*200 binary monochrome image (8 pixels per byte) of 1/4 of circle 
    // we convert from 1 bit per pixel  to a linear 8 bits/pixels  640x400 full circle (could be done offline)
    
    for (let y=0;y<200;y++)
    {
        for (xdest=0; xdest<320;xdest++)
        {
            let startofline= 40*y ;  
            let xcirclebyteindex= xdest >> 3;  //8 pixels/bytes
            let xcirclebitindex= 7-(xdest & 7);    //rightest pixel  in the byte is stored on LSB in memory
            
            let colorindex=0;
            CurrentPlane=3;
            planeByte= circle2[startofline+ xcirclebyteindex]; //cx=0401h in KOEB initinterference (copy of 1 plane starting at 3rd plane)
            colorindex|= ( (planeByte >> xcirclebitindex) & 1)  << CurrentPlane;
            //Generate full circle using 1/4 image (done in KOEB initinterference)
            circle2bytes[y*640+xdest]=colorindex;  //BitBlt in KOE
            circle2bytes[(399-y)*640+xdest]=colorindex; //BitBlt KOE
            circle2bytes[y*640+ 320+ (319-xdest)]=colorindex; //BitBltRev in KOE
            circle2bytes[(399-y)*640+ 320+ (319-xdest)]=colorindex; //BitBltRev in KOE
        }
    }
}


//************************************************************************************************************************************************************************************************************
function PrepareCircle1Bytes () 
{
    //circle1 in original is a 320*200  8 colors (3 bits/pixels)   image of 1/4 circle
    //Each line is stored by 3 consecutive planes of 40 bytes (8 bits per bytes=> 320 pixels per plane), each plane  give 1 bit of each pixel of the line
    // we convert from 3 bit per pixel  to a linear 8 bits/pixels  640x400 full circle

    for (let y=0;y<200;y++)
    {
        for (xdest=0; xdest<320;xdest++)
        {
            let startofline= 40*y *3 ;  //
            let xcirclebyteindex= xdest >> 3;  //8 pixels/bytes
            let xcirclebitindex= 7-(xdest & 7);    //rightest pixel  in the byte is stored on LSB in memory
            
            let colorindex=0;
            for (let CurrentPlane=0;CurrentPlane<3;CurrentPlane++)  //cx=0103h in KOEB initinterference (copy of 3 plane starting at 1st plane)
            {
                planeByte= circle1[startofline+ CurrentPlane*40+xcirclebyteindex];
                colorindex|= ( (planeByte >> xcirclebitindex) & 1)  << (CurrentPlane);
            }
            //Generate full circle using 1/4 image (done in KOEB initinterference)
            circle1bytes[y*640+xdest]=colorindex; //BitBlt in KOE
            circle1bytes[(399-y)*640+xdest]=colorindex; //BitBlt in KOE
            circle1bytes[y*640+ 320+ (319-xdest)]=colorindex; //BitBltRev  in KOE
            circle1bytes[(399-y)*640+ 320+ (319-xdest)]=colorindex; //BitBltRev in KOE
        }
    }
}



//************************************************************************************************************************************************************************************************************
//function mixpal in KOEB.ASM original code 
function mixpal(SourcePalette,DestPalette, StartDestIndex,Quantity, FaderLevel)
{
    for (let i=0;i<Quantity;i++)
    {
        let newvalue;
        if (FaderLevel<=256) newvalue= Math.floor(SourcePalette[i]*(FaderLevel/256));
        else  newvalue= SourcePalette[i]+FaderLevel-256
        DestPalette[i+StartDestIndex]=clip(newvalue,0,63);
    }
}


//************************************************************************************************************************************************************************************************************
//todo comment
let sinurot=0;  //todo move this
let sinuspower=0;
let scrnrot=0;
let overrot=211;
let palanimc=7; 

function do_interference_KOEA(ExpectedFrame)
{
  //  console.log("do_interference_KOEA, ExpectedFrame="+ExpectedFrame, " palanimc=", palanimc);
    
    for (let i=0;i<8;i++)  SetVGAPaletteColor(i,pal1[(i+(7-palanimc))*3],pal1[(i+(7-palanimc))*3+1],pal1[(i+(7-palanimc))*3+2]);
    for (let i=0;i<8;i++) SetVGAPaletteColor(i+8,pal2[(i+(7-palanimc))*3],pal2[(i+(7-palanimc))*3+1],pal2[(i+(7-palanimc))*3+2]);
    

    let overx= 160+ Math.floor(sin1024[overrot]/4);
    let overy= 100+ Math.floor(sin1024[(overrot+256)%1024]/4);

    let scrnx= 160+ Math.floor(sin1024[scrnrot]/4);
    let scrny= 100+ Math.floor(sin1024[(scrnrot+256)%1024]/4);


    sinurot=(sinurot+7)%1024;
    for (let y=0; y<200; y++)
    {
        let sinroty=(sinurot+9*y)%1024;
        let siny=Math.floor(sin1024[sinroty]/8) & 0xFF;  // -63 .. 63 =>  // & 0xFF to interpret result as unsigned byte 
        
        let powr= (power0[ sinuspower*256+siny]) ; 
        for (x=0;x<320;x++)
        {
            IndexedFrameBuffer[y*320+x]=circle1bytes[(y+scrny)*640+(x+scrnx)] |  (circle2bytes[(y+overy)*640+(x+overx+powr)]); 
        }
    }
    
    if (ExpectedFrame>70*5) sinuspower= clip(Math.floor( (ExpectedFrame-70*5)/16),1,15);  //initial delay of 70*5 frames, then sinuspower is increased every 16 frames

    overrot=(overrot+7)%1024;

    scrnrot=(scrnrot+5)%1024;

    if (IsDisSyncPointReached("TECHNO_CIRCLES2_START")) patdir=1;   //make KOEA animation visible when required
    palanimc=(palanimc+patdir)%8;   //visually smoother to strictly advance 1 per actual video frame  
    
    
}


//************************************************************************************************************************************************************************************************************
function do_interference_KOEB(ExpectedFrame)
{
   // console.log("do_interference_KOEB, ExpectedFrame="+ExpectedFrame);
    let palfader= clip(Math.floor(ExpectedFrame)*2,0,512);
    
    mixpal(pal0,pal,0,8*3,palfader);
    mixpal(pal0,pal,8*3,8*3,palfader);
    for (let i=0;i<16;i++) SetVGAPaletteColor(i,pal[((i+7-shft)%8)*3],pal[((i+7-shft)%8)*3+1],pal[((i+7-shft)%8)+2]);
    shft=(shft+1)%8;   //visually smoother to strictly advance 1 per actual video frame   
        
}

//************************************************************************************************************************************************************************************************************

function singen()  // generate sin and cos table, used for circles position modulation 
{
    let x;
    sinit=new Array(4096);
    cosit=new Array(2048);
    sin1024=new Array(1024);
    for (x = 0; x < 4096; x++) sinit[x] = Math.sin(Math.PI*x/128)*((1.0*x*3) / 128);
    for (x = 0; x < 2048; x++) cosit[x] = Math.cos(Math.PI*x/128)*((1.0*x*4) / 64);
    for (x = 0; x < 1024; x++) sin1024[x] = Math.floor(Math.sin(2*Math.PI*x/1024) * 255);  
}

//************************************************************************************************************************************************************************************************************
// Part Interface with main.js


return { init: () => { PartInit(); },   update: () => { PartRenderFrame();},  end: () => { PartLeave();}};
  

}