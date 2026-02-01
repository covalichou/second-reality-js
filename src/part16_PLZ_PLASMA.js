// PLZ Part (Original code by WILDFIRE)

// Original source code in PLZPART folder contains two parts:
// 1st part: PLASMA (colored waves/smoke effect) (PLZ function called in PLZPART\MAIN.C)
// 2nd part: Textured plasma cube (VECT function called in PLZPART\MAIN.C)

// This file implements the first part (colored waves/smoke effect)

//  Original code in PLZ folder (mainly in PLZ.C, ASMYT.ASM, COPPER.ASM), 

// You can find already existing ports of this part here:
//  https://ndkovac.tumblr.com/  (1st known port by Nick Kovac, dropbox links to code seem dead)
//  https://github.com/cmatsuoka/sr-port   (migration of Nick's implementation in Claudio Matsuoka sr_port in plzpart and plzpart-gl)

// Resolution of this part is 320x400 


function PLZ_PLASMA() 
{

    const QUAD_MAXX=80; // Compute 80 plasma pixels per line , pixels are doubled, and we have 2 plasma (this will generate 320 pixels per line
                        // actual code uses a 84*4 because  buffer for planar mode and register size and additionnal "pompota" 4 pixels shift  

    const MAXY=280;
   
    const DPII = 2* Math.PI;
    let l1,l2,l3,l4;
    let k1,k2,k3,k4;
    let whitefadelevel, blackfadelevel,fadestartframe; 
    let curpal,pals;
    let sequence,cop_drop,lc;  //lc = current plasma Y position (60 for centered position) ,, sequence: "ttptr" in orginal code
    let lsini4, lsini16,psini,ptau;
    let prev_lc;
    
    const FadeWhiteDuration = 512;  //duration in 70Hz frames
    const FadeBlackDuration =  64;  //duration in 70Hz frames


    const	inittable= /*[6][8]*/     // 8 values for each 6 sequence 
             [[1000,2000,3000,4000,3500,2300,3900,3670],
			  [1000,2000,4000,4000,1500,2300,3900,1670],
			  [3500,1000,3000,1000,3500,3300,2900,2670],
			  [1000,2000,3000,4000,3500,2300,3900,3670],
			  [1000,2000,3000,4000,3500,2300,3900,3670],
			  [1000,2000,3000,4000,3500,2300,3900,3670]];
    let prev_mframe;
// *******************************************************************************************************************************************************************************

function PartInit()
{
	PartName = "PLZ_PLASMA";
    PartTargetFrameRate=70;  //originally based on a VGA Mode 13h timing (320x200@70Hz)


    pals=new Array(6);
    for (let i=0;i<pals.length;i++) { pals[i]=new Array(768); pals[i].fill(0); }

    init_plz();
    cop_drop=0;
    lc=60;
    sequence=0; 
    initpparas(0);
    fadestartframe=0;
    whitefadelevel=1;  //will start fully faded white
    blackfadelevel=0;  
    prev_lc=0;
    prev_mframe=0;

    IndexedFrameBuffer.fill(0);  // initial frame buffer color 0  (set to white to continue previous part)
    SetVGAPaletteColor(0, 63, 63, 63);  // color index 0  is white
    RenderIndexedModeFrame320x400(); //render all buffer at start, then we'll render only useful area
}

//************************************************************************************************************************************************************************************************************
//called by main demo loop each time the screen has to be updated, time stamp is relative to part start
function PartRenderFrame()
{     
    if (GetCurrentSyncPoint() == -1) { ResetPartClock(); return;}  //wait for music sync event to start animation

    PLZ(CurrentAnimationFrame);   //PLZ will end part when final plasma drop is over
}

//************************************************************************************************************************************************************************************************************



function PLZ(CurrentFrame)  
{   
    //check if a sequence change is requested
    let mframe=GetCurrentSyncPoint();
    if (mframe!=prev_mframe)  //time to exit current sequencechange palette!
    {
        prev_mframe=mframe;
        cop_drop=1;   //start dropping
    }
    //generate both plasma
    plzparasK=[k1,k2,k3,k4];
    plzparasL=[l1,l2,l3,l4];

    for(y=0;y<MAXY;y+=2)  //even lines
        plzline(y,lc,plzparasK,true);  // even pixels 0,2,4...
    for(y=1;y<MAXY;y+=2)  //odd lines
        plzline(y,lc,plzparasL,true);  //even pixels 0,2,4...

    for(y=1;y<MAXY;y+=2)  //even lines
        plzline(y,lc,plzparasK, false); // odd pixels 1,3,5...
    for(y=0;y<MAXY;y+=2)  //odd lines
        plzline(y,lc,plzparasL,false);   // odd pixels 0,2,4...

    plzmove();  //update animation

    if (cop_drop!=0) do_drop(CurrentFrame);  //if drop requested, do it

    // Fade palette if needed:
    whitefadelevel=clip (whitefadelevel-(CurrentFrame-fadestartframe)/FadeWhiteDuration,0,1);
    blackfadelevel=clip (blackfadelevel-(CurrentFrame-fadestartframe)/FadeBlackDuration,0,1);
    
    if (whitefadelevel!=0) 
        SetVGAPaletteFadeToWhite(pals[curpal],whitefadelevel);
    else if (blackfadelevel!=0)   SetVGAPaletteFadeToBlack(pals[curpal],blackfadelevel);
    else  SetVGAPalette(pals[curpal]);

    // when dropping down, some plasma lines are remaining on top, we need to clear them
    if (lc>prev_lc) //plasma has been dropped down: clear lines between the previous and the new position
    {
        for (let y=prev_lc;y<lc;y++)
            for (let x=0;x<320;x++)
                IndexedFrameBuffer[y*320+x]=0;  //force black
    }
    

    //Finally transfer plasma to screen
    RenderIndexedModeFrame320x400();
    prev_lc=lc;

}

//************************************************************************************************************************************************************************************************************
function do_drop(CurrentFrame)  //manage transition with falling / fading
{
    cop_drop++;
    
    if (cop_drop<=64)  lc= Math.floor(cop_drop*cop_drop/4*43/128+60);  // increase drop level
    else  //drop finished
    { 
        lc= 60;
        sequence= GetCurrentSyncPoint();  
        if (curpal!=sequence) initpparas(sequence);

        blackfadelevel=1;
        fadestartframe=CurrentFrame
        cop_drop=0;  //drop finished
        if (sequence==3) HasPartEnded=true; //end of part when sequence 3 is over (this means sequence 0,1,2 are done)   
    }

}
//************************************************************************************************************************************************************************************************************
function plzline(y,lc,params, FirstPixelEven)
{
    const FirstPixel = FirstPixelEven?0:1;

    let yy= (y+lc)*320;
    let xx=0;
    let rx;
    if ((y+lc)>=400) return; // this line is out of screen 
    for (let x = 0; x < QUAD_MAXX; x++) 
    {
        rx=QUAD_MAXX-x;
       
        //First wave
        let bx1 = lsini16[(y + params[1]+rx*4) & 0xFFF]; 
        let val1 = psini[ (x*8 +  params[0]+bx1) & 0x3FFF];
        // second wave
        let bx2=  lsini4[(y + params[3]+x*16) & 0xFFF];
        let val2 = psini[(bx2 + y*2 +params[2]+rx*4) & 0x3FFF];

        let ColorIndex = (val1 + val2) & 0xFF;  // final color index with both waves contribution
        IndexedFrameBuffer[yy+xx+FirstPixel]=ColorIndex;
        IndexedFrameBuffer[yy+xx+FirstPixel+2]=ColorIndex;
        xx+=4;
    }
}
//************************************************************************************************************************************************************************************************************
function plzmove()   //make animation program 1 frame
{
    const  PARAM_MASK = 4095;
    k1 = (k1 - 3) & PARAM_MASK;
    k2 = (k2 - 2) & PARAM_MASK;
    k3 = (k3 + 1) & PARAM_MASK;
    k4 = (k4 + 2) & PARAM_MASK;

    l1 = (l1 - 1) & PARAM_MASK;
    l2 = (l2 - 2) & PARAM_MASK;
    l3 = (l3 + 2) & PARAM_MASK;
    l4 = (l4 + 3) & PARAM_MASK;
}

function initpparas(sequence)  //init plasma parameters for a given sequence
{
        l1=inittable[sequence][0];   
        l2=inittable[sequence][1];
        l3=inittable[sequence][2];
        l4=inittable[sequence][3];
        k1=inittable[sequence][4];
        k2=inittable[sequence][5];
        k3=inittable[sequence][6];
        k4=inittable[sequence][7];
        curpal=sequence;
}
//************************************************************************************************************************************************************************************************************
//table generation

function init_plz()
{
	//init tables
    let a;
    lsini4=new Array(1024*8);
    lsini16=new Array(1024*8);
    psini=new Array(1024*16);
    ptau=new Array(1024*16);

    function iptau(k) {   return ptau[Math.floor(k)];}
    for(a=0;a<1024*8;a++)   lsini4[a]=Math.floor((Math.sin(a*DPII/4096)*55+Math.sin(a*DPII/4096*5)*8+Math.sin(a*DPII/4096*15)*2+64)*8);
    for (a=0;a<1024*8;a++)  lsini16[a]=Math.floor((Math.sin(a*DPII/4096)*55+Math.sin(a*DPII/4096*4)*5+Math.sin(a*DPII/4096*17)*3+64)*16);
    for (a=0;a<1024*16;a++) psini[a]=Math.floor(Math.sin(a*DPII/4096)*55+Math.sin(a*DPII/4096*6)*5+Math.sin(a*DPII/4096*21)*4+64);
    for(a=1;a<=128;a++)     ptau[a]=Math.floor(Math.cos(a*DPII/128+3.1415926535)*31+32);
	ptau[0]=0;
    //init palettes
    let pptr,pal;
    //	RGB palette Palette 0
	pptr=3; pal=pals[0];
	for(a=1;a<64;a++) { pal[pptr++]=iptau(a   );pal[pptr++]=iptau(0   );pal[pptr++]=iptau(0   ); }
	for(a=0;a<64;a++) { pal[pptr++]=iptau(63-a);pal[pptr++]=iptau(0   );pal[pptr++]=iptau(0   ); }
	for(a=0;a<64;a++) { pal[pptr++]=iptau(0   );pal[pptr++]=iptau(0   );pal[pptr++]=iptau(a   ); }
	for(a=0;a<64;a++) { pal[pptr++]=iptau(a   );pal[pptr++]=iptau(0   );pal[pptr++]=iptau(63-a); }

//	RB-black Palette 1
	pptr=3; pal=pals[1];
	for(a=1;a<64;a++) { pal[pptr++]=iptau(a   );pal[pptr++]=iptau(0   );pal[pptr++]=iptau(0   ); }
	for(a=0;a<64;a++) { pal[pptr++]=iptau(63-a);pal[pptr++]=iptau(0   );pal[pptr++]=iptau(a   ); }
	for(a=0;a<64;a++) { pal[pptr++]=iptau(0   );pal[pptr++]=iptau(a   );pal[pptr++]=iptau(63-a); }
	for(a=0;a<64;a++) { pal[pptr++]=iptau(a   );pal[pptr++]=iptau(63  );pal[pptr++]=iptau(a   ); }
    
//	RB-white Palette 3
	pptr=3; pal=pals[3];
	for(a=1;a<64;a++) { pal[pptr++]=iptau(a  ) ;pal[pptr++]=iptau(0   );pal[pptr++]=iptau(0   ); }
	for(a=0;a<64;a++) { pal[pptr++]=iptau(63 ) ;pal[pptr++]=iptau(a   );pal[pptr++]=iptau(a   ); }
	for(a=0;a<64;a++) { pal[pptr++]=iptau(63-a);pal[pptr++]=iptau(63-a);pal[pptr++]=iptau(63  ); }
	for(a=0;a<64;a++) { pal[pptr++]=iptau(0  ) ;pal[pptr++]=iptau(0   );pal[pptr++]=iptau(63  ); }

//	white Palette 2
	pptr=3; pal=pals[2];
	for(a=1;a<64;a++) { pal[pptr++]=iptau(0   )/2;pal[pptr++]=iptau(0   )/2;pal[pptr++]=iptau(0   )/2; }
	for(a=0;a<64;a++) { pal[pptr++]=iptau(a   )/2;pal[pptr++]=iptau(a   )/2;pal[pptr++]=iptau(a   )/2; }
	for(a=0;a<64;a++) { pal[pptr++]=iptau(63-a)/2;pal[pptr++]=iptau(63-a)/2;pal[pptr++]=iptau(63-a)/2; }
	for(a=0;a<64;a++) { pal[pptr++]=iptau(0   )/2;pal[pptr++]=iptau(0   )/2;pal[pptr++]=iptau(0   )/2; }

//	white II Palette 4
	pptr=3; pal=pals[4];
	for(a=1;a<75;a++) { pal[pptr++]=iptau(63-a*64/75); pal[pptr++]=iptau(63-a*64/75);pal[pptr++]=iptau(63-a*64/75); }
	for(a=0;a<106;a++){ pal[pptr++]=0; pal[pptr++]=0; pal[pptr++]=0; }
	for(a=0;a<75;a++) { pal[pptr++]=iptau(a*64/75)*8/10; pal[pptr++]=iptau(a*64/75)*9/10; pal[pptr++]=iptau(a*64/75); }
    
	pptr=0; pal=pals[0];



}

//************************************************************************************************************************************************************************************************************
function GetCurrentSyncPoint()
{
    if (IsDisSyncPointReached("PLZ_DROP3")) return 3;
    else if (IsDisSyncPointReached("PLZ_DROP2")) return 2;
    else if (IsDisSyncPointReached("PLZ_DROP1")) return 1;
    else if (IsDisSyncPointReached("PLZ_START")) return 0;
    else return -1; 
}
//************************************************************************************************************************************************************************************************************
function PartLeave()
{

}

//************************************************************************************************************************************************************************************************************
// Part Interface with main.js
return { init: () => { PartInit(); },   update: () => { PartRenderFrame();},  end: () => { PartLeave();}};
  

}