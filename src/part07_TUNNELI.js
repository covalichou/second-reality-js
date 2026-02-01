//PART07: TUNNEL part : 
// Original code written in Turbo Pascal (in TUNNELI folder). Ported to C/OpenGL in SR-PORT
// Port of this part to js mostly copied and inspired from SR-PORT 

// Original name: 'Dottitunneli', code by TRUG

function TUNNELI() 
{


//************************************************************************************************************************************************************************************************************
//internal variables kept between frames

let PrevTunnelAnimationFrame;

let pcalc,cosit,sinit; // precomputed positions/data
let putki;  //"putki" in original code, contains the  position of pixels of each circle
let veke=1060; //max frame before exit
let oldpos; //buffer to remember position of drawn pixel in the frame buffer, to clear only necessary pixels
let sade;
//************************************************************************************************************************************************************************************************************

function PartInit()
{
	PartName = "part07_TUNNELI";
    PartTargetFrameRate=70;  //originally based on a VGA Mode 13h (320x200@70Hz)
    //----------------- 
    // pre compute, and prepare data
    ballgen();
    singen();
    putki=new Array(101);  //TODO check if size= 101?
    for (let x = 0; x <= 100; x++) 
    {
        putki[x]={};
        putki[x].x = putki[x].y = putki[x].c = 0;
    }

    sade=new Array(100); 
    oldpos=new Array(80*64);
    for (z = 0; z < 100; z++) sade[z] = Math.trunc( 16384 / ((z*7)+95) );
    //Build palette
    for (let x = 0; x <= 64; x++) SetVGAPaletteColor(64+x ,(64-x),(64-x),(64-x));
    for (let x = 0; x <= 64; x++) SetVGAPaletteColor(128+x,(64-x) *3 / 4,(64-x) *3 / 4,(64-x) *3 / 4);
    SetVGAPaletteColor(0,0,0,0);
    SetVGAPaletteColor(68,0,0,0);
    SetVGAPaletteColor(132,0,0,0);
    SetVGAPaletteColor(255,0,63,0);

    imageDatabuf32.fill(0xFF000000); //CLEAR SCREEN for 1st frame
   
  }


//************************************************************************************************************************************************************************************************************
//called by main demo loop each time the screen has to be updated, time stamp is relative to part start
function PartRenderFrame()
{
    //make animation progress according to actual framerate
    if (CurrentAnimationFrame<=veke)
    {
        for (let i=0;i<AnimationFramesToRender;i++) AnimateOneTunnelFrame(ActualRenderedAnimationFrame+i);  
        RenderTunnelFrame(); // now render the tunnel
       RenderRGBABufferToScreen320x200(); //transfer frame buffer to screen
    }
    else if (CurrentAnimationFrame>veke+0) HasPartEnded=true;  //Part is done when image has faded out, add additional time (our part transition are faster)
}

//************************************************************************************************************************************************************************************************************
function RenderTunnelFrame()
{
    //CLEAR Previous circles pixels
    for (let i=0;i<oldpos.length;i++)
    {
        imageDatabuf32[oldpos[i]]=CurrentRGBAPalette[0]; //CLEAR Previous pixel
        oldpos[i]=0;
    } 
    //Draw updated circles
    let bx,by,br,bbc,pcp,si,i,xpos,ypos,x1,y1,pos;
    for (x = 80,i=0; x >= 4; x--,i++) //for each circle, update position
    {
        si=i*80;
        bx = putki[x].x-putki[5].x;
        by = putki[x].y-putki[5].y;
        br = sade[x];
        bbc = putki[x].c+Math.trunc(x / 1.3);   /* circles pixel color */
        pcp = pcalc[br];
   
        if (bbc >= 64) // if color of the circle is dark or bright (but not black)
        {
            for (let i = 0; i < 64; i++) //for each pixels of the circle, compute new position and draw the pixel
            {
                xpos = pcp[i].x + bx;
                ypos = pcp[i].y + by;
                if (xpos >= 0 && xpos <= 319 && ypos >= 0 && ypos <= 199)
                {
                    x1=Math.trunc(xpos);
                    y1=Math.trunc(ypos);
                    pos=x1+y1*320;
                    imageDatabuf32[pos]= CurrentRGBAPalette[bbc]; //draw new pixel
                    oldpos[si]=pos;  //store pixel position for erasing in next frame
                }
                si++
            }
        }
    }
}
//************************************************************************************************************************************************************************************************************
function AnimateOneTunnelFrame(CurrentFrame)   // based on code in MAIN.C (~line 450 and below), split in different functions to clarify
{
   
    //add a new circle at end of circle list (CurrentFrame has the same value as sx and sy in original code)
        putki[100]={}; 
        putki[100].x = -sinit[(CurrentFrame*3) & 4095]  //simplify original code as sx==sy 
        putki[100].y = sinit[(CurrentFrame*2) & 4095]-cosit[CurrentFrame & 2047]+sinit[CurrentFrame & 4095];
     
        //shift circle list (remove, oldest circle and replace it by 2nd oldest)
        for (let i=0;i<100;i++) putki[i]=putki[i+1]; //memmove(&putki[0],&putki[1],100 * sizeof (struct rengas));
  
        //update new circle color (bright, dark , or invisible)
        if ((CurrentFrame & 15) > 7) putki[99].c = 128; else putki[99].c = 64;  //alternatively bright or dark
        if (CurrentFrame >= veke-102) putki[99].c = 0;  //at end of animation, make the new circles black (not drawn)
}


//************************************************************************************************************************************************************************************************************
// based on SR-PORT
function ballgen()
{
    pcalc=new Array(138);
    let z, a;
    for (z = 10; z < 148; z++)   //general 138 circles  radius 10 (farthest circle) to 148 (nearest circle)
    {
        pcalc[z-10]=new Array(64);
        for (a = 0; a < 64; a++)   //compute 64 points coordinates of a screen centerd circle, (radius=z on y axis, z*1.7 on x axis)
        {
            pcalc[z - 10][a]= { };
            pcalc[z - 10][a].x = 160 + Math.trunc(Math.sin(a * Math.PI / 32) * (1.7 * z));
            pcalc[z - 10][a].y = 100 + Math.trunc(Math.cos(a * Math.PI  / 32) * z);
        }
    }
}

//************************************************************************************************************************************************************************************************************
// based on SR-PORT
function singen()  // generate sin and cos table, used for circles position modulation
{
    let x;
    sinit=new Array(4096);
    cosit=new Array(2048);
    for (x = 0; x < 4096; x++) sinit[x] = Math.sin(Math.PI*x/128)*((1.0*x*3) / 128);
    for (x = 0; x < 2048; x++) cosit[x] = Math.cos(Math.PI*x/128)*((1.0*x*4) / 64);
}


//************************************************************************************************************************************************************************************************************
function PartLeave()
{
    pcalc=cosit=sinit=oldpos=putki=sade=0; //clear arrays at end
}
//************************************************************************************************************************************************************************************************************
// Part Interface with main.js
// main.js interface

return { init: () => { PartInit(); },   update: () => { PartRenderFrame();},  end: () => { PartLeave();}};
  

}