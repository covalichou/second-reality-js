//  'LENS' (original code by PSI) (result compiled in LNS&ZOOM.EXE)
// (picture display, see-through bouncing lens , roto zoomer)
// This files includes the port of "part1"  function in original LENS\MAIN.C
// Part1 makes the picture appear with a kind of thunder shaped curtain

function LENS_TRANSITION() 
{

    let LENS_EXB;
    let palette,back;
    let firfade1,firfade2,firfade1a,firfade2a;


// *******************************************<***********************************************************************************************************************************************

function PartInit()
{
	PartName = "LENS_TRANSITION";
    PartTargetFrameRate=70;  //originally based on a VGA Mode 13h timing (320x200@70Hz)

	//decode the files stored in base64
	LENS_EXB= Base64toArray(LENS_EXB_base64); //21258 bytes
    palette= LENS_EXB.slice(16,16+768);
    back= LENS_EXB.slice(16+768,16+768+64000);
 

    firfade1=new Array(200);
    firfade2=new Array(200);
    firfade1a=new Array(200);
    firfade2a=new Array(200);

    for(let b=0;b<200;b++)  //Prepare Part1 computation // TODO comment/clarify
	{
		let a=b;
		firfade1a[b]=Math.floor((19+a/5+4))&(~7);
		firfade2a[b]=Math.floor(-(19+(199-a)/5+4))&(~7);
		firfade1[b]=170*64+(100-b)*50;
		firfade2[b]=170*64+(100-b)*50;
	}
    for (let i=0;i<64000;i++) IndexedFrameBuffer[i]=0; 
    SetVGAPalette(palette);
    RenderIndexedMode13hFrame();  //initial pixels set, with black palette
}

//************************************************************************************************************************************************************************************************************
//called by main demo loop each time the screen has to be updated, time stamp is relative to part start
function PartRenderFrame()
{     

  	if (!IsDisSyncPointReached("LENS_TRANSITION_START")) 
	{
		ResetPartClock();  //let CurrentAnimationFrame to 0
		return;  //exit function until music point is reached
	}

    if (CurrentAnimationFrame<300)    //Part1(); 
    {
        Part1(CurrentAnimationFrame);
    }
    else HasPartEnded=true;
   
}

//************************************************************************************************************************************************************************************************************
function Part1(CurrentFrame)  // effect for picture appearance
{   //TODO comment!
    if(CurrentFrame<80)
    {			
        for(let c=0;c<6;c++)
        {
            let cp=0; //vram
            let dp=0; //back
            for(let y=0;y<200;y++)
            {
                
                x=firfade1[y]>>6;
                IndexedFrameBuffer[cp+x]=back[dp+x];
                x=firfade2[y]>>6;
                IndexedFrameBuffer[cp+x]=back[dp+x];
                firfade1[y]+=firfade1a[y];
                firfade2[y]+=firfade2a[y];
                cp+=320;
                dp+=320;
            }
        }
    }
    RenderIndexedMode13hFrame();
}



//************************************************************************************************************************************************************************************************************
function PartLeave()
{
    LENS_EXB= palette= back=null;
    firfade1=firfade2=firfade1a=firfade2a=null;
}



//************************************************************************************************************************************************************************************************************
// Part Interface with main.js


return { init: () => { PartInit(); },   update: () => { PartRenderFrame();},  end: () => { PartLeave();}};
  

}