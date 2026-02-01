//  'LENS' (original code by PSI) (result compiled in LNS&ZOOM.EXE)
// (bouncing see-through crystal ball)
// This files includes the port of  "part2" function in original LENS\MAIN.C

// Part2 shows a bouncing lens, you can see the distorted background picture through the lens

// This implementation uses the original data set, which was build with x86 optimisations in mind,
// This makes the lens rendering a bit more complex (splitting pixels processing in group)
// Another approach would use a lens image and the lenscalc function from LENS\CALC.C to compute, for each lens pixel the coordinates of the src pixel in the background image) 
// (this is done in sr-port, with an implementation using OpenGL shader )

// See through color blending is managed through palette: background use only color from 0 to 63
// The 3 remaining 64 colors block are used for storing colors as seen through the lens.  
// Pixels seen trough lens are backgroung pixels written with a OR mask to modulate the color.

function LENS_LENS() 
{

    let LENS_EXB;
    let LENS_EX;
    let palette,back;
    let lenswid,lenshig;
    let lensxs,lensys;
    let fade2;
    let x,y,xa,ya,firstbounce;  //used for lens path computation

// *******************************************<***********************************************************************************************************************************************

function PartInit()
{
	PartName = "LENS_LENS";
    PartTargetFrameRate=70;  //originally based on a VGA Mode 13h timing (320x200@70Hz)

	//decode the files stored in base64
	LENS_EXB= Base64toArray(LENS_EXB_base64); //21258 bytes
    palette= LENS_EXB.slice(16,16+768);
    back= LENS_EXB.slice(16+768,16+768+64000);
    
    LENS_EX=new Array(5);
    LENS_EX[0]= Base64toArray(LENS_EX0_base64);
    LENS_EX[1]= Base64toArray(LENS_EX1_base64);
    LENS_EX[2]= Base64toArray(LENS_EX2_base64);
    LENS_EX[3]= Base64toArray(LENS_EX3_base64);
    LENS_EX[4]= Base64toArray(LENS_EX4_base64);
    
    lenswid=Unsigned16FromByteBuffer(LENS_EX[0],0);
    lenshig=Unsigned16FromByteBuffer(LENS_EX[0],2);
    lensxs=lenswid/2; 
	lensys=lenshig/2;

    let cp=4;  // cp=lensex0+4;
    // Build palette, based on background image palette
    // palette[ 63..127]=>mix background palette with lens color 1
    // palette[128..191]=>mix background palette with lens color 2
    // palette[192..255]=>mix background palette with lens color 3
    for(let i=1;i<4;i++) // i=lens color 
	{  
		let r=LENS_EX[0][cp++];  //lens palette color 1..3
		let g=LENS_EX[0][cp++];
		let b=LENS_EX[0][cp++];
		for(let a=0;a<64*3;a+=3)  //mix 64 colors of background with current Lens color
		{
			palette[a+i*64*3+0]=clip(r+palette[a+0],0,63);   
			palette[a+i*64*3+1]=clip(g+palette[a+1],0,63);   
			palette[a+i*64*3+2]=clip(b+palette[a+2],0,63);   
		}	
	}

    fade2=new Array (20000);

    // Create 32  versions of our background seen through lens palette (index 64..255)
    // first version (x=0) is fully opaque , 31th version is translucent
    cp=0;
	for(x=0;x<32;x++)
	{
		for(y=64*3;y<256*3;y++)
		{
			a=y%(64*3);
			a=(palette[y]-palette[a]*(31-x)/31);
			fade2[cp++]=a;
		}
	}
    
    //Prepare Part2 computation
    x=65*64;
	y=-50*64;
	xa=ya=64;
    firstbounce=1;

    for (let i=0;i<64000;i++) IndexedFrameBuffer[i]=back[i];
    SetVGAPalette(palette);
    RenderIndexedMode13hFrame();  //initial pixels set, with black palette
}
//************************************************************************************************************************************************************************************************************
//called by main demo loop each time the screen has to be updated, time stamp is relative to part start
function PartRenderFrame()
{     
   	if (!IsDisSyncPointReached("LENS_BOUNCE")) 
	{
		ResetPartClock();  //let CurrentAnimationFrame to 0
		return;  //exit function until music point is reached
	}
    if ( (CurrentAnimationFrame<1000)    && (!IsDisSyncPointReached("LENS_ROTO")) )  // toDO ADAPT ANIMATION SPEED TO REFRESH RATE
    {      
        Part2(CurrentAnimationFrame);
    }
    else HasPartEnded=true;
}

//************************************************************************************************************************************************************************************************************
function Part2(CurrentFrame)  //Boucing see-through lens
{
    
    if(CurrentFrame<96)  //lens appears dark then becomes brighter
    {
        a=Math.floor((CurrentFrame-32)/2);
        if(a<0) a=0;
        SetVGAPaletteArea(fade2,a*3*192,64,192); //progressively reduce opacity in the lens palette  
    }
    for (let i=0;i<64000;i++) IndexedFrameBuffer[i]=back[i];
    DrawLens(Math.floor(x/64),Math.floor(y/64));
    //update lens position:
    x+=xa; y+=ya;
    if(x>256*64 || x<60*64) xa=-xa;
    if(y>150*64 && CurrentFrame<600) 
    {
        y-=ya;
        if(firstbounce)
        {
            ya=-ya*2/3;
            firstbounce=0;
        }
        else ya=-ya*9/10;
    }
    ya+=2;

    RenderIndexedMode13hFrame();
}

//************************************************************************************************************************************************************************************************************
function DrawLens(x0,y0)
{

    let	y,ys,ye;
	let u1,u2;

	u1=(x0-lensxs)+(y0-lensys)*320;  //top of lens lensxs=lenswid/2;
	u2=(x0-lensxs)+(y0+lensys-1)*320;//bottom of lens
	ys=Math.floor(lenshig/2);
	ye=lenshig-1;
    for(y=0;y<ys;y++)
	{
		if(u1>=0 && u1<=64000) //top half of lens
		{
			dorow (LENS_EX[1],u1,y,0x40);     //color index range  64..127, lens cental part
			dorow2(LENS_EX[2],u1,y,0x80);     //color index range 128..191, lens reflection
			dorow2(LENS_EX[3],u1,y,0xC0);     //color index range 192..255, lens brighter reflection
			dorow3(LENS_EX[4],u1,y);
		}
		u1+=320;
		if(u2>=0 && u2<=64000) //bottom half of lens (symetry)
		{
			dorow (LENS_EX[1],u2,ye-y,0x40);  //color index range  64..127, lens cental part
			dorow2(LENS_EX[2],u2,ye-y,0x80);  //color index range 128..191, lens reflection 
			dorow2(LENS_EX[3],u2,ye-y,0xC0);  //color index range 192..255, lens brighter reflection
			dorow3(LENS_EX[4],u2,ye-y);
		}
		u2-=320;
	}
}

////***********************************************************************************************************************************************************************************************************
// this function reads a lensex1 buffer and draws the associated pixels (central part of the lens)
// lensex1 contains data to generate pixels of the central area of the lens (lens consists of a border, a central area, a reflect area, each area has its own color) 
// lensex1 is an array describing segment of consecutive horizontal pixels (central part of the lens has many consecutive pixels of the same color)
// By design, lensex1 contains only one segment per destination horizontal line 
// Original dorow function is an optimised assembly code, which limits the memory access, adress and loop computations. lensex1 structure has been build to allow these optimisations
// A segment in lensex1 is described as follow:
// _ First part of the array contains the list of the segment, each segment  in this list is described by 2 16 bits word):
//        _ First 16 bits word: index (address in lensex1), of the segment data
//        _ Second 16 bits word: number of pixels in the segment
// _ Segment data:
//   _ First 16 bits word of segment data gives a base adress: 
//        _ This BaseAdress is the adress of the first pixels in destination frame buffer (adress is relative to lens position)
//        _ of background picture pixels (relative to lens position)
//   _ Following 16 bits words provide adress of each pixels in background picture (relative to BaseAdress)
//   (all adress in segment data are signed as, for a given destination pixel, the source pixel to apply can be on any direction (top,bottom, left, right)    

// Transparency is managed through Palette construction and PixelMask (Background image pixels are ORed with mask to get the see-through effect)
function dorow( lensex1_buffer, LensPositionAdress, CurrentY, PixelMask )
{
    let DestAdress,SourceAdress,BaseAdress;
    let SegmentDataIndex= Unsigned16FromByteBuffer(lensex1_buffer,CurrentY*4);  //rowDescriptorPtr  :start coordinate
    let NPixels= Unsigned16FromByteBuffer(lensex1_buffer,CurrentY*4+2);//rowDescriptorPtr+2 :number of pixels
    
    if (NPixels>0) 
    {
        BaseAdress= LensPositionAdress+Signed16FromByteBuffer(lensex1_buffer,SegmentDataIndex);  //base dest  pixel adress (depending of lens position)
        SegmentDataIndex+=2;
        DestAdress=BaseAdress;
    
        for (let i=0;i<NPixels;i++)
        {
            SourceAdress= BaseAdress+Signed16FromByteBuffer(lensex1_buffer,SegmentDataIndex);  // adress of source pixel
            SegmentDataIndex+=2;
            IndexedFrameBuffer[DestAdress]=back[SourceAdress] | PixelMask; //write pixel to destination, with the mask to get the see-through color change
            DestAdress++;       //next destination pixel is consecutive
        }
    }
}
////***********************************************************************************************************************************************************************************************************
// dorow2 uses same concept as dorow1, it manages individual pixels in a row instead of consecutive pixels
// In original code it's a bit less optimised in term of memory access (need to read source and destination for each pixel)
// less pixels fall  in this category (mostly pixels drawing the reflect in the lens)
function dorow2( lensex2_buffer, LensPositionAdress, CurrentY, PixelMask )
{

    let DestAdress,SourceAdress,BaseAdress;
    let PixelDataIndex= Unsigned16FromByteBuffer(lensex2_buffer,CurrentY*4);  //rowDescriptorPtr  :start coordinate
    let NPixels= Unsigned16FromByteBuffer(lensex2_buffer,CurrentY*4+2);//rowDescriptorPtr+2 :number of pixels
    
    if (NPixels>0) 
    {
        BaseAdress= LensPositionAdress+Signed16FromByteBuffer(lensex2_buffer,PixelDataIndex);  //base src  pixel adress (depending of lens position), DI in @@3 loop
        PixelDataIndex+=2;
        DestAdress=BaseAdress;
    
        for (let i=0;i<NPixels;i++)
        {
            SourceAdress= BaseAdress+Signed16FromByteBuffer(lensex2_buffer,PixelDataIndex+2);  // adress of source pixel
            DestAdress= BaseAdress+Signed16FromByteBuffer(lensex2_buffer,PixelDataIndex);
            PixelDataIndex+=4;
            IndexedFrameBuffer[DestAdress]=back[SourceAdress] | PixelMask; //write pixel to destination, with the mask to get the see-through color change
        }
    }
}


//************************************************************************************************************************************************************************************************************
//dorow3: similar function as dorow and dorow2. Used to directly copy pixels from the background
//data in the lensex1_buffer, just contain the list of pixels to copy
// It is used to copy background pixels that are surrounding the lens in order to clear previous lens drawing (which is supposed to be in the same area)
function dorow3( lensex3_buffer, LensPositionAdress, CurrentY)
{
    let DestAdress,SourceAdress,BaseAdress;
    let SegmentDataIndex= Unsigned16FromByteBuffer(lensex3_buffer,CurrentY*4);  //rowDescriptorPtr  :start coordinate
    let NPixels= Unsigned16FromByteBuffer(lensex3_buffer,CurrentY*4+2);//rowDescriptorPtr+2 :number of pixels
    
    if (NPixels>0) 
    {
        BaseAdress= LensPositionAdress+Signed16FromByteBuffer(lensex3_buffer,SegmentDataIndex);  //base dest  pixel adress (depending of lens position)
        SegmentDataIndex+=2;
        DestAdress=BaseAdress;
    
        for (let i=0;i<NPixels;i++)
        {
            SourceAdress= BaseAdress+Signed16FromByteBuffer(lensex3_buffer,SegmentDataIndex);  // adress of source pixel
            SegmentDataIndex+=2;
            IndexedFrameBuffer[SourceAdress]=back[SourceAdress] ; //write pixel to destination

        }
    }
}

//************************************************************************************************************************************************************************************************************
function PartLeave()
{
    LENS_EXB=LENS_EX=null;
    palette=back=null;
}



//************************************************************************************************************************************************************************************************************
// Part Interface with main.js


return { init: () => { PartInit(); },   update: () => { PartRenderFrame();},  end: () => { PartLeave();}};
  

}