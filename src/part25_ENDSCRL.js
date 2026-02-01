// Ending scroller, original code in ENDSCRL folder

// Published source code differs from final release
// I took the font from the Conspiracy Win32 port (guys extracted the data from final release, this can be done using DOSBOX debugger or unpacking the EXE then reverse with Ghidra)

// original part uses hardware scrolling

function ENDSCRL()
{


    let font_data;    //canva to access font pixels (one byte per pixel value)

    let font_char_width;  // "fonaw" : widt= new Array(256);h of each char in the font image (ordered by Ascii code)
    let font_char_xposition;  // "fonap" : position of each char in the font image  (ordered by Ascii code)
    const font_order=`ABCDEFGHIJKLMNOPQRSTUVWXabcdefghijklmnopqrstuvwxyz0123456789!?,.:""()+-*='Z„”Y/&`;
    const font_height=25; // "FONAY"
   
	
	let line,yscrl;
	let	tstart,chars,tptr;
	let textline;
	let scanbuf;

	let PreviousAnimationFrame;
   
   
//************************************************************************************************************************************************************************************************************


function PartInit()
{
	console.log("PartInit ENDSCRL");
	
    
    
	PartName = "ENDSCRL";
    PartTargetFrameRate=35;  // 70Hz / 2 (dis_waitb() called twice before scroll update)

    //----------------- 
	line=yscrl=0;
	tstart=chars=tptr=0;
	scanbuf=new Array(640);
	textline=new Array(100);


    SetVGAPaletteColor(0,0,0,0);
	SetVGAPaletteColor(1,0,0,0);
	SetVGAPaletteColor(20,20,20);
	SetVGAPaletteColor(2,40,40,40);
	SetVGAPaletteColor(3,60,60,60);
	SetVGAPaletteColor(4,60,60,60);
	SetVGAPaletteColor(5,60,60,60);
	SetVGAPaletteColor(6,60,60,60);
	SetVGAPaletteColor(7,60,60,60);
	SetVGAPaletteColor(8,60,60,60);
	SetVGAPaletteColor(9,60,60,60);
	SetVGAPaletteColor(10,60,60,60);
	SetVGAPaletteColor(11,60,60,60);
	SetVGAPaletteColor(12,60,60,60);
	SetVGAPaletteColor(13,60,60,60);
	SetVGAPaletteColor(14,60,60,60);
	SetVGAPaletteColor(15,60,60,60);    
    IndexedFrameBuffer_640.fill(0); //clear screen
    

	init_font();
	PreviousAnimationFrame=CurrentAnimationFrame

    RenderIndexedModeFrame640x400(); //transfer frame buffer to screen

}

//************************************************************************************************************************************************************************************************************
//called each time screen has to be updated, time stamp is relative to part start


function PartRenderFrame()
{


   
		for (let i=PreviousAnimationFrame; i<Math.floor(CurrentAnimationFrame);i++) do_scroll();
        RenderIndexedModeFrame640x400(); 
		PreviousAnimationFrame=Math.floor(CurrentAnimationFrame);

}

//***********************************************************************************************************************************************************************************************************
function do_scroll()
	{

	let a,b,c,x,y,m;

	//scroll one line up:
	for (let i=0;i<399*640;i++)
		IndexedFrameBuffer_640[i]=IndexedFrameBuffer_640[i+640];

	if(line==0)  //new line of text, first compute width to center the line
	{
		
		for(a=0,tstart=0,chars=0;text[tptr]!='\n';a++,chars++)
		{
			textline[a]=text.charCodeAt(tptr++);
			tstart+=font_char_width[textline[a]]+2;
		}
		textline[a]=text.charCodeAt(tptr++);
		tstart=Math.floor((639-tstart)/2);  //center text
		if (textline[0]=='[')
		{
			chars = 0;
		}
	}
	
	scanbuf.fill(0);

	for(a=0,x=tstart;a<chars;a++,x+=2)
		for(b=0;b<font_char_width[textline[a]];b++,x++)
		{
			scanbuf[x] = font_data[line*1550+font_char_xposition[ textline[a]]+b];
	
		}
	for (i=0;i<640;i++) IndexedFrameBuffer_640[i+399*640]=scanbuf[i]; //fill bottom line
	
	yscrl=(yscrl+1)%401; //TODO REMOVE

	// --- W32 PORT CHANGE (decompiled from final) --- (Based on CONSPIRACY WIN32 PORT)
	if (textline[0]=="[".charCodeAt(0))
	{
		let height = (textline[1]-"0".charCodeAt(0))*10+(textline[2]-"0".charCodeAt(0));
		line=(line+1)%height;
	}
	else
	{
		line=(line+1)%font_height;
	}
	

	// --- W32 PORT CHANGE (decompiled from final) --- (Based on CONSPIRACY WIN32 PORT)
	if (String.fromCharCode(textline[0])=='%')
	{
		HasPartEnded=true;
	}
	

	/*  //check font content:  //TODO REMOVE
	for (x=0;x<500;x++)
		for(y=0;y<font_height;y++) IndexedFrameBuffer_640[x+y*640]=font_data[y*1550+x];

	for (x=0;x<500;x++)
		for(y=0;y<font_height;y++) IndexedFrameBuffer_640[x+(y+50)*640]=font_data[y*1550+x+500];

	for (x=0;x<550;x++)
		for(y=0;y<font_height;y++) IndexedFrameBuffer_640[x+(y+100)*640]=font_data[y*1550+x+1000];
*/
	}
//***********************************************************************************************************************************************************************************************************
//TODO REMOVE
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
                    IndexedFrameBuffer_640[x2+y2*640]=font_data[(y2-y)*1550+sx];
			sx++;
		}
		x=x2+2;
		index++;
	}
}

//***********************************************************************************************************************************************************************************************************
function init_font()
{    
    let x;
    let order_index=0;
    font_data=Base64toArray(endscrl_font_base64);
    font_char_width= new Array(256);  // "fonaw" : width of each char in the font image (ordered by Ascii code)
    font_char_xposition= new Array(256);  // "fonap" : position of each char in the font image  (ordered by Ascii code)

    for(x=0;x<1550 && order_index<font_order.length;)  //find each char position and width in the font image
	{
		while(x<1550)   //find start of char (first non black column)
		{
			for(y=0;y<font_height;y++) if(font_data[y*1550+x]) break;
			if(y!=font_height) break;
			x++;
		}
		b=x;
		while(x<1550)  //find end of char (next black column)
		{
			for(y=0;y<font_height;y++) if(font_data[y*1550+x]) break;
			if(y==font_height) break;
			x++;
		}
		
		font_char_xposition[font_order.charCodeAt(order_index)]=b;
		font_char_width[font_order.charCodeAt(order_index)]=x-b;
		order_index++;
	}
	font_char_xposition[32]=1550-20;  //space char
	font_char_width[32]=16; //space char
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