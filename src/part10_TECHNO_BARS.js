//TECHNO PART
// Original code in TECHNO folder
// Original code by PSI

// This part has several sequences. This file implements the rotating bars sequence

//Original part  uses a 320x200 16 color planar mode, using 8 graphic pages.

// Main concept is to draw rotating bars in different video pages (change at each frame, 8 total pages ) and different bitplane (change every 8 frames)
// Palette is build in order to be brighter when several bits are set to 1, this create the blending/interference effect when 2 bars of different bitplanes are crossed

// Frame  1 : Bars drawn on Page 1, bitplane 1 (Page 1 displayed)
// Frame  2 : Bars drawn on Page 2, bitplane 1 (Page 2 displayed)
//     ....    
// Frame  8 : Bars drawn on Page 8, bitplane 1 (Page 8 displayed)
// Frame  9 : Bars drawn on Page 1, bitplane 2 (Page 1 displayed): So you get content of Frame 1 mixed with bars generated at frame 9, when bars of two bitplane overlap, you get a brighter color
// Frame  10: Bars drawn on Page 2, bitplane 2 (Page 2 displayed): So you get content of Frame 2 mixed with bars generated at frame 10, when bars of two bitplane overlap, you get a brighter color
//     ....    
// Frame 17 : Bars drawn on Page 8, bitplane 2 (Page 8 displayed): So you get content of Frame 8 mixed with bars generated at frame 17, when bars of two bitplaned overlap, you get a brighter color
// Frame 18 : Bars drawn on Page 1, bitplane 3 (Page 1 displayed): So you get content of Frame 9 mixed with bars generated at frame 18, when bars of two bitplane overlap, you get a brighter color, you can get 3 bars overlapping
//      ...
// So after 32 frames all bitplanes on all pages are filled.
// Frame 33 : Bars drawn on Page 1, bitplane 1 (Page 1 displayed), content of Frame 1 in page 1, is replaced by bars generated at frame 33

// Palette is updated according to music beat

// original code in KOE.C (with asm functions for fast polygon drawing and vram copy in KOEA.ASM)

function TECHNO_BARS() 
{

let	rot,rota,rot2,vm, vma,xpos,xposa;
let BaseTechnoPalette;
let sin1024;

let FirstDoIt1Cycle,FirstDoIt2Cycle,FirstDoIt3Cycle;
let doit3FirstFrame;

let CurrentPlane,CurrentPage;  //pl, plv in original code


let vbuf= new Array(64000);   // 1 320x200 buffer to draw new lines
let vpages= new Array(8);  //8 320x200 pages
let prev_row;
let curpal;
for (let i=0;i<vpages.length;i++)  vpages[i]=new Array(64000);  //pages

//************************************************************************************************************************************************************************************************************

function PartInit()
{
	PartName = "Techno Bars";
    PartTargetFrameRate=70;  //originally based on a VGA Mode 13h timing (320x200@70Hz)
   
    ClippingY	=	[0,199] ;	 //for polygon fill routine (which is common with U2A/U2E 3d parts and use other clipping limit)
    
    prev_row=0;
    curpal=0;
    FirstDoIt1Cycle=true;
    FirstDoIt2Cycle=true;
    FirstDoIt3Cycle=true;

    
    
    sin1024=new Array(1024);
    for (let x = 0; x < 1024; x++) sin1024[x] = Math.floor(Math.sin(2*Math.PI*x/1024) * 255);  
    PaletteGeneration();
  }



//************************************************************************************************************************************************************************************************************
//called by main demo loop each time the screen has to be updated, time stamp is relative to part start

function PartRenderFrame()
{     
    if (CurrentAnimationFrame<70*6)  doit1();
    else if (CurrentAnimationFrame<70*(6+12))  doit2();
    else if (CurrentAnimationFrame<70*(6+12+14))  doit3(); // doit3 will set HasPartEnded
}



//************************************************************************************************************************************************************************************************************
// 1st rotating bars sequence  
function doit1()
{
  
	let	c,x1,y1,x2,y2,x3,y3,x4,y4,hx,hy,vx,vy,cx,cy;
    if (FirstDoIt1Cycle)   //initialisation of the sequence
    {
        console.log("doit1");
        FirstDoIt1Cycle=false;
        CurrentPlane=0;
        CurrentPage=0;
        for (let i=0;i<vpages.length;i++)  vpages[i].fill(0);  //clear pages content
        rot=45;
        vm=50; 
        vma=0;  
    }
    // one frame of the sequence:
    UpdatePaletteWithMusic();
    for (let i=0;i<64000;i++) vbuf[i]=0; //clear vbuf  //memset(vbuf,0,8000);  vbuf is where new polygons are rendered, before getting merged with previous pictures
    let rotf=Math.floor(rot);
    hx=sin1024[(rotf+0)&1023]*16*6/5;
    hy=sin1024[(rotf+256)&1023]*16;
    vx=sin1024[(rotf+256)&1023]*6/5;
    vy=sin1024[(rotf+512)&1023];
    vx=vx*vm/100;
    vy=vy*vm/100;
    for(c=-10;c<11;c+=2)   //draw all bars in vbuff
    {
        cx=vx*c*2; cy=vy*c*2;
        x1=(-hx-vx+cx)/16+160; y1=(-hy-vy+cy)/16+100;
        x2=(-hx+vx+cx)/16+160; y2=(-hy+vy+cy)/16+100;
        x3=(+hx+vx+cx)/16+160; y3=(+hy+vy+cy)/16+100;
        x4=(+hx-vx+cx)/16+160; y4=(+hy-vy+cy)/16+100;
        asmbox(x1,y1,x2,y2,x3,y3,x4,y4,vbuf,1);     //draw this bar 
    }
    rot+=(2*AnimationFramesToRender); //update rotation angle
    vm+=vma;  //update amplitude vm:  distance between polygons, cyclic increase/decrease with kind of rebound acceleration/deceleration (vma)
    if(vm<25) 
    {
        vm-=vma;
        vma=-vma;
    }
    vma-=AnimationFramesToRender;

    asmdoit(vpages[CurrentPage],CurrentPlane);  //merge polygons by overwriting the current bit plane of the current page (other bit planes remain unchanged)

    CurrentPage= (CurrentPage+1) %8 ;   //CurrentPage  0..7, switch page every frame
    if (CurrentPage==0) CurrentPlane=(CurrentPlane+1) % 4;  //CurrentPlane 0..3 , destination plan changes every 8 frames
  

}


//************************************************************************************************************************************************************************************************************
// 2nd rotating bars sequence  
function doit2()
{
  
	let	c,x1,y1,x2,y2,x3,y3,x4,y4,hx,hy,vx,vy,cx,cy;
    if (FirstDoIt2Cycle)   //initialisation of the sequence
    {
        console.log("doit2");
        FirstDoIt2Cycle=false;
        CurrentPlane=0;
        CurrentPage=0;
        for (let i=0;i<vpages.length;i++)  vpages[i].fill(0);  //clear pages content
        rot=50;
        rota=10;
        vm=100*64; 
        vma=0;  
    }
    // one frame of the sequence:
    UpdatePaletteWithMusic();
    for (let i=0;i<64000;i++) vbuf[i]=0; //clear vbuf  //memset(vbuf,0,8000);  vbuf is where new polygons are rendered, before getting merged with previous pictures
    let rotf=Math.floor(rot);
    hx=sin1024[(rotf+0)&1023]*16*6/5;
    hy=sin1024[(rotf+256)&1023]*16;
    vx=sin1024[(rotf+256)&1023]*6/5;
    vy=sin1024[(rotf+512)&1023];
    vx=vx*(vm/64)/100;
    vy=vy*(vm/64)/100;
    for(c=-10;c<11;c+=2)    //draw all bars in vbuff
    {
        cx=vx*c*2; cy=vy*c*2;
        x1=(-hx-vx+cx)/16+160; y1=(-hy-vy+cy)/16+100;
        x2=(-hx+vx+cx)/16+160; y2=(-hy+vy+cy)/16+100;
        x3=(+hx+vx+cx)/16+160; y3=(+hy+vy+cy)/16+100;
        x4=(+hx-vx+cx)/16+160; y4=(+hy-vy+cy)/16+100;
        asmbox(x1,y1,x2,y2,x3,y3,x4,y4,vbuf,1);     //draw this bar 
    }
    rot+=rota/10; //update rotation angle
    vm+=vma;  //update amplitude vm:  distance between polygons, cyclic increase/decrease with kind of rebound acceleration/deceleration (vma)
    if(vm<0) 
    {
        vm-=vma;
        vma=-vma;
    }
    vma-=AnimationFramesToRender;
    rota+=AnimationFramesToRender

    asmdoit(vpages[CurrentPage],CurrentPlane);  //merge polygons by overwriting the current bit plane of the current page (other bit planes remain unchanged)

    CurrentPage= (CurrentPage+1) %8 ;   //CurrentPage  0..7, switch page every frame
    if (CurrentPage==0) CurrentPlane=(CurrentPlane+1) % 4;  //CurrentPlane 0..3 , destination plan changes every 8 frames
  

}
//************************************************************************************************************************************************************************************************************
// 3nd rotating bars sequence 
// doit3 in original code is a bit different: 
//  _ it manages scrolling using VGA viewport change  (pages are now 640x200 with 320x200 visible, allowing to shift picture for transition), we do it here by shifting frame buffer
//  _ it display the picture, coming in scrolling (it's done in next part in my implementation to make things a bit clearer)

function doit3()
{
    
	let	c,x1,y1,x2,y2,x3,y3,x4,y4,hx,hy,vx,vy,cx,cy,wx,wy;
    if (FirstDoIt3Cycle)   //initialisation of the sequence
    {
        console.log("doit3");
        FirstDoIt3Cycle=false;
        CurrentPlane=0;
        CurrentPage=0;
        for (let i=0;i<vpages.length;i++)  vpages[i].fill(0);  //clear pages content
        rot=45;
        rota=10;
        rot2=0;
        xposa=0;
        xpos=0;
        vm=100*64; 
        vma=0; 
        doit3FirstFrame=CurrentAnimationFrame;
    }
    // one frame of the sequence:
    UpdatePaletteWithMusic();
    for (let i=0;i<64000;i++) vbuf[i]=0; //clear vbuf  //memset(vbuf,0,8000);  vbuf is where new polygons are rendered, before getting merged with previous pictures
 	let rot2f=Math.floor(rot2);
    if(rot2<32)
    {
        wx=sin1024[(rot2f+0)&1023]*rot2/8+160;
        wy=sin1024[(rot2f+256)&1023]*rot2/8+100;
    }
    else
    {
        wx=sin1024[(rot2f+0)&1023]/4+160;
        wy=sin1024[(rot2f+256)&1023]/4+100;
    }
	rot2+=17*AnimationFramesToRender;
    let rotf=Math.floor(rot);
    hx=sin1024[(rotf+0)&1023]*16*6/5;
    hy=sin1024[(rotf+256)&1023]*16;
    vx=sin1024[(rotf+256)&1023]*6/5;
    vy=sin1024[(rotf+512)&1023];
    vx=vx*(vm/64)/100;
    vy=vy*(vm/64)/100;
    for(c=-10;c<11;c+=2)    //draw all bars in vbuff
    {
        cx=vx*c*2; cy=vy*c*2;
        x1=(-hx-vx+cx)/16+wx; y1=(-hy-vy+cy)/16+wy;
        x2=(-hx+vx+cx)/16+wx; y2=(-hy+vy+cy)/16+wy;
        x3=(+hx+vx+cx)/16+wx; y3=(+hy+vy+cy)/16+wy;
        x4=(+hx-vx+cx)/16+wx; y4=(+hy-vy+cy)/16+wy;
        asmbox(x1,y1,x2,y2,x3,y3,x4,y4,vbuf,1);     //draw this bar
    }
    rot+=rota/10; //update rotation angle
    vm+=vma;  //update amplitude vm:  distance between polygons, cyclic increase/decrease with parabolic rebound acceleration/deceleration (vma)
    if(vm<0) 
    {
        vm-=vma;
        vma=-vma;
    }
    vma-=AnimationFramesToRender;
    rota+=AnimationFramesToRender

    //manage scroll of bars at end of sequence (333 last frames)
    if (CurrentAnimationFrame-doit3FirstFrame> 70*14-333)   
    {
        xpos+=Math.floor(xposa/4);
	    if(xpos>320) xpos=320;
	    else xposa+=AnimationFramesToRender;
        if (xpos>=320) HasPartEnded=true;
    }
    asmdoit(vpages[CurrentPage],CurrentPlane,xpos);  //merge polygons by overwriting the current bit plane of the current page (other bit planes remain unchanged)

    CurrentPage= (CurrentPage+1) %8 ;   //CurrentPage  0..7, switch page every frame
    if (CurrentPage==0) CurrentPlane=(CurrentPlane+1) % 4;  //CurrentPlane 0..3 , destination plan changes every 8 frames
  

}


//************************************************************************************************************************************************************************************************************
function asmbox (x1,y1,x2,y2,x3,y3,x4,y4,FrameBuffer,color)
{
    let mypoly={};
    mypoly.vertices2D=new Array(4);
    mypoly.color=color;
    mypoly.vertices2D[0]={};
    mypoly.vertices2D[0].x =Math.floor(x1);
    mypoly.vertices2D[0].y =Math.floor(y1);
    mypoly.vertices2D[1]={};
    mypoly.vertices2D[1].x =Math.floor(x2);
    mypoly.vertices2D[1].y =Math.floor(y2);
    mypoly.vertices2D[2]={};
    mypoly.vertices2D[2].x =Math.floor(x3);
    mypoly.vertices2D[2].y =Math.floor(y3);
    mypoly.vertices2D[3]={};
    mypoly.vertices2D[3].x =Math.floor(x4);
    mypoly.vertices2D[3].y =Math.floor(y4);

    mypoly=ClipPolygonDown(mypoly);
    mypoly=ClipPolygonUp(mypoly);
    mypoly=ClipPolygonLeft(mypoly);
    mypoly=ClipPolygonRight(mypoly);   
    FillConvexPolygon(mypoly,false,true, FrameBuffer,color); //Draw the polygon 
}

//************************************************************************************************************************************************************************************************************
function asmdoit (CurrentPage,CurrentPlan,xpos=0) //mix of asmdoit and asmdoit2 from original code, adapted to our graphic mode and capabilities
{
   //transfer Monochrome line image to current bit plan (pl) of current page (plv) 
    let msk= 1 << CurrentPlan;
    for (i=0;i<64000;i++)
    {
        if(vbuf[i]!=0)  
            CurrentPage[i]|= msk; //set the bit 
       else
            CurrentPage[i]&=~(msk); //reset the bit
    }
    

    //transfer current page to screen (doit1 and doit2)
    if (xpos==0) RenderIndexedMode13hFrame(CurrentPage);
    else  //for doit3 we need to scroll and use an intermediate buffer (reuse of the vbuf intermediate buffer)
    {
        for(let yy=0;yy<64000;yy+=320)  //y from 0 to 200
        {
            for(let x=0;x<320;x++)
            {
                if (x<xpos) vbuf[yy+x]=0;  //beginning of line before xpos is black
                else vbuf[yy+x]=CurrentPage[yy+x-xpos]; // from xpos to end of line, fill the remaining part of line with bars data
            }
        }
        RenderIndexedMode13hFrame(vbuf);
    }
}


//************************************************************************************************************************************************************************************************************
function UpdatePaletteWithMusic()  // Called waitborder in original code in KOE.C:34  update palette according to music position
{
    row=dis_musrow();
    if (row!=prev_row)
    {
        prev_row=row;
        if((row&7)==7) curpal=15;
    }
    //set palette according to curpal
    let r,g,b;
    let index=16*3*curpal;
    for (c=0;c<16;c++)
    {
        r=BaseTechnoPalette[index++];
        g=BaseTechnoPalette[index++];
        b=BaseTechnoPalette[index++];
        SetVGAPaletteColor(c,r,g,b);
    }

    if(curpal) curpal--;
	
}

//************************************************************************************************************************************************************************************************************
function PaletteGeneration() 
{
    // Actual code in KOE.C:119
    //  (Integer arithmetic in C vs floating point in Js => needs to "floor" every division to obtain exact same colors as original code)
    let r,g,b,index;
    BaseTechnoPalette= new Array(3*256); //768 bytes
    for(let c=0;c<16;c++)  //generate 16 palette of colors
    {
        index=3*16*c;
        for(let a=0;a<16;a++) //
        {
            x=0;
            if(a&1) x++;
            if(a&2) x++;
            if(a&4) x++;
            if(a&8) x++;  // x= number of "1" in binary value of a
            switch(x)   
            {
                case 0 :
                    r=0;
                    g=0;
                    b=0;                    
                    break;
                case 1 :   // 1 bit at 1 in all 4 bit planes, darker color
                    r=Math.floor(38*64/111);
                    g=Math.floor(33*64/111);
                    b=Math.floor(44*64/111);
                    break;
                case 2 :
                    r=Math.floor(52*64/111);
                    g=Math.floor(45*64/111);
                    b=Math.floor(58*64/111);
                    break;
                case 3 :
                    r=Math.floor(67*64/111);
                    g=Math.floor(61*64/111);
                    b=Math.floor(73*64/111);
                    break;
                case 4 : // All 4 bits at 1 in bit planes, brightest color
                    r=Math.floor(83*64/111);
                    g=Math.floor(77*64/111);
                    b=Math.floor(89*64/111);
                    break;
            }
          
            //generate similar palette, with different amplitudes: correct palette will be selected according to music beat
            r=Math.floor(r*Math.floor(10+c*9/9)/10);   
            g=Math.floor(g*Math.floor(10+c*7/9)/10);
            b=Math.floor(b*Math.floor(10+c*5/9)/10);

            BaseTechnoPalette[index++]=clip(r,0,63);  
            BaseTechnoPalette[index++]=clip(g,0,63);
            BaseTechnoPalette[index++]=clip(b,0,63);
            SetVGAPaletteColor(16*c+a,r,g,b);
        }
    }
}

//************************************************************************************************************************************************************************************************************
function PartLeave()
{
  
}



//************************************************************************************************************************************************************************************************************
// Part Interface with main.js


return { init: () => { PartInit(); },   update: () => { PartRenderFrame();},  end: () => { PartLeave();}};
  

}