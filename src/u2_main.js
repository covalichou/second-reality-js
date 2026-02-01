// Main functions of the U2 3D engine
// Include function to read/decode 3D data  (objects and animation) in Future crew encoding format
// Based on original code, with few adjustments to make things clearer (there's still room for improvement)
// Will call functions from u2_calc.js to compute polygon, then call function from u2_drawclip.js to prepare drawing, then call function from u2_fillpoly.js to draw


let co;   //array, will contain object data, index, name
let scene0;
//projection clip window (set in vid_window in original code)
let ClippingX	=	[0,319] ;			//(xmin,xmax)
let ClippingY	=	[25,174] ;			//(ymin,ymax)
let ClippingZ	=	[512 ,9999999 ];  //(zmin,zmax)

//projection variables
let Projection2DXFactor;
let Projection2DYFactor;
let Projection2DXOffset	=	159  ;//  
let Projection2DYOffset	=	 99  ;//
let Projection2DXYAspectRatio	=	172/200 ; //(ypitch/xpitch) 

let fov= 40.0; 
let order;
let cam;



let anim_pointer=0;
let animation_end=false;

/* flags for objects & faces (lower 8 bits in face flags are the side number) */
const F_DEFAULT	=	0xf001;	/* for objects only - all enabled, visible */
const F_VISIBLE	=	0x0001;	/* object visibility */
const F_2SIDE	=	0x0200; /* enable disable culling */
const F_GOURAUD	=	0x1000; /* gouraud shaded */
const F_SHADE32	=	0x0C00; /* range of shading */ 

const VF_UP 	=	1;
const VF_DOWN	=	2;
const VF_LEFT	=	4;
const VF_RIGHT	=	8;
const VF_NEAR 	=	16;
const VF_FAR  	=	32;

const  scene_light= [ 12118/16384,
    10603/16384,
    3030/16834 ]; //sqrt(x²+y²+z²)=1.0


//************************************************************************************************************************************************************************************************************
function resetsceneU2()
{
    anim_pointer=0;
    animation_end=false;
    co={};
    order={};
    cam={};
}

//************************************************************************************************************************************************************************************************************
function load_data_u2(U2SceneBase64, U2DataFiles, U2AnimData)
{
	vid_cameraangle(fov);   //take in account Field of view angle(which can be changed through animation)
	//U2A/U2E specific assets:
	scene0= Base64toArray(U2SceneBase64);
	let ObjectRawData=new Array();
	for (let i = 0; i < U2DataFiles.length; i++) 	ObjectRawData.push(Base64toArray(U2DataFiles[i])); //convert all objects  elements from base64 to Array
	SceneAnimData= Base64toArray(U2AnimData);  //for U2A and U2E only 1 anim file (given in U2A.0AB / U2E.0AB); (no need to handle scenelist array as size is always 1)
	//**************
	// Read 00M file (called "materials", it contains color palette, and a 3d object list)   (similar code as original U2A.C Line 168;)

	let ip=Unsigned16FromByteBuffer(scene0,4);
	let conum=Unsigned16FromByteBuffer(scene0,ip); ip=ip+2;	//d=number of object to retrieve +1
	co= new Array(conum);
	for(let c=1;c<conum;c++)							//loop to read 3D objects (or copy them if there objects that are used several times)
	{
		e=Unsigned16FromByteBuffer(scene0,ip); ip=ip+2;	// get "object to load" index (to load associated file)
		//console.log("Loading U2 data file: "+e);				// original code handle object copy (U2A.C Line 189) to avoid loading a file twice, but here we already have everything in memory , so we can load many times and get less code
		co[c]={}; 
		co[c].o= vis_loadobject(ObjectRawData[e-1]); 
		co[c].index=e;								// original code initalise r,r0 matrix but vis_loadobject is doing it (line 181)
		co[c].on=0;
	}
	// INIT CAMERA (Object  0)
	co[0]= {}; co[0].o={};
	co[0].o.r0 = new Array(12);	
	co[0].o.r0.fill(0.0);  //empty matrix
	camera= co[0].o;
	cam	=co[0].o.r0;
}

//************************************************************************************************************************************************************************************************************
function RenderFrameU2()
{
    //compute the objects coordinate according to current camera
	calc_matrix();
	
	//Sort objects farthest to nearest (bubble sort algorithm, original code in U2A.C:311)
	for(a=0;a<order.length;a++)   
	{
		dis=co[c=order[a]].dist;
		for(b=a-1;b>=0 && dis>co[order[b]].dist;b--)
			order[b+1]=order[b];
		order[b+1]=c;
	}
	
	//Draw each objects in frame buffer
	for(a=0;a<order.length;a++)
	{
		o=co[order[a]].o;
		vis_drawobject(o);
	}
	
}

//************************************************************************************************************************************************************************************************************
function vis_drawobject(obj)  //original code : visu.c L101
{

	if(!(obj.flags&F_VISIBLE)) return;
	calc_rotate_translate(obj.v,obj.v0,obj.r);
	if(obj.flags&F_GOURAUD) calc_nrotate(o.nnum,obj.n,obj.n0,obj.r);  // for gouraud polygons we have to compute objects normals for light computation
	else calc_nrotate(o.nnum1,obj.n,obj.n0,obj.r);
	
	calc_projection(obj.pv,obj.v);  //project 3D vertex to 2D coordinates, and set clipping/visibility information
	
	
	// find the best suitable order to draw the object polygons (some objects drawing orders are precomputed, best order is selected according to object orientation points)
	
	let OrderIndexMin=1; //initialse Index of the Order with nearest orientation point
	let MinimalZValue=  obj.v[obj.pl[1][0]].z  ;
			
	for(let OrderIndex=2;OrderIndex<obj.pl.length;OrderIndex++) //find Order point with minimal Z
	{
		let OrientationPointIndex=obj.pl[OrderIndex][0];   
		let ZValue=obj.v[OrientationPointIndex].z;
		if(ZValue<MinimalZValue)       
		{
			MinimalZValue=ZValue;
			OrderIndexMin=OrderIndex;
		}
	}
	draw_polylist(obj.pl[OrderIndexMin],obj.pd,obj.v,obj.pv,obj.n,obj.flags); //draw the object according to the selected order
}



//************************************************************************************************************************************************************************************************************
//  l: array containing a list of polygon to draw  
//  d: array of vertices2D index (each index of this array contains the list of vertices2D needed to draw one polygon)
//  v: 3D vertices2D data (before projection), used for 3D clipping
// pv: projected (2D) vertices2D array (
//  n: polygon  normals (needed for culling computation)
//  f:object flags

function draw_polylist( l, d, v, pv,  n, f) //port of  _draw_polylist in ADRAW.ASM
{
	if ((f & F_VISIBLE)==0) return;
	for ( let polyindex=1; polyindex<l.length; polyindex++)  // FOR EACH POLYGON of the POLYLIST (start a 1 to skip  sort vertex reference  at index 0)
	{
		let poly = l[polyindex];
		let si = d[poly]; /* si points to polydata/polygon we are now drawing */

		let sides = si.vertex.length;
		let  flags = si.flags;
		flags = (flags << 8) & (f | 0x0f00);  

		let NormalIndex = si.NormalIndex;
		let point = si.vertex;
		let color = si.color;

		/* for this face */
		let  np = n[NormalIndex];
		let vp =  v[point[0]];
							
		if ((flags & F_2SIDE)!=0) ;  //if polygon is not F_2SIDE , check cull and don't draw the polygon  when not needed (if polygon is facing back)
		   	if (checkculling(np, vp))	continue;

		let PolyClippingflagsAND= 0xFF;
		let PolyClippingflagsOR=  0x00;
		for (i = 0; i < sides; i++) 
		{
			let pp = pv[point[i]];
			PolyClippingflagsAND &= pp.clipping_flags;
			PolyClippingflagsOR  |= pp.clipping_flags;
		}
		
		if (PolyClippingflagsOR & VF_FAR) continue;  //If *ANY* vertex is 'far', entire polygon is skipped

		//compute polygon shading (for flat or gouraud shading)
		if ((flags & F_GOURAUD)==0)  color += calclight(flags, np);  //flat shading, same color for the whole polygon
		
		// prepare for drawing: 
		//Adapt polygon to expected format for Polygon fill function and compute Gouraud lightinh colors
		let mypoly={};
		mypoly.flags=flags;
		mypoly.color=color;
		mypoly.vertices2D=new Array(sides);
		for (let i=0; i<sides;i++)
		{
			pp = pv[point[i]];
			mypoly.vertices2D[i]={};
			mypoly.vertices2D[i].x = pp.x;
			mypoly.vertices2D[i].y = pp.y;
			if (flags & F_GOURAUD)
			{
				ff = v[point[i]];
				nn = n[ff.NormalIndex];
				mypoly.vertices2D[i].color= color  + calclight(flags, nn);
			} 
		}
		

		if (PolyClippingflagsOR!=0) // if this polygon  needs clipping (additional data is needed for Z clipping)
		{
			mypoly.vertices3D=new Array(sides);
			let ZClipNeeded= (PolyClippingflagsOR & VF_NEAR);
			if  (ZClipNeeded) 
			{
				for (let i=0; i<sides;i++)  //Add additionnal 3D data to  polygon to polygon object
				{
						let pu = v[point[i]];
						mypoly.vertices3D[i]={};
						mypoly.vertices3D[i].x=pu.x;
						mypoly.vertices3D[i].y=pu.y;
						mypoly.vertices3D[i].z=pu.z;
				}
				mypoly=ClipPolygonZ(mypoly);
			}
			
			//Apply 2D Clipping  where needed:
			PolyClippingflagsOR=GetPolygonFlagsClip2D(mypoly);  //Update boundaries check after Z clipping (less clipping may be necessary after Z clipping)
			if ((PolyClippingflagsOR & VF_DOWN)!=0) mypoly=ClipPolygonDown(mypoly);
			if ((PolyClippingflagsOR & VF_UP)!=0) mypoly=ClipPolygonUp(mypoly);
			if ((PolyClippingflagsOR & VF_LEFT)!=0) mypoly=ClipPolygonLeft(mypoly);
			if ((PolyClippingflagsOR & VF_RIGHT)!=0) mypoly=ClipPolygonRight(mypoly);

		}
	
		if (flags & F_GOURAUD)  FillConvexPolygonGouraud(mypoly);	
		else  FillConvexPolygon(mypoly);	

	}
}

//************************************************************************************************************************************************************************************************************
//After Z Clipping flags need to be updated (some X,Y clipping may be no longer needed)
function GetPolygonFlagsClip2D (poly_in)
{
	
	let ClippingFlagsOR=0;
    for (i = 0; i < poly_in.vertices2D.length; i++)
	{
		if (poly_in.vertices2D[i].y < ClippingY[0]) ClippingFlagsOR |= VF_UP  ;  //ymin
		if (poly_in.vertices2D[i].y > ClippingY[1]) ClippingFlagsOR |= VF_DOWN;  //ymax
		if (poly_in.vertices2D[i].x <  ClippingX[0]) ClippingFlagsOR |= VF_LEFT  ; //xmin
		if (poly_in.vertices2D[i].x >  ClippingX[1]) ClippingFlagsOR |= VF_RIGHT ; //xmax
	}
	return ClippingFlagsOR;
}


//************************************************************************************************************************************************************************************************************
function checkculling(n,v)  //calculate the dot product between the viewing vector and the polygon normal. according to the sign of the result, polygon is visible, else it's backfacing
{
	return ( ( (n.x * v.x)	 + (n.y * v.y) + (n.z * v.z)) >= 0);
	//explanation ref: https://archive.gamedev.net/archive/reference/articles/article1088.html
}

//************************************************************************************************************************************************************************************************************
//compute light according to polygon flags (flags give the number of shades available)
//(similar to original code but with improved readiness)
function  calclight( flags, NormalVector)
{
	/* lightsource */
	let light = normallight(NormalVector); //compute the dot product, return a light level in  0..255 range, the adjust level to number of available shades in palette
	let divider = 16;		
	f=(flags&F_SHADE32)>>10;  
	if (f==1) divider= 32;
	else if (f==2) divider= 16;
	else if (f==3) divider=8;
	light= light / divider;		
	light=clip(light,2, 256/divider -1 );
	return Math.floor(light);
}


//************************************************************************************************************************************************************************************************************
function StepOneAnimationFrame()  //implementation of the FC 3D animation file decoder, will update object visibility, position, orientation (one frame each call)
{
	let onum=0;    
	while (true)   //function will return with continue/break
	{
		//Parse annimation begin :
		let a=SceneAnimData[anim_pointer];anim_pointer++; //U2A.C:342
		if(a==0xff)  //Command change FOV / Animation End
		{
			a=SceneAnimData[anim_pointer];anim_pointer++; 
			if(a<=0x7f)
			{
				fov=a/256.0*360.0;  //convert in degrees
				return;
			}
			else if(a==0xff)   //animation end requested
			{
				resetsceneU2();
				animation_end=true;
				return;
			}
		}
		
		if((a&0xc0)==0xc0)     //command for object selection 
		{
			onum=((a&0x3f)<<4);  //obj number  is 8 bits long but can be spread on 2 bytes, high 4 bits here
			a=SceneAnimData[anim_pointer];anim_pointer++; 
		}
		onum=(onum&0xff0)|(a&0xf); //obj number can be spread on 2 bytes, low 4 bits here
		//once object is selected: it can enabled / disabled
		switch(a&0xc0)   //selected object visible/invisible
		{
				case 0x80 :  co[onum].on=1; break; //visible
				case 0x40 :  co[onum].on=0; break; //invisible
		}
		
		//once object is selected: flags can be updated;
		let r=co[onum].o.r0;
		let pflag=0;
		
		switch(a&0x30)
		{
			case 0x00 : break;
			case 0x10 : pflag=SceneAnimData[anim_pointer];anim_pointer++;  
						break;
			case 0x20 : pflag=Unsigned16FromByteBuffer(SceneAnimData, anim_pointer);anim_pointer+=2;
						break;
			case 0x30 : pflag=Unsigned24FromByteBuffer(SceneAnimData, anim_pointer);anim_pointer+=3;
						break;
		}
		
		//once object is selected: it can be translated
		let factor=128;
		if (onum==0) factor=1; //workaround for camera to get rid of all original code fixed point computation
		let lx=lsget(pflag);
		r[9]+=lx/factor;
		let ly=lsget(pflag>>2);
		r[10]+=ly/factor;
		let lz=lsget(pflag>>4);
		r[11]+=lz/factor;
		
		//once object is selected: its transformation (rotation) matrix can be updated
		if(pflag&0x40)
		{ // word matrix
			for(let b=0;b<9;b++) 
				if(pflag&(0x80<<b))	r[b]+=lsget(2)/128;
		}
		else
		{ // byte matrix
			for(let b=0;b<9;b++) if(pflag&(0x80<<b))
				r[b]+=lsget(1)/128;
		}
	}

}

//************************************************************************************************************************************************************************************************************
//Load a 3D object stored in the Future Crew proprietary file format, original code in VISU/VISU.C, from line 9
//File format is composed of multiple chuncks containing vertices2D (X,Y,Z coordinates), normals coordinates, point index to build polygons 
//Data structures and file format can be seen in original source code: VISU/CD.H ,  data file is generated outside the demo by code  in VISU/C/SAVE.C 
function vis_loadobject(ObjectRawData)   
{
	
	const ObjectRawDataStr=new TextDecoder('ascii').decode(ObjectRawData);  //"String version" of our data object, useful for directly looking for Ascii strings
	let map_offset_index = new Map();   //file format contains direct offset in byte, as we change the data format we need to keep track of the association index in table vs offset in buffer
	let o= {};
	o.flags=F_DEFAULT;
	o.r = new Array(12);		o.r.fill(0.0);
	o.r0 = new Array(12);	o.r0.fill(0.0);
	o.pl=new Array();
	
	//read the stored 3d object data, chunk by chunk -------------------------------------------------
	let d=0;		//index in ObjectRawData
	while(d<ObjectRawData.length)
	{
		let d0=d;		//d0 pointer to the beginning of the chunk
		d+=8;			//d points to the beginning of the chunk data

		let chunkname=ObjectRawDataStr.substring(d0,d0+4);  //chunk name key
		let chunklength= Unsigned32FromByteBuffer(ObjectRawData,d0+4);
		
		if (chunkname=="NAME") o.name=ObjectRawDataStr.substring(d,d+chunklength);
		else if(chunkname=="VERT") //list of vertices2D of our 3d object --------------------------------
		{
			vnum=Unsigned16FromByteBuffer(ObjectRawData,d); d=d+4;
			o.v0= new Array(vnum);
			o.v = new Array(vnum);
			o.pv= new Array(vnum);
			for (let i=0; i < vnum; i++)  //Decode vertices2D, 16 bytes per vertices2D 
			{
				o.v0[i]={}; 
				o.v0[i].x= Signed32FromByteBuffer(ObjectRawData,d)/16384;	
				o.v0[i].y= Signed32FromByteBuffer(ObjectRawData,d+4)/16384;	
				o.v0[i].z= Signed32FromByteBuffer(ObjectRawData,d+8)/16384;	
				o.v0[i].NormalIndex= Signed16FromByteBuffer(ObjectRawData,d+12);	
				o.v[i]={}; 
				o.pv[i]={};				
				d=d+16;  //go to next vertice
			}
		}
		else if(chunkname=="NORM") //list of normals of our 3d object (8	bytes per normal) --------------
		{
			o.nnum =Unsigned16FromByteBuffer(ObjectRawData,d); d=d+2;
			o.nnum1=Unsigned16FromByteBuffer(ObjectRawData,d); d=d+2;
			o.n0= new Array(o.nnum);
			o.n = new Array(o.nnum);
			for (let i=0; i < o.nnum; i++)
			{
				o.n0[i]={}; 
				o.n0[i].x= Signed16FromByteBuffer(ObjectRawData,d)/16384;	
				o.n0[i].y= Signed16FromByteBuffer(ObjectRawData,d+2)/16384;	
				o.n0[i].z= Signed16FromByteBuffer(ObjectRawData,d+4)/16384;	
				o.n[i]={};  				
				d=d+8; //go to next normal
			}
		}
		else if(chunkname=="POLY") //polygons data of our 3d object ------------------------------------
		{
			d=d+2;  //skip ZERO word
			
			o.pd= new Array();   
			while(d<d0+chunklength+8) 
			{
				let poly={};
				map_offset_index.set(d-(d0+8),o.pd.length);  //remember which index is at which offset relative to the beginning of POLY chunk data (skip two null bytes)
				let sides=ObjectRawData[d]; d=d+1;
				if (sides==0) break;
				poly.flags=ObjectRawData[d]; d=d+1;
				poly.color=ObjectRawData[d]; d=d+2;	 //skip RESERVED byte

				poly.NormalIndex= Unsigned16FromByteBuffer(ObjectRawData,d); d=d+2;
				poly.vertex= new Array();
				for (let s=0;s<sides;s++) 
				{
					poly.vertex.push(Unsigned16FromByteBuffer(ObjectRawData,d)); d=d+2;
				}
				o.pd.push(poly);
			}
		}
		else if ((chunkname== "ORD0") ||  (chunkname== "ORDE")) //polygons lists of our 3d object ----------
		{
			chunkname== "ORD0"
			polylist_size= Unsigned16FromByteBuffer(ObjectRawData,d)-2; d=d+2;   //-2 to ignore size word and final 0
			polylist=new Array();
			for (let i=0; i < polylist_size; i++)  
			{
				polylist.push( Unsigned16FromByteBuffer(ObjectRawData,d));  d=d+2;
			}
			o.pl.push(polylist);
		}
		d=d0+chunklength+8;   //go to next chunk
	}
	// All chunk read ! ------------------------------ ------------------------------------------------- 
	// convert polylist from  memory offset  value (as stored in the file) to index value (because we don't use direct memory offset in JS!)
	for (let plindex=0; plindex<o.pl.length;plindex++)
	{
		polylist=o.pl[plindex];
		for (let i=1; i < polylist_size; i++)  //skip first
		{
			let offset=polylist[i];
			polylist[i]= map_offset_index.get(offset); //+1;
		}
	}
	return o;
	
	
}



//************************************************************************************************************************************************************************************************************
function lsget(f)  //function used by animation decoder, to read a 8 / 16 /32 bits signed words  in animation data(U2A.C:53)
{
	let	l;
	switch(f&3)
	{
		case 0 : 
			 l=0;  
			 break; 
		case 1 : 
			 l=Signed8FromByteBuffer(SceneAnimData, anim_pointer);
			 anim_pointer+=1;
			 break;
		case 2 : 
			 l=Signed16FromByteBuffer(SceneAnimData, anim_pointer);
			 anim_pointer+=2;
			 break;
		case 3 :
			 l=Signed32FromByteBuffer(SceneAnimData, anim_pointer);
			 anim_pointer+=4;
			 break;
	}
	return(l);
}

