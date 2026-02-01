//******************************************************************************************************************************************************

let MUSIC_SPEED_GAIN=[1.00370,1.00231]; // slight music speed adjustment to match with reference video  

//********************************************************************************************************************************************
// ordersync1 in original source code: DIS/DISINT.ASM (point of synchronisation between effects/music)
// Modified here to manage ALL demo sync events in one place (original code uses only 10 first index and then use other functions such as dis_getmframe to synchronize)
// Adjusted for my implementation, for better match with  reference video 
// Events in dis_sync_table must be set in correct order (from start to end of demo) 
// Events have a name. Parts are checking if sync point is reached using the name.


const dis_sync_table= [
	 { music: 0	, position :  0		, row:  0	, name:"DEMO_START"             },	// 	 
	 { music: 0	, position :  2		, row:  2	, name:"ALKU_TEXT1"             },	// part 01 "Future crew production" start
	 { music: 0	, position :  3		, row:  2	, name:"ALKU_TEXT2"             },	// part 01 "First Presented" start
	 { music: 0	, position :  3		, row:  2	, name:"ALKU_TEXT2"             },	// part 01 "First Presented" start
	 { music: 0	, position :  3		, row: 53	, name:"ALKU_TEXT3"             },	// part 01 "in Dolby" start
     { music: 0	, position :  4		, row: 48	, name:"ALKU_LANDSCAPE"         },	// part 01  to start fade in and scrolling landscape
   	 { music: 0	, position :  6		, row:  2	, name:"ALKU_TEXT4"             },	// part 01  "Graphics..."
	 { music: 0	, position :  7 	, row:  2	, name:"ALKU_TEXT5"             },	// part 01  "Music ..." start
	 { music: 0	, position :  8 	, row:  2  	, name:"ALKU_TEXT6"             },	// part 01 "Code ... " start
 	 { music: 0	, position :  9 	, row:  2	, name:"ALKU_TEXT7"             },	// part 01"Additional Design..."
	 { music: 0	, position : 10     , row: 60	, name:"ALKU_EXIT"              },	// part 01 exit 
	 { music: 0	, position : 11 	, row: 48	, name:"U2A_START"              },	// part 02 U2A:  ships animation start
	 { music: 0	, position : 13 	, row:  1 	, name:"PAM_START"              },	// part 03 PAM to trigger explosion start
	 { music: 0	, position : 13	    , row: 42   , name:"MUSIC0_STOP"            },	// part 04 end of first music just after explosion
	 { music: 1	, position :  2  	, row: 46	, name:"CHECKERBOARD_FALL"      },	// Part 05 fall of checkerboard
	 { music: 1	, position :  4   	, row: 28	, name:"GLENZ_START"            },	// Part 05 Glenz 3D start
	 { music: 1	, position : 17  	, row:  0	, name:"TECHNO_CIRCLES2_START"  },	// Part "Techno" start of purple plasma
	 { music: 1	, position : 21  	, row: 48 	, name:"TECHNO_CIRCLES2_END"    },	// Part "Techno" end of purple plasma
     { music: 1	, position : 21  	, row: 52	, name:"TECHNO_BARS_TRANSITION" },	// Part "Techno" Blue Bar sequence start
	 { music: 1	, position : 22  	, row:  0 	, name:"TECHNO_BAR1"            },	// Part "Techno" Blue Bar 1 fall
	 { music: 1	, position : 22  	, row:  8 	, name:"TECHNO_BAR2"            },	// Part "Techno" Blue Bar 2 fall
	 { music: 1	, position : 22  	, row: 16 	, name:"TECHNO_BAR3"            },	// Part "Techno" Blue Bar 3 fall
 	 { music: 1	, position : 22  	, row: 24 	, name:"TECHNO_BAR4"            },	// Part "Techno" Blue Bar 4 fall
	 { music: 1	, position : 22  	, row: 31 	, name:"TECHNO_BAR_FINAL_FLASH" },	// Part "Techno" Final flash start after Blue Bar 4 fall
	 { music: 1	, position : 30  	, row: 50 	, name:"TECHNO_TROLL" 			},	// Part "Techno" Monster picture display starts
	 { music: 1	, position : 32  	, row: 56 	, name:"TECHNO_TROLL_CRT" 		},	// Part "Techno" Monster picture display fade starts
	 { music: 1	, position : 35  	, row:  5 	, name:"FOREST_START"			},	// Part "FOREST" green leaves fade in
     { music: 1	, position : 35  	, row: 20 	, name:"FOREST_SCROLL"          },	// Part "FOREST" start the scroller
	 { music: 1	, position : 38  	, row: 50 	, name:"FOREST_FADEOUT"         },	// Part "FOREST" fade out
	 { music: 1	, position : 39  	, row:  0 	, name:"LENS_TRANSITION_START"  },	// Part "LENS" face picture comes in
	 { music: 1	, position : 40  	, row: 30 	, name:"LENS_BOUNCE"            },	// Part "LENS": boucing lens comes in
 	 { music: 1	, position : 44  	, row:  2 	, name:"LENS_ROTO"              },	// Part "LENS": rotation part starts
	 { music: 1	, position : 52    	, row:  0 	, name:"PLZ_START"              },	// Part "PLZ" plasma start
	 { music: 1	, position : 53  	, row:  56 	, name:"PLZ_DROP1"              },	// Part "PLZ" 1st plasma drop
	 { music: 1	, position : 55  	, row:  56 	, name:"PLZ_DROP2"              },	// Part "PLZ" 2nd plasma drop
	 { music: 1	, position : 56  	, row:  56 	, name:"PLZ_DROP3"              },	// Part "PLZ" 3rd plasma drop
	 { music: 1	, position : 57  	, row:  15 	, name:"PLZ_CUBE_START"         },	// Part "PLZ" start of textured cube
	 { music: 1	, position : 64  	, row:  63 	, name:"PLZ_CUBE_END"           },	// Part "PLZ" End of textured cube
	 { music: 1	, position : 74  	, row:  63 	, name:"DOTS_END"               },	// Part "DOTS" end 
	 { music: 1	, position : 75  	, row:  5 	, name:"WATER_START"			},	// Part "WATER" green leaves fade in
     { music: 1	, position : 76  	, row:  18 	, name:"WATER_SCROLL"           },	// Part "WATER" start the scroller
	 { music: 1	, position : 78  	, row:  52 	, name:"WATER_FADEOUT"          },	// Part "WATER" fade out
	 { music: 1	, position : 79  	, row:   0 	, name:"COMAN_START"            },	// Part "COMAN" start
	 { music: 1	, position : 82  	, row:  32  , name:"COMAN_SCROLL_DOWN"      },	// Part "COMAN" transition
	 { music: 1	, position : 84  	, row:   0  , name:"MUSIC1_STOP"   	  	    },	// Music change when JPLOGO displayed
	 { music: 0	, position : 14  	, row:   5  , name:"U2E_START"   		    },	// Start of the part (fade transition
	 { music: 0	, position : 15  	, row:   0  , name:"U2E_ANIM"   		    },	// Actual animation start
	 { music: 0	, position : 21  	, row:  19  , name:"U2E_FINALFADE"   	    },  // fade to white 
	 { music: 0	, position : 21  	, row:  27  , name:"U2E_END"   	            },  // end of U2E part
	 { music: 0	, position : 23  	, row:   0  , name:"CREDITS_START"          },  // start of credit part
	 { music: 0	, position : 39  	, row:   0  , name:"CREDITS_END"            },  // end of credit part, final music fade out
	 

	];
// This file contains the main functions for handling the music player (web-audio-mod-player)
// global variables to manage music,
let GLOBAL_MUSIC_SPEED_GAIN;
const Musics= [music0s3m_base64,music1s3m_base64];
let MusicPlayer=new Array(Musics.length);
let MusicData=new Array(Musics.length);
let MusicPlayer_in_progress=-1;
let DisSyncMap = new Map();


//******************************************************************************************************************************************************
function InitMusicPlayer()
{
	//build DisSyncMap from dis_sync_table to quickly access sync points by name
	for (let i=0; i<dis_sync_table.length; i++)
			DisSyncMap.set(dis_sync_table[i].name, i);
	
	const Musics= [music0s3m_base64,music1s3m_base64];
	for (let p=0;p<Musics.length;p++)
	{
		MusicPlayer[p]=new Modplayer();	
		MusicData[p]= Base64toArray(Musics[p]);
		MusicData[0][50]=0x78;   //slightly reduce tempo (125 to 120) before playing by patching byte value in first S3M song  (originial source code MAIN/STARTMUS.C line 257 : module[50]=0x78;) 
		MusicPlayer[p].myload(MusicData[p]);
		MusicPlayer[p].play();		
		MusicPlayer[p].pause();  //Ready to resume when needed
	}
}	

//****************************************************************************************************************************************************** 
//DIS/DISINT.ASM line 449: return the current sync event according to music position
//adaptated to manage 2 music files and the table above to manage all sync points in the demo
function dis_sync()
{
	if ((MusicPlayer_in_progress<0) || (MusicPlayer_in_progress>1)) return -1;
	if (!Config.MusicSync) return dis_sync_table.length+1;  //If no sync expected => tell we already are after all events
	let table_index=0;
	let position = MusicPlayer[MusicPlayer_in_progress].position;
	let row = MusicPlayer[MusicPlayer_in_progress].row;
	
	for (let i=0; i< dis_sync_table.length; i++)
	{	
		if (MusicPlayer_in_progress==dis_sync_table[i].music)
		{
			if (position>dis_sync_table[i].position) table_index=i;
			else if ((position==dis_sync_table[i].position) && (row>dis_sync_table[i].row)) table_index=i;
		}	
	}
	return table_index;
}

//****************************************************************************************************************************************************** 
function dis_musrow()
{
	if ((MusicPlayer_in_progress<0) || (MusicPlayer_in_progress>1)) return 0;
	return MusicPlayer[MusicPlayer_in_progress].row;
}
//******************************************************************************************************************************************************
function IsDisSyncPointReached(name)
{
	let index=DisSyncMap.get(name);
	if (index===undefined) return false; //name not found in sync table
	if (dis_sync() >= index) return true; //sync point reached
	return false; //sync point not reached
}
//********************************************************************************************************************************************
function music_change(music, position,row)
{
	
	console.log("music_change to " + music + " position=" + position + " row=" + row + "  music= " + music 	) ; //TODO REMOVE
	GLOBAL_MUSIC_SPEED_GAIN=MUSIC_SPEED_GAIN[music];
	for (let i=0; i<Musics.length; i++)  //pause all the music expect the requested one, seek to new position
	{
	
		if (i!=music)  //i is not the expected song, paue it
		{
			MusicPlayer[i].pause();
			//console.log ("pause: "  + i);  //TODO REMOVE
		}
		else if ( MusicPlayer_in_progress==music)  //i is the expected song and is currently the one in progress, no song change
		{
			MusicPlayer[i].seek(position,row);   
			console.log ("seek without song change: "  + i);  //TODO REMOVE
		}
		else  //we need to change song
		{
			MusicPlayer[i].resume();  //unpause
			//console.log ("resume: "  + i);  //TODO REMOVE
			if  ((position!=0) || (row!=0) || (music!=0)) 
				MusicPlayer[i].seek(position,row);   //workaround (because player does not sound correctly after seek to (0,0) when currently at 0,0, this request happens once, at demo start)

		}
	}
	MusicPlayer_in_progress=music;
	
}
//******************************************************************************************
function MusicPause()
{
	if ((MusicPlayer_in_progress<0) || (MusicPlayer>=Musics.length)) return ;
	MusicPlayer[MusicPlayer_in_progress].pause();
		
}

//******************************************************************************************
function MusicResume()
{
	if ((MusicPlayer_in_progress<0) || (MusicPlayer>=Musics.length)) return ;
	MusicPlayer[MusicPlayer_in_progress].resume();

}


//******************************************************************************************
//**** Additional Minimal Parts, called by part manager,  in charge of changing music during demo 
function STARTMUS() 
{
let MUSIC_SPEED_GAIN=[1.00370,1.00365]; // slight speed adjustment to match with reference video  
	return { init: () => { PartName = "Music Starter";},   update: () => { music_change(0,0,0); HasPartEnded=true;},  end: () => { }};
}

function MusicChanger1() 
{
	return { init: () => { PartName = "Music Changer1"; },  update: () => { music_change(1,0,0); HasPartEnded=true;},  end: () => { }};
}

function MusicChanger2() 
{
	return { init: () => { PartName = "Music Changer2"; },  update: () => { music_change(0,14,0); HasPartEnded=true;},  end: () => { }};
}

//additional part fade out at music at demo end
let TSTART;
function MusicFinalFadeout() 
{
	return { init: () => { PartName = "Music fade out";TSTART=Date.now(); },  update: () => { MusicPlayer[MusicPlayer_in_progress].player.volume=clip(64-Math.floor(64/2*(Date.now()-TSTART)/1000),0,64); if  (MusicPlayer[MusicPlayer_in_progress].player.volume==0 ) HasPartEnded=true;},  end: () => { }};
}


//additional part to create a delay before switching MusicChanger2
function PartDelay() 
{
	return { init: () => { PartName = "Wait"; TSTART=Date.now()},  update: () => { if (Date.now()-TSTART>1800) HasPartEnded=true;},  end: () => { }};
}