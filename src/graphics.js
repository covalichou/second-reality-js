

//Global variables, can be used by all part to render graphics on screen

let OffScreenBuffer;
let imageData;
let imageDatabuf;
let imageDatabuf8;
let imageDatabuf32;
let IndexedFrameBuffer;

let OffScreenBuffer_640;
let imageData_640;
let imageDatabuf_640;
let imageDatabuf8_640;
let imageDatabuf32_640;
let IndexedFrameBuffer_640;

let CurrentRGBAPalette;




//************************************************************************************************************************************************************************************************************
function InitGraphics()
{

    OffScreenBuffer=new canvas(320,400,"",true);
    imageData=OffScreenBuffer.contex.getImageData(0, 0, OffScreenBuffer.width, OffScreenBuffer.height);
    imageDatabuf = new ArrayBuffer(imageData.data.length);
    imageDatabuf8 = new Uint8ClampedArray(imageDatabuf);
    imageDatabuf32= new Uint32Array(imageDatabuf);
    imageDatabuf32.fill(0);  // initial frame buffer black
    CurrentRGBAPalette=new Array (768);
    CurrentRGBAPalette.fill(0);  // initial palette black
    IndexedFrameBuffer=new Array(64000*2); // 320x400 indexed pixels (often used in 320x200 mode 13h)

    OffScreenBuffer_640=new canvas(640,400,"",true);
    imageData_640=OffScreenBuffer_640.contex.getImageData(0, 0, OffScreenBuffer_640.width, OffScreenBuffer_640.height);
    imageDatabuf_640 = new ArrayBuffer(imageData_640.data.length);
    imageDatabuf8_640 = new Uint8ClampedArray(imageDatabuf_640);
    imageDatabuf32_640= new Uint32Array(imageDatabuf_640);
    imageDatabuf32_640.fill(0);  // initial frame buffer black
    IndexedFrameBuffer_640=new Array(640*400); // 640x400 indexed pixels (for ending scroller)

} 

//************************************************************************************************************************************************************************************************************
// Update one color of current palette (CurrentRGBAPalette), input range for rgb is VGA range (0..63)
function SetVGAPaletteColor(c,r1,g1,b1)
{
    const k= 4.048; //ratio to convert from VGA 0..63 range to RGBA 0..255 range (4.048=255/63)
    let r2=clip(Math.floor(r1*k),0,255);
    let g2=clip(Math.floor(g1*k),0,255);
    let b2=clip(Math.floor(b1*k),0,255);
    CurrentRGBAPalette[c]=  255<<24 | b2<<16  | g2 <<8 | r2 << 0 ; // 32 bits RGBA (big endian)
}
//************************************************************************************************************************************************************************************************************
//return VGA palette RGB values for one color of current palette
function GetVGAPaletteColor(c)
{
    const k= 4.048;
    let result={};
    let val= CurrentRGBAPalette[c];
    result.r=Math.floor(  (val & 0x000000FF) /k);
    result.g=Math.floor( ((val & 0x0000FF00) >> 8)  /k);
    result.b=Math.floor( ((val & 0x00FF0000) >> 16) /k);
    return result;
}


//************************************************************************************************************************************************************************************************************function SetVGAPaletteColor(c,r1,g1,b1)
function SetVGAPalette(palette)
{
    for (let i=0;i<256;i++) SetVGAPaletteColor(i,palette[i*3],palette[i*3+1],palette[i*3+2]);
}


//************************************************************************************************************************************************************************************************************function SetVGAPaletteColor(c,r1,g1,b1)
 //set palette with a fade to white level (0..1) (1=full white)
function SetVGAPaletteFadeToWhite(palette768, whitefadelevel, SetColor0=true) 
{   
    let start=0;
    if (!SetColor0) start=1;  // skip color 0
    for (let i = start; i < 256; i++) 
	{
		let r=palette768[i*3];
		let g=palette768[i*3+1];
		let b=palette768[i*3+2];
		r= clip(Math.floor(whitefadelevel*63+(1-whitefadelevel)*r),0,63);
		g= clip(Math.floor(whitefadelevel*63+(1-whitefadelevel)*g),0,63);
		b= clip(Math.floor(whitefadelevel*63+(1-whitefadelevel)*b),0,63);
		SetVGAPaletteColor(i,r,g,b);
	}
}

//************************************************************************************************************************************************************************************************************function SetVGAPaletteColor(c,r1,g1,b1)
 //set palette with a fade to black level (0..1) (1=full black)
function SetVGAPaletteFadeToBlack(palette768, blackfadelevel, SetColor0=true) 
{   
    let start=0;
    let level=1-blackfadelevel
    if (!SetColor0) start=1;  // skip color 0
    for (let i = start; i < 256; i++) 
	{
		let r=palette768[i*3];
		let g=palette768[i*3+1];
		let b=palette768[i*3+2];
		r= clip(Math.floor(level*r),0,63);
		g= clip(Math.floor(level*g),0,63);
		b= clip(Math.floor(level*b),0,63);
		SetVGAPaletteColor(i,r,g,b);
	}
}


//************************************************************************************************************************************************************************************************************function SetVGAPaletteColor(c,r1,g1,b1)
function SetVGAPaletteMixPalette(palette768_1, palette768_2, mixlevel)  //interpolate between two palettes (0..1) (mixlevel 0=palette768_1 only, 1.0=palette768_2 only)
{
    let r,g,b;
    for (let i = 0; i < 256; i++) 
	{
		let r1=palette768_1[i*3];
		let g1=palette768_1[i*3+1];
		let b1=palette768_1[i*3+2];
        let r2=palette768_2[i*3];
		let g2=palette768_2[i*3+1];
		let b2=palette768_2[i*3+2];
		r= clip(Math.floor(mixlevel*r2+(1-mixlevel)*r1),0,63);
		g= clip(Math.floor(mixlevel*g2+(1-mixlevel)*g1),0,63);
		b= clip(Math.floor(mixlevel*b2+(1-mixlevel)*b1),0,63);
		SetVGAPaletteColor(i,r,g,b);
	}
}

//************************************************************************************************************************************************************************************************************function SetVGAPaletteColor(c,r1,g1,b1)
 //fade palette from black palette to a destination palette, by incrementing luminance until expected level is reached (0=full black,1=full palette)
function SetVGAPaletteFadeByInc(palette768, inclevel)
{
    for (let i = 0; i < 256; i++) 
	{
		let r=palette768[i*3];
		let g=palette768[i*3+1];
		let b=palette768[i*3+2];
		r= clip(Math.floor(inclevel*63),0,r);
		g= clip(Math.floor(inclevel*63),0,g);
		b= clip(Math.floor(inclevel*63),0,b);
		SetVGAPaletteColor(i,r,g,b);
	}
}

//************************************************************************************************************************************************************************************************************function SetVGAPaletteColor(c,r1,g1,b1)
 //fade palette by substracting an offset  (1.0=full decrementation 0=no decrementation)
function SetVGAPaletteFadeByDec(palette768, declevel)  
{
    for (let i = 0; i < 256; i++) 
	{
		let r=palette768[i*3];
		let g=palette768[i*3+1];
		let b=palette768[i*3+2];
		r= clip(Math.floor(r-declevel*63),0,r);
		g= clip(Math.floor(g-declevel*63),0,g);
		b= clip(Math.floor(b-declevel*63),0,b);
		SetVGAPaletteColor(i,r,g,b);
	}
}

//************************************************************************************************************************************************************************************************************function SetVGAPaletteColor(c,r1,g1,b1)
function SetVGAPaletteArea(palette768,start_array_index, start_color, length) //partially apply a palette (used in LENS)
{
    for (let i = 0; i < length; i++)
    {
		let r=palette768[start_array_index+i*3];
		let g=palette768[start_array_index+i*3+1];
		let b=palette768[start_array_index+i*3+2];
		SetVGAPaletteColor(start_color+i,r,g,b);
	}
}


//************************************************************************************************************************************************************************************************************
// Convert 320x200 indexed buffer to RGBA buffer, and transfer to screen
function RenderIndexedMode13hFrame(FrameBuffer = IndexedFrameBuffer)
{   
    for (let i=0;i<64000;i++) imageDatabuf32[i]=CurrentRGBAPalette[FrameBuffer[i]];
    RenderRGBABufferToScreen320x200();
}


//************************************************************************************************************************************************************************************************************
// Convert 320x134 indexed buffer to RGBA buffer, and transfer to screen
function RenderIndexedModeFrame320x134(FrameBuffer = IndexedFrameBuffer)
{   
    for (let i=0;i<42880;i++) imageDatabuf32[i]=CurrentRGBAPalette[FrameBuffer[i]];
    RenderRGBABufferToScreen320x134();
}

//************************************************************************************************************************************************************************************************************
// Convert 640x400 indexed buffer to RGBA buffer, and transfer to screen
function RenderIndexedModeFrame640x400()
{
    for (let i=0;i<640*400;i++) imageDatabuf32_640[i]=CurrentRGBAPalette[IndexedFrameBuffer_640[i]];
    RenderRGBABufferToScreen640x400();
}

//************************************************************************************************************************************************************************************************************
// Convert 320x400 indexed buffer to RGBA buffer, and transfer to screen
function RenderIndexedModeFrame320x400()
{
    for (let i=0;i<64000*2;i++) imageDatabuf32[i]=CurrentRGBAPalette[IndexedFrameBuffer[i]];
    RenderRGBABufferToScreen320x400();
}
//************************************************************************************************************************************************************************************************************
// Convert 160x100 indexed buffer to RGBA buffer, and transfer to screen
function RenderIndexedModeFrame160x100()
{
    let cp=0;
    for (let y=0;y<100;y++) 
    {
        let yy=y*320;
        for (let x=0;x<160;x++)
        {
            imageDatabuf32[yy+x]=CurrentRGBAPalette[IndexedFrameBuffer[cp++]];
        }
    }

    RenderRGBABufferToScreen160x100();
}

//************************************************************************************************************************************************************************************************************
// Transfer 320x200  RGBA buffer to screen 
function RenderRGBABufferToScreen320x200 ()
{
    //transfer the 320x200 32bits RGBA buffer to destination HTML canva (screen)
    mainscreen.contex.imageSmoothingEnabled = false;  //disable image smoothing (canva is 640x400 and we use 320x200 or 320x400, we don't want image smoothing)
    imageData.data.set(imageDatabuf8);
    OffScreenBuffer.contex.putImageData(imageData, 0, 0);    
    OffScreenBuffer.drawPart(	mainscreen,
                                    0,0,		//The x,y coord in the destination canvas 
                                    0,0,       //The x,y coord of the part in the source canvas
                                    OffScreenBuffer.width,OffScreenBuffer.height,  // The width, height of the part in the source canvas.
                                    1.0,  		// alpha (1.0
                                    0.0,		// rotation angle
                                    2.0, 		// normalized zoom factor on x 
                                    2.0,		// normalized zoom factor on y (320x200 for this sequence in part)
                                    );
}
//************************************************************************************************************************************************************************************************************
// Transfer and expand the 160x100 area of a 320x200  RGBA buffer to screen 
function RenderRGBABufferToScreen160x100 ()
{
    //transfer the 320x200 32bits RGBA buffer to destination HTML canva (screen)
    mainscreen.contex.imageSmoothingEnabled = false;  //disable image smoothing (canva is 640x400 and we use 320x200 or 320x400, we don't want image smoothing)
    imageData.data.set(imageDatabuf8);
    OffScreenBuffer.contex.putImageData(imageData, 0, 0);    
    OffScreenBuffer.drawPart(	mainscreen,
                                    0,0,		//The x,y coord in the destination canvas 
                                    0,0,       //The x,y coord of the part in the source canvas
                                    OffScreenBuffer.width,OffScreenBuffer.height,  // The width, height of the part in the source canvas.
                                    1.0,  		// alpha (1.0
                                    0.0,		// rotation angle
                                    4.0, 		// normalized zoom factor on x 
                                    4.0,		// normalized zoom factor on y 
                                    );
}
//************************************************************************************************************************************************************************************************************
// Transfer 320x400  RGBA buffer to screen 
function RenderRGBABufferToScreen320x400 ()
{
    //transfer the 320x200 32bits RGBA buffer to destination HTML canva (screen)
    mainscreen.contex.imageSmoothingEnabled = false;  //disable image smoothing (canva is 640x400 and we use 320x200 or 320x400, we don't want image smoothing)
    imageData.data.set(imageDatabuf8);
    OffScreenBuffer.contex.putImageData(imageData, 0, 0);    
    OffScreenBuffer.drawPart(	mainscreen,
                                    0,0,		//The x,y coord in the destination canvas 
                                    0,0,       //The x,y coord of the part in the source canvas
                                    OffScreenBuffer.width,OffScreenBuffer.height,  // The width, height of the part in the source canvas.
                                    1.0,  		// alpha (1.0
                                    0.0,		// rotation angle
                                    2.0, 		// normalized zoom factor on x 
                                    1.0,		// normalized zoom factor on y (320x400 for this sequence in part)
                                    );
}

//************************************************************************************************************************************************************************************************************
// Transfer 320x134  RGBA buffer to screen 
function RenderRGBABufferToScreen320x134 ()
{
    //transfer the 320x200 32bits RGBA buffer to destination HTML canva (screen)
    mainscreen.contex.imageSmoothingEnabled = false;  //disable image smoothing (canva is 640x400 and we use 320x200 or 320x400, we don't want image smoothing)
    imageData.data.set(imageDatabuf8);
    OffScreenBuffer.contex.putImageData(imageData, 0, 0);    
    OffScreenBuffer.drawPart(	mainscreen,
                                    0,0,		//The x,y coord in the destination canvas 
                                    0,0,       //The x,y coord of the part in the source canvas
                                    OffScreenBuffer.width,OffScreenBuffer.height,  // The width, height of the part in the source canvas.
                                    1.0,  		// alpha (1.0
                                    0.0,		// rotation angle
                                    2.0, 		// normalized zoom factor on x 
                                    3.0,		// normalized zoom factor on y (134 for this sequence in part)
                                    );
}


//************************************************************************************************************************************************************************************************************
// Transfer 640x400  RGBA buffer to screen 
function RenderRGBABufferToScreen640x400 ()
{
    //transfer the 320x200 32bits RGBA buffer to destination HTML canva (screen)
    mainscreen.contex.imageSmoothingEnabled = false;  //disable image smoothing (canva is 640x400 and we use 320x200 or 320x400, we don't want image smoothing)
    imageData_640.data.set(imageDatabuf8_640);
    OffScreenBuffer_640.contex.putImageData(imageData_640, 0, 0);    
    OffScreenBuffer_640.drawPart(	mainscreen,
                                    0,0,		//The x,y coord in the destination canvas 
                                    0,0,       //The x,y coord of the part in the source canvas
                                    OffScreenBuffer_640.width,OffScreenBuffer_640.height,  // The width, height of the part in the source canvas.
                                    1.0,  		// alpha (1.0
                                    0.0,		// rotation angle
                                    1.0, 		// normalized zoom factor on x 
                                    1.0,		// normalized zoom factor on y (320x400 for this sequence in part)
                                    );
}
