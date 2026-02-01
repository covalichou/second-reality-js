// Final and simple sequence of the TECHNO part, that just make the "troll" (also called "monster") picture coming and disappear
// Original code by PSI, and located:
// _ First in doit3() of TECHNO\KOE.C to make picture scrolling
// _ Then in PANIC\SHUTDOWN.C file: CRT TV shutdown effect to clear the screen

// This file includes both sequences, in order to group all code using this picture 

function TECHNO_TROLL() 
{

    let troll_palette,troll_pixels,troll_palette_fade;
    let xpos,xposa;     // picture scroll current position and current speed
    let ripple,ripplep; // bounce effect when scroll has reached position
    let sin1024;
    let Shutdown_sequence,Shutdown_Height, Shutdown_Width,Shutdown_Extinct;
//************************************************************************************************************************************************************************************************************

function PartInit()
{
	PartName = "Techno Troll";
    PartTargetFrameRate=70;  //originally based on a VGA Mode 13h timing (320x200@70Hz)


	//decode the palette and pixels of the Troll picture;
	let TROLL_FILE= Base64toArray(TROLL_base64);
	troll_palette=new Array(768);
	readp(troll_palette,-1,TROLL_FILE);
	let pixellines=new Array(320);
	troll_pixels=new Array(320*400);
	for(let y=0;y<400;y++)
	{
			readp(pixellines,y,TROLL_FILE);
			for (let x=0;x<320;x++) troll_pixels[y*320+x]=pixellines[x];
	}

    //Prepare multiple (16) palette for the fading effect (from KOE.C doit3)
    troll_palette_fade=new Array(16);
    let x,y,a;
    for(let y=0;y<16;y++)
	{
	    troll_palette_fade[y]=new Array(768);
        x=(45-y*3);
		for(a=0;a<768;a++)
		{
			c=troll_palette[a]+x;
			if(c>63) c=63;
			troll_palette_fade[y][a]=c;
		}
	}
    xpos=0;
    xposa=0;
    ripple=0;
    ripplep=8;
    
    sin1024=new Array(1024);
    for (let x = 0; x < 1024; x++) sin1024[x] = Math.floor(Math.sin(2*Math.PI*x/1024) * 255);  

    //Prepare data for shutdown effect (no need to compute fadepals, we already have SetVGAPaletteFadeToWhite which does the same)
    Shutdown_sequence=0;
    Shutdown_Height=32;
    Shutdown_Width=280;
    Shutdown_Extinct=0;
}

//************************************************************************************************************************************************************************************************************
//called by main demo loop each time the screen has to be updated, time stamp is relative to part start
const SequenceDuration=[60,50,700];

function PartRenderFrame()
{     

    //wait for music sync event to start animation
	if (!IsDisSyncPointReached("TECHNO_TROLL")) 
	{
		ResetPartClock();  //let CurrentAnimationFrame to 0
		return;  //exit function until music point is reached
	}

    if (CurrentAnimationFrame<SequenceDuration[0])  //First scroll the picture (scrolling speed increase), make it fully visible
    {
        
        xpos+=xposa/4;    //xpos=0 means picture on far right, and comes closer when xpos increases
        if(xpos>320) xpos=320;
		else xposa+=AnimationFramesToRender;
        DisplayTroll(xpos,troll_palette);
    }  
    else if (CurrentAnimationFrame<SequenceDuration[0]+SequenceDuration[1])  // then make it horizontally bounce and flash
    {
       AnimationFramesToRender=1;
        if(ripplep>1023) ripplep=1024;
		else ripplep=ripplep*(5/4*AnimationFramesToRender);
        ripple+=ripplep+(100*AnimationFramesToRender);
        xpos=320+sin1024[Math.floor(ripple % 1024)]/ripplep;
   
        let c=clip(CurrentAnimationFrame-SequenceDuration[0],0,15); // c=flash level
        //console.log(xpos)
        let pal=troll_palette_fade[Math.floor(c)];   
        DisplayTroll(xpos,pal);
    }
    else if (CurrentAnimationFrame<SequenceDuration[0]+SequenceDuration[1]+SequenceDuration[2])
    {
      if (IsDisSyncPointReached("TECHNO_TROLL_CRT")) Shutdown();  //perform the CRT shutdown animation
    }
    else HasPartEnded=true;

}
//*************************************************************************************
//display the picture with selected palette, with H-scroll parameter
function DisplayTroll(HScrollPosition,palette)
{
    SetVGAPalette(palette);
    let x,yy;
    let xpos=Math.floor(320-HScrollPosition);
    for (yy=0;yy<400*320;yy+=320)
    {
        for (x=0;x<320;x++) 
        {
            if (x<xpos)
                IndexedFrameBuffer[yy+x]=0; 
            else
                IndexedFrameBuffer[yy+x]= troll_pixels[yy+x-xpos];
        }
    }
    RenderIndexedModeFrame320x400();
}

//************************************************************************************************************************************************************************************************************
function Shutdown()  //original code in PANIC/Shutdown.c
{
    let	x,y;
	switch(Shutdown_sequence)  //sequence in Shutdown() in Panic\SHUTDOWN.C
    {
        case 0:  //display picture  fullscreen but  in 320x200 fullscreen
            for(y=0;y<200;y++) 
                for(x=0;x<320;x++)
                    IndexedFrameBuffer[y*320+x]= troll_pixels[y*2*320+x];
            Shutdown_sequence++;
            break;
        case 1:  //half vertical size + flash during 1 frame
            SetVGAPaletteFadeToWhite(troll_palette, 3/63) ;   // (tw_setpalette(fadepals[3]);)
            SetVGAPaletteColor(0,63,63,63);  //set border white  
            ShrinkY(100); //half vertical size 
            Shutdown_sequence++;
            break;  
        case 2: //flash ends
            SetVGAPaletteFadeToWhite(troll_palette, 20/63,false) ;   // (tw_setpalette(fadepals[20]);)
            SetVGAPaletteColor(0,0,0,0);  //set border black
            Shutdown_sequence++;
            break;
        case 3:  //Reduce picture vertial size (start from 32 and reduce)
            Shutdown_Height=Shutdown_Height*Math.pow(5/6,AnimationFramesToRender); //size is reduced of 5/6 every 70Hz frame
            if(Shutdown_Height<=2) 
            {
                Shutdown_Height=2;
                Shutdown_sequence++;
            }
            SetVGAPaletteFadeToWhite(troll_palette, 1-(Shutdown_Height-2)/63,false) ;   // tw_setpalette(fadepals[63-a]); better: 63-2*a looks similar to video
            ShrinkY(Math.floor(Shutdown_Height));
            break;
        case 4:  //stretch the remaining horizontal line
            BlackLine(99);  //clear remaining lines from previous sequence
            SetVGAPaletteFadeToWhite(troll_palette, 1,false) ; // all remaining pixels white
            Shutdown_Width-=3*AnimationFramesToRender;
            PartialClearHLine(Math.floor(Shutdown_Width)); //progressively clear the central remaing line
            if(Shutdown_Width<=1) Shutdown_sequence++;
            break;        
        case 5:  //leave one pixel and modulate its value (fade out , fade in and fade out)
            IndexedFrameBuffer[100*320+160]=1;    //leave one pixel,similar tw_putpixel(160,200,1);
            let b=Math.cos(Shutdown_Extinct/120.0*3*2*Math.PI)*31.0+32;  //the cos function makes brightness level oscillate
            SetVGAPaletteColor(1,b,b,b);  //fade the pixel, similar to tw_setrgbpalette(1,b,b,b);
            Shutdown_Extinct+=AnimationFramesToRender;
            if (Shutdown_Extinct>=60) Shutdown_sequence++;
            break;
    }
    RenderIndexedMode13hFrame();
}

//************************************************************************************************************************************************************************************************************
// stretch the 320x400 picture at FinalHeight, to the 320x200 Frame buffer, centered 
function ShrinkY(FinalHeight)
{
    for(b=0;b<=200;b++)  //black lines above and below
	{
        if (b<(100-Math.floor(FinalHeight/2)) || b>=(100+Math.floor(FinalHeight/2)))
            BlackLine(b);
        else
            CopyPictureLine(Math.floor((b-(100-FinalHeight/2))*400/FinalHeight),b);
 	}
}

//************************************************************************************************************************************************************************************************************
//copy one horizontal line from the troll picture to the frame buffer
function CopyPictureLine(Yfrom,Yto)
{
    for (x=0;x<320;x++) 
        IndexedFrameBuffer[Yto*320+x]= troll_pixels[Yfrom*320+x];
}
 
//************************************************************************************************************************************************************************************************************
// Draw a black horizonal line in our frame buffer
function BlackLine(Y)
{
    for (x=0;x<320;x++) 
        IndexedFrameBuffer[Y*320+x]= 0;
}
 //************************************************************************************************************************************************************************************************************
// Partially clear an horizontal line (pixels in center are kept)
function PartialClearHLine(RemainingLineWidth)
{
    for (x=0;x<320;x++) 
    {
        if (x<160-Math.floor(RemainingLineWidth/2) || x>160+Math.floor(RemainingLineWidth/2))
            IndexedFrameBuffer[100*320+x]= 0;
    }
}
//************************************************************************************************************************************************************************************************************
function PartLeave()
{
    //free allocated memory
    troll_palette=null;
    troll_pixels=null
    troll_palette_fade=null;
    sin1024=null;
}

//************************************************************************************************************************************************************************************************************
// Part Interface with main.js
return { init: () => { PartInit(); },   update: () => { PartRenderFrame();},  end: () => { PartLeave();}};
  
}