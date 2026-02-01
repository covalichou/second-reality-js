// ALKU: intro part, code by WILDFIRE
//This part is divided in two sub parts:
// 1st, it draws static  text on a black background using a font stored in "fona" picture and fade in / fade out,  Each letter has its own width.
// 2nd, it still draws and fade in and out static text but over a scrolling background picture (64 colors in backgroupd pictures)
// Antialiasing of text is taken in account ("alpha blending"). Text is using a palette with 3 levels of gray for each color ( index 1,2,3) 
// Originally Uses tweaked VGA mode 13h to get a 320x400 256 colors modes 
// Some more optimisation for scrolling the background exist in original source code, but not relevant here

// here the implementation is simpler: everything is redrawn each frame

//original source code https://github.com/mtuomi/SecondReality/tree/master/ALKU

// original tite  'Alkutekstit I'  which means  or "opening credits 1"



function ALKU()
{


//************************************************************************************************************************************************************************************************************
//internal variables kept between frames
let hzpic_pix;  //global (will be accessed by next parts)

let font_data;    //canva to access font pixels (one byte per pixel value)


let font_char_width= new Array(256);  // "fonaw" : width of each char in the font image (ordered by Ascii code)
let font_char_xposition= new Array(256);  // "fonap" : position of each char in the font image  (ordered by Ascii code)

let SequenceStartFrame;
let CurrentSequence;
let TextFadeLevel;
let BackgroundFadeLevel;
let ScrollsequenceStart;

let palette;  //palette for the background only () text faded out)
let palette2;  //palette for the text and background, (text faded in)
let blackpalette;  //black palette for black background (text faded out)

const background_scroll_speed=7.8 /70 ;  //speed of landscape scrolling (7.8 pixels per second at 70Hz, so 7.8/70 pixels per frame)
const backgroundFadeinDuration=128;  //duration of landscape fade in (in frames @70Hz) 
const textfadeduration= 64;  // 64 frames (@70Hz)  // duration of fade in/out for text sequence 
const textdurationbeforefadeout= 300 + textfadeduration; //duration of text before fading out (300 frames + 64 frames for fade in) (without landscape)
const textdurationbeforefadeout2= 200+ textfadeduration; //duration of text before fading out (200 frames + 64 frames for fade in) (with landscape)
const font_size_x=1500;
const font_size_y=30;


//************************************************************************************************************************************************************************************************************
function PartInit()
{
	PartName = "ALKU";
    PartTargetFrameRate=70;  //originally based on a VGA Mode 13h frame rate(@70Hz)
    //----------------- 
    font_char_width= new Array(256);  // "fonaw" : width of each char in the font image (ordered by Ascii code)
    font_char_xposition= new Array(256);  // "fonap" : position of each char in the font image  (ordered by Ascii code)
    palette =new Array(768);  //palette for the background only () text faded out)
    palette2=new Array(768);  //palette for the text and background, (text faded in)
    blackpalette = new Array(768);  //black palette for black background (text faded out)	
	init_font();
	hzpic_pix=Base64toArray(hzpic_base64);  //load the background picture
	background_scroll=0;
	CurrentSequence=0;
	TextFadeLevel=0;
	IndexedFrameBuffer.fill(0); //clear frame buffer
	init_palettes()  
}


//************************************************************************************************************************************************************************************************************
//called each time screen has to be updated, time stamp is relative to part start

function PartRenderFrame()
{
	let f=CurrentAnimationFrame
	switch (CurrentSequence)
	{
		case 0:    //first sequence, display black background and wait for next text
			SetVGAPalette(blackpalette);  //set the palette for the hzpic image (3*256 bytes of 0..63 rgb values)	
			display_black_background();
			if (IsDisSyncPointReached("ALKU_TEXT1")) EndSequence();  //wait with black screen, sync to music progress
			break;
		case 1:	 // first text fade in /out
			display_black_background();
			textFadeInFadeout(f, SequenceStartFrame,SequenceStartFrame+textdurationbeforefadeout,textfadeduration );
			prtc(160,120,"A");
			prtc(160,160,"Future Crew");
			prtc(160,200,"Production");
			if (IsDisSyncPointReached("ALKU_TEXT2")) EndSequence();  //wait with black screen, sync to music progress
			break;
		case 2: // next text fade in /out
			display_black_background();
			textFadeInFadeout(f, SequenceStartFrame,SequenceStartFrame+textdurationbeforefadeout,textfadeduration );
			prtc(160,160,"First Presented");
			prtc(160,200,"at Assembly 93");
			if (IsDisSyncPointReached("ALKU_TEXT3")) EndSequence();
			break;
	
		case 3: // next text fade in /out
			display_black_background();
			textFadeInFadeout(f, SequenceStartFrame,SequenceStartFrame+textdurationbeforefadeout,textfadeduration );
			prtc(160,120,"in");
			prtc(160,160,"[");  //Dolby Logo
			prtc(160,179,"]");
			if (IsDisSyncPointReached("ALKU_LANDSCAPE")) EndSequence();
			break;
		
		case 4:  //start fading in the scrolling background and a bit later text fadein/out
			ScrollsequenceStart=SequenceStartFrame;
			backgroundFadein(f,SequenceStartFrame,backgroundFadeinDuration);  //fade in background over 250 frames
			display_scrolling_background(f,ScrollsequenceStart);
			//if (f>=SequenceStartFrame+250+475) EndSequence();  //wait for background fade in to end
			if (IsDisSyncPointReached("ALKU_TEXT4")) EndSequence();
			break;
		
		case 5:
			display_scrolling_background(f,ScrollsequenceStart);
			textFadeInFadeout(f, SequenceStartFrame,SequenceStartFrame+textdurationbeforefadeout2,textfadeduration );
			prtc(160,150,"Graphics");
			prtc(160,190,"Marvel");
			prtc(160,230,"Pixel");	
			if (IsDisSyncPointReached("ALKU_TEXT5")) EndSequence();
			break;
		
		case 6: // next text fade in /out (with scrolling background)
			display_scrolling_background(f,ScrollsequenceStart);
			textFadeInFadeout(f, SequenceStartFrame,SequenceStartFrame+textdurationbeforefadeout2,textfadeduration );
			prtc(160,150,"Music");
			prtc(160,190,"Purple Motion");
			prtc(160,230,"Skaven");
			if (IsDisSyncPointReached("ALKU_TEXT6")) EndSequence();
			break;

		case 7: // next text fade in /out (with scrolling background)
			display_scrolling_background(f,ScrollsequenceStart);
			textFadeInFadeout(f, SequenceStartFrame,SequenceStartFrame+textdurationbeforefadeout2,textfadeduration );
			prtc(160,130,"Code");
			prtc(160,170,  "Psi");
			prtc(160,210, "Trug");
			prtc(160,248, "Wildfire");
			if (IsDisSyncPointReached("ALKU_TEXT7")) EndSequence();
			break;

		case 8: // next text fade in /out (with scrolling background)
			display_scrolling_background(f,ScrollsequenceStart);
			textFadeInFadeout(f, SequenceStartFrame,SequenceStartFrame+textdurationbeforefadeout2,textfadeduration );
			prtc(160,150,"Additional Design");
			prtc(160,190, "Abyss");
			prtc(160,230, "Gore");
			
			break;
		default: 
			break;
	}
    if (IsDisSyncPointReached("ALKU_EXIT")) HasPartEnded=true;
	RenderIndexedModeFrame320x400();  //render the frame buffer to the screen
}


//************************************************************************************************************************************************************************************************************
function textFadeInFadeout(f, FadeInFrame,FadeOutFrame,FadeDuration)  //manage a text fade in and fade out sequence
{
	//console.log("textFadeInFadeout f="+f+" FadeInFrame="+FadeInFrame+" FadeOutFrame="+FadeOutFrame+" FadeDuration="+FadeDuration);
	if ((f<FadeInFrame)) SetVGAPalette(palette);	//Before fade in: no text, use "palette"
	else if (between(f,FadeInFrame,FadeInFrame+FadeDuration)) //fadein in progress: no text, use "palette"
	{
		TextFadeLevel= clip ( (f-FadeInFrame) / FadeDuration, 0, 1);
		SetVGAPaletteMixPalette(palette, palette2,TextFadeLevel);  //progessively use "palette2" to fade in text
	}
	else if (between(f,FadeInFrame+FadeDuration,FadeOutFrame)) SetVGAPalette(palette2);	// text at full level (ensure text is displayed at full brightness level)
	else if (between(f,FadeOutFrame,FadeOutFrame+FadeDuration)) //fadeout in progress:/progessively use "palette" to fade out text
	{
		TextFadeLevel= clip ( (f-FadeOutFrame) / FadeDuration, 0, 1);
		SetVGAPaletteMixPalette(palette2, palette,TextFadeLevel);  //progessively go back  to "palette"
	}
	else SetVGAPalette(palette);  //after fade out, no text, use "palette" (ensure text is set to full black)
}

//************************************************************************************************************************************************************************************************************
function backgroundFadein(t, FadeStartFrame,FadeDuration)
{
	if (between(t,FadeStartFrame,FadeStartFrame+FadeDuration))
	{
		BackgroundFadeLevel= clip(  (t-FadeStartFrame) / FadeDuration, 0, 1);
		SetVGAPaletteMixPalette(blackpalette,palette, BackgroundFadeLevel);  
	}
}
//************************************************************************************************************************************************************************************************************
function EndSequence()
{
	CurrentSequence++;
	SequenceStartFrame=CurrentAnimationFrame ;
}
//************************************************************************************************************************************************************************************************************
function display_scrolling_background(t, StartFrame)
{
	if (t<StartFrame) return;
	background_scroll= (t-StartFrame)*background_scroll_speed; 
	if (background_scroll>320) background_scroll=320;

	for (let yy=0; yy<200; yy++)  //draw the scrolling picture line by line
		for (let xx=0; xx<320; xx++)  //draw the line pixel by pixel
		{
			let index_pixel= hzpic_pix[xx+Math.floor(background_scroll)+yy*part01_hzpic_size_x];  //get pixel value from background image
			if (index_pixel!=0)  //if not transparent
			{
				IndexedFrameBuffer[xx+(yy*2+50)*320]= index_pixel;  //draw pixel in the frame buffer
				IndexedFrameBuffer[xx+(yy*2+50+1)*320]= index_pixel;  //draw pixel in the frame buffer (double height)
			}
		}	
}

//************************************************************************************************************************************************************************************************************
function display_black_background()
{
	for (let yy=0; yy<200; yy++)  //draw the scrolling picture line by line
		for (let xx=0; xx<320; xx++)  //draw the line pixel by pixel
		{
			IndexedFrameBuffer[xx+(yy*2+50)*320]= 0;  //draw pixel in the frame buffer
			IndexedFrameBuffer[xx+(yy*2+50+1)*320]= 0;  //draw pixel in the frame buffer (double height)
		}	
}
//************************************************************************************************************************************************************************************************************
//display txt string at x,y with the fona font
function prt(x,y, txt)  //original code: line 24
{
	let x2=x;
	
	for (let txt_index = 0; txt_index < txt.length  ; txt_index++)  
	{
		let char_to_draw= txt.charCodeAt(txt_index);
		let char_width=font_char_width[char_to_draw];
		let char_x=font_char_xposition[char_to_draw];
		let char_height=font_size_y;
		if (char_to_draw==91) char_height=19;  //specific to dolby logo upper part (to avoid overlapping, visible when fading using alpha blending)

		for (let yy=0; yy<char_height; yy++)  //draw the char line by line
			for (let xx=0; xx<char_width; xx++)  //draw the line pixel by pixel
			{
				let pixel_value=font_data[char_x+xx+(yy*font_size_x)]; 
				if (pixel_value!=0)  //if not transparent
					IndexedFrameBuffer[(x2+xx)+(y+yy)*320] |= font_data[char_x+xx+(yy*font_size_x)];  //write with a OR to allow alpha blending by palette mixing
			}
		x2=x2+char_width+2;

	}
}
//************************************************************************************************************************************************************************************************************
//display a text string at y, centered around x
function prtc(x,y, txt)  //original code: line 45
{
	let w=0;  //compute in w the width of the string to draw
	for (let txt_index = 0; txt_index < txt.length  ; txt_index++)   //for each char in the string
	{
		let char_to_draw= txt.charCodeAt(txt_index);  //get char ascii code
		let char_width=font_char_width[char_to_draw];
		w=w+char_width+2;  
	}
	
	xdest=x-Math.floor(w/2);
	prt(xdest,y,txt);
}

//************************************************************************************************************************************************************************************************************
function init_palettes()  
{
	//MAIN.C:161 //memcpy(palette,hzpic+16,768);
	for (let i = 0; i < 768; i++) 
		palette[i] = hzpic_pal[i];
	
	//MAIN.C:184
	let a,y;
	// create 3 other palette version when antialised text has to be mixed with background
	for(y=0;y<768;y+=3)	//Blend picture palette with antialised levels of text, to get correct text anti aliasing. ()
	{
		if(y<64*3)  //background only
		{
		palette2[y+0]=palette[y+0];
		palette2[y+1]=palette[y+1];
		palette2[y+2]=palette[y+2];
		}
		else if(y<128*3)  //text color index 1 mixed with background 
		{
			palette2[y+0]=Math.floor((palette[0x1*3+0])+palette[y%(64*3)+0]*(63-palette[0x1*3+0])/63);
			palette2[y+1]=Math.floor((palette[0x1*3+1])+palette[y%(64*3)+1]*(63-palette[0x1*3+1])/63);
			palette2[y+2]=Math.floor((palette[0x1*3+2])+palette[y%(64*3)+2]*(63-palette[0x1*3+2])/63);
		}
		else if(y<192*3) //text color index 2 mixed with background 
		{
			palette2[y+0]=Math.floor((palette[0x2*3+0])+palette[y%(64*3)+0]*(63-palette[0x2*3+0])/63);
			palette2[y+1]=Math.floor((palette[0x2*3+1])+palette[y%(64*3)+1]*(63-palette[0x2*3+1])/63);
			palette2[y+2]=Math.floor((palette[0x2*3+2])+palette[y%(64*3)+2]*(63-palette[0x2*3+2])/63);
		}
		else if(y<256*3) //text color index 3 mixed with background
		{
			palette2[y+0]=Math.floor((palette[0x3*3+0])+palette[y%(64*3)+0]*(63-palette[0x3*3+0])/63);
			palette2[y+1]=Math.floor((palette[0x3*3+1])+palette[y%(64*3)+1]*(63-palette[0x3*3+1])/63);
			palette2[y+2]=Math.floor((palette[0x3*3+2])+palette[y%(64*3)+2]*(63-palette[0x3*3+2])/63);
		}
	}

	for(a=192;a<768;a++) palette[a]=palette[a-192];
	blackpalette.fill(0);  //black palette useful when landscape is fading in (without text)
}


//************************************************************************************************************************************************************************************************************
function init_font()
{

	// (font data is stored as 30 lines of 1500 pixels, one byte per pixel (possible values are 0,1,2,3)
	font_data=Base64toArray(fona1_inc_base64);
	for (let index = 0; index < font_data.length  ; index++) //original code MAIN.C:169
	{
			let new_value
			switch(font_data[index])   //adapt the font to work with OR combining (for palette mixing to fade in/out)
			{
				case 1: new_value= 0x40; break;
				case 2 : new_value=0x80; break ;
				case 3: new_value= 0xC0;  break;
				default: new_value=0;
			}
			font_data[index]=new_value;    

		}	
	
		// Then  recover each character position and width in the font, by finding black columns (original source code line 161)
		// two last chars are for the "dolby" logo
		
		const font_order="ABCDEFGHIJKLMNOPQRSTUVWXabcdefghijklmnopqrstuvwxyz0123456789!?,.:$#()+-*='[]" ;
		let current_char_index_in_font=0;
		let current_char_in_font=font_order.charCodeAt(current_char_index_in_font);
		x=0;
		while (x<font_size_x)
		{
			
			b=FindNextNonBlackColumnFromX(x);    //Find beginning of char
			x=FindNextBlackColumnFromX(x+1);  //find end of char
			
			current_char_in_font=font_order.charCodeAt(current_char_index_in_font);
			font_char_xposition[current_char_in_font]=b;
			font_char_width[current_char_in_font]=x-b;  
			current_char_index_in_font++;
		}
		
		font_char_xposition[32]=1500-20; //handle space char (original source code line 181, but modified with updated font
		font_char_width[32]=16; //handle space char  (original source code line 182)
}

//************************************************************************************************************************************************************************************************************
// return the X position of next non empty (black) column in font
function FindNextNonBlackColumnFromX(xstart)
{
	x=xstart;
	while (x<font_size_x)
	{
		if (!IsFontColumnBlack(x)) return x;
		x++;
	}
	return ; //returns undefined
}
//************************************************************************************************************************************************************************************************************
// return the X position of next empty (black) column in font
function FindNextBlackColumnFromX(xstart)
{
	x=xstart;
	while (x<font_size_x)
	{
		if (IsFontColumnBlack(x)) return x;
		x++;
	}
	return ; //returns undefined
}
//************************************************************************************************************************************************************************************************************
// return true if the column x of the font is black (used for character position detection)
function IsFontColumnBlack(x)
{
	for (let index = 0; index < font_size_y ; index++) 
	{
		if ( font_data[x + index*font_size_x] !=0) return false;
	}
	return true;
}

//************************************************************************************************************************************************************************************************************
function PartLeave() 
{
	font_data=font_char_xposition=font_char_width=null;
	palette=palette2=blackpalette=null;	
}

// Part Interface with main.js
return { init: () => { PartInit(); },   update: () => { PartRenderFrame();},  end: () => { PartLeave();}};
  
}