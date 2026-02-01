// JPLOGO Part "Jellypic" (Code by PSI)
// Original source code in JPLOGO folder
// Original code  in C + assembly for graphic loop

// Resolution 320x400

// Animation is in two parts, first part is a vertical scroll of the image
// 2nd part is a bouncing "jelly" effect applied to the image

// In original code 1st part is done with hardware scroll register
// 2nd part is done with a pre-generated assembly code taking in accound all the line possible horizontal size

// Implementation here is simplified, no hardware scroll, and line zooming is done on the fly.

// Here Line size/bounce computation is done with same code as original.

// TODO sync start to music


function JPLOGO() 
{
    let palette;
    let sin1024;
 
    let	framey1;
    let	framey2;
    let	framey1t;
    let	framey2t;
    let	lasty;
    let	lasts;
    let row;
	let scrollpos
	
//************************************************************************************************************************************************************************************************************
function PartInit()
{
	PartName = "JPLOGO";
    PartTargetFrameRate=70;  //originally based on a VGA Mode 13h timing (320x200@70Hz)
    //-----------
    sin1024 = new Array (1024);
    for (let angle=0;angle<1024;angle++) sin1024[angle]= Math.floor( 255 * Math.sin(angle/1024*2*Math.PI) );
  

    

	let ysz=400*16; 
    let ysza=-460/6;
	let y=0;
	let y1=0;
    let y1a=500;
	let y2=399*16; 
    let y2a=500;
	let mika=1;
    let halt=0;
    let a,b,c,d,la;
	let scrolly, scrollyspd;


    framey1=new Array(200);
    framey2=new Array(200);
	for(let frame=0;frame<200;frame++) //compute parameters for each frame
	{	
		if(!halt)
		{
			y1+=y1a;
			y2+=y2a;
	
			y2a+=16;
			if(y2>400*16)
			{
				y2-=y2a;
				y2a=-y2a*mika/8;
				if(mika<4) mika+=3;
			}
	
			y1a+=16;
			
			la=a;
			a=(y2-y1)-400*16;
			if((a&0x8000)^(la&0x8000))
			{
				y1a=y1a*7/8;
			}
			y1a+=a/8;
			y2a-=a/8;
		}
		
		if(frame>90) 
		{
			if(y2>=399*16) 
			{
				y2=400*16;
				halt=1;
			}
			else y2a=8;
			y1=y2-400*16;
		}

		framey1[frame]=Math.floor(y1);
		framey2[frame]=Math.floor(y2);
	}
    framey1t=new Array(800);
    framey2t=new Array(800);
	for(a=0;a<800;a++)
	{
		b=Math.floor(a/4);
		c=a&3;
		d=3-c;
		framey1t[a]=Math.floor((framey1[b]*d+framey1[b+1]*c)/3);
		framey2t[a]=Math.floor((framey2[b]*d+framey2[b+1]*c)/3);
	}

    let ICEKNGDM_UP= Base64toArray(ICEKNGDM_UP_base64);
	palette=new Array(768);
	readp(palette,-1,ICEKNGDM_UP);
    palette[64*3+0]=0;
	palette[64*3+1]=0;
	palette[64*3+2]=0;
	//let rowbuf=new Array(640);

    row=new Array(400);  //image divided in rows
    let rowbuf=new Array(320);
    for(y=0;y<400;y++)  //read row with additional tweaking
	{
		row[y]=new Array(186); 
        row[y].fill(0);
        readp(rowbuf,y,ICEKNGDM_UP);
        for (let x=0;x<186;x++) row[y][x]=rowbuf[x+70]; 
        row[y][184]=65;
        for(b=0;b<184;b++) if(row[y][b]==0) row[y][b]=64;
    
	}
    lasty=new Array(400);
    lasts=new Array(400);
    for(y=0;y<400;y++) lasty[y]=lasts[y]=-1;
    scrolly=400;
	scrollyspd=64;
	scrollpos=new Array()
	while (scrolly>0)  //pre-compute vertical scroll positions with acceleration (easier to adapt to frame rate)
	{
		scrolly-=scrollyspd/64;
		scrollyspd+=6;
		if (scrolly<0) scrolly=0;
		scrollpos.push(Math.floor(scrolly));

	}

	IndexedFrameBuffer.fill(0);


    SetVGAPalette(palette);
    RenderIndexedModeFrame320x400();  //initial pixels set, with black palette
}

//************************************************************************************************************************************************************************************************************
//called by main demo loop each time the screen has to be updated, time stamp is relative to part start
function PartRenderFrame()
{     
    if (CurrentAnimationFrame<scrollpos.length)  //first part, vertical scroll
	{
		let yy=scrollpos[Math.floor(CurrentAnimationFrame)];
		for(y=0;y<400;y++)
		{
			if ((y-yy>0) && (y-yy<400)) linezoom((y-yy)*320,row[y],184);

		}
		
	}	
	else if (CurrentAnimationFrame<700+scrollpos.length)
	//else if (CurrentAnimationFrame<20+scrollpos.length) //TODO RACCOURCI pour travail transition to REMOVE
 	{
/*		if(*shiftstatus&16) setborder(0);
		c=waitb();
		if(*shiftstatus&16) setborder(127);*/	
		let frame=Math.floor(CurrentAnimationFrame)-scrollpos.length;
		if(frame>511) c=400;   //TODO c ??
		else 
		{
			y1=Math.floor(framey1t[frame]/16);
			y2=Math.floor(framey2t[frame]/16);
		}
		xsc=(400-(y2-y1))/8;
		for(y=0;y<400;y++)
		{
			if(y<y1 || y>=y2)
			{
				linezoom(y*320,0,0);
			}
			else 
			{
				b=Math.floor((y-y1)*400/(y2-y1));
				a=184+(sin1024[Math.floor(b*32/25)]*xsc+32)/64;
				a&=~1;
				if(lasty[y]!=b || lasts[y]!=a)
				{
					linezoom(y*320,row[b],a);
					lasty[y]=b;
					lasts[y]=a;
				}
			}
		}
    }
	else HasPartEnded=true; //end of part

    RenderIndexedModeFrame320x400();  
    
}
//************************************************************************************************************************************************************************************************************
function linezoom(dest,source , size)
{
	if (size==0)  for (let x=0;x<320;x++) IndexedFrameBuffer[dest+x]=0; //clear line if size
	else
	{
		// zoom in /out (nearest neighbor)
		let halfsize=Math.floor(size/2);
		let firstx= 160- halfsize;
		let lastx= 160 + halfsize;
		let Increment= 186/(lastx-firstx);
		let currentX=0;
		let x;
		//clear remaining pixels from previous frame
		for (x=47;x<firstx;x++) IndexedFrameBuffer[dest+x]=0; //clear left side
		for (x=lastx+1;x<320-48;x++) IndexedFrameBuffer[dest+x]=0; //clear right side
		for (x=firstx;x<=lastx;x++) //draw zoomed pixels
		{
			IndexedFrameBuffer[dest+x]=source[Math.floor(currentX)];
			currentX+= Increment;
		}

	}
}
//************************************************************************************************************************************************************************************************************
function PartLeave()
{
	palette=sin1024=framey1=framey2=framey1t=framey2t=lasty=lasts=row=null;
}

//************************************************************************************************************************************************************************************************************
// Part interface with main.js


return { init: () => { PartInit(); },   update: () => { PartRenderFrame();},  end: () => { PartLeave();}};
  

}