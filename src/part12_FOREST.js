//  'Vuori-Scrolli' (original code by TRUG) (result compiled in MNTSCRL.EXE)
//  Could be translated as "Mountain Scroller"
//  Original code in FOREST folder, which contains code to prepare data, and code in the demo which render the scroller
//  (Main rendering code in MAIN2.PAS and ROUTINES.ASM)

// Displayed text is "ANOTHER WAY TO SCROLL"

// Not a very complex part, most things are pre-computed

function FOREST() 
{

    let O2SCI;   //file containing picture of the text
    let HILLBACK; //file containing background picture and palette 
    let POS;  // array of 3 files containing the destination adress of each scroller picture pixel
    let fbuf; //the picture of the text to scrall
    let fpal,pal; // full palette, and pal with only green leaves remaining
    let hback; //the background picture
    let font; //the picture of the text currently displayed
    let scp; // scroller current position
    let sss; 
    let LastCurrentAnimationFrame1,LastCurrentAnimationFrame2;
    const iscp=133;  //initial scroll position (row in hbuff)
// ******************************************************************************************************************************************************************************************

function PartInit()
{
	PartName = "FOREST";
    PartTargetFrameRate=70;  //originally based on a VGA Mode 13h timing (320x200@70Hz)

	//decode the files stored in base64
	O2SCI= Base64toArray(O2SCI_base64); //21258 bytes
    HILLBACK= Base64toArray(HILLBACK_base64); // 64778 bytes
    POS=new Array(3);  // Destination coordinates of source text pixels (split in 3 interlaced array)
    POS[0]= Base64toArray(POS1_base64); // 25088 bytes
    POS[1]= Base64toArray(POS2_base64); // 25064 bytes
    POS[2]= Base64toArray(POS3_base64); // 25114 bytes

    fbuf= O2SCI.slice(778,30*640+778);   //READP2.PAS:112, fbuf contains full text image 640x30
    for (let x=0;x<fbuf.length;x++) if (fbuf[x]>0) fbuf[x]+=128;
    pal= HILLBACK.slice(10,10+768);
    fpal=HILLBACK.slice(10,10+768);
    hback= HILLBACK.slice(778,64000+778);

    //prepare fpal (palette with only green leaves remaining)
    for (let i=0;i<32*3;i++) fpal[i]=fpal[(128*3)+i]=0;         // fillchar(fpal,32*3,#0); fillchar(fpal[128*3],32*3,#0);

    //prepare initial visible text (scroller starts partially filled)
    font=new Array(237*30); //visible part of scroller image size: 237x30
    font.fill(0);
    for (let x=0;x<30;x++)  //fill scroller row 104  to 237 with beginning ot text picture
        for (i=0;i<237-iscp;i++)  
            font[x*237+(237-iscp)+i]=fbuf[x*640+i];  // for x := 0 to 30 do move(fbuf[x*640],font[x*237+104],133);;

    scp = iscp; // scroller initial position, row number (where to get next scrolling row)
    sss = 0;
    //set palette all black at start
    SetVGAPaletteFadeByInc(pal, 0);  //start frome black palette
    for (let i=0;i<64000;i++) IndexedFrameBuffer[i]=hback[i];
    RenderIndexedMode13hFrame();  //initial pixels set, with black palette
}

//************************************************************************************************************************************************************************************************************
//called by main demo loop each time the screen has to be updated, time stamp is relative to part start
function PartRenderFrame()
{     
 if (IsDisSyncPointReached("FOREST_SCROLL"))
    {
      sss= (sss+1)%3; //sss=0..1..2 (updates data destination, use next third of data)
      scr(sss);   //Update 1/3 of the rows of the scroller (updated rows are interlaced) 
      if (sss==2)   AnimateOneFrame(); //make the scroller progress when all rows updated

        if(!IsDisSyncPointReached("FOREST_FADEOUT")) 
        {   //FADEIN at beginning
            SetVGAPaletteMixPalByInc(fpal,pal,(CurrentAnimationFrame-LastCurrentAnimationFrame1)/128); //slowly fade background in during 128 frames
            LastCurrentAnimationFrame2=CurrentAnimationFrame;
        }  
        else 
        {   //FADEOUT at part end
            SetVGAPaletteFadeByInc(pal, 1-(CurrentAnimationFrame-LastCurrentAnimationFrame2)/63);
            if ((CurrentAnimationFrame-LastCurrentAnimationFrame2)>63) HasPartEnded=true; //end part when faded out is finished (64 frames@70Hz)
        }
    }   
    else if (IsDisSyncPointReached("FOREST_START")) //Part starts by green leaves fade in
	{
		SetVGAPaletteFadeByInc(fpal, CurrentAnimationFrame/63);
        LastCurrentAnimationFrame1=CurrentAnimationFrame;
	}
    else ResetPartClock();  //wait for FOREST_START SIGNAL without counting frames

    RenderIndexedMode13hFrame();
    
   
}

//************************************************************************************************************************************************************************************************************function SetVGAPaletteColor(c,r1,g1,b1)
// Draw one frame
function scr(pos)
{
    let count,indexdest;
    let posindex=0;
    let fontindex=0;
    for (let dx=237*31; dx>0;dx--) //for each pixel of the font area to draw (237 rows,  31  pixel)
    {
        count=Unsigned16FromByteBuffer(POS[pos],posindex);
        posindex+=2;
        if (count!=0) //if 0 then hidden pixel
        {
            for (let i=0;i<count;i++) // text pixel visible, and to be drawn at 1 or mutiple place
            {
                indexdest=Unsigned16FromByteBuffer(POS[pos],posindex);
                posindex+=2;
                let pixelvalue=hback[indexdest] ;  // get background pixel 
                pixelvalue+=font[fontindex];       // add font pixel value 
                IndexedFrameBuffer[indexdest]=pixelvalue;  
            }
        }
        fontindex++;
    }
    
}
//************************************************************************************************************************************************************************************************************function SetVGAPaletteColor(c,r1,g1,b1)
function AnimateOneFrame()
{
    for (let i=0;i<237*31;i++) font[i]=font[i+1]; //scroll entire font buffer 1 row
    for (let ff=0;ff<30;ff++) font[ff*237+236] = fbuf[ff*640+scp]; //fill last row
    if (scp < 639) scp++; //advance source data 1 row until end
  
}


//************************************************************************************************************************************************************************************************************function SetVGAPaletteColor(c,r1,g1,b1)
 //fade palette from black palette to a destination palette, by incrementing luminance until expected level is reached (0=full black,1=full palette)
function SetVGAPaletteMixPalByInc(palettesrc,palettedst, inclevel)  //set palette with a fade to white level (0..1) (1=full white)
{
    for (let i = 0; i < 176; i++) 
	{
		let r=palettesrc[i*3];
		let g=palettesrc[i*3+1];
		let b=palettesrc[i*3+2];
		r= clip(Math.floor(inclevel*63),r,palettedst[i*3]);
		g= clip(Math.floor(inclevel*63),g,palettedst[i*3+1]);
		b= clip(Math.floor(inclevel*63),b,palettedst[i*3+2]);
		SetVGAPaletteColor(i,r,g,b);
	}
}

//************************************************************************************************************************************************************************************************************
function PartLeave()
{
  O2SCI=HILLBACK=POS=null;
  fbuf=pal=fpal=font=hback=null;
}



//************************************************************************************************************************************************************************************************************
// Part Interface with main.js


return { init: () => { PartInit(); },   update: () => { PartRenderFrame();},  end: () => { PartLeave();}};
  

}