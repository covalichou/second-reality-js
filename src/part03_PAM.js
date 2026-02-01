
//PART03 PAM: Explosion animation
// This part implements a small video player (video is in a FC specifc format)
// Original code is in PAM folder (https://github.com/mtuomi/SecondReality/tree/master/PAM)
// Main file is OUTTAA.C
// Original video is a FLI file (3D Studio/Autodesk format), with the landscape and the explosion animation.
// The FLI file was decompressed in a RAW video file by VFLI.C (containing each frame), color palette is in a separate file (PAL.PAL)
// Then the RAW file was then compressed in a custom video file format "ANI file" in ANIM.C
// ANI file format is based on a Running length algorithm (RLE), to encode differences between each succesive frames

// The demo itself only implements the video decoder, with aditionnal palette image fading (to start explosion with a white flash, and finish all white)

// Original title is 'Alkutekstit III'
// Credits to TRUG (animation) and WILDFIRE (code)


function PAM()
{


let PamAnimationData;
let PamAnimationIndex;
let PamAnimationEnd;
let PamCurrentVideoFrame;


 

//palette fade level as animation progress
let	PAMPaletteFade=    [63,32,16,8,4,2,1,0,0,0,
	0,0,0,0,0,0,0,0,0,0,
	0,0,0,0,0,0,0,0,0,0,
	1,2,4,6,9,14,20,28,37,46,
	56,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63];
//************************************************************************************************************************************************************************************************************



function PartInit()
{
	PartName = "PAM";
    PartTargetFrameRate=70/4;  //originally based on a VGA Mode 13h (320x200@70Hz), but will update at 70 Hz /4 
	init_data_pam();
	PamAnimationIndex=0;
	PamAnimationEnd=false;
	PamCurrentVideoFrame=0;

}

//************************************************************************************************************************************************************************************************************
//called each time screen has to be updated, time stamp is relative to part start

function PartRenderFrame()
{
	//wait for music sync event to start animation
	
	//console.log("CurrentAnimationFrame="+CurrentAnimationFrame+ " PamCurrentVideoFrame="+ PamCurrentVideoFrame+ " CurrentPartAdditionalDelay=",CurrentPartAdditionalDelay);

	if(!IsDisSyncPointReached("PAM_START")) 
	{
		ResetPartClock();  //let CurrentAnimationFrame to 0
		return;  //exit function until music point is reached,  avoid wait for additional frames (OUTAA.C line 48), sync point adjusted 
	}
	

	//Update video frame at correct rate (play video then continue with palette fade)
	if (Math.floor(CurrentAnimationFrame)==0) for (i=0;i<320*400;i++) IndexedFrameBuffer[i]=0;  //clear all FrameBuffer (else initial flash will not apply everywhere)
	if (CurrentAnimationFrame<PAMPaletteFade.length-4) //duration adjusted
	{
		SetVGAPaletteFadeToWhite(PamPalette,PAMPaletteFade[Math.floor(CurrentAnimationFrame)]/63.0);

		while ( (PamCurrentVideoFrame<CurrentAnimationFrame) && (PamCurrentVideoFrame<= 40) &&  (!PamAnimationEnd))
		{
			RenderFramePAM(); 
			PamCurrentVideoFrame++;
		}
		RenderIndexedMode13hFrame();	
	}
	else HasPartEnded=true; //render only the first 40 frames (OUTAA.C line 49)

	
}


//************************************************************************************************************************************************************************************************************
function RenderFramePAM()
{
	// Implementation of the RLE decoder to decode one frame (original implementation in ulosta_frame function in ASMYT.ASM)
	let b,c,p,i;
	
	p=0;		//adress of destination pixel
	if (PamAnimationIndex>=PamAnimationData.length-1)
		{
			PamAnimationEnd=true;
			return;
		} 

	while ((PamAnimationIndex & 0x0F) !=0) PamAnimationIndex++; //Each frame starts on an adress mulitple of 16
	while (1)
	{
		b=Signed8FromByteBuffer(PamAnimationData,PamAnimationIndex++); //First byte: gives a number of pixels to write or to skip, or ends animation
		
		if (b>0)  // update b consecutive pixels with same value
		{
			c=PamAnimationData[PamAnimationIndex++];  //next byte give next pixel(s) color index
			for(i=0;i<b;i++)  IndexedFrameBuffer[p++]=c; 
		}
		else if(b<0)  //b<0 : skip |b| pixels (this means we'll let |b| pixels unchanged )
		{
			p-=b   ; // number of destination pixel to skip (remain unchanged from previous frame) 
		}
		else  return;  // b==0  means current frame is over
	}
}
//************************************************************************************************************************************************************************************************************
function init_data_pam()
{
	PamAnimationData= Base64toArray(OUT_ANI_base64);
}




//***********************************************************************************************************************************************************************************************************
function PartLeave()
{
	PamAnimationData=null;
}


// Part Interface with main.js
return { init: () => { PartInit(); },   update: () => { PartRenderFrame();},  end: () => { PartLeave();}};

}