
//PART05: Transition to the GLENZ part : Fade Title picture then display bouncing checkerboard, 
//PART05 is dependent of PART04 data (title picture) 
// original code in GLENZ/MAIN.C  of source code release. This part only imprement the checkerboard transition,
// original code by PSI
// 3D glenz vectors are implemented in part05




// original part starts in 320x400 (from title pic)
// then switch to 320x200 for checkerboard display and glenz vectors (you can observe a few black frames when mode is changed in actual demo)

let LastCHECKERBOARD; 

let CHECKERBOARD;  //useful for next part checkerboard image 16 bytes header, 768 bytes of palette, followed by 320x200 bytes (pixel index)

function GLENZ_TRANSITION()
{ 



//zoomer1 (title picture removal) data
let zy,previous_zy,previous_zy2;

// checkerboard rebound data


let color_palette_checker=new Array(256*3);
let Checkerboard_Velocity,Checkerboard_Position; //ya and yy in original code



//************************************************************************************************************************************************************************************************************



function PartInit()
{
	if (!srtitle_pixels) BEGLOGO().init() //load background picture if not done by previous part, (Do it early to avoid PartName overwrite)

	PartName = "Transition to Glenz";
    PartTargetFrameRate=70;  //originally based on a VGA Mode 13h (320x200@70Hz)	
	//this part reuses data from part04 (sr title...)
	

	
	//"zoomer1" (title picture removal) data initialisation
	zy=0;
	zy2=0;
	zya=0;
	previous_zy=0;
	previous_zy2=0;
	
	

	//bouncing checkerboard animation initialisation 
	let a; 
	CHECKERBOARD= Base64toArray(CHECKERBOARD_base64);
	//build RGBA palette for checkerboard from checkerboard buffer
	color_palette_checker.fill(0);  //original code GLENZ/MAIN.C:316
	for(a=0;a<16*3;a++)  //original code GLENZ/MAIN.C:318 
		color_palette_checker[a]=  CHECKERBOARD[16+a];  //palette stored here in FC image file format

	Checkerboard_Velocity=0;
	Checkerboard_Position=0;
	LastCHECKERBOARD= new Array(320*200);  
	LastCHECKERBOARD.fill(0);	

}

//************************************************************************************************************************************************************************************************************
//called each time screen has to be updated, time stamp is relative to part start

function PartRenderFrame()
{
	//console.log ("CurrentAnimationFrame= ", CurrentAnimationFrame);
	//wait for music sync event to start animation
	if (!IsDisSyncPointReached("CHECKERBOARD_FALL")) 
	{
		ResetPartClock();  //let CurrentAnimationFrame to 0	
		return;  //exit function until music point is reached
	}
	

	//1st part: progressively clear title picture (original code in zoomer.c , zoomer2 function)
	if (CurrentAnimationFrame<=48) Zoomer1(AnimationFramesToRender,CurrentAnimationFrame);  //progressively clear top/bottom of title screen
	//2nd part checkerboard
	else CheckerboardAnimation(AnimationFramesToRender); //will  end the part when needed

}

//************************************************************************************************************************************************************************************************************
//first animation of the part, progressively clear line on top and bottom of title picture and fade it to grey
//ExpectedFrame 00..128
function Zoomer1(NbFrameToRender,ExpectedFrame)  //code based on zoomer1 function in original code
{
	//clear top lines of title picture (clear a few lines per frame)
	
	let zya=ExpectedFrame; // current position in animation

	previous_zy= zy;
	zy += Math.floor(zya/4*NbFrameToRender);
	//console.log("zoomer1 ExpectedFrame=",ExpectedFrame, "zy=",zy,"previous_zy=",previous_zy);
	if(zy>260) zy=260;
	for(y=previous_zy;y<=zy;y++)
		for (x=0;x<320;x++) srtitle_pixels[y*320+x]=255; //clear each pixel of the line in source image

	//clear bottom lines of title picture (clear a few lines per frame)
	previous_zy2= zy2;
	zy2= Math.floor(125*zy/260);
	for(y=previous_zy2;y<=zy2;y++)
		for (x=0;x<320;x++) srtitle_pixels[(399-y)*320+x]=255; //clear each pixel of the line in source image

	//Fade to grey
	c=ExpectedFrame;
	if(c>32) c=32;
	FadeTitlePaletteToGray(srtitle_palette,c);  //fadelevel=expected frame number
	
	//render frame buffer to screen
	for (let i=0;i<320*400;i++) IndexedFrameBuffer[i]=srtitle_pixels[i]; //palette changes each frames, so all pixel  have to be converted again from index to RGB
	RenderIndexedModeFrame320x400(); //transfer frame buffer to screen
	
	
}

//************************************************************************************************************************************************************************************************************
//Compute the title screen palette (3*256 bytes of 0..63 rgb values)
//according to the palette fade level (2nd parameter, 0= no fade ..32=palette fully faded to grey)
function FadeTitlePaletteToGray(palette768,fadetograylevel)
{
	
	for (let i = 0; i < 128; i++) 
	{
		let r=palette768[i*3];
		let g=palette768[i*3+1];
		let b=palette768[i*3+2];
		r= Math.floor( ((32-fadetograylevel)*r + fadetograylevel*30)/32);
		g= Math.floor( ((32-fadetograylevel)*g + fadetograylevel*30)/32);
		b= Math.floor( ((32-fadetograylevel)*b + fadetograylevel*30)/32);
		SetVGAPaletteColor(i,r,g,b);

	}
	SetVGAPaletteColor(255,0,0,0);

	
}

//************************************************************************************************************************************************************************************************************
//************************************************************************************************************************************************************************************************************
//second animation of the part,: bouncing checkerboard
// original is supposed to take 187 frames (~2.7s at 70Hz), here speed  is adapted to actual framerate, in order to match duration

function CheckerboardAnimation(NbFrameToRender) //code based on  original GLENZ/MAIN.C:320 sequence
{
	//checkerboard starts at top position (0), with no velocity, Velocity increases, position incrases (the checkerboard is getting lower)
	//when bottom is reached,  velocity is reversed and reduced to rebound with a reduced amplitude.
	let b,y,y1,y2;
	//console.log("CheckerboardAnimation NbFrameToRender=",NbFrameToRender);	
	
	//compute bounce (as many frames as needed)
	for (i=0; i<NbFrameToRender;i++) 
	{
		Checkerboard_Velocity++;   //accelerate  when falling (or decelerate when velocity is <0 (ascending))
		Checkerboard_Position+=Checkerboard_Velocity;	// original code GLENZ/MAIN.C:323 (update checker position with velocity)
		if(Checkerboard_Position>48*16) //when reaching bottom  (yy high), update bounce direction and amplitude
		{
			Checkerboard_Position-=Checkerboard_Velocity;	//cancel previous update
			Checkerboard_Velocity=-Checkerboard_Velocity*2/3;  //rebound: initial velocity is reduced and direction changes to go up
			if(Checkerboard_Velocity>-4 && Checkerboard_Velocity<4) 
			{
				RenderLastCheckerBoardForNextPart();
				HasPartEnded=true;
			} 
		}
	}
	
	// render checkerboard image at computed vertical size (yy)
	y=Math.floor(Checkerboard_Position/16);	//new checkerboard size
	y1=Math.floor(130+y/2); //top position of checkerboard
	y2=Math.floor(130+y*3/2); //bottom position of checkerboard
	if(y2!=y1) b=(100/(y2-y1));  //size ratio of checkerboard (number of source image lines to skip to reach next  destination line)

	//Clear top lines that need to be empty (when top of checkerboard is going down => ya>0)
	if (Checkerboard_Velocity>0) for(let ry=y1-4;ry<y1;ry++) ClearScreenLine(ry);

	//copy checkerboard lines to screen, skip lines in source to zoom out to correct size
	for(c=0,ry=y1;ry<y2;ry++,c+=b) CopyCheckerboardLineToScreen(Math.floor(c),ry);
	
	//draw checker board bottom lines  (vertical side of the checkerboard), no zoom out
	for(c=0;c<8;c++,ry++) CopyCheckerboardLineToScreen(c+100,ry); //bottom of checker board is never zoomed (solid  vertical border of the checkerboard facing you)
	
	//clear remaining bottom lines (when bottom of checker board is going up =>  ya<0)
	if (Checkerboard_Velocity<0)for(c=0;c<8;c++,ry++) ClearScreenLine(ry); //clear bottom lines that need to be empty
	
	SetVGAPalette(color_palette_checker); //set checkerboard palette (256 colors, 3 bytes per color)
	
	RenderIndexedMode13hFrame();	//transfer frame buffer to screen

}

//************************************************************************************************************************************************************************************************************
function ClearScreenLine(ydest)  //clear a line in destination buffer
{
	if (ydest>199) return;
	let d=ydest*320;
	for (let i=0;i<320;i++) IndexedFrameBuffer[d+i]=0; 
}

//************************************************************************************************************************************************************************************************************
function CopyCheckerboardLineToScreen(ysrc, ydest)  //copy a given checkerboard image line to a given height in destination buffer
{
	if (ydest>199) return;
	if (ysrc>199) return;
	let s=768+16+ysrc*320;
	let d=ydest*320;
	for (let i=0;i<320;i++) IndexedFrameBuffer[d+i]=CHECKERBOARD[s+i];
}

//************************************************************************************************************************************************************************************************************
function CopyCheckerboardLineToBuffer(buffer, ysrc, ydest)  //copy a given checkerboard image line to a given height in destination buffer
{
	if (ydest>199) return;
	if (ysrc>199) return;
	let s=768+16+ysrc*320;
	let d=ydest*320;
	for (let i=0;i<320;i++) buffer[d+i]=CHECKERBOARD[s+i];
}

//***********************************************************************************************************************************************************************************************************
//next part needs a copy of the last rendered checkerboard pixels (in indexed color value)
function RenderLastCheckerBoardForNextPart()
{
	y=Math.floor(Checkerboard_Position/16);	//new checkerboard size
	y1=Math.floor(130+y/2); //top position of checkerboard
	y2=Math.floor(130+y*3/2); //bottom position of checkerboard
	if(y2!=y1) b=(100/(y2-y1));  //size ratio of checkerboard (number of source image lines to skip to reach next  destination line)

	//copy checkerboard lines to screen, skip lines in source to zoom out to correct size
	for (let i=0; i<320*200;i++) LastCHECKERBOARD[i]=0; //clear before filling
	for(c=0,ry=y1;ry<y2;ry++,c+=b) CopyCheckerboardLineToBuffer(LastCHECKERBOARD, Math.floor(c),ry,); //render last checkerboard
}
//***********************************************************************************************************************************************************************************************************
function PartLeave()
{
	srtitle_pixels=null;  //clear part04 data
	srtitle_palette=null; //clear part04 data
}

// Part Interface with main.js
return { init: () => { PartInit(); },   update: () => { PartRenderFrame();},  end: () => { PartLeave();}};

}