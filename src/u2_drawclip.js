//U2 3D Engine: Polygon filling : Polygon clip functions


// Based on original code
// To reduce amount of work, these polygon filling functions are also used by all parts that need polygon fill (Glenz, Techno..)


// ClipPolygonZ:  input: polygon to clip (Cut the polygon in parts, remore too near parts)
// 			output: return a modified polygon, 

function ClipPolygonZ (poly_in)
{
	let sides= poly_in.vertices2D.length;
	let poly_out={};
	poly_out.flags=poly_in.flags;
	poly_out.color=poly_in.color;
	poly_out.vertices2D=new Array();


		//ZCLIPCLIP in original code-------------------------------

		let pu1 = poly_in.vertices3D[0];  
		let pv1 = poly_in.vertices2D[0];
		let zlimit= ClippingZ[0];
		let col1,col2;
		if  (poly_in.flags & F_GOURAUD)  col1= pv1.color;
		let index=0;
		for (i = 0; i < sides; i++) //iterate on each segment of the polygon (last segment is from last polygon point to first polygon point)
		{
			
			index++; if (index==sides) index=0;  
			
			let pu2= poly_in.vertices3D[index];  
			let pv2 =poly_in.vertices2D[index];  
			let z1=pu1.z;
			let z2=pu2.z;
			if (poly_in.flags & F_GOURAUD) col2=pv2.color;
				
			
			if ((z1 >= zlimit) && (z2 >= zlimit))  //this segment is not clipped, add end point of segment to the list of segment
			{
				let nv={ };
				nv.x = pv2.x;
				nv.y = pv2.y;
				if (poly_in.flags & F_GOURAUD) nv.color=col2;
				poly_out.vertices2D.push(nv);
			} 
			else if ((z1 >= zlimit) && (z2 < zlimit))  //this segment enters in the clipped zone 
			{

		
				let newx2 = pu1.x + (zlimit-z1)* (pu2.x-pu1.x) / (z2-z1); //compute the x intersection with Z clipping plan
				let newy2 = pu1.y + (zlimit-z1)* (pu2.y-pu1.y) / (z2-z1); //compute the y intersection with Z clipping plan
				let nv={ };
				nv.x = Math.round((newx2*Projection2DXFactor/zlimit) + Projection2DXOffset); // new projected coordinates
				nv.y = Math.round((newy2*Projection2DYFactor/zlimit) + Projection2DYOffset);
				if (poly_in.flags & F_GOURAUD) nv.color=Math.round(col1 + (zlimit-z1)* (col2-col1) / (z2-z1));
				poly_out.vertices2D.push(nv);
			}
			else if ((z1 < zlimit) && (z2 >= zlimit)) //this segment leaves  the clipped zone , we create a point at clipped zone intersection, and add the second extremity
			{

				let x2=pu2.x;
				let y1=pu1.y;
				let y2=pu2.y;
				let newx2 = pu1.x +  (zlimit-z1)* (pu2.x-pu1.x) / (z2-z1); //compute the x intersection with Z clipping plan
				let newy2 = pu1.y +  (zlimit-z1)* (pu2.y-pu1.y) / (z2-z1); //compute the y intersection with Z clipping plan
				let nv={ };
				nv.x=  Math.round((newx2*Projection2DXFactor/zlimit)) + Projection2DXOffset; // new projected coordinates
				nv.y = Math.round((newy2*Projection2DYFactor/zlimit)) + Projection2DYOffset;
				if (poly_in.flags & F_GOURAUD) nv.color=Math.round(col1 + (zlimit-z1)* (col2-col1) / (z2-z1));
				poly_out.vertices2D.push(nv);
				let nv2={ };
				nv2.x = pv2.x;
				nv2.y = pv2.y;
				if (poly_in.flags & F_GOURAUD) nv2.color=col2;
				poly_out.vertices2D.push(nv2);
			}  
			//nothing to do if both segment points are Z clipped

			pu1=pu2; //end of segment becomes beginning of next
			pv1=pv2;
			if (poly_in.flags & F_GOURAUD) col1=col2;
			
		
		}

	return poly_out;
}

function ClipPolygonUp (poly_in)
{
	let sides= poly_in.vertices2D.length;
	if (sides==0) return poly_in;
	let poly_out={};
	poly_out.flags=poly_in.flags;
	poly_out.color=poly_in.color;
	poly_out.vertices2D=new Array();
	let pv1 = poly_in.vertices2D[0];
	let ylimit= ClippingY[0];
	let col1,col2;
	if  (poly_in.flags & F_GOURAUD)  col1= pv1.color;
	let index=0;
	for (i = 0; i < sides; i++) //iterate on each segment of the polygon (last segment is from last polygon point to first polygon point)
	{
		index++; if (index==sides) index=0;  
		let pv2 =poly_in.vertices2D[index];  
		let y1=pv1.y;
		let y2=pv2.y;
		if (poly_in.flags & F_GOURAUD) col2=pv2.color;
		if ((y1 >= ylimit) && (y2 >= ylimit))  //this segment is not clipped, add end point of segment to the list of segment
		{
			let nv={ };
			nv.x = pv2.x;
			nv.y = pv2.y;
			if (poly_in.flags & F_GOURAUD) nv.color=col2;
			poly_out.vertices2D.push(nv);
		} 
		else if ((y1 >= ylimit) && (y2 < ylimit))  //this segment enters in the clipped zone 
		{
			let nv={ };
			nv.x = Math.round(pv1.x + (ylimit-y1)* (pv2.x-pv1.x) / (y2-y1)); //compute the x intersection with Y limit 
			nv.y = ylimit;
			if (poly_in.flags & F_GOURAUD) nv.color=Math.round(col1 + (ylimit-y1)* (col2-col1) / (y2-y1));
			poly_out.vertices2D.push(nv);
		}
		else if ((y1 < ylimit) && (y2 >= ylimit)) //this segment leaves  the clipped zone , we create a point at clipped zone intersection, and add the second extremity to the polygon
		{
			let nv={ };
			nv.x = Math.round(pv1.x +  (ylimit-y1)* (pv2.x-pv1.x) / (y2-y1)); //compute the x intersection with Y limit 
			nv.y = ylimit;
			if (poly_in.flags & F_GOURAUD) nv.color=Math.round(col1 + (ylimit-y1)* (col2-col1) / (y2-y1));
			poly_out.vertices2D.push(nv);
			
			let nv2={ };
			nv2.x = pv2.x;
			nv2.y = pv2.y;
			if (poly_in.flags & F_GOURAUD) nv2.color=col2;
			poly_out.vertices2D.push(nv2);
		}  
		//nothing to do if both segment points are Z clipped
		pv1=pv2; // the end of segment becomes beginning of next
		if (poly_in.flags & F_GOURAUD) col1=col2;
	}
	return poly_out;
}

function ClipPolygonDown (poly_in)
{
	let sides= poly_in.vertices2D.length;
	if (sides==0) return poly_in;
	let poly_out={};
	poly_out.flags=poly_in.flags;
	poly_out.color=poly_in.color;
	poly_out.vertices2D=new Array();
	let pv1 = poly_in.vertices2D[0];
	let ylimit= ClippingY[1];
	let col1,col2;
	if  (poly_in.flags & F_GOURAUD)  col1= pv1.color;
	let index=0;
	for (i = 0; i < sides; i++) //iterate on each segment of the polygon (last segment is from last polygon point to first polygon point)
	{
		index++; if (index==sides) index=0;  
		let pv2 =poly_in.vertices2D[index];  
		let y1=pv1.y;
		let y2=pv2.y;
		if (poly_in.flags & F_GOURAUD) col2=pv2.color;
		if ((y1 <= ylimit) && (y2 <= ylimit))  //this segment is not clipped, add end point of segment to the list of segment
		{
			let nv={ };
			nv.x = pv2.x;
			nv.y = pv2.y;
			if (poly_in.flags & F_GOURAUD) nv.color=col2;
			poly_out.vertices2D.push(nv);
		} 
		else if ((y1 <= ylimit) && (y2 > ylimit))  //this segment enters in the clipped zone 
		{
			let nv={ };
			nv.x = Math.round(pv1.x + (ylimit-y1)* (pv2.x-pv1.x) / (y2-y1)); //compute the x intersection with Y limit 
			nv.y = ylimit;
			if (poly_in.flags & F_GOURAUD) nv.color=Math.round(col1 + (ylimit-y1)* (col2-col1) / (y2-y1));
			poly_out.vertices2D.push(nv);
		}
		else if ((y1 > ylimit) && (y2 <= ylimit)) //this segment leaves  the clipped zone , we create a point at clipped zone intersection, and add the second extremity to the polygon
		{
			let nv={ };
			nv.x = Math.round(pv1.x +  (ylimit-y1)* (pv2.x-pv1.x) / (y2-y1)); //compute the x intersection with Y limit 
			nv.y = ylimit;
			if (poly_in.flags & F_GOURAUD) nv.color=Math.round(col1 + (ylimit-y1)* (col2-col1) / (y2-y1));
			poly_out.vertices2D.push(nv);
			let nv2={ };
			nv2.x = pv2.x;
			nv2.y = pv2.y;
			if (poly_in.flags & F_GOURAUD) nv2.color=col2;
			poly_out.vertices2D.push(nv2);
		}  
		//nothing to do if both segment points are Z clipped
		pv1=pv2; // the end of segment becomes beginning of next
		if (poly_in.flags & F_GOURAUD) col1=col2;
	}
	return poly_out;
}



function ClipPolygonLeft (poly_in)
{
	let sides= poly_in.vertices2D.length;
	if (sides==0) return poly_in;
	let poly_out={};
	poly_out.flags=poly_in.flags;
	poly_out.color=poly_in.color;
	poly_out.vertices2D=new Array();
	let pv1 = poly_in.vertices2D[0];
	let xlimit= ClippingX[0];
	let col1,col2;
	if  (poly_in.flags & F_GOURAUD)  col1= pv1.color;
	let index=0;
	for (i = 0; i < sides; i++) //iterate on each segment of the polygon (last segment is from last polygon point to first polygon point)
	{
		index++; if (index==sides) index=0;  
		let pv2 =poly_in.vertices2D[index];  
		let x1=pv1.x;
		let x2=pv2.x;
		if (poly_in.flags & F_GOURAUD) col2=pv2.color;
		if ((x1 >= xlimit) && (x2 >= xlimit))  //this segment is not clipped, add end point of segment to the list of segment
		{
			let nv={ };
			nv.x = pv2.x;
			nv.y = pv2.y;
			if (poly_in.flags & F_GOURAUD) nv.color=col2;
			poly_out.vertices2D.push(nv);
		} 
		else if ((x1 >=xlimit) && (x2 < xlimit))  //this segment enters in the clipped zone 
		{
			let nv={ };
			nv.x = xlimit;
			nv.y = Math.round(pv1.y +  (xlimit-x1)* (pv2.y-pv1.y) / (x2-x1)); //compute the y intersection with Y limit 
			if (poly_in.flags & F_GOURAUD) nv.color=Math.round(col1 + (xlimit-x1)* (col2-col1) / (x2-x1));
			poly_out.vertices2D.push(nv);
		}
		else if ((x1 < xlimit) && (x2 >= xlimit)) //this segment leaves  the clipped zone , we create a point at clipped zone intersection, and add the second extremity to the polygon
		{
			let nv={ };
			nv.x = xlimit;
			nv.y = Math.round(pv1.y +  (xlimit-x1)* (pv2.y-pv1.y) / (x2-x1)); //compute the y intersection with Y limit 
			if (poly_in.flags & F_GOURAUD) nv.color=Math.round(col1 + (xlimit-x1)* (col2-col1) / (x2-x1));
			poly_out.vertices2D.push(nv);
			let nv2={ };
			nv2.x = pv2.x;
			nv2.y = pv2.y;
			if (poly_in.flags & F_GOURAUD) nv2.color=col2;
			poly_out.vertices2D.push(nv2);
		}  
		//nothing to do if both segment points are Z clipped
		pv1=pv2; // the end of segment becomes beginning of next
		if (poly_in.flags & F_GOURAUD) col1=col2;
	}
	return poly_out;
}



function ClipPolygonRight (poly_in)
{
	let sides= poly_in.vertices2D.length;
	if (sides==0) return poly_in;
	let poly_out={};
	poly_out.flags=poly_in.flags;
	poly_out.color=poly_in.color;
	poly_out.vertices2D=new Array();
	let pv1 = poly_in.vertices2D[0];
	let xlimit= ClippingX[1];
	let col1,col2;
	if  (poly_in.flags & F_GOURAUD)  col1= pv1.color;
	let index=0;
	for (i = 0; i < sides; i++) //iterate on each segment of the polygon (last segment is from last polygon point to first polygon point)
	{
		index++; if (index==sides) index=0;  
		let pv2 =poly_in.vertices2D[index];  
		let x1=pv1.x;
		let x2=pv2.x;
		if (poly_in.flags & F_GOURAUD) col2=pv2.color;
		if ((x1 <= xlimit) && (x2 <= xlimit))  //this segment is not clipped, add end point of segment to the list of segment
		{
			let nv={ };
			nv.x = pv2.x;
			nv.y = pv2.y;
			if (poly_in.flags & F_GOURAUD) nv.color=col2;
			poly_out.vertices2D.push(nv);
		} 
		else if ((x1 <=xlimit) && (x2 > xlimit))  //this segment enters in the clipped zone 
		{
			let nv={ };
			nv.x = Math.round(pv1.x +  (xlimit-x1)* (pv2.x-pv1.x) / (x2-x1)); //compute the x intersection with Y limit 
			nv.y = Math.round(pv1.y +  (xlimit-x1)* (pv2.y-pv1.y) / (x2-x1)); //compute the y intersection with Y limit 
			if (poly_in.flags & F_GOURAUD) nv.color=Math.round(col1 + (xlimit-x1)* (col2-col1) / (x2-x1));
			poly_out.vertices2D.push(nv);
		}
		else if ((x1 > xlimit) && (x2 <= xlimit)) //this segment leaves  the clipped zone , we create a point at clipped zone intersection, and add the second extremity to the polygon
		{
			let nv={ };
			nv.x = Math.round(pv1.x +  (xlimit-x1)* (pv2.x-pv1.x) / (x2-x1)); //compute the x intersection with Y limit 
			nv.y = Math.round(pv1.y +  (xlimit-x1)* (pv2.y-pv1.y) / (x2-x1)); //compute the y intersection with Y limit 
			if (poly_in.flags & F_GOURAUD) nv.color=Math.round(col1 + (xlimit-x1)* (col2-col1) / (x2-x1));
			poly_out.vertices2D.push(nv);
			let nv2={ };
			nv2.x = pv2.x;
			nv2.y = pv2.y;
			if (poly_in.flags & F_GOURAUD) nv2.color=col2;
			poly_out.vertices2D.push(nv2);
		}  
		//nothing to do if both segment points are Z clipped
		pv1=pv2; // the end of segment becomes beginning of next
		if (poly_in.flags & F_GOURAUD) col1=col2;
	}
	return poly_out;
}

