
//PART04: Display Title picture with fade-in / fade out
 

// title picture data is shared with next part => global scope
// no credits for the original coder
// original source code and data in BEGLOGO folder

let srtitle_palette;
let srtitle_pixels;


function BEGLOGO()
{ 

let SRTITLE_UP;



//************************************************************************************************************************************************************************************************************



function PartInit()
{
	PartName = "BEGLOGO";
    PartTargetFrameRate=70;  //originally based on a VGA Mode 13h (320x200@70Hz)

	init_data();
}

//************************************************************************************************************************************************************************************************************
//called each time screen has to be updated, time stamp is relative to part start

function PartRenderFrame()
{

	if (CurrentAnimationFrame<32) return;   //do nothing for first 32 frame

	else if (CurrentAnimationFrame-32<=128) //fade in for next 128 frames
	{
		SetVGAPaletteFadeToWhite(srtitle_palette, 1.0- (CurrentAnimationFrame-32)/128.0); //fade to white level 0..1
		//render frame buffer to screen
		for (let i=0;i<320*400;i++) IndexedFrameBuffer[i]=srtitle_pixels[i];
		RenderIndexedModeFrame320x400(); //transfer frame buffer to screen
	}
	
	else  if (CurrentAnimationFrame-32>128+128-6) HasPartEnded=true;  //Wait ~128 additional frames before ending part and starting new music

}


//************************************************************************************************************************************************************************************************************
function init_data()
{
	//decode the palette and pixels of the 320x400 title picture;
	SRTITLE_UP= Base64toArray(SRTITLE_UP_base64);
	srtitle_palette=new Array(768);
	readp(srtitle_palette,-1,SRTITLE_UP);
	pixellines=new Array(320);
	srtitle_pixels=new Array(320*400);
	for(y=0;y<400;y++)
	{
			readp(pixellines,y,SRTITLE_UP);
			for (let x=0;x<320;x++) srtitle_pixels[y*320+x]=pixellines[x];
	}
}


//***********************************************************************************************************************************************************************************************************
function PartLeave()
{
	SRTITLE_UP=null;
}

// Part Interface with main.js
return { init: () => { PartInit(); },   update: () => { PartRenderFrame();},  end: () => { PartLeave();}};

}