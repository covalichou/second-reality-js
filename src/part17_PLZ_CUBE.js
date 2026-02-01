// PLZ Part (Original code by WILDFIRE)
// Original source code in PLZPART folder contains two parts:
// 1st part: PLASMA (colored waves/smoke effect) (PLZ function called in PLZPART\MAIN.C)
// 2nd part: Textured plasma cube (VECT function called in PLZPART\MAIN.C)

// This file implements the second part (Textured plasma cube).
//  Original code in PLZ folder (mainly in VECT.C PLZFILL.C, PLZA.ASM files). 


// Original part uses a 320x134 video mode : vertical resolution is 400 but scan lines are tripled 400/3=> 134)

// There is no real specif trick in this code, just a basic 3D engine with optimizations for speed (fixed point, precalculated sin/cos tables, backface culling, lighting per face, ...)
// Polygon drawing is simplified (doesn't draw horizontal edge!) but works here
// Texturing is not perspective corrected (complete linear interpolation) this is not very visible with this texture and the cube shape.

// Screen clearing is optimised to only clear pixels that were not overwritten by the current frame drawing (only a few pixels per line need to be clearead each frame)


function PLZ_CUBE() 
{
    let sinit, kosinit,sini;  //sin, cos table
    let tx, ty, dis, kx, ky, kz;
    let ls_kx,ls_ky;
    let cxx,cxy,cxz,cyx,cyy,cyz,czx,czy,czz; // rotation matrix
    let ptodraw;
    let pal,fpal,kuva1,kuva2,kuva3,kuvataus;
    let clrptr,clrtau,dist1,ctau;

// ******************************************************************************************************************************************************************************************
let object={
		name: "Cube",
		points: 				// points
		[
		{x:125 ,y:125 ,z: 125},
		{x:125 ,y:-125,z: 125},
		{x:-125,y:-125,z: 125},
		{x:-125,y:125 ,z: 125},
		{x:125 ,y:125 ,z:-125},
		{x:125 ,y:-125,z:-125},
		{x:-125,y:-125,z:-125},
		{x:-125,y:125 ,z:-125},
        ],
		faces:  //pg in original code (useless data removed)
		[
		{ p1: 1, p2: 2, p3: 3, p4: 0, color: 0},   
		{ p1: 7, p2: 6, p3: 5, p4: 4, color: 0},
		{ p1: 0, p2: 4, p3: 5, p4: 1, color: 1},
		{ p1: 1, p2: 5, p3: 6, p4: 2, color: 2},
		{ p1: 2, p2: 6, p3: 7, p4: 3, color: 1},
		{ p1: 3, p2: 7, p3: 4, p4: 0, color: 2}]
        };

const txt = [{x: 64, y: 4}, {x: 190, y: 4}, {x: 190, y: 60}, {x: 64, y: 60}]; //  texture coordinates (same for each face)
// ******************************************************************************************************************************************************************************************
//from SPLINE.INC (length: 1024 words) (coefficient for spline interpolation)

const spline_coeff=[0,0,0,0,2,3,5,7,9,12,15,18,22,26,30,35,40,45,51,57,63,69,76,83,91,99,107,115,124,133,143,152,162,173,183,194,205,217,229,241,254,267,280,293,307,321,335,350,365,380,396,412,428,445,461,479,496,514,532,550,569,588,607,626,646,666,687,707,728,750,771,793,815,838,860,883,907,930,954,978,1002,1027,1052,1077,1103,1129,1155,1181,1208,1234,1261,1289,1317,1344,1373,1401,1430,1459,1488,1517,1547,1577,1607,1638,1669,1700,1731,1762,1794,1826,1858,1891,1923,1956,1989,2023,2056,2090,2124,2159,2193,2228,2263,2298,2334,2369,2405,2441,2478,2514,2551,2588,2625,2662,2700,2738,2776,2814,2852,2891,2929,2968,3008,3047,3087,3126,3166,3206,3247,3287,3328,3368,3409,3451,3492,3533,3575,3617,3659,3701,3744,3786,3829,3872,3915,3958,4001,4044,4088,4132,4176,4220,4264,4308,4353,4397,4442,4487,4532,4577,4622,4667,4713,4759,4804,4850,4896,4942,4988,5035,5081,5128,5174,5221,5268,5315,5362,5409,5456,5503,5551,5598,5646,5693,5741,5789,5837,5885,5933,5981,6029,6078,6126,6174,6223,6271,6320,6369,6417,6466,6515,6564,6613,6662,6711,6760,6809,6858,6907,6956,7006,7055,7104,7154,7203,7253,7302,7351,7401,7450,7500,7549,7599,7648,7698,7748,7797,7847,7896,7946,7995,8045,8095,8144,8194,8243,8293,8342,8392,8441,8491,8540,8589,8639,8688,8737,8787,8836,8885,8934,8983,9033,9082,9131,9180,9228,9277,9326,9375,9424,9472,9521,9569,9618,9666,9715,9763,9811,9859,9907,9955,10003,10051,10099,10146,10194,10242,10289,10336,10384,10431,10478,10525,10572,10618,10665,10712,10758,10804,10851,10897,10943,10989,11035,11080,11126,11171,11217,11262,11307,11352,11397,11442,11486,11531,11575,11619,11663,11707,11751,11795,11838,11882,11925,11968,12011,12054,12096,12139,12181,12223,12265,12307,12349,12390,12432,12473,12514,12555,12596,12636,12676,12717,12757,12797,12836,12876,12915,12954,12993,13032,13071,13109,13147,13185,13223,13261,13298,13335,13373,13409,13446,13483,13519,13555,13591,13626,13662,13697,13732,13767,13802,13836,13870,13904,13938,13972,14005,14038,14071,14104,14136,14169,14201,14233,14264,14295,14327,14358,14388,14419,14449,14479,14509,14538,14567,14596,14625,14654,14682,14710,14738,14766,14793,14820,14847,14874,14900,14926,14952,14978,15003,15028,15053,15078,15102,15126,15150,15174,15197,15220,15243,15265,15288,15310,15332,15353,15374,15395,15416,15437,15457,15477,15496,15516,15535,15554,15572,15591,15609,15626,15644,15661,15678,15695,15711,15727,15743,15759,15774,15789,15804,15818,15833,15847,15860,15874,15887,15899,15912,15924,15936,15948,15959,15970,15981,15992,16002,16012,16021,16031,16040,16049,16057,16066,16074,16081,16089,16096,16103,16109,16115,16121,16127,16132,16137,16142,16147,16151,16155,16158,16162,16165,16168,16170,16172,16174,16176,16177,16178,16179,16179,16179,16179,16179,16178,16177,16176,16174,16172,16170,16168,16165,16162,16158,16155,16151,16147,16142,16137,16132,16127,16121,16115,16109,16103,16096,16089,16081,16074,16066,16057,16049,16040,16031,16021,16012,16002,15992,15981,15970,15959,15948,15936,15924,15912,15899,15887,15874,15860,15847,15833,15818,15804,15789,15774,15759,15743,15727,15711,15695,15678,15661,15644,15626,15609,15591,15572,15554,15535,15516,15496,15477,15457,15437,15416,15395,15374,15353,15332,15310,15288,15265,15243,15220,15197,15174,15150,15126,15102,15078,15053,15028,15003,14978,14952,14926,14900,14874,14847,14820,14793,14766,14738,14710,14682,14654,14625,14596,14567,14538,14509,14479,14449,14419,14388,14358,14327,14295,14264,14233,14201,14169,14136,14104,14071,14038,14005,13972,13938,13904,13870,13836,13802,13767,13732,13697,13662,13626,13591,13555,13519,13483,13446,13409,13373,13335,13298,13261,13223,13185,13147,13109,13071,13032,12993,12954,12915,12876,12836,12797,12757,12717,12676,12636,12596,12555,12514,12473,12432,12390,12349,12307,12265,12223,12181,12139,12096,12054,12011,11968,11925,11882,11838,11795,11751,11707,11663,11619,11575,11531,11486,11442,11397,11352,11307,11262,11217,11171,11126,11080,11035,10989,10943,10897,10851,10804,10758,10712,10665,10618,10572,10525,10478,10431,10384,10336,10289,10242,10194,10146,10099,10051,10003,9955,9907,9859,9811,9763,9715,9666,9618,9569,9521,9472,9424,9375,9326,9277,9228,9180,9131,9082,9033,8983,8934,8885,8836,8787,8737,8688,8639,8589,8540,8491,8441,8392,8342,8293,8243,8194,8144,8095,8045,7995,7946,7896,7847,7797,7748,7698,7648,7599,7549,7500,7450,7401,7351,7302,7253,7203,7154,7104,7055,7006,6956,6907,6858,6809,6760,6711,6662,6613,6564,6515,6466,6417,6369,6320,6271,6223,6174,6126,6078,6029,5981,5933,5885,5837,5789,5741,5693,5646,5598,5551,5503,5456,5409,5362,5315,5268,5221,5174,5128,5081,5035,4988,4942,4896,4850,4804,4759,4713,4667,4622,4577,4532,4487,4442,4397,4353,4308,4264,4220,4176,4132,4088,4044,4001,3958,3915,3872,3829,3786,3744,3701,3659,3617,3575,3533,3492,3451,3409,3368,3328,3287,3247,3206,3166,3126,3087,3047,3008,2968,2929,2891,2852,2814,2776,2738,2700,2662,2625,2588,2551,2514,2478,2441,2405,2369,2334,2298,2263,2228,2193,2159,2124,2090,2056,2023,1989,1956,1923,1891,1858,1826,1794,1762,1731,1700,1669,1638,1607,1577,1547,1517,1488,1459,1430,1401,1373,1344,1317,1289,1261,1234,1208,1181,1155,1129,1103,1077,1052,1027,1002,978,954,930,907,883,860,838,815,793,771,750,728,707,687,666,646,626,607,588,569,550,532,514,496,479,461,445,428,412,396,380,365,350,335,321,307,293,280,267,254,241,229,217,205,194,183,173,162,152,143,133,124,115,107,99,91,83,76,69,63,57,51,45,40,35,30,26,22,18,15,12,9,7,5,3,2,0,0,0];


const kkk=100;
const animation_spline= [   //from animation_spline.INC  , 136 array of 8 words,  spline definition for cube rotation,translation changes
     //tx    ty         dis     kx            ky          kz          ls_ks          ls_ky

    { dx: 0, dy: 2000, dz: 500, kx: kkk * 0, ky: kkk * 4, kz: kkk * 6, l_kx:      0, l_ky:   0 },
    { dx: 0, dy: 2000, dz: 500, kx: kkk * 1, ky: kkk * 5, kz: kkk * 7, l_kx:      0, l_ky:   0 },
    { dx: 0, dy: 2000, dz: 500, kx: kkk * 2, ky: kkk * 6, kz: kkk * 8, l_kx:      0, l_ky:   0 },
    { dx: 0, dy: 2000, dz: 500, kx: kkk * 3, ky: kkk * 7, kz: kkk * 7, l_kx:      0, l_ky:   0 },
    { dx: 0, dy: 2000, dz: 500, kx: kkk * 4, ky: kkk * 8, kz: kkk * 6, l_kx:      0, l_ky:   0 },
    { dx: 0, dy: -150, dz: 500, kx: kkk * 5, ky: kkk * 7, kz: kkk * 5, l_kx:      0, l_ky:   0 },
    { dx: 0, dy:    0, dz: 500, kx: kkk * 6, ky: kkk * 6, kz: kkk * 4, l_kx:      0, l_ky:   0 },
    { dx: 0, dy:    0, dz: 500, kx: kkk * 7, ky: kkk * 5, kz: kkk * 3, l_kx: 0 * 32, l_ky:   0 },
    { dx: 0, dy:    0, dz: 500, kx: kkk * 8, ky: kkk * 4, kz: kkk * 2, l_kx: 1 * 32, l_ky:   0 },
    { dx: 0, dy:    0, dz: 500, kx: kkk * 7, ky: kkk * 3, kz: kkk * 1, l_kx: 2 * 32, l_ky:   0 },
    { dx: 0, dy:    0, dz: 500, kx: kkk * 6, ky: kkk * 2, kz: kkk * 0, l_kx: 3 * 32, l_ky:   0 },
    { dx: 0, dy:    0, dz: 450, kx: kkk * 5, ky: kkk * 1, kz: kkk * 1, l_kx: 4 * 32, l_ky:   0 },
    { dx: 0, dy:    0, dz: 400, kx: kkk * 4, ky: kkk * 0, kz: kkk * 2, l_kx: 5 * 32, l_ky:   0 },
    { dx: 0, dy:    0, dz: 350, kx: kkk * 3, ky: kkk * 1, kz: kkk * 3, l_kx: 6 * 32, l_ky:   0 },
    { dx: 0, dy:    0, dz: 300, kx: kkk * 2, ky: kkk * 2, kz: kkk * 4, l_kx: 7 * 32, l_ky:   0 },
    { dx: 0, dy:    0, dz: 300, kx: kkk * 1, ky: kkk * 3, kz: kkk * 5, l_kx: 8 * 32, l_ky:   0 },
    { dx: 0, dy:    0, dz: 300, kx: kkk * 0, ky: kkk * 4, kz: kkk * 6, l_kx:    256, l_ky:   0 },
    { dx: 0, dy:    0, dz: 300, kx: kkk * 1, ky: kkk * 5, kz: kkk * 7, l_kx:    256, l_ky:   0 },
    { dx: 0, dy:    0, dz: 300, kx: kkk * 2, ky: kkk * 6, kz: kkk * 8, l_kx:    256, l_ky:   0 },
    { dx: 0, dy:    0, dz: 300, kx: kkk * 3, ky: kkk * 7, kz: kkk * 7, l_kx:    256, l_ky:   0 },
    { dx: 0, dy:    0, dz: 300, kx: kkk * 4, ky: kkk * 8, kz: kkk * 6, l_kx:    256, l_ky:   0 },
    { dx: 0, dy:    0, dz: 300, kx: kkk * 5, ky: kkk * 7, kz: kkk * 5, l_kx:    256, l_ky:   0 },
    { dx: 0, dy:    0, dz: 300, kx: kkk * 6, ky: kkk * 6, kz: kkk * 4, l_kx:    256, l_ky:   0 },
    { dx: 0, dy:    0, dz: 300, kx: kkk * 7, ky: kkk * 5, kz: kkk * 3, l_kx:    256, l_ky:   0 },
    { dx: 0, dy:    0, dz: 300, kx: kkk * 8, ky: kkk * 4, kz: kkk * 2, l_kx:    256, l_ky:   0 },
    { dx: 0, dy:    0, dz: 300, kx: kkk * 7, ky: kkk * 3, kz: kkk * 1, l_kx:    256, l_ky:   0 },
    { dx: 0, dy:    0, dz: 300, kx: kkk * 6, ky: kkk * 2, kz: kkk * 0, l_kx:    256, l_ky:   0 },
    { dx: 0, dy:    0, dz: 300, kx: kkk * 5, ky: kkk * 1, kz: kkk * 1, l_kx:    256, l_ky:   0 },
    { dx: 0, dy:    0, dz: 300, kx: kkk * 4, ky: kkk * 0, kz: kkk * 2, l_kx:    256, l_ky:   0 },
    { dx: 0, dy:    0, dz: 300, kx: kkk * 3, ky: kkk * 1, kz: kkk * 3, l_kx:    256, l_ky:   0 },
    { dx: 0, dy:    0, dz: 300, kx: kkk * 2, ky: kkk * 2, kz: kkk * 4, l_kx:    256, l_ky:   0 },
    { dx: 0, dy:    0, dz: 300, kx: kkk * 1, ky: kkk * 3, kz: kkk * 5, l_kx:    256, l_ky:   0 },
    { dx: 0, dy:    0, dz: 350, kx: kkk * 0, ky: kkk * 4, kz: kkk * 4, l_kx: 0 * 64, l_ky: 128 },
    { dx: 0, dy:    0, dz: 400, kx: kkk * 1, ky: kkk * 3, kz: kkk * 3, l_kx: 1 * 64, l_ky: 256 },
    { dx: 0, dy:    0, dz: 450, kx: kkk * 2, ky: kkk * 2, kz: kkk * 2, l_kx: 2 * 64, l_ky: 384 },
    { dx: 0, dy:    0, dz: 500, kx: kkk * 1, ky: kkk * 1, kz: kkk * 1, l_kx: 3 * 64, l_ky: 512 },
    ];
    for (let k=0;k<10;k++)	animation_spline.push({ dx: 0, dy: 0, dz: 500, kx: kkk * 0, ky: kkk * 0, kz: kkk * 0, l_kx: 256, l_ky: 512 });  //REPT macro (size adjusted)
    

//************************************************************************************************************************************************************************************************************
function PartInit()
{
	PartName = "PLZ_CUBE";
    PartTargetFrameRate=70;  //originally based on a VGA Mode 13h timing (320x200@70Hz)

    sinit=new Array(); 
    kosinit=new Array();


        
    for (let i = 0; i < 1024; i++) sinit[i]   = Math.floor(32767*Math.sin(i*(Math.PI)/512));  
    for (let i = 0; i < 1024; i++) kosinit[i] = Math.floor(32767*Math.cos(i*(Math.PI)/512));

    clrptr=0;
    initvect();
  
    for (let i=0;i<64000;i++) IndexedFrameBuffer[i]=0; 
    RenderIndexedModeFrame320x134();  //initial pixels set, with black palette
}

//************************************************************************************************************************************************************************************************************
//called by main demo loop each time the screen has to be updated, time stamp is relative to part start
function PartRenderFrame()
{     
 	if (!IsDisSyncPointReached("PLZ_CUBE_START")) 
	{
		ResetPartClock();  //let CurrentAnimationFrame to 0
		return;  //exit function until music point is reached
	}
    calculate(CurrentAnimationFrame);       //calculate new cube position,angles
    draw(CurrentAnimationFrame);            //draw the cube
    SetVGAPalette(fpal);
    clear();                                //remove  pixels not overwritten by the current frame drawing    
    RenderIndexedModeFrame320x134();  
    if (IsDisSyncPointReached("PLZ_CUBE_END")) HasPartEnded=true; //end part 
   
}
//************************************************************************************************************************************************************************************************************
function calculate(frame)
{
    getspl(4*256+Math.floor(frame)*4);   //compute animation parameters (cube position,angles) using spline interpolation (make adaptation to frame rate easy!)
    kx=kx&1023;
	ky=ky&1023;
	kz=kz&1023;
	ls_kx=ls_kx&1023;
	ls_ky=ls_ky&1023;

	ls_y=kosinit[ls_kx]>>8;
	ls_x=(sinit[ls_kx]>>8)*(sinit[ls_ky]>>8)>>7;
	ls_z=(sinit[ls_kx]>>8)*(kosinit[ls_ky]>>8)>>7;    
    count_const(); //prepare rotation constants
	rotate();
	sort_faces();

}





//************************************************************************************************************************************************************************************************************
function count_const()
{
    	//matrix equations:

	//
	// 0=Ycos*Zcos		 2=Ycos*Zsin		 4=-Ysin
	// 6=Xsin*Zcos*Ysin	 8=Xsin*Ysin*Zsin	10=Ycos*Xsin
	//   -Xcos*Zsin		   +Xcos*Zcos
	//12=Xcos*Zcos*Ysin	14=Xcos*Ysin*Zsin	16=Ycos*Xcos
	//   +Xsin*Zsin		   -Xsin*Zcos
    
    let SX= sinit[kx];
    let SY= sinit[ky];
    let SZ= sinit[kz];
    let CX= kosinit[kx];
    let CY= kosinit[ky];
    let CZ= kosinit[kz];
    cxx=(CY*CZ)>>(15+7);
	cxy=(CY*SZ)>>(15+7);
	cxz=-SY>>7;

	cyx=((SX*CZ+16384)>>15)*SY - (CX*SZ)>>(15+7);
	cyy=((SX*SY+16384)>>15)*SZ + (CX*CZ)>>(15+7);
	cyz=(CY*SX)>>(15+7);

	czx=((CX*CZ+16384)>>15)*SY + (SX*SZ)>>(15+7);
	czy=((CX*SY+16384)>>15)*SZ - (SX*CZ)>>(15+7);
	czz=(CY*CX)>>(15+7);     
}

//************************************************************************************************************************************************************************************************************
function rotate()
{
	let	a,x,y,z,xx,yy,zz;

	for(a=0;a<object.points.length;a++)
	{
		x=object.points[a].x; y=object.points[a].y; z=object.points[a].z;
        //rotation
		object.points[a].xx=xx=((x*cxx>>1) + (y*cxy>>1) + (z*cxz>>1)>>7)+tx;
		object.points[a].yy=yy=((x*cyx>>1) + (y*cyy>>1) + (z*cyz>>1)>>7)+ty;
		object.points[a].zz=zz=((x*czx>>1) + (y*czy>>1) + (z*czz>>1)>>7)+dis;


        //projection to screen   (screen centre is 160,66)  X,Y factor tuned to match reference video aspect ratio
		object.points[a].xxx=(xx*245)/zz+160;  
        object.points[a].yyy=(yy*137)/zz+66;   

	}
}

//************************************************************************************************************************************************************************************************************
function sort_faces()
{
    let 	a=0,c,x,y,z,p=0;
	let	ax,ay,az,bx,by,bz,nx,ny,nz,s,l;

    ptodraw=new Array();
	while(a<object.faces.length)
	{
		x=object.points[object.faces[a].p1].xx;
		y=object.points[object.faces[a].p1].yy;
		z=object.points[object.faces[a].p1].zz;

		ax=object.points[object.faces[a].p2].xx-x;
		ay=object.points[object.faces[a].p2].yy-y;
		az=object.points[object.faces[a].p2].zz-z;

		bx=object.points[object.faces[a].p3].xx-x;
		by=object.points[object.faces[a].p3].yy-y;
		bz=object.points[object.faces[a].p3].zz-z;

		nx = ay * bz - az * by;
		ny = az * bx - ax * bz;
		nz = ax * by - ay * bx;			// normal vector to the face (dot product)

		
		if(nz<0)  { a++; continue; }  //Z component of normal vector is < 0 => face is backside, don't draw it! 

		s=(ls_x*nx+ls_y*ny+ls_z*nz)/250000+32;   //light level
        if(s<0) s=0; if(s>64) s=64;		c=object.faces[a].color;  

		shadepal(c*64*3, s );  //shade the palette area for this face color
		ptodraw.push(a); 
        a++;
	}
}

//************************************************************************************************************************************************************************************************************
function draw(CurrentAnimationFrame)
{
    let 	a,c;

	for(a=0;a<ptodraw.length;a++)
	{
		c=object.faces[ptodraw[a]].color;
		do_poly( Math.floor(object.points[object.faces[ptodraw[a]].p1].xxx), Math.floor(object.points[object.faces[ptodraw[a]].p1].yyy),
			     Math.floor(object.points[object.faces[ptodraw[a]].p2].xxx), Math.floor(object.points[object.faces[ptodraw[a]].p2].yyy),
			     Math.floor(object.points[object.faces[ptodraw[a]].p3].xxx), Math.floor(object.points[object.faces[ptodraw[a]].p3].yyy),
			     Math.floor(object.points[object.faces[ptodraw[a]].p4].xxx), Math.floor(object.points[object.faces[ptodraw[a]].p4].yyy),
			     c, CurrentAnimationFrame&63);
	}
}


let pnts = [{x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}];

//************************************************************************************************************************************************************************************************************
function do_poly(x1,y1,x2,y2,x3,y3,x4,y4,color, dd)
{
    // Draw/Texture fill a 4 sided polygon. 
    // Texture coordinates are computed using linear interpolation (same concept as the Gouraud shading, but texture coordinates are interpolated instead light level)
    // this is not a "perfect" mapping, good 3d texture mapping is "perspective corrected". This is not really visible on this big cube with the quickly changing texture.
    // but can be visible on a flat plane with a texture with straight lines (in this case the lines appears curved).


    let    	a,n=0,m,s1,s2,d1,d2,dx1,dy1,dx2,dy2;

	pnts[0].x=x1; pnts[0].y=y1;
	pnts[1].x=x2; pnts[1].y=y2;
	pnts[2].x=x3; pnts[2].y=y3;
	pnts[3].x=x4; pnts[3].y=y4;

	for(n=0,a=1;a<4;a++) if(pnts[a].y<pnts[n].y) n=a;  //find top most point (lowest Y)

	s1=n; s2=n;    //start from top most point
    d1=(n-1)&3;  d2=(n+1)&3;                        //calculate next points index  ( d1: left, d2: right,   )
	dx1=pnts[d1].x-pnts[s1].x;                      //Delta X for s1 (top most point) to d1 segment (segment 1)
	dy1=pnts[d1].y-pnts[s1].y;                      //Delta Y for s1 (top most point) to d1 segment (segment 1)
    if(dy1==0) dy1++;                               // slighlty distord the polygon to avoid full horizontal line (which complexify a bit the algorithm!)
	ax1=65536*dx1/dy1;                              // segment 1 slope 
	xx1= (pnts[s1].x<<16);                          // start x of segment1
	txx1=( txt[s1].x<<16);                          // txx1: X of start texture point
	txy1=( txt[s1].y<<16);                          // txy1: Y of start texture point
	tax1=65536*(txt[d1].x-txt[s1].x)/dy1;           // X displacement vector in texture (for each Y increment on segment1)
	tay1=65536*(txt[d1].y-txt[s1].y)/dy1;           // Y displacement vector in texture (for each Y increment on segment1) 

	dx2=pnts[d2].x-pnts[s2].x;                      //Delta X for s2 (top most point) to d2 segment (segment 2)
	dy2=pnts[d2].y-pnts[s2].y;                      //Delta Y for s2 (top most point) to d2 segment (segment 2)
    if(dy2==0) dy2++;                               // slighlty distord the polygon to avoid full horizontal line (which complexify a bit the algorithm!)       
	ax2=65536*dx2/dy2;                              // segment 2 slope 
	xx2=(  pnts[s2].x<<16);                         // start x of segment2
	txx2=(  txt[s2].x<<16);                         // txx2: X of start texture point
	txy2=(  txt[s2].y<<16);                         // txy2: Y of start texture point
	tax2=65536*(txt[d2].x-txt[s2].x)/dy2;           // X displacement vector in texture (for each Y increment on segment2)
	tay2=65536*(txt[d2].y-txt[s2].y)/dy2;           // Y displacement vector in texture (for each Y increment on segment2)

	yy=pnts[s1].y;                                   // yy: current Y scanline , start on top most point
	from=kuvataus[color];                           //select the correct texture/color, according to the face color


	for(n=0;n<4;)       //while end of polygon not reached
	{
		if(pnts[d1].y<pnts[d2].y) m=pnts[d1].y; else m=pnts[d2].y;  //find the shortest segment, loop will end when 


		do_block(m-yy, dd); yy=m;   // draw the polygon until when segment end is reached

        //update the segment(s)
		if(pnts[d1].y==pnts[d2].y)   //both segment ended simultaneously
		{
			s1=d1; d1=(s1-1)&3;
			s2=d2; d2=(s2+1)&3; n+=2;

			dx1=pnts[d1].x-pnts[s1].x;
			dy1=pnts[d1].y-pnts[s1].y; if(dy1==0) dy1++;
			ax1=65536*dx1/dy1;
			xx1=(pnts[s1].x<<16);
			txx1=(txt[s1].x<<16);
			txy1=(txt[s1].y<<16);
			tax1=65536*(txt[d1].x-txt[s1].x)/dy1;
			tay1=65536*(txt[d1].y-txt[s1].y)/dy1;

			dx2=pnts[d2].x-pnts[s2].x;
			dy2=pnts[d2].y-pnts[s2].y; if(dy2==0) dy2++;
			ax2=65536*dx2/dy2;
			xx2=(pnts[s2].x<<16);
			txx2=(txt[s2].x<<16);
			txy2=(txt[s2].y<<16);
			tax2=65536*(txt[d2].x-txt[s2].x)/dy2;
			tay2=65536*(txt[d2].y-txt[s2].y)/dy2;
		}
		else if(pnts[d1].y<pnts[d2].y)  // first segment over
		{
			s1=d1; d1=(s1-1)&3; n++;
			dx1=pnts[d1].x-pnts[s1].x;
			dy1=pnts[d1].y-pnts[s1].y; if(dy1==0) dy1++;
			ax1=65536*dx1/dy1;
			xx1=(pnts[s1].x<<16);
			txx1=(txt[s1].x<<16);
			txy1=(txt[s1].y<<16);
			tax1=65536*(txt[d1].x-txt[s1].x)/dy1;
			tay1=65536*(txt[d1].y-txt[s1].y)/dy1;
		}
		else  //second  segment over
        {
			s2=d2; d2=(s2+1)&3; n++;
			dx2=pnts[d2].x-pnts[s2].x;
			dy2=pnts[d2].y-pnts[s2].y; if(dy2==0) dy2++;
			ax2=65536*dx2/dy2;
			xx2=(pnts[s2].x<<16);
			txx2=(txt[s2].x<<16);
			txy2=(txt[s2].y<<16);
			tax2=65536*(txt[d2].x-txt[s2].x)/dy2;
			tay2=65536*(txt[d2].y-txt[s2].y)/dy2;
		}
	}    
}


//************************************************************************************************************************************************************************************************************
// draw a block of scanlines of the textured polygon (until one side ends)
// linear interpolation of texture coordinates (with distortion effect)
function do_block(ycount, distortion_position)
{
     if (ycount <= 0) return;
    let x_start,x_end,width, tx_inc,ty_inc,u,v,u_current,v_current,screen_offset, dist_val,distorted_u,distorted_v;
    
    for (let i = 0; i < ycount; i++)   // for each scanline
    {
        if (yy>133) break;  //clip bottom

        x_start = xx1 >> 16;
        x_end = xx2 >> 16;

        width = x_end - x_start;            
        if (width>0)  
        {
            tx_inc = (txx2 - txx1) / width;  //Texture coordinates X increment for each pixel
            ty_inc = (txy2 - txy1) / width;  //Texture coordinates Y increment for each pixel
            
            u_current = txx1;  //Initial X texture coordinate (in 16.16 fixed point)
            v_current = txy1;  //Initial Y texture coordinate (in 16.16 fixed point)
            
        
            screen_offset = yy * 320 + x_start; 

            if(yy>=0)
            {
                ctau=clrtau[clrptr][yy]; //pointer to clear table  for current scanline    
                if (x_start < ctau[0]) ctau[0] = clip(x_start, 0, 319);  //update clear table if we increase the drawn area (on left side)
                if (x_end   > ctau[1]) ctau[1] = clip(x_end, 0, 319);    //update clear table if we increase the drawn area (on right side)
            }

            for (let x = x_start; x < x_end; x++) // for each pixel of the scaline
            {
                // (u,v) are the texture coordinates
                u = u_current >> 16;
                v = v_current >> 16;
                dist_val = dist1[ distortion_position + v ]  ;  //horizontal sinusoidal shift value, (changing when going down in the texture)
                distorted_u= (u + dist_val) & 255;  //horizontal shift taken in account from dist1 table
                distorted_v=  v & 63; // La texture fait 64 de haut?

                if (yy>=0 && yy<134 && x>=0 && x<320)
                        IndexedFrameBuffer[screen_offset] = from[ distorted_v * 256 + distorted_u]; //draw the pixel , color index is given by the texture
            
                u_current += tx_inc;  //next point in texture
                v_current += ty_inc;
                screen_offset++;      //next pixel on screen
            }
        }

        // Update for next scanline (add already computed slopes)
        xx1 += ax1;     // new left side position
        txx1 += tax1;   // new left side texture position X
        txy1 += tay1;   // new left side texture position Y

        xx2 += ax2;    // new right side position
        txx2 += tax2;  // new right side texture position X
        txy2 += tay2;  // new right side texture position Y

        yy++; // next scanline
 
    }


}

//************************************************************************************************************************************************************************************************************
// interpolate the animation parameters using spline interpolation according to the current frame in the animation
function getspl(position)  // position stored as 8.8 fixed point word
{
   const i = position >> 8;     // High 8 bits - Integer part: index of the spline segment
   const f = position & 0xFF;   // Low 8 bits - Fractional part: position within the segment

   // The spline_coeff array contains pre-calculated coefficients for spline interpolation.
   // (interpolation computed as a weighted sum of four consecutive control points from the 'animation_spline' array.)
   
   tx   =  ((animation_spline[i+3].dx   * spline_coeff[f]       + animation_spline[i+2].dx   * spline_coeff[f+256] + animation_spline[i+1].dx   * spline_coeff[f+512] + animation_spline[i].dx   * spline_coeff[f+768])*2) >> 16;
   ty   =  ((animation_spline[i+3].dy   * spline_coeff[f]       + animation_spline[i+2].dy   * spline_coeff[f+256] + animation_spline[i+1].dy   * spline_coeff[f+512] + animation_spline[i].dy   * spline_coeff[f+768])*2) >> 16;
   dis  =  ((animation_spline[i+3].dz   * spline_coeff[f]       + animation_spline[i+2].dz   * spline_coeff[f+256] + animation_spline[i+1].dz   * spline_coeff[f+512] + animation_spline[i].dz   * spline_coeff[f+768])*2) >> 16;
   kx   =  ((animation_spline[i+3].kx   * spline_coeff[f]       + animation_spline[i+2].kx   * spline_coeff[f+256] + animation_spline[i+1].kx   * spline_coeff[f+512] + animation_spline[i].kx   * spline_coeff[f+768])*2) >> 16;
   ky   =  ((animation_spline[i+3].ky   * spline_coeff[f]       + animation_spline[i+2].ky   * spline_coeff[f+256] + animation_spline[i+1].ky   * spline_coeff[f+512] + animation_spline[i].ky   * spline_coeff[f+768])*2) >> 16;
   kz   =  ((animation_spline[i+3].kz   * spline_coeff[f]       + animation_spline[i+2].kz   * spline_coeff[f+256] + animation_spline[i+1].kz   * spline_coeff[f+512] + animation_spline[i].kz   * spline_coeff[f+768])*2) >> 16;
   ls_kx = ((animation_spline[i+3].l_kx * spline_coeff[f]       + animation_spline[i+2].l_kx * spline_coeff[f+256] + animation_spline[i+1].l_kx * spline_coeff[f+512] + animation_spline[i].l_kx * spline_coeff[f+768])*2) >> 16;
   ls_ky = ((animation_spline[i+3].l_ky * spline_coeff[f]       + animation_spline[i+2].l_ky * spline_coeff[f+256] + animation_spline[i+1].l_ky * spline_coeff[f+512] + animation_spline[i].l_ky * spline_coeff[f+768])*2) >> 16;
}

//************************************************************************************************************************************************************************************************************
function clear()  //clear pixels from previous frame that were not overwritten by the current frame drawing
{
    let x,oldx1,oldx2,newx1,newx2,y,yy=0;
    otau=clrtau[(clrptr+1)&1];  //otau is the previous clear buffer (the one used 1 frame ago)
    ntau=clrtau[clrptr];        //ntau is the current clear buffer  (used to generate curent frame)

    for (y=0;y<134;y++)
    {
        yy=y*320;
        oldx1=otau[y][0]; 
        newx1=ntau[y][0]; 
        
        if (newx1>oldx1) for (x=oldx1;x<=newx1;x++) IndexedFrameBuffer[x+yy]=0;
        oldx2=otau[y][1]; 
        newx2=ntau[y][1]; 
        
        if (newx2<oldx2) for (x=newx2;x<=oldx2;x++) IndexedFrameBuffer[x+yy]=0;
        otau[y][0]=319; 
        otau[y][1]=0;  //reset old clear buffer for next frame
    }

	clrptr=(clrptr+1)&1;  // 0,1 (original code uses more buffers, but 2 is enough here)
}

//************************************************************************************************************************************************************************************************************
function shadepal(index, light)
{
    // Apply shading to the palette  area based on the light level
    for(let i=index; i<index+64*3; i++)
        fpal[i] = ( pal[i] * light) >> 6;

}

//************************************************************************************************************************************************************************************************************
function initvect()
{
    let	a,x,y,s;
    sini=new Array(1524);
	for(a=0;a<1524;a++) sini[a]=s=Math.sin(a/1024.0*Math.PI*4)*127;

    pal = new Array(768);
    
    //create 3 palette area (64 colors each) for the 3 kind of face color
	for(a=1;a<32;a++)		// must-blue-valk  = blue - white
		{ pal[0*192+a*3]=0; pal[0*192+a*3+1]=0; pal[0*192+a*3+2]=a*2; }
	for(a=0;a<32;a++)
		{ pal[0*192+a*3+32*3]=a*2; pal[0*192+a*3+1+32*3]=a*2; pal[0*192+a*3+2+32*3]=63; }

	for(a=0;a<32;a++)		// must-pun-kelt = red - yellow
		{ pal[1*192+a*3]=a*2; pal[1*192+a*3+1]=0; pal[1*192+a*3+2]=0; }
	for(a=0;a<32;a++)
		{ pal[1*192+a*3+32*3]=63; pal[1*192+a*3+1+32*3]=a*2; pal[1*192+a*3+2+32*3]=0; }


	for(a=0;a<32;a++)		// must-orans-viol = dark purple - green
		{ pal[2*192+a*3]=a; pal[2*192+a*3+1]=0; pal[2*192+a*3+2]=a*2/3; }
	for(a=0;a<32;a++)
		{ pal[2*192+a*3+32*3]=31-a; pal[2*192+a*3+1+32*3]=a*2; pal[2*192+a*3+2+32*3]=21; }
    
    fpal=new Array (768);
    fpal.fill(0);

    kuva1=new Array(64*256);
    kuva2=new Array(64*256);
    kuva3=new Array(64*256);
    kuvataus=[kuva1,kuva2,kuva3];
	for(y=0;y<64;y++) 
        for(x=0;x<256;x++)
		{
            kuva1[y*256+x]=Math.floor(sini[(y*4+sini[x*2])&511]/4+32);
            kuva2[y*256+x]=Math.floor(sini[(y*4+sini[x*2])&511]/4+32+64);
            kuva3[y*256+x]=Math.floor(sini[(y*4+sini[x*2])&511]/4+32+128);
		}

    dist1=new Array(256);
	for(y=0;y<128;y++) 
            dist1[y]=Math.floor(sini[y*8]/3);  //table for computing the texture distortion
	
    clrtau=new Array(2);
    for (let i=0;i<2;i++) 
    {
        clrtau[i]=new Array(256);
        for (let y=0;y<256;y++) 
        {
            clrtau[i][y]=new Array(2);
            clrtau[i][y][0]=319;
            clrtau[i][y][1]=0;
        }
    }
}
//************************************************************************************************************************************************************************************************************
function PartLeave()
{
    sinit=kosinit= sini  = pal= fpal= kuva1= kuva2= kuva3= dist1= clrtrau= kuvataus= null;

}

//************************************************************************************************************************************************************************************************************
// Part Interface with main.js


return { init: () => { PartInit(); },   update: () => { PartRenderFrame();},  end: () => { PartLeave();}};
  

}