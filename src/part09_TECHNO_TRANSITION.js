//TECHNO PART
// Original code in TECHNO folder
// Original code by PSI

// This part has several sequences. This file implements the short sequence to manage flash and vertical bars synced to music
//Original part  uses a 320x200 16 color planar mode

function TECHNO_BARS_TRANSITION() 
{


//************************************************************************************************************************************************************************************************************
//internal variables kept between frames
let SavedPal=new Array(16);
let prev_dis_sync,ts_dis_sync_change;
let BarClear=new Array(20);
const FirstBarSyncPoint=16;  //first bar sync point (dis_sync==16) 4 bars to clear, 0..3  
//************************************************************************************************************************************************************************************************************

function PartInit()
{
	PartName = "Techno Bars Transition";
    PartTargetFrameRate=70;  //originally based on a VGA Mode 13h (320x200@70Hz)
    prev_dis_sync=-1;
    ts_dis_sync_change=-1;

    //BarClear: table giving line quantity to clear at each frame (bar are progressively cleared with acceleration (same thing done in KOE.C:288, but we do it only once)
    let zy=0; zya=0; 
    for(a=0;a<BarClear.length;a++)   //bar clearing occurs in 20 frames
	{
			zya++;      //increase bar clear speed for next iteration
			zy+=zya;    //quantity to clear
            BarClear[a]=clip(zy,0,199);  //max 200 lines to clear
    }

 
    flash(-1); //save initial palette
  }



//************************************************************************************************************************************************************************************************************
//called by main demo loop each time the screen has to be updated, time stamp is relative to part start

function PartRenderFrame()
{     
    let s=dis_sync();  //TODO CLEAN this?
    if (s!=prev_dis_sync)  ts_dis_sync_change=CurrentTimestamp;
    prev_dis_sync=s;
    let cb=GetCurrentBar();  //according to sync events get which bar we need to anime

    if  (cb==-1)  //Initial flash at part start
    {
        let level=clip(Math.floor(CurrentTimestamp/(4*1000/PartTargetFrameRate)*256),0,256);  //initial flash occurs during 4 frames at 70Hz (from min flash level to max)
        if (level>=256)  //when picture full white, prepare palette and pixels to do the blue picture
        {
            for(a=0;a<16;a++)
            {
                SavedPal[a]={};
                SavedPal[a].r=a*6/2;
                SavedPal[a].g=a*7/2;
                SavedPal[a].b=a*8/2;
            }
            for (i=0;i<64000;i++) IndexedFrameBuffer[i]=15;  //frame buffer full blue (when flash will become uneffective)
        }
        flash(level); 
    }  
    else if ((cb>=0) && (cb<=3)) //manage the 4 bars according to sync points (sync points are set on music beat)
    {
        //decreasing flash for first 8 frames@70 Hz
        let ts= CurrentSyncPointTime; // Timestamp-ts_dis_sync_change;
        flash(256-clip(Math.floor(ts/(8*1000/PartTargetFrameRate)*256),0,256));    //flash occurs during 8 frames at 70Hz (from max flash level to min)
        let Nframe=Math.floor( ts*PartTargetFrameRate/1000);    // Current "original 70 Hz" frame number (0..19) of the bar clearing
        let NpixelsToClear=BarClear[clip(Nframe,0,BarClear.length-1)];
        ClearBar(cb,NpixelsToClear);  //progressively erase current bar
        
    }
     
    if (IsDisSyncPointReached("TECHNO_BAR_FINAL_FLASH"))  //one more flash after the 4 bars
    {
        //increasing flash for last 4 frames@70 Hz
        let ts= CurrentTimestamp-ts_dis_sync_change;
        flash(clip(Math.floor(ts/(4*1000/PartTargetFrameRate)*256),0,256));    //final flash occurs during 4 frames at 70Hz (from min flash level to max)
        if (ts>(4*1000/PartTargetFrameRate))  //then end part
            HasPartEnded=true;
    }

    RenderIndexedMode13hFrame();

}

//************************************************************************************************************************************************************************************************************
function GetCurrentBar()
{
    if (IsDisSyncPointReached("TECHNO_BAR_END")) return   4;
    else if (IsDisSyncPointReached("TECHNO_BAR4")) return 3;
    else if (IsDisSyncPointReached("TECHNO_BAR3")) return 2;
    else if (IsDisSyncPointReached("TECHNO_BAR2")) return 1;
    else if (IsDisSyncPointReached("TECHNO_BAR1")) return 0;
    else return -1; 
}

//************************************************************************************************************************************************************************************************************
function ClearBar(bar,level)  //x =0..3 : bar 1 to 4,  level: 0 bar remains full, 200 bar is fully black
{
   // console.log("ClearBar bar="+bar+" level="+level);
    for (let y=0;y<level;y++)
        for (x=bar*80;x<(bar+1)*80;x++)
            IndexedFrameBuffer[y*320+x]=0;
    
}
//************************************************************************************************************************************************************************************************************
function flash(fadelevel)  //Original code in KOE.C:  -1: save current palette, 0..256: mix saved  palette with full white palette (0: keep original palette 256: fade to full white)
{


    //if (flash!=0) console.log("flash "+fadelevel);
	if(fadelevel==-1)     //Get current palette (first 16 colors only)
	{
        for (i=0;i<16;i++)
            SavedPal[i]=GetVGAPaletteColor(i);
	}
	else if ((fadelevel>=0) && (fadelevel<=256))
	{
		j=256-fadelevel;
		for(a=0;a<16;a++)
        {
            let r= Math.floor((SavedPal[a].r*j+63*fadelevel)>>8);
            let g= Math.floor((SavedPal[a].g*j+63*fadelevel)>>8);
            let b= Math.floor((SavedPal[a].b*j+63*fadelevel)>>8);
            SetVGAPaletteColor(a, r,g,b);
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