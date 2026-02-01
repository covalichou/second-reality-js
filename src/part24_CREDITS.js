
// Credits part, code by  WILDFIRE
// Original part uses VGA Hardware capabilities for scrolling  of images and text:
//   _ mode X start adress (for horizontal scroll of pictures)
//   _VGA line compare function (for vertical scroll of text)

// Nothing special in the implementation, scrolling is achieving by copying the text/images at the correct place with clipping

function CREDITS()
{


    let font_data;    //canva to access font pixels (one byte per pixel value)

    let font_char_width;  // "fonaw" : widt= new Array(256);h of each char in the font image (ordered by Ascii code)
    let font_char_xposition;  // "fonap" : position of each char in the font image  (ordered by Ascii code)
    const font_order="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/?!:,.\"()+-";
    const font_height=32;  //FONAY
    let credits_pal;
    let positions;  //per frame, position of text and picture
    const pics_base64=[PIC01_UH_base64,PIC02_UH_base64,PIC03_UH_base64,PIC04_UH_base64,PIC05_UH_base64,PIC05B_UH_base64,
                       PIC06_UH_base64,PIC07_UH_base64,PIC08_UH_base64,PIC09_UH_base64,PIC10_UH_base64,PIC10B_UH_base64,
                       PIC11_UH_base64,PIC12_UH_base64,PIC13_UH_base64,PIC14_UH_base64,PIC14B_UH_base64,PIC15_UH_base64,
                       PIC16_UH_base64,PIC17_UH_base64,PIC18_UH_base64];
    let credits_pics;
    let CurrentScreen;
    const credits_txt=[
	   ["GRAPHICS - MARVEL","MUSIC - SKAVEN","CODE - WILDFIRE"],
	   ["GRAPHICS - MARVEL","MUSIC - SKAVEN","CODE - PSI","OBJECTS - WILDFIRE"],
	   ["GRAPHICS - MARVEL","MUSIC - SKAVEN","CODE - WILDFIRE","ANIMATION - TRUG"],
	   ["","GRAPHICS - PIXEL"],
       ["GRAPHICS - PIXEL","MUSIC - PURPLE MOTION","CODE - PSI"],
       ["","MUSIC - PURPLE MOTION","CODE - TRUG"],
	   ["","MUSIC - PURPLE MOTION","CODE - PSI"],
	   ["","MUSIC - PURPLE MOTION","CODE - PSI"],
	   ["","GRAPHICS - PIXEL","MUSIC - PURPLE MOTION"],
       ["GRAPHICS - PIXEL","MUSIC - PURPLE MOTION","CODE - TRUG","RENDERING - TRUG"],
	   ["SKETCH - SKAVEN","GRAPHICS - PIXEL","MUSIC - PURPLE MOTION","CODE - PSI"],
       ["SKETCH - SKAVEN","GRAPHICS - PIXEL","MUSIC - PURPLE MOTION","CODE - PSI"],
	   ["","MUSIC - PURPLE MOTION","CODE - WILDFIRE"],
	   ["","MUSIC - PURPLE MOTION","CODE - WILDFIRE"],
	   ["","MUSIC - PURPLE MOTION","CODE - PSI"],
	   ["GRAPHICS - PIXEL","MUSIC - PURPLE MOTION","CODE - TRUG","RENDERING - TRUG"],
	   ["","MUSIC - PURPLE MOTION","CODE - PSI"],
	   ["GRAPHICS - MARVEL","MUSIC - PURPLE MOTION","CODE - PSI"],
	   ["MUSIC - SKAVEN","CODE - PSI","WORLD - TRUG"],		
	   ["GRAPHICS - PIXEL","MUSIC - SKAVEN"],
	   ["GRAPHICS - PIXEL","MUSIC - SKAVEN","CODE - WILDFIRE"]
       ];
//************************************************************************************************************************************************************************************************************


function PartInit()
{
	console.log("PartInit CREDITS");
	

	PartName = "CREDITS";
    PartTargetFrameRate=70;  //originally based on a VGA Mode 13h (320x200@70Hz), but runs at half speed (35 fps)

    //----------------- 


    SetVGAPaletteColor(0,0,0,0);
    IndexedFrameBuffer.fill(0); //clear screen

	init_data();

    CurrentScreen=0;
    RenderIndexedModeFrame320x400(); //transfer frame buffer to screen

}

//************************************************************************************************************************************************************************************************************
//called each time screen has to be updated, time stamp is relative to part start


function PartRenderFrame()
{
		//wait for music sync event to start animation
	if (!IsDisSyncPointReached("CREDITS_START")) 
	{
		ResetPartClock();  //let CurrentAnimationFrame to 0
		return;  //exit function until music point is reached
	}
        
    if (CurrentAnimationFrame<12800)  
    {
        let l=positions.length;
        screenin(Math.floor(CurrentAnimationFrame/l) , CurrentAnimationFrame % l);
          RenderIndexedModeFrame320x400(); 
    } 
	else if (CurrentAnimationFrame<500) //wait with picture displayed 
	{

	}
    else  if (CurrentAnimationFrame<600) 
    {

    } 
    else HasPartEnded=true; 

}

//************************************************************************************************************************************************************************************************************
function screenin(CurrentScreenIndex,CurrentScreenFrame)
{
    let x,y;
    if (CurrentScreenIndex >= credits_txt.length) 
    {
        HasPartEnded=true;  //END part when all screens have been displayed
        return;
    }
    IndexedFrameBuffer.fill(0); //clear screen
    //draw picture
    let textY=positions[Math.floor(CurrentScreenFrame)].textY;
    let picX=positions[Math.floor(CurrentScreenFrame)].picX;
    for(x=0;x<160;x++)  //copy picture to screen buffer (double size in Y), with lateral clipping
        for(y=0;y<100;y++) 
            if (picX+x>=0 && picX+x<320) 
                IndexedFrameBuffer[picX+x+y*2*320]=IndexedFrameBuffer[picX+x+(y*2+1)*320]= credits_pics[CurrentScreenIndex][y*160+x]+16;
        
    //draw texts
    y=160+60+textY;
    for(let text of credits_txt[CurrentScreenIndex])  //for each text
    {
        prtc(160,y,text);
        y+=font_height+10;
    }
    SetVGAPalette(credits_pal[CurrentScreenIndex]);

}

//************************************************************************************************************************************************************************************************************
function init_data()
{
    //decode the font and pictures from base64

    credits_pics=new Array();
    credits_pal= new Array();
    // prepare pictures and palettes and for each "sequence" of the credits part
    for(let i=0;i<pics_base64.length;i++) 
    {   
       credits_pal.push(Base64toArray(pics_base64[i]).slice(16,16+768));    //extract palette  (offset 16 in picture data)
       credits_pics.push(Base64toArray(pics_base64[i]).slice(16+768,160*100+16+768));  //extract picture pixels (offset 16+768 in picture file)
       for (let j=768-16*3-1;j>=0;j--) //move palette entries to make room for the font (index will be shifted when copying pic to vram)
            credits_pal[i][j+16*3]=credits_pal[i][j];  //memmove(&pic1[16*3+16],&pic1[16],768-16*3);
        //modify picture palette to support text
       for(let a=0;a<10;a++) //create a gradient for the font in the picture palette (color index 0..9 for font)
            credits_pal[i][a*3+0]=credits_pal[i][a*3+1]=credits_pal[i][a*3+2]=7*a;
      //  credits_pics[i]= credits_pics[i].slice(16+768,160*100);  //extract picture pixels (offset 16+768 in picture file)
    }
    //prepare font
    init_font();
  
    //prepare positions for screenin
    positions=new Array();
    let y,yy,i,v;
    for(i=0;i<5;i++)    //additional delay
    {
        let pos={ };
        pos.textY=200;
        yy=80+y/106;
        pos.picX= 322;
        positions.push(pos);
    }

    for(y=200*128;y>0;y=Math.floor(y*12/13))  // text and pic position when coming
    {
        let pos={ };
        pos.textY= Math.floor(y/128);
        yy=80+y/106+0;
        pos.picX= Math.floor(yy);
        positions.push(pos);
    }   
    for(i=0;i<200;i++)  // text and pic position are fixed for 200 frmaes
    {
        let pos={ };
        pos.textY= Math.floor(y/128);
        yy=80+y/106;
        pos.picX= Math.floor(yy);
        positions.push(pos);
    }

    for(y=0,v=0;y<128*200;y=y+v,v+=15) // text and pic position when leaving
    {
        let pos={ };
        pos.textY= Math.floor(y/128);
        yy=80-y/106;
        pos.picX= Math.floor(yy);
        positions.push(pos);
    }      
}
//***********************************************************************************************************************************************************************************************************
function prt(x,y,txt)  //print txt at position x,y using the font (x,y is top left of first char)  
{
	let	x2w,x2,y2,y2w,sx;
    y2w=y+font_height;
    let index=0;
	while(index<txt.length)
	{
		x2w=font_char_width[txt.charCodeAt(index)]+x;
		sx=font_char_xposition[txt.charCodeAt(index)];
		for(x2=x;x2<x2w;x2++)
		{
			for(y2=y;y2<y2w;y2++)
				if (y2>=0 && y2<400)
                    IndexedFrameBuffer[x2+y2*320]=font_data[(y2-y)*1500+sx];
			sx++;
		}
		x=x2+2;
		index++;
	}
}
//***********************************************************************************************************************************************************************************************************
function prtc(x,y,txt)  //print centered txt at position x,y using the font (x is center of text)   
{
	let	w=0;
    let index=0;
	while(index<txt.length) w+=font_char_width[txt.charCodeAt(index++)]+2;  //compute length of txt string in pixels
	prt(Math.floor(x-w/2),y,txt); //print centered
	
}
//***********************************************************************************************************************************************************************************************************
function init_font()
{    
    let x;
    let order_index=0;
    font_data=Base64toArray(fona_credits_base64);
//TODO: 256? should be length of font_order?
    font_char_width= new Array(256);  // "fonaw" : width of each char in the font image (ordered by Ascii code)
    font_char_xposition= new Array(256);  // "fonap" : position of each char in the font image  (ordered by Ascii code)    
    for(x=0;x<1500 && order_index<font_order.length;)  //find each char position and width in the font image
	{
		while(x<1500)   //find start of char (first non black column)
		{
			for(y=0;y<font_height;y++) if(font_data[y*1500+x]) break;
			if(y!=font_height) break;
			x++;
		}
		b=x;
		while(x<1500)  //find end of char (next black column)
		{
			for(y=0;y<font_height;y++) if(font_data[y*1500+x]) break;
			if(y==font_height) break;
			x++;
		}
		
		font_char_xposition[font_order.charCodeAt(order_index)]=b;
		font_char_width[font_order.charCodeAt(order_index)]=x-b;
		order_index++;
	}
	font_char_xposition[32]=1500-32;
	font_char_width[32]=8;
}

//***********************************************************************************************************************************************************************************************************
function PartLeave()
{
 //TODO free resources
    font_data=font_char_xposition=font_char_width=null;
    }

// Part Interface with main.js
return { init: () => { PartInit(); },   update: () => { PartRenderFrame();},  end: () => { PartLeave();}};

}