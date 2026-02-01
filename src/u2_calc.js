//U2 3D Engine:  3D/2D Math computations


function normallight(NormalVector)
{
	let x = NormalVector.x; 
	let y = NormalVector.y;
	let z = NormalVector.z;
	
	let dotp = (x * scene_light[0] + y * scene_light[1] + z * scene_light[2]) / (16384) * 128;  //dot product between normal and light vector (result [-128,+128])
	dotp += 128;
	dotp=clip(dotp,0,255);
	return dotp;
}


//************************************************************************************************************************************************************************************************************
// transformation 3d coodinates -> 2D screen coordinates (with clipping)
function calc_projection(ProjectedVertexListDest, VertexListSrc)
{
	for (let index=0; index<VertexListSrc.length; index++)  //for each vertice, check clipping and project
	{
		let clipping_flags=0;
		let x=VertexListSrc[index].x;
		let y=VertexListSrc[index].y;
		let z=VertexListSrc[index].z;
		
		if (z<  ClippingZ[0])   clipping_flags |= VF_NEAR;  //zmin
		if (z>  ClippingZ[1])   clipping_flags |= VF_FAR;  //zmax
		
		let y_proj = (y*Projection2DYFactor/z) + Projection2DYOffset;
		if (y_proj < ClippingY[0]) clipping_flags |= VF_UP  ;  //ymin
		if (y_proj > ClippingY[1]) clipping_flags |= VF_DOWN;  //ymax

		let x_proj = (x*Projection2DXFactor/z) + Projection2DXOffset;
		if (x_proj <  ClippingX[0]) clipping_flags |= VF_LEFT  ; //xmin
		if (x_proj >  ClippingX[1]) clipping_flags |= VF_RIGHT ; //xmax
		
		ProjectedVertexListDest[index].x=Math.round(x_proj);
		ProjectedVertexListDest[index].y=Math.round(y_proj);
		ProjectedVertexListDest[index].clipping_flags=clipping_flags;
	}
}
//************************************************************************************************************************************************************************************************************
// apply rotation matrix and add translation vector, to a vertex list
// TODO SEPARATE 3x3 matrix + vector (instead of 9 + 3 values in same array)
function calc_rotate_translate(vertexlistdest, vertexlistsrc, rmatrix)
{
	for (let index=0; index<vertexlistsrc.length; index++)
	{
			let src=vertexlistsrc[index];
			let dst=vertexlistdest[index];
		
			dst.x= Math.round( (src.x * rmatrix[0] + src.y * rmatrix[1]+ src.z * rmatrix[2]) +rmatrix[9]);  
			dst.y= Math.round( (src.x * rmatrix[3] + src.y * rmatrix[4]+ src.z * rmatrix[5]) +rmatrix[10]);
			dst.z= Math.round( (src.x * rmatrix[6] + src.y * rmatrix[7]+ src.z * rmatrix[8]) +rmatrix[11]);  //tests have shown that rounding is necessary for correct drawing order
			
			dst.NormalIndex=src.NormalIndex; ///tODO rename normal en NormalVeIndex
	}
}

//************************************************************************************************************************************************************************************************************
// apply rotation matrix to a vertex list (same as calc_rotate without the translation vector)
function calc_nrotate(vertexnumber, vertexlistdest, vertexlistsrc, rmatrix)
{
	for (let index=0; index<vertexnumber; index++)
	{
			let src=vertexlistsrc[index];
			let dst=vertexlistdest[index];
		
			dst.x= (src.x * rmatrix[0] + src.y * rmatrix[1]+ src.z * rmatrix[2]);
			dst.y= (src.x * rmatrix[3] + src.y * rmatrix[4]+ src.z * rmatrix[5]);
			dst.z= (src.x * rmatrix[6] + src.y * rmatrix[7]+ src.z * rmatrix[8]);
	}
}
//************************************************************************************************************************************************************************************************************
//original function in AVID.ASM:60 (original FC function works with angle 0..65535 angle range, instead of 0..360°), here angle in degrees is used
function vid_cameraangle(fov_value_deg)
{
	
	let new_fov=fov_value_deg  / 2.0;
	if (new_fov<3.0) new_fov=3.0;    //min  3.0°
	if (new_fov>90.0) new_fov=90.0;  //max 90.0°
	
	Projection2DXFactor= (ClippingX[1]-Projection2DXOffset) /Math.tan(new_fov * Math.PI/180);  //original AVISTAN table is a 1/TAN lookup table
	Projection2DYFactor = Projection2DXFactor*Projection2DXYAspectRatio;
}


//************************************************************************************************************************************************************************************************************
function calc_matrix()
{
	
		// Calc matrices and add to order list (only enabled objects)
		order=new Array();
		
		for(let a=1;a<co.length;a++)  // start at object index 1 to skip camera 
			if(co[a].on) 			  // if object enabled
			{
				order.push(a);  // prepare order table for forthcoming sort
				o=co[a].o;
				calc_applyrmatrix(o.r,o.r0,cam);
			
				b=o.pl[0][0]; // center vertex
				
				co[a].dist= calc_singlez(b,o.v0,o.r);
				if(co[a].o.name[1]=='_') co[a].dist=1000000000;  //TU2E specific : quickfix to draw all building floors before other objects (order drawing algorithm does not work for floor objects!)
				
				if(CurrentAnimationFrame>900 && CurrentAnimationFrame<1100) // U2E specific (force drawing of the spaceship as last object, in a given animation timeframe (else it become uncorrectly hidden by a building wall)
				{
					if(co[a].o.name[1]=='s' &&
					   co[a].o.name[2]=='0' &&
					   co[a].o.name[3]=='1')
						co[a].dist=1;
				}

			}
}


//************************************************************************************************************************************************************************************************************
// TODO SEPARATE 3x3 matrix + vector (instead of 9 + 3 values in same array)
// compute rotation matrix and transaltion vector
// original code in ACALC.ASM:
function calc_applyrmatrix(dest, src, apply)
{
		// 1) Apply camera transformation matrix (multiply matrix ( dest = source * apply))
		dest[0]= (apply[0]*src[0] + apply[1]*src[3] + apply[2]*src[6]);  //line 1
		dest[1]= (apply[0]*src[1] + apply[1]*src[4] + apply[2]*src[7]);
		dest[2]= (apply[0]*src[2] + apply[1]*src[5] + apply[2]*src[8]);
		
		dest[3]= (apply[3]*src[0] + apply[4]*src[3] + apply[5]*src[6]);  //line 2
		dest[4]= (apply[3]*src[1] + apply[4]*src[4] + apply[5]*src[7]);
		dest[5]= (apply[3]*src[2] + apply[4]*src[5] + apply[5]*src[8]);

		dest[6]= (apply[6]*src[0] + apply[7]*src[3] + apply[8]*src[6]);  //line 3
		dest[7]= (apply[6]*src[1] + apply[7]*src[4] + apply[8]*src[7]);
		dest[8]= (apply[6]*src[2] + apply[7]*src[5] + apply[8]*src[8]);
		
		// 2) transform object translation vector in the camera frame (rotatesingle)
		
		
		let Trans_VecX = (src[9 ]*apply[0] + src[10]*apply[1] + src[11]*apply[2]);
		let Trans_VecY=  (src[9 ]*apply[3] + src[10]*apply[4] + src[11]*apply[5]);
		let Trans_VecZ=  (src[9 ]*apply[6] + src[10]*apply[7] + src[11]*apply[8]);

		
		// 3) apply the translation:   
		dest[9]=  Trans_VecX + apply[9] ;
		dest[10]= Trans_VecY + apply[10];
		dest[11]= Trans_VecZ + apply[11];
		
}
//************************************************************************************************************************************************************************************************************
//descr: Rotates the single vertex and returns the resulting Z coordinate.
//entry:	vertex=number of the vertex to process
//			vertexlist=list from which to pick the vertex
//			rmatrix= the rotation matrix
//			return rotated Z coordinate  of the vertes

function calc_singlez(vertex, vertexlist, rmatrix)
{
		return ( (vertexlist[vertex].x * rmatrix[6]+vertexlist[vertex].y * rmatrix[7] +vertexlist[vertex].z * rmatrix[8]  )   + rmatrix[11]);
}
