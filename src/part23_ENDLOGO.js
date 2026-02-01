
// Part 23 ENDLOGO : End Logo Display with fade in and fade out , code similar to BEGLOGO part
// Original code in END folder (unknown coder)

function ENDLOGO()
{
    let logo_palette;
    let logo_pixels;
    let lastFrame;


//************************************************************************************************************************************************************************************************************

function PartInit()
{
	console.log("PartInit ENDLOGO");
	

	PartName = "ENDLOGO";
    PartTargetFrameRate=70;  //originally based on a VGA Mode 13h (320x200@70Hz), but runs at half speed (35 fps)

    //----------------- 

	init_data();

    SetVGAPaletteFadeToWhite(logo_palette, 1.0);; //full white at start
    //write image to screen but it won't be visible due to full white palette
    for (let i=0;i<320*400;i++) IndexedFrameBuffer[i]=logo_pixels[i]; 
    RenderIndexedModeFrame320x400(); //transfer frame buffer to screen


}

//************************************************************************************************************************************************************************************************************
//called each time screen has to be updated, time stamp is relative to part start

function PartRenderFrame()
{
	if (CurrentAnimationFrame<128)   //Initial Fade In
    {
        SetVGAPaletteFadeToWhite(logo_palette, 1.0- (CurrentAnimationFrame)/128.0); //full white at start
        RenderIndexedModeFrame320x400(); 
    } 
	else if (CurrentAnimationFrame<500) //wait with picture displayed //TODO WAIT MUSIC EVENT
	{
        lastFrame=CurrentAnimationFrame;
	}
    else  if (CurrentAnimationFrame<lastFrame+32) //fade out
    {
        let Level=clip((CurrentAnimationFrame-lastFrame)/32,0,1);
        SetVGAPaletteFadeToBlack(logo_palette, Level); //full black at start
        RenderIndexedModeFrame320x400()
    } 
    else HasPartEnded=true;  //Wait ~128 additional frames before ending part and starting new music

}


//************************************************************************************************************************************************************************************************************
function init_data()
{
	//decode the palette and pixels of the 320x400 title picture;
	let ENDLOGO_UP= Base64toArray(ENDLOGO_UP_base64);
	logo_palette=new Array(768);
	readp(logo_palette,-1,ENDLOGO_UP);
	pixellines=new Array(320);
	logo_pixels=new Array(320*400);
	for(y=0;y<400;y++)
	{
			readp(pixellines,y,ENDLOGO_UP);
			for (let x=0;x<320;x++) logo_pixels[y*320+x]=pixellines[x];
	}
}


//***********************************************************************************************************************************************************************************************************
function PartLeave()
{
    logo_palette=logo_pixels=null;
}

// Part Interface with main.js
return { init: () => { PartInit(); },   update: () => { PartRenderFrame();},  end: () => { PartLeave();}};

}