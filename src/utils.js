// Miscellaneous utility functions used by several demo parts (to load data, manage time, etc.)
//************************************************************************************************************************************************************************************************************
//return true if value is included in [min,max] interval
function between(ts, min, max) 
{
  return ts >= min && ts <= max;
}

//************************************************************************************************************************************************************************************************************
//clip a value between min and max
function clip(val, min, max) 
{
  if (val<min) return min;
  if(val>max) return max;
  return val;
}


//************************************************************************************************************************************************************************************************************
//convert a base64 string to a byteArray
function Base64toArray(base64) 
{
  const binString = atob(base64);
  return Uint8Array.from(binString, (m) => m.codePointAt(0));
}

//************************************************************************************************************************************************************************************************************
function Signed8FromByteBuffer(buffer, index)
{
    let value = buffer[index];
    if (value & 0x80)
        return -((~value)& 0xFF) - 1;
    else
        return value;
}

//************************************************************************************************************************************************************************************************************
function Unsigned16FromByteBuffer(buffer, index)
{
    let value = (buffer[index]) |  (buffer[index+1] << 8);
    return value;
}
//************************************************************************************************************************************************************************************************************
function Signed16FromByteBuffer(buffer, index)
{
    let value = (buffer[index]) |  (buffer[index+1] << 8);
    if (value & 0x8000)
        return -((~value)& 0xFFFF) - 1;
    else
        return value;
}



//************************************************************************************************************************************************************************************************************
function Unsigned32FromByteBuffer(buffer, index)
{
    let value = ( buffer[index] ) |  (buffer[index+1] << 8) |  (buffer[index+2] << 16) |  (buffer[index+3] << 24);
    return value;
}

//************************************************************************************************************************************************************************************************************
function Signed32FromByteBuffer(buffer, index)
{
   let value = ( buffer[index] ) |  (buffer[index+1] << 8) |  (buffer[index+2] << 16) |  (buffer[index+3] << 24);
   if (value & 0x80000000)
         return  -((~value)& 0xFFFFFFFF) - 1;
    else
        return value;
}

//************************************************************************************************************************************************************************************************************
function Unsigned24FromByteBuffer(buffer, index)
{
   let value = ( buffer[index] ) |  (buffer[index+1] << 8) |  (buffer[index+2] << 16) ;
   return value;
}
//************************************************************************************************************************************************************************************************************
function Signed24FromByteBuffer(buffer, index)
{
   let value = ( buffer[index] ) |  (buffer[index+1] << 8) |  (buffer[index+2] << 16) ;
   if (value & 0x800000)
         return  -((~value)& 0xFFFFFF) - 1;
    else
        return value;
}

//************************************************************************************************************************************************************************************************************
function SignedValueFromByte(byte)
{
    let value = byte;
    if (value & 0x80)
        return -((~value)& 0xFF) - 1;
    else
        return value;
}
//************************************************************************************************************************************************************************************************************
//convert RGBA to JS RGBA value
function rgbToHex (r, g, b) 
{
  const rgb = (r << 16) | (g << 8) | (b << 0);
  return '#' + (0x1000000 + rgb).toString(16).slice(1);
}


//************************************************************************************************************************************************************************************************************
// Interpolate a value from an array 
// (as we can run at different refresh rate as original data, some angles/position can be interpolated)
function InterpolateCycle(data, cycle) 
{
  const lastIndex = data.length - 1;
  if (cycle <= 0) return data[0];
  if (cycle >= lastIndex) return data[lastIndex];

  const lowerIndex = Math.floor(cycle);
  const upperIndex = Math.ceil(cycle);

  if (lowerIndex === upperIndex) return data[lowerIndex];

  const t = cycle - lowerIndex; 
  const valueA = data[lowerIndex];
  const valueB = data[upperIndex];

  return valueA * (1 - t) + valueB * t;
}

//************************************************************************************************************************************************************************************************************
//function needed to decode picture file in FC Format (will provide palette data or a pixel row)
//Pixel Encoding is a RLE algorithm, used to pack identical consecutive pixels
function readp(dest, row, src)  /// Original function in beg/readp.c
{
	let a,b;
	//header data extract
	let magic= Unsigned16FromByteBuffer(src, 0);
	let wid= Unsigned16FromByteBuffer(src, 2);
	let hig= Unsigned16FromByteBuffer(src,4);
	let cols= Unsigned16FromByteBuffer(src,6);
	let add= Unsigned16FromByteBuffer(src,8);

	
	if(row==-1)  //request to process palette data
	{
		for (let i=0;i<dest.length;i++)
		{
			dest[i]=src[i+16];
		}
		return;
	}
	//else  request to extract  a specific row
	if(row>=hig) return;
	let srcindex=add*16;
	while(row)  //move srcindex to the requested row
	{
		srcindex+= Unsigned16FromByteBuffer(src,srcindex);
		srcindex+=2;
		row--;
	}
	let bytes= Unsigned16FromByteBuffer(src,srcindex);
	srcindex+=2;
	let rowendindex= srcindex+bytes;
	let destindex=0;
	// unpack the row
	do
	{
		let n;
		let b=src[srcindex];
		srcindex++;
		if (b<=127) n=1; //l2: highest bit is 0 => single pixel
		else  //l1: else high bit is 1, remaining bits give number of identical pixels
		{
			n=b&127;
			b=src[srcindex];  //next byte gives the pixel value
			srcindex++;
		}
		for (let i=0; i<n;i++)
		{
				dest[destindex]=b;
				destindex++;
		}
		if (srcindex>=rowendindex) return;
	} while (1)
}

//************************************************************************************************************************************************************************************************************
