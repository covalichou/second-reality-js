
// Part 02 U2A : 3D ships over landscape background
// Uses the "U2" 3D engine (here source code files start with u2, original code is in VISU and VISU\C folder)

//Original part coded by PSI
//Original title "Alkutekstit II"  which means  "opening credits 2"



function U2A()
{

let hzpic_pix;  //global (will be accessed by next parts)
let Background_Pic=new Array(320*200);
const Background_Color_Offset=192; //shift color index of background picture (use unused area of 3d polygons palette)

//************************************************************************************************************************************************************************************************************

function PartInit()
{
	console.log("PartInit U2A");
	hzpic_pix=Base64toArray(hzpic_base64);  //load the background picture


	PartName = "U2A";
    PartTargetFrameRate=70;  //originally based on a VGA Mode 13h (320x200@70Hz)

    //----------------- 
	
	resetsceneU2();

	//Get Background picture from Hzpic
	const Xscroll=320; //X scroll position of background picture in hzpic_pix
	for (let y=0; y<200-2; y++)
		for (let x=0; x<320; x++)
			Background_Pic[x+y*320]=hzpic_pix[x+Xscroll+y*640]+Background_Color_Offset;  //copy background picture from current hzpic_pix scroll position Background_Pic

	load_data_u2a();
	

	ClippingY	=	[25,174] ;	
	
	//Init color palette
	cp=scene0.slice(16,16+768); 
	for (i=0;i<63*3;i++) cp[i+Background_Color_Offset*3]=hzpic_pal[i]; //copy background palette to unused area of 3d polygons palette using Background_Color_Offset)


	for (let y=ClippingY[1];y<200 ;y++)
		for (let x=0; x<320; x++ )
			IndexedFrameBuffer[x+(y+ClippingY[0])*320]=0;   //clear lower part of picture () (palette change make some unexpected pixel appear)
	
	SetVGAPalette(cp);
	}

//************************************************************************************************************************************************************************************************************
function load_data_u2a()
{
	load_data_u2(U2A_00M_base64,U2A_DataFiles,U2A_0AB_base64);
}


//************************************************************************************************************************************************************************************************************
//called each time screen has to be updated, time stamp is relative to part start
function PartRenderFrame()
{
	
	//wait for music sync event to start animation
	if (!IsDisSyncPointReached("U2A_START")) 
	{
		ResetPartClock();  //let CurrentAnimationFrame to 0
		return;  //exit function until music point is reached
	}

	//copy landscape background (reuse data from part01)
	let Xscroll=320;
	for (let y=0; y<ClippingY[1];y++)
		for (let x=0; x<320; x++ )
			IndexedFrameBuffer[x+(y+ClippingY[0])*320]=Background_Pic[x+(y*320)];   

	
	//Update animation of objects (including camera);  update at correct rate (U2A.C l:328)
	for (let i=0; (i<AnimationFramesToRender) && (!animation_end);i++) StepOneAnimationFrame();

	RenderFrameU2();   // 3D engine will render the frame (draw all polygons)
	RenderIndexedMode13hFrame();	//transfer frame buffer to screen
	if (animation_end) HasPartEnded=true;
}


//***********************************************************************************************************************************************************************************************************
function PartLeave()
{
	resetsceneU2();
	hzpic_pix=null;
	Background_Pic=null;	
	
}

//************************************************************************************************************************************************************************************************************
// Part Interface with main.js
return { init: () => { PartInit(); },   update: () => { PartRenderFrame();},  end: () => { PartLeave();}};
 
}