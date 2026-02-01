// COMAN Part "3D-Sinusfield" (PSI)
// Original source code in COMAN folder
// Original code mostly in C + assembly for graphic loop

// This part is an implementation of  raymarching Voxel
//  A good explanation of the concept of the algorithm can be found here https://s-macke.github.io/VoxelSpace/

// Original code is complex, and implements several optimisation to handle fast fixed point computations
// Assembly code is an unfolded loop. This loop code is generated in DOLOOP.C

// 
// TODO sync start to music

// TODO 2 : check consistency of rendering with actual code  (result looks similar but not identical), adapt to refresh rate



//TODO CLEAR DATA AT END

function COMAN() 
{
    let palette;
    let vbuf;
    let wave1,wave2,zwave;
    let startrise;
    let	rot2,rot,rsin,rcos,xwav,ywav,zwav,xw,yw;
	let	rsin2,rcos2;
    
    //const from DOLOOP.C
    const horizony=70;
    const bailstart=0;
    const bail=192;
    const bailhalve=64;
    const group=500;

    let deb=0;  //TODO REMOVE DEBUG

//************************************************************************************************************************************************************************************************************
function PartInit()
{
	PartName = "COMAN";
    PartTargetFrameRate=35;  //originally based on a VGA Mode 13h timing (320x200@70Hz)
    //-----------
    let	a,b,j,k;
	rot=0;
    xwav=0;
    ywav=0;
    rot=0;
    xwav=0;
    startrise=160-40;
   

	palette=new Array(768);
    palette.fill(0);
    
	for(a=0;a<256;a++)
	{
		uc=(223-Math.floor(a*22/26))*3;   //color 7
		b=Math.floor((230-a)/4);
		b+=Math.floor( 256*Math.sin( a*4/1024*2*Math.PI) / 32) ;//b+=sin1024[a*4&1023]/32;
		if(b<0) b=0;
		if(b>63) b=63;
		palette[uc+1]=Math.floor(b);
		b=(255-a)/3;
		if(b>63) b=63;
		palette[uc+2]=Math.floor(b);
		b=a-220; if(b<0) b=-b;
		if(b>40) b=40;
		b=40-b;
		palette[uc+0]=Math.floor(b/3);
	}

    for(a=0;a<768-16*3;a++)  //color 0..239
	{
		b=palette[a];
		b=b*9/6; if(b>63) b=63;
		palette[a]=Math.floor(b);
	}

	for(a=0;a<24;a++)
	{
		uc=(255-a)*3;          // color .. 232..255
		b=a-4; if(b<0) b=0;
		palette[uc+0]=Math.floor(b/2);
		palette[uc+1]=0;
		palette[uc+2]=0;
	}
	palette[0]=0;
	palette[1]=0;
	palette[2]=0;

         	
	wave1=new Array(256*128);
	wave2=new Array(256*128);
    let W1DTA=Base64toArray(W1DTA_base64);
    let W2DTA=Base64toArray(W2DTA_base64);
    for (i=0;i<256*128;i++) wave1[i]=Signed16FromByteBuffer(W1DTA,i*2);
    for (i=0;i<256*128;i++) wave2[i]=Signed16FromByteBuffer(W2DTA,i*2)
    

	zwave=new Array(bail);
    for(let i=0;i<bail;i++)
		zwave[i]=Math.trunc(16.0*Math.sin(i*Math.PI*2.0*3.0/bail));
	
	IndexedFrameBuffer.fill(0);  //clear screen

    PrepareAnimationParam();
    xwav=0;
    ywav=0;
    zwav=0;

    SetVGAPalette(palette);
    RenderIndexedMode13hFrame();  //initial pixels set, with black palette
}

//************************************************************************************************************************************************************************************************************
//called by main demo loop each time the screen has to be updated, time stamp is relative to part start
function PartRenderFrame()
{     
 	if (!IsDisSyncPointReached("COMAN_START")) 
	{
		ResetPartClock();  //let CurrentAnimationFrame to 0
		return;  //exit function until music point is reached
	}    
    if (CurrentAnimationFrame<4444)
    {
      
        UpdateAnimationParam(Math.floor(CurrentAnimationFrame)); //TODO speeed
        RenderFrame();
        RenderIndexedMode13hFrame();  
    }
}

//************************************************************************************************************************************************************************************************************
//compute animation parameters once
function PrepareAnimationParam()
{
	rot2=0;
    rot=0;
    rsin=new Array();
    rcos=new Array();
    rsin2=new Array();
    rcos2=new Array();
    for (let frame=0;frame<4444;frame++)
    {
        rot2+=4;  
        rot+=Math.trunc(256*Math.sin( rot2/1024*2*Math.PI)/15);
        
        
        r=rot>>3;
        rsin.push(Math.trunc(256*Math.sin( r/1024*2*Math.PI))) ; //sin1024[r&1023];
        rcos.push(Math.trunc(256*Math.sin( (r+256)/1024*2*Math.PI)))  ; //sin1024[(r+256)&1023];
        rsin2.push(Math.trunc(256*Math.sin( (r+177)/1024*2*Math.PI))); //sin1024[(r+177)&1023];
        rcos2.push(Math.trunc(256*Math.sin( (r+177+256)/1024*2*Math.PI))); //sin1024[(r+177+256)&1023];
    }
}
//************************************************************************************************************************************************************************************************************

function UpdateAnimationParam(frame)
{
    if (CurrentAnimationFrame<400)
    {
        if(startrise>0) startrise-=1;  
    }
    else  if (IsDisSyncPointReached("COMAN_SCROLL_DOWN")) 
    {
        if (startrise<160) startrise+=1
        else HasPartEnded=true; //end part when scroller reached bottom
    }


    xw=xwav; yw=ywav;
    
    //console.log ("Frame="+frame+" rot2="+rot2+" rot="+rot+" rsin="+rsin+" rcos="+rcos+" rsin2="+rsin2+" rcos2="+rcos2);
    
}

//************************************************************************************************************************************************************************************************************
function RenderFrame()
{
    let x,xa,ya,destbegin,destfinal;
    
    valrcos=rcos[Math.trunc(CurrentAnimationFrame/2)];  //don't move too fast (original part usually running at 35 fps, due to computer speed)
    valrsin=rsin[Math.trunc(CurrentAnimationFrame/2)];
    valrcos2=rcos2[Math.trunc(CurrentAnimationFrame/2)];
    valrsin2=rsin2[Math.trunc(CurrentAnimationFrame/2)];

    const y=160;

    
    for(let a=0;a<160;a++) //for  whole screen width
    {
        x=(a-80);
        xa=Math.trunc((x*valrcos+y*valrsin)/256) ;  //TODO CHECK ~1 useful?
        ya=Math.trunc((y*valrcos2-x*valrsin2)/256) ;

        //TODO: why -30 liens below?
        const fix=-30;
        destfinal=  a*2 + 320*(startrise+52+fix); //TODO should be +52 (mov	di,52*80 in docopy) without fix
        destbegin=destfinal+199*320;  //start from bottom of column
        deb=0;
      //  if (a==159) deb=1;
        docol(xw,yw,xa,ya,destbegin,destfinal);
        if(a==80)  //take value for next frame (TODO move to UpdateAnimationParam ?)
        {
            xwav+=xa*2; //TODO adapt animation speed (original code *4)
            ywav+=ya*2;
        }
        if (deb==1) 
        {
           // col=new Array();
           // for (i=0;i<200;i++) col.push(IndexedFrameBuffer[destfinal+i*320]);
           // console.log("frame=",CurrentAnimationFrame);
            for (i=0;i<200;i++) console.log(i+": " + IndexedFrameBuffer[destfinal+i*320]);
            debugger;
        }
      
        
        
      //  debugger;
    }
    
}

function swap32(v)
{
    q=( v & 0xFFFF) << 16;
    q=q | ((v & 0xFFFF0000) >>> 16);
    return (q >>> 0);
}


function toHex32(v) {
    
    return (v >>> 0).toString(16).padStart(8, "0");
}


function toHex32_swap(v) {
    q=swap32(v);
    return (q >>> 0).toString(16).padStart(8, "0");
}

function toHex16(v) {
    return (v & 0xFFFF).toString(16).padStart(4, "0");
}

function floatToFixed16_16(x) {
    let v = Math.round(x * 65536);
    return v | 0;
}

function floatToFixed16_16_swap(x) {
    let v = Math.round(x * 65536);
    return swap32(v | 0);
}

function fixed16_16ToFloat(v) {
    return (v | 0) / 65536.0;
}

//************************************************************************************************************************************************************************************************************
// Render 1 column, from bottom to top (Raymarching)
//  (xw,yw): height map start coordinates, 
//  (xa,ya): displacement vector in height map, 
//  dest: destination offset in  frame buffer
//  finaldest: destination offset to reach in frame buffer (to clear remaining pixels from previous frame)
function docol(xw,yw,xa,ya, dest, finaldest)
{
    //code based on assembly code from "theloop.inc" generated by doloop.c 
    let Terrain_Height;  //bx
    let Color_Index;  //dx
    let l;
    let RayHeight=0;  //eax  (cameralevel)
    let sina=1;   //sina used after 64 (bailhalve) iterations to reduce precision when drawwing "far" pixels (else we may spend lot of time drawing the few last pixels of the column)
  
    let RayHeightIncrement=  ((-(200-70)*2560)/65536) ; // firstraydir from doloop.c, with correction for carry management
    
    fix1616= floatToFixed16_16(RayHeightIncrement) ;  //todo debug
    if (deb==1) console.log("ECX="  + Print_fixedReverse(swap32(fix1616))); // todo debug
    

    //debugger;
    xw=xw & 0xFFFFFFFE; //make even input data (done in _docol before calling theloop in original code)
    yw=yw & 0xFFFFFFFE;
    xa=xa & 0xFFFFFFFE;
    ya=ya & 0xFFFFFFFE;

    jm=0;
    for(let i=bailstart;i<bail;i+=group)
    {
        jm=i+group; if(jm>bail) jm=bail;
        for (let j=i; j<jm;j++ ) //TODO check the loop nb of iteration
        {
            if(j==bailhalve)          // sina=2;  //TODO remove sina
            {
                xa+=xa;
                ya+=ya;
                sina=2;
            }

            
            //if (j==68) debugger;  
            xw+= xa;
            yw+= ya;
            /*if (sina==2)  //sina 
            {
            xw+= xa;
            yw+= ya;
            }*/
           if (deb==1) displayval(j,"     xw=",floatToFixed16_16_swap(xw)," yw=",floatToFixed16_16_swap(yw));

            Terrain_Height= (wave1[(xw>>1) & 32767]+wave2[ (yw>>1) & 32767])+(zwave[j]-240);  //height //TODO check if >32767 //TODO confirm sina1/sina2 after bailhave
            if (RayHeight < Terrain_Height)  //   ( EAX=Curent height BX=scenery height //TODO COMMENT???)  //jge seeko0
            { 
            //debugger;
                
                Color_Index=((Terrain_Height+140-j/8)  & 0xFF )>>1;  //color, based on height and distance,  +120 in doloop.c , +140 in loop.inc ! TOdO : could be clearer!
                
                //_@hit0:  /
                l=(j*2560)/65536 ;
                
                while (RayHeight<Terrain_Height)
                {
                //debugger;
                    let OldRayHeight=RayHeight;
                    RayHeight+= l;    // add eax, wflip(2560*j) , each time we draw a pixel we  raise the ray height
                    if (deb==1) displayval(j,"     RayHeight+= l  RayHeight valait ",floatToFixed16_16_swap(OldRayHeight), " new=",floatToFixed16_16_swap(RayHeight)); 
                    IndexedFrameBuffer[dest]=Color_Index;IndexedFrameBuffer[dest+1]=Color_Index; //write 2 pixels
                    dest-=320;
                   // if (deb) displayval("Inc dans la boucle ecx: avant=",RayHeightIncrement, " après=", RayHeightIncrement+2560/65536);

                    if (deb==1) displayval(j,"   inc RayHeightIncrement, prev=",floatToFixed16_16_swap(RayHeightIncrement), " new=",floatToFixed16_16_swap(RayHeightIncrement+2560/65536)); 
                    RayHeightIncrement+=2560/65536;   // add ecx,00A000000h; perspective effect
                    
                } 
            
            }
                    
            //seekoO:
            const rb=RayHeight;
            
            if (sina==1) RayHeight=advanceRayPosition(RayHeight,RayHeightIncrement) ; // raise the ray height (further mountains are smaller)
            if (sina==2) RayHeight=advanceRayPosition2(RayHeight,RayHeightIncrement);  //accelerate  when far
           if (deb==1) displayval(j,"add eax,ecx +adc:  ECX=",floatToFixed16_16_swap(RayHeightIncrement)," EAX avant=",floatToFixed16_16_swap(rb)," EAX après=", floatToFixed16_16_swap(RayHeight));
           if (sina==2) j++; //accelerate when far
        }
    }
    //additional code: clear pixels from current y to top y
    while(dest>finaldest)
    {
        IndexedFrameBuffer[dest]=0;IndexedFrameBuffer[dest+1]=0;
        dest-=320;
    }
}

function displayval(j,t1,v1,t2,v2,t3,v3)
{
    console.log( j+": "+t1+Print_fixedReverse(v1)+t2+Print_fixedReverse(v2)+t3+Print_fixedReverse(v3)  );
}
//************************************************************************************************************************************************************************************************************
//Generated with help of Gemini, compute the new ray height as in original code with "ADC" trick

function advanceRayPosition(currentPosition, direction)   // advance ray by simulating  "add eax,ecx" then "adc ax,-1"
{

     // help from chatgpt to mimic ADD + ADC in JS and  get accurate result!
    let eax= floatToFixed16_16_swap(currentPosition) >>> 0;
    let ecx=floatToFixed16_16_swap(direction) >>> 0;
    let sum32 = eax+ecx;
    let eax_after_add = sum32 >>> 0;
    let carryAdd = ((eax + ecx) >>> 0) < eax ? 1 : 0;

    //console.log("\n-- Après ADD EAX,ECX, EAX = 0x" + toHex32(eax_after_add)+" Carry = " + carryAdd);

    // 2) ADC AX, -1
    let ax = eax_after_add & 0xFFFF;
    let result16 = ax + 0xFFFF + carryAdd;
    let newAX = result16 & 0xFFFF;    
    let eax_after_adc = (eax_after_add & 0xFFFF0000) | newAX;
    //console.log("\n-- Après ADC AX,-1, EAX= 0x" + toHex32(eax_after_adc));
    return(fixed16_16ToFloat(swap32(eax_after_adc)));

}


function advanceRayPosition2(currentPosition, direction)   // advance ray by simulating 2* "add eax,ecx" then "adc ax,-1", this is done by original code but to be accurate, each add should be followed by adc, this causes precision issue that we reproduce here
{


     // help from chatgpt to mimic ADD + ADC in JS and  get accurate result!
    let eax= floatToFixed16_16_swap(currentPosition) >>> 0;
    let ecx=floatToFixed16_16_swap(direction) >>> 0;
    eax = (eax+ecx) >>> 0;           //first add (if carry is set, it is ignored!)
    let sum32 = eax+ecx ; //second add with adc 
    let eax_after_add = sum32 >>> 0;
    let carryAdd = ((eax + ecx) >>> 0) < eax ? 1 : 0;

    //console.log("\n-- Après ADD EAX,ECX, EAX = 0x" + toHex32(eax_after_add)+" Carry = " + carryAdd);

    // 2) ADC AX, -1
    let ax = eax_after_add & 0xFFFF;
    let result16 = ax + 0xFFFF + carryAdd;
    let newAX = result16 & 0xFFFF;    
    let eax_after_adc = (eax_after_add & 0xFFFF0000) | newAX;
    //console.log("\n-- Après ADC AX,-1, EAX= 0x" + toHex32(eax_after_adc));
    return(fixed16_16ToFloat(swap32(eax_after_adc)));

}
//************************************************************************************************************************************************************************************************************
function PartLeave()
{
    palette=wave1=wave2=zwave=null;
}

//************************************************************************************************************************************************************************************************************
// Part interface with main.js , expose useful functions to outside world


return {
    init: () => { PartInit(); },
    update: () => { PartRenderFrame(); },
    end: () => { PartLeave(); },
    

};
  

}