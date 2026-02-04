
// Part 22 U2E : 'Vector Part II'  (3D city fly over) (code by PSI)
// Uses the "U2" 3D engine (here source code files start with u2, original code is in VISU and VISU\C folder)
//Original part coded by PSI


function U2E()
{

    let prev_palette;
    let Last3DAnimFrame;


//************************************************************************************************************************************************************************************************************

function PartInit()
{
	console.log("PartInit U2E");
	

	PartName = "U2E";
    PartTargetFrameRate=70/2;  //originally based on a VGA Mode 13h (320x200@70Hz), but runs at half speed (35 fps) 

    //----------------- 
	
	resetsceneU2();


	load_data_u2e();
	

	ClippingY	=	[25,174+1] ;	 //TODO check why+1 needed (polygons clipped early?)
	

	cp=scene0.slice(16,16+768); 
//	SetVGAPalette(cp);
    //adjust cp for transition with previous part
    cp[255*3+0]=0;cp[255*3+1]=0;cp[255*3+2]=0;
	cp[252*3+0]=0;cp[252*3+1]=0;cp[252*3+2]=0;
	cp[253*3+0]=63;cp[253*3+1]=63;cp[253*3+2]=63;
	cp[254*3+0]=63;	cp[254*3+1]=63;	cp[254*3+2]=63;

    //get palette from previous part
    prev_palette=new Array(768);
    for (let i=0;i<256;i++)
        {
            let c=GetVGAPaletteColor(i)
            prev_palette[i*3+0]=c.r;
            prev_palette[i*3+1]=c.g;
            prev_palette[i*3+2]=c.b;
        }
}



//************************************************************************************************************************************************************************************************************
function load_data_u2e()
{
	load_data_u2(U2E_00M_base64,U2E_DataFiles,U2E_0AB_base64);
}

//************************************************************************************************************************************************************************************************************
//adapt picture for transition 
function fadeset()
{
    let  x,y;
    const left=68;
    const right=256-3;
    //when seeking from another part, force 4 corners black
    for(y=0;y<25;y++)   //when seeking from another part, force top corners black
    {
	    for( x=0;x<left;x++) IndexedFrameBuffer[x+y*320]=0;
        for( x=right;x<320;x++) IndexedFrameBuffer[x+y*320]=0;
    }

    for(y=0;y<25;y++)   //top band of previous part picture is white but will become black
	    for( x=left;x<right;x++) IndexedFrameBuffer[x+y*320]=252;

    for(y=25;y<175;y++)
    {
        for( x=0;x<left;x++) IndexedFrameBuffer[x+y*320]=254; //left band of previous part picture will become white
        for (x=left;x<right;x++) IndexedFrameBuffer[x+y*320]=253;  //central  part of picture will remain white
        for( x=right;x<320;x++) IndexedFrameBuffer[x+y*320]=254; //right band of previous part picture will become white
    }

    for(y=175;y<200;y++)  //bottom band of previous part picture will become black
	    for( x=left;x<right;x++) IndexedFrameBuffer[x+y*320]=252;
    
    for(y=175;y<200;y++)   //when seeking from another part, force low corners black
    {
	    for( x=0;x<left;x++) IndexedFrameBuffer[x+y*320]=0;
        for( x=right;x<320;x++) IndexedFrameBuffer[x+y*320]=0;
    }


    prev_palette.fill(0); //all black palette except color 252,253 white
    prev_palette[252*3]=63; prev_palette[252*3+1]=63; prev_palette[252*3+2]=63; //color 252 white
    prev_palette[253*3]=63; prev_palette[253*3+1]=63; prev_palette[253*3+2]=63; //color 253 white
}
//************************************************************************************************************************************************************************************************************

//called each time screen has to be updated, time stamp is relative to part start
function PartRenderFrame()
{
	
	//wait for music sync event to start animation
	if (!IsDisSyncPointReached("U2E_START")) 
	{
		ResetPartClock();  //let CurrentAnimationFrame to 0
		return;  //exit function until music point is reached
	}
    
    if (IsDisSyncPointReached("U2E_END"))  HasPartEnded=true;
    else if (IsDisSyncPointReached("U2E_FINALFADE"))
    {
        if (CurrentAnimationFrame*2-Last3DAnimFrame*2<16) //final fade to white
        {
            let level= clip((CurrentAnimationFrame*2-Last3DAnimFrame*2)/16,0,1);
            SetVGAPaletteFadeToWhite(cp, level,true); //fade to white in 16 frames
            RenderIndexedMode13hFrame();
        }
    }
    else if (IsDisSyncPointReached("U2E_ANIM")) //3D animation
    {
        if (!animation_end)
        {

            SetVGAPalette(cp);
        
            //clear screen area
            for (let yy=ClippingY[0]*320; yy<ClippingY[1]*320; yy+=320)
                for (let x=0; x<320; x++ )
                    IndexedFrameBuffer[x+yy]=0;

            for (let i=0; (i<AnimationFramesToRender) && (!animation_end);i++) StepOneAnimationFrame();

            RenderFrameU2();   // 3D engine will render the frame (draw all polygons)
            RenderIndexedMode13hFrame();	//transfer frame buffer to screen
        }
        Last3DAnimFrame=CurrentAnimationFrame;
    }
    else //inital transition from previous part
    {
        if (CurrentAnimationFrame*2<33) //fade previous part to white in 33  frames@70hz
        {
            SetVGAPaletteFadeToWhite(prev_palette, Math.floor(CurrentAnimationFrame)/33,false); //fade to white in 33 frames
            RenderIndexedModeFrame320x400();  //transition with previous JELLY/JPLOGO part which 320x400 mode
        }
        else  if (CurrentAnimationFrame*2<33+16) //update image for next part (nothing visible due to palette) and wait
        {
            fadeset();
            SetVGAPalette(prev_palette);
            RenderIndexedMode13hFrame(); //seamless transtion from previous part, from 320x400 mode to 320x200
        }
        else if (CurrentAnimationFrame*2<33+16+32) //fade to new picture to remove top/down white zone, and make left right white zone appear
        {
            let lev= (CurrentAnimationFrame*2-(33+16)) /32;
            prev_palette[252*3]=prev_palette[252*3+1]=prev_palette[252*3+2]= clip (Math.floor(63-lev*63),0,63); //color 252 becomes black
            prev_palette[254*3]=prev_palette[254*3+1]=prev_palette[254*3+2]= clip (Math.floor(lev*63),0,63); //color 252 becomes white
            SetVGAPalette(prev_palette);
            RenderIndexedMode13hFrame();     
        }
    }        
}


//***********************************************************************************************************************************************************************************************************
function PartLeave()
{
    resetsceneU2();
}

//************************************************************************************************************************************************************************************************************
// Part Interface with main.js
return { init: () => { PartInit(); },   update: () => { PartRenderFrame();},  end: () => { PartLeave();}};
 
}