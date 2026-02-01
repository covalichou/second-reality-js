


// This file contains customised modplayer functions. It just add new functions or overrides existing methods of the class.
// modplayer is (c) 2012-2021 Noora Halme et al. 
// https://github.com/electronoora/webaudio-mod-player
//


//*************************************************************************************************************
//seek: Allow seeking to a specific position in song
// (this is a new modplayer function, 
// some tests show that in some cases, music must be stopped to correctly take in accound all effects for fi
Modplayer.prototype.seek = function(position,row)
{
  if (this.player) {
    this.player.tick=0;
    this.player.row=row;
    this.player.position=position;
    this.player.flags=1+2;
    if (this.player.position<0) this.player.position=0;
    if (this.player.position >= this.player.songlen) this.stop();
  }
}

//*************************************************************************************************************
// load module from local buffer
// (this is a copy of the load modplayer function, modified in order to use an already available buffer, and support only S3M format

Modplayer.prototype.myload = function(buffer)
{
	let i;
	this.format='s3m';
	this.player=new Screamtracker();
	this.loading=true;

	this.state="parsing..";
	console.log( this.state);
	if (this.player.parse(buffer)) 
	{
		// copy static data from player
		this.title=this.player.title
		this.signature=this.player.signature;
		this.songlen=this.player.songlen;
		this.channels=this.player.channels;
		this.patterns=this.player.patterns;
		this.filter=this.player.filter;
		if (this.context) this.setfilter(this.filter);
		this.mixval=this.player.mixval; // usually 8.0, though
		this.samplenames=new Array(32)
		for(i=0;i<32;i++) this.samplenames[i]="";

		for(i=0;i<this.player.sample.length;i++) this.samplenames[i]=this.player.sample[i].name;
		console.log( this.state);
		this.state="ready.";
		this.loading=false;
		
		if (this.autostart) this.play();
		console.log("buffer parsed");
	} 
}

//*************************************************************************************************************
//Additional seek function (needed because one S3M song) has to be split in 2 (used at the beginning and the end, other music is for the middle)
//This quick implementation  is not perfect for seeking in every moment (in some cases some effect are not correctly managed), but enough for the demo to run
Modplayer.prototype.seek = function(position,row)   
{
  if (this.player) {
    this.player.tick=0;
    this.player.row=row;
    this.player.position=position;
    this.player.flags=1+2;
    if (this.player.position<0) this.player.position=0;
    if (this.player.position >= this.player.songlen) this.stop();
  }
}

//*************************************************************************************************************
// pause playback
Modplayer.prototype.pause = function()
{
  	if (this.player) 
	{
		//console.log("my customised pause");
		this.player.paused=true;
	}
}

//*************************************************************************************************************
// resume paused playback
Modplayer.prototype.resume = function()
{
	if (this.player) 
	{
		//console.log("my customised resume");
		this.player.paused=false;
	}
}


