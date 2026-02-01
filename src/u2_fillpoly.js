//U2 3D Engine: Polygon filling : Polygon clip functions


// Based on original code
// To reduce amount of work, these polygon filling functions are also used by all parts that need polygon fill (Glenz, Techno..)

// Gouraud shading and flat shading are implemented)
// Added function to write pixels with a "OR" function to support other parts (Glenz, Techno) parts

//TODO REMOVE DRAWGLENZ (ALPHA?)

//***********************************************************************************************************************************************************************************************************
// FillConvexPolygon: use same method as original code (Original Code: ADRAW.ASM, AVIDFILL.ASM), minor deviations may occur!
// Scan polygon from top to bottom, each time a segment on left or right side is finished a new "zone" is created.
// Then each zone is drawn (horizontal line by horizontal line)
// Polygons have to be clipped before drawing

function FillConvexPolygon( poly, drawglenz, DrawIndexedOR, IndexedBuff )   //poly_nrm function in Original code, addition option for an alternative rendering color  selection used by GLENZ part
{

	let PolygonDrawInfo={ };				//object that will collect Polygon Zones information
	let Coordinates=poly.vertices2D;		//shorter name
	if (Coordinates.length == 0) return;    // reject null polygons 

	let PolyInfo=FindPolygonTopBottom(Coordinates);  //will detect TopPoint and BottomPoint (index and value)
	if (PolyInfo.TopPoint_Y == PolyInfo.BottomPoint_Y)    return;  // if polygon is 0-height: avoid infinite loop below 
	
	//********* Create Polygons zones from top to bottom (new zone each time a segment is finished), PolygonDrawInfo will contain the zones data
	PolygonDrawInfo.Color= poly.color;
	PolygonDrawInfo.Top=PolyInfo.TopPoint_Y;
	PolygonDrawInfo.Zones=new Array();  //array describing Polygons zone 
	
	let PreviousLeftIndex,PreviousRightIndex, CurrentLeftIndex,CurrentRightIndex,DeltaYL,DeltaYR,CurrentY;

	CurrentLeftIndex=CurrentRightIndex=PolyInfo.TopPoint_Index;  // Everything starts from the top
	CurrentY =PolyInfo.TopPoint_Y;  // "polycury" in original code
	//---------------------------------------------------------------------------- Iterate to creat zones
	do  
	{
		//Left Side segment (it should be called Anti-Clockwise segment instead Left)):  ----------------------------------------------------------
		if ( Coordinates[CurrentLeftIndex].y == CurrentY) 
		{
			do 			//Left side segment change  : find next left side point index that make y progress 
			{
				PreviousLeftIndex=CurrentLeftIndex; 
				CurrentLeftIndex= GetPrevSideIndex(poly,CurrentLeftIndex); //get the next Left side point (rotate anti clockwise in the Coordinates list)
			} while (Coordinates[CurrentLeftIndex].y==Coordinates[PreviousLeftIndex].y)  //if no y change (flat segment), try next point
			DeltaYL=Coordinates[CurrentLeftIndex].y-Coordinates[PreviousLeftIndex].y
		}
		if (DeltaYL<0) break;  //if next point is going upward => end of polygon
		let RemainingYL=Coordinates[CurrentLeftIndex].y -CurrentY;  //height of the remaining part in the segment (segment can be cut later in the function) (polyRhigh in original code)
		let SegmentLeftParameters= ComputePolygonSegment(Coordinates,PreviousLeftIndex, CurrentLeftIndex,CurrentY,DeltaYL );

		//Right side (it should be called Clockwise segment instead Right):   ----------------------------------------------------------
		if ( Coordinates[CurrentRightIndex].y == CurrentY)
		{
			do //Right side segment change  : find next right side point index that make y progress 
			{
				PreviousRightIndex=CurrentRightIndex; 
				CurrentRightIndex= GetNextSideIndex(poly,CurrentRightIndex); //get the next Right side point (rotate clockwise in the Coordinates list)
			} while (Coordinates[CurrentRightIndex].y==Coordinates[PreviousRightIndex].y)  //if no y change (flat segment), try next point
			DeltaYR=Coordinates[CurrentRightIndex].y-Coordinates[PreviousRightIndex].y;
		}
		if (DeltaYR<0) break;  //if next point is going upward => end of polygon
		let RemainingYR=Coordinates[CurrentRightIndex].y -CurrentY; //height of the remaining part in the segment (segment can be cut later in the function) (polyRhigh in original code)
		let SegmentRightParameters = ComputePolygonSegment(Coordinates,PreviousRightIndex, CurrentRightIndex,CurrentY,DeltaYR ); 
		//----------------------------------------------------------------------------
		let Zone={};  //add a new zone to the list
		Zone.Side1=SegmentLeftParameters;   //Side 1 (may be actual left or right)
		Zone.Side2=SegmentRightParameters;  //Side 2 (may be actual right or left)
		Zone.Height=Math.min(RemainingYL,RemainingYR);  //We have one segment for Left, one for Right, the zone ends when ends of shorter segment is reached
		PolygonDrawInfo.Zones.push(Zone);  //store the zone in the Array
		
		CurrentY+=Zone.Height;  //we've progessed in the polygon
	} 
	while (true);  //loop will exit when bottom of polygon reached using above "break"  statements
	if (DrawIndexedOR) FillDrawPolygonIndexedOR(PolygonDrawInfo, IndexedBuff);
	else if (drawglenz) FillDrawPolygonZonesAlpha(PolygonDrawInfo)  //for GLENZ part
	else FillDrawPolygonZones(PolygonDrawInfo);  //for U2A/U2E part
}

// ********** FindPolygonTopBottom: Scan the Coordinates list to find the top and bottom of the polygon 
function FindPolygonTopBottom(Coordinates)
{
	
	let TopPoint_Y, BottomPoint_Y, TopPoint_Index,BottomPoint_Index;
			
	BottomPoint_Y = TopPoint_Y = Coordinates[TopPoint_Index = BottomPoint_Index = 0].y;  //initial setup based on index 0 nefore iterating on all other points
	for (i = 1; i < Coordinates.length; i++) 
	{
		if (Coordinates[i].y < TopPoint_Y)
			TopPoint_Y = Coordinates[TopPoint_Index = i].y; // new upper point 
		else if (Coordinates[i].y > BottomPoint_Y)
			BottomPoint_Y = Coordinates[BottomPoint_Index = i].y; // new lower point 
	}
	//store the result in the returned object
	let PolyInfo= {};
	PolyInfo.TopPoint_Y=TopPoint_Y;
	PolyInfo.TopPoint_Index=TopPoint_Index
	PolyInfo.BottomPoint_Y=BottomPoint_Y;  //no need for Bottom point index
	return  PolyInfo;
}
//***********************************************************************************************************************************************************************************************************

//ComputePolygonSegment: used to compute polygon segment parameters (beginning and slope) (POLYSIDECALC macro in original code)
function ComputePolygonSegment(Coordinates,IndexFrom, IndexTo, CurrentY,DeltaY)  
{
	SegmentParams={};
	let X1=  Coordinates[IndexFrom].x;
	let X2=  Coordinates[IndexTo].x;
	let Y2=  Coordinates[IndexTo].y;
	
	SegmentParams.InvSlope= (X2-X1)/DeltaY;
	SegmentParams.XStart= X2-  SegmentParams.InvSlope * ( Y2-CurrentY);   //handles already started segment  (the function can be called several times for same segment at diffent CurrentY)
	return SegmentParams;
}

//***********************************************************************************************************************************************************************************************************
//Draw the polygon zones
//(drawfill_nrm in original code, original code optimises horizontal line drawing, by writing in VRAM by block up to 4 pixels at a time using VGA Mode X advantages)
function FillDrawPolygonZones(PolygonDrawInfo)
{
	let X,Y,XLeft,XRight,ZoneHeight,X1,X2,Slope1,Slope2;
	let color_index= PolygonDrawInfo.Color;    //U2E/U2A,  provide the color index

	let Ymul=PolygonDrawInfo.Top*320; 
	PolygonDrawInfo.Zones.forEach((Zone)=> // We'll now draw each zone starting from the top 
	{
		ZoneHeight=Zone.Height;
		X1= Zone.Side1.XStart; 
		X2= Zone.Side2.XStart;
		Slope1= Zone.Side1.InvSlope;
		Slope2= Zone.Side2.InvSlope;
		for (Y=0;Y<ZoneHeight;Y++)	//draw all horizontal lines in the zone
		{	
			//up to now we're not sure of which side is left or not (we've just decided to read polygon index from top in clockwise way for one side and anti-clockwise for the other, but we have no clue of actuel Left or right position)
			XLeft= Math.round(Math.min(X1,X2));
			XRight= Math.round(Math.max(X1,X2));  

			for (X = XLeft; X <= XRight; X++) IndexedFrameBuffer[X+Ymul]=color_index;  //draw the scanline (also draw rightmost pixel (X2) may generate small polygon overlap, but provides better result on "CR" of final Future Crew Logo)
			X1+=Slope1;
			X2+=Slope2;
			Ymul+=320;  //skip to next line 
		}
	});
}



//***********************************************************************************************************************************************************************************************************
//Draw the polygon zones in the frame buffer, write the pixel in a OR mode to manage transparency (used by GLENZ part)

//(drawfill_nrm in original code, original code optimises horizontal line drawing, by writing in VRAM by block up to 4 pixels at a time using VGA Mode X advantages)
function FillDrawPolygonIndexedOR(PolygonDrawInfo,IndexedBuffer)
{
	let X,Y,XLeft,XRight,ZoneHeight,X1,X2,Slope1,Slope2;
	let r1,g1,b1,r2,g2,b2;
	let indexed_color=PolygonDrawInfo.Color;   //GLENZ will directlky provide the rgba_color
	

	let Ymul=PolygonDrawInfo.Top*320;  
	PolygonDrawInfo.Zones.forEach((Zone)=> // We'll now draw each zone starting from the top 
	{
		ZoneHeight=Zone.Height;
		X1= Zone.Side1.XStart; 
		X2= Zone.Side2.XStart;
		Slope1= Zone.Side1.InvSlope;
		Slope2= Zone.Side2.InvSlope;
		for (Y=0;Y<ZoneHeight;Y++)	//draw all horizontal lines in the zone
		{	
			//up to now we're not sure of which side is left or not (we've just decided to read polygon index from top in clockwise way for one side and anti-clockwise for the other, but we have no clue of actuel Left or right position)
			XLeft= Math.round(Math.min(X1,X2));
			XRight= Math.round(Math.max(X1,X2));  

			for (X = XLeft; X < XRight; X++)    //no extral pixel else transparent polygon will overlap, which doesn't look good
			{
				//blend the pixels will write a blendedpixel of opacity 1
				IndexedBuffer[X+Ymul]|=indexed_color;  //draw the scanline (also draw rightmost pixel (X2) may generate small polygon overlap, but provides better result on "CR" of final Future Crew Logo)
			}
			X1+=Slope1;
			X2+=Slope2;
			Ymul+=320;  //skip to next line 
		}
	});
}
//***********************************************************************************************************************************************************************************************************
// Advance the index by one Coordinates forward through the Coordinates list, wrapping at the end of the list 
 function GetNextSideIndex(poly,currentSideIndex)  //SIDE_INDEX_FORWARD in Michael Abrash's code
 {
	return ( (currentSideIndex + 1) % poly.vertices2D.length);
 }	 
 
//***********************************************************************************************************************************************************************************************************
 // Advance the index by one Coordinates backward through the Coordinates list, wrapping at the start of the list 
 function GetPrevSideIndex(poly,currentSideIndex)  //SIDE_INDEX_BACKWARD in Michael Abrash's code
 {
	return ( (currentSideIndex - 1 + poly.vertices2D.length) % poly.vertices2D.length);
 }	

//***********************************************************************************************************************************************************************************************************
//***********************************************************************************************************************************************************************************************************
//***********************************************************************************************************************************************************************************************************
//Same code as FillConvexPolygonGouraud with additional color interpolation

 function FillConvexPolygonGouraud( poly )   //poly_grd function in Original code
 {
 
	 let PolygonDrawInfo={ };				//object that will collect Polygon Zones information
	 let Coordinates=poly.vertices2D;		//shorter name
	 if (Coordinates.length == 0) return;    // reject null polygons 
 
	 let PolyInfo=FindPolygonTopBottom(Coordinates);  //will detect TopPoint and BottomPoint (index and value)
	 if (PolyInfo.TopPoint_Y == PolyInfo.BottomPoint_Y)    return;  // if polygon is 0-height: avoid infinite loop below 
	 
	 //********* Create Polygons zones from top to bottom (new zone each time a segment is finished), PolygonDrawInfo will contain the zones data
	 
	 PolygonDrawInfo.Top=PolyInfo.TopPoint_Y;
	 PolygonDrawInfo.Zones=new Array();  //array describing Polygons zone 
	 
	 let PreviousLeftIndex,PreviousRightIndex, CurrentLeftIndex,CurrentRightIndex,DeltaYL,DeltaYR,CurrentY;
 
	 CurrentLeftIndex=CurrentRightIndex=PolyInfo.TopPoint_Index;  // Everything starts from the top
	 CurrentY =PolyInfo.TopPoint_Y;  // "polycury" in original code
	 //---------------------------------------------------------------------------- Iterate to creat zones
	 do  
	 {
		 //Left Side segment (it should be called Anti-Clockwise segment instead Left)):  ----------------------------------------------------------
		 if ( Coordinates[CurrentLeftIndex].y == CurrentY) 
		 {
			 do 			//Left side segment change  : find next left side point index that make y progress 
			 {
				 PreviousLeftIndex=CurrentLeftIndex; 
				 CurrentLeftIndex= GetPrevSideIndex(poly,CurrentLeftIndex); //get the next Left side point (rotate anti clockwise in the Coordinates list)
			 } while (Coordinates[CurrentLeftIndex].y==Coordinates[PreviousLeftIndex].y)  //if no y change (flat segment), try next point
			 DeltaYL=Coordinates[CurrentLeftIndex].y-Coordinates[PreviousLeftIndex].y
		 }
		 if (DeltaYL<0) break;  //if next point is going upward => end of polygon
		 let RemainingYL=Coordinates[CurrentLeftIndex].y -CurrentY;  //height of the remaining part in the segment (segment can be cut later in the function) (polyLhigh in original code)
		 let SegmentLeftParameters= ComputePolygonSegmentGouraud(Coordinates,PreviousLeftIndex, CurrentLeftIndex,CurrentY,DeltaYL );
 
		 //Right side (it should be called Clockwise segment instead Right):   ----------------------------------------------------------
		 if ( Coordinates[CurrentRightIndex].y == CurrentY)
		 {
			 do //Right side segment change  : find next right side point index that make y progress 
			 {
				 PreviousRightIndex=CurrentRightIndex; 
				 CurrentRightIndex= GetNextSideIndex(poly,CurrentRightIndex); //get the next Right side point (rotate clockwise in the Coordinates list)
			 } while (Coordinates[CurrentRightIndex].y==Coordinates[PreviousRightIndex].y)  //if no y change (flat segment), try next point
			 DeltaYR=Coordinates[CurrentRightIndex].y-Coordinates[PreviousRightIndex].y;
		 }
		 if (DeltaYR<0) break;  //if next point is going upward => end of polygon
		 let RemainingYR=Coordinates[CurrentRightIndex].y -CurrentY; //height of the remaining part in the segment (segment can be cut later in the function)  (polyRhigh in original code)
		 let SegmentRightParameters = ComputePolygonSegmentGouraud(Coordinates,PreviousRightIndex, CurrentRightIndex,CurrentY,DeltaYR );
		 //----------------------------------------------------------------------------
		 let Zone={};  //add a new zone to the list
		 Zone.Side1=SegmentLeftParameters;   //Side A (may be actual left or right)
		 Zone.Side2=SegmentRightParameters;  //Side B (may be actual right or left)
		 Zone.Height=Math.min(RemainingYL,RemainingYR);  //We have one segment for Left, one for Right, the zone ends when ends of shorter segment is reached
		 PolygonDrawInfo.Zones.push(Zone);  //store the zone in the Array
		 
		 CurrentY+=Zone.Height;  //we've progessed in the polygon
	 } 
	 while (true);  //loop will exit when bottom of polygon reached using above "break"  statements
	 FillDrawPolygonZonesGouraud(PolygonDrawInfo);
 }
 
//***********************************************************************************************************************************************************************************************************
//ComputePolygonSegment: used to compute and store polygon segment parameters (beginning of and slope) (POLYSIDECALC_GRD macro in original code)
function ComputePolygonSegmentGouraud(Coordinates,IndexFrom, IndexTo, CurrentY,DeltaY)  
{
	SegmentParams={};
	let X1=  Coordinates[IndexFrom].x;
	let X2=  Coordinates[IndexTo].x;
	let Y2=  Coordinates[IndexTo].y;
	let Color1 = Coordinates[IndexFrom].color;
	let Color2 = Coordinates[IndexTo].color;
	
	SegmentParams.ColorSlope= (Color2-Color1)/DeltaY;
	SegmentParams.ColorStart= Color2 - SegmentParams.ColorSlope * ( Y2-CurrentY) ;    //  differs from original code, that use the fact that color is continous from one zone to ther other

	SegmentParams.InvSlope= (X2-X1)/DeltaY;
	SegmentParams.XStart= X2-  SegmentParams.InvSlope * ( Y2-CurrentY);   //handles already started segment  (the function can be called several times for same segment at diffent CurrentY)
	return SegmentParams;
}

//***********************************************************************************************************************************************************************************************************
function FillDrawPolygonZonesGouraud(PolygonDrawInfo)
{
	let ColorHSlope,Color,XLeft,XRight,X,Y,Color1,Color2,ZoneHeight,X1,X2,Slope1,Slope2,Color1VSlope,Color2VSlope;
	let Ymul=PolygonDrawInfo.Top*320;  
	
	
	PolygonDrawInfo.Zones.forEach((Zone)=> // We'll now draw each zone starting from the top 
	{
		
		ZoneHeight=Zone.Height;
		X1= Zone.Side1.XStart; 
		X2= Zone.Side2.XStart;
		Slope1= Zone.Side1.InvSlope;
		Slope2= Zone.Side2.InvSlope;
	
		Color1=Zone.Side1.ColorStart;
		Color2=Zone.Side2.ColorStart;
		 
		Color1VSlope= Zone.Side1.ColorSlope;  //Slope for color interpolation along the segment 1 
		Color2VSlope= Zone.Side2.ColorSlope;
		
		for (Y=0;Y<ZoneHeight;Y++)	//draw all horizontal lines in the zone
		{	
			//up to now we're not sure of which side is left or not (we  decided to read polygon index from top in clockwise way for one side and anti-clockwise for the other, but we have no clue of actuel Left or right position)
			
			XLeft= Math.round(Math.min(X1,X2));
			XRight= Math.round(Math.max(X1,X2));  
			
			if (XLeft!=XRight) ColorHSlope=(Color2-Color1)/(X2-X1); else ColorHSlope=0;
			Color=Color1; //initial value	for this scanline	
			if (X2<X1) Color=Color2;   //initial color changes if Left/Right reversed
			
			for (X = XLeft; X < XRight; X++) 
			{
				IndexedFrameBuffer[X+Ymul]=Math.round(Color);  //draw the scanline (also draw rightmost pixel (X2) may generate small polygon overlap, but provides better result on Future Crew Logo)
				Color+=ColorHSlope;	//interpolate color horizontally
			}
			X1+=Slope1;
			X2+=Slope2;
			Color1+=Color1VSlope;  //Vertical interpolation of color for side 1
			Color2+=Color2VSlope;  //Vertical interpolation of color for side 2
			Ymul+=320;  //skip to next line //TODO ADAPT TO FRAME BUFFER
		}
	});
}

