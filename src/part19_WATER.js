//  'Peilipalloscroll (TRUG)' (original code by TRUG) (result compiled in RAYSCRL.EXE)
//  Could be translated as "Mirror ball scroller" 
//  Original code in WATER folder, which contains code to prepare data, and code in the demo which render the scroller
//  (Main rendering code in DEMO.PAS and ROUTINES.ASM)

// Not a very complex part, most things are pre-computed
// Part is very similar to "FOREST" part : 
//  The only significant change is in the assembly pixel writing:
//  in FOREST text is blended with background ("add" instruction in the putrouts function to mix background pixels with scroll), 
//  here sword image pixels are copied in a direct write ("mov" instruction instead of "add")


function WATER() 
{

    
    let POS;  // array of 3 files containing the destination adress of each scroller picture pixel
    let fbuf; //the picture of the text to scrall
    let pal; // full palette, and faded current pal 
    
    let font; //the picture of the text currently displayed
    let scp; // scroller current position
    let sss; 
    let LastCurrentAnimationFrame1,LastCurrentAnimationFrame2;
    
    
// ******************************************************************************************************************************************************************************************

function PartInit()
{
	PartName = "WATER";
    PartTargetFrameRate=70;  //originally based on a VGA Mode 13h timing (320x200@70Hz)

	//decode the files stored in base64
	let MIEKKA= Base64toArray(MIEKKA_SCI_base64); // 14778  bytes ; sword picture and palette
    let BKG_CLX= Base64toArray(BKG_CLX_base64); // 64778  bytes  , background picture and palette
    POS=new Array(3);  // Destination coordinates of source text pixels (split in 3 interlaced array)
    POS[0]= Base64toArray(WAT1_base64); // 23096  bytes
    POS[1]= Base64toArray(WAT2_base64); // 23034 bytes
    POS[2]= Base64toArray(WAT3_base64); // 27818 bytes

    fbuf= new Array(158*34);
    fbuf.fill(0);
    pal= MIEKKA.slice(10,10+768);


    font=MIEKKA.slice(10+768,10+768+400*34);  //sword
    tausta= BKG_CLX.slice(778,64000+778);

    for (let i=0;i<64000;i++) IndexedFrameBuffer[i]=tausta[i];  // copy background to screen

  
    scp = 0; //scroller position
    sss = 0;
    SetVGAPaletteFadeByInc(pal, 0);  //start frome black palette, will fade in later
    RenderIndexedMode13hFrame();  //initial pixels set, with black palette
}

//************************************************************************************************************************************************************************************************************
//called by main demo loop each time the screen has to be updated, time stamp is relative to part start
function PartRenderFrame()
{     
    if (IsDisSyncPointReached("WATER_SCROLL")) 
    {
      sss= (sss+1)%3; //sss=0..1..2 (updates data destination, use next third of data)
      scr(sss);   //Update 1/3 of the rows of the scroller (updated rows are interlaced) 
      if (sss==2)   AnimateOneFrame(); //make the scroller progress when all rows updated

        if(IsDisSyncPointReached("WATER_FADEOUT")) 
        {   //FADEOUT at part end
            SetVGAPaletteFadeByInc(pal, 1-(CurrentAnimationFrame-LastCurrentAnimationFrame2)/63);
            if ((CurrentAnimationFrame-LastCurrentAnimationFrame2)>63) HasPartEnded=true; //end part when faded out is finished (64 frames@70Hz)
        }
        else LastCurrentAnimationFrame2=CurrentAnimationFrame; // note frame where for fadeout signal occurs
    }   
    else if (IsDisSyncPointReached("WATER_START")) //Part starts by green leaves fade in
	{
        SetVGAPaletteFadeByInc(pal, CurrentAnimationFrame/63);
        LastCurrentAnimationFrame1=CurrentAnimationFrame;
	} 
    else ResetPartClock();  //wait for WATER_START SIGNAL without counting frames

    RenderIndexedMode13hFrame();
    
   
}

//************************************************************************************************************************************************************************************************************function SetVGAPaletteColor(c,r1,g1,b1)
// Draw one frame
function scr(pos)
{
    let count,indexdest;
    let posindex=0;
    let fontindex=0;
    let pixelvalue;
    for (let dx=158*34; dx>0;dx--) //for each pixel of the font area to draw (237 rows,  31  pixel)
    {
        count=Unsigned16FromByteBuffer(POS[pos],posindex);
        posindex+=2;
        if (count!=0) //if 0 then hidden pixel
        {
            for (let i=0;i<count;i++) // text pixel visible, and to be drawn at 1 or mutiple place
            {
                indexdest=Unsigned16FromByteBuffer(POS[pos],posindex);
                posindex+=2;
                pixelvalue=fbuf[fontindex];       // sword pixel value
                if (pixelvalue==0) pixelvalue=tausta[indexdest] ;  // no sword content: get background pixel 
                IndexedFrameBuffer[indexdest]=pixelvalue;  
            }
        }
        fontindex++;
    }
    
}
//************************************************************************************************************************************************************************************************************function SetVGAPaletteColor(c,r1,g1,b1)
function AnimateOneFrame()
{
    for (let i=0;i<fbuf.length-1;i++) fbuf[i]=fbuf[i+1]; //scroll entire sword buffer 1 row
    for (let x= 0; x<33;x++) fbuf[158+x*158] = font[x*400+scp]; //copy 1 row of the sword at the end of the buffer
    if (scp < 390) scp++; //advance source data 1 row until end
  
}


//************************************************************************************************************************************************************************************************************
function PartLeave()
{
    POS=fbuf=pal=font=tausta=null;
} 



//************************************************************************************************************************************************************************************************************
// Part Interface with main.js


return { init: () => { PartInit(); },   update: () => { PartRenderFrame();},  end: () => { PartLeave();}};
  

}