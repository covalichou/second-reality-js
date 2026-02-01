

// JS implementation of
//
//   ___  ____  ___  _____  _  _  ____     ____  ____    __    __    ____  ____  _  _ 
//  / __)( ___)/ __)(  _  )( \( )(  _ \   (  _ \( ___)  /__\  (  )  (_  _)(_  _)( \/ )
//  \__ \ )__)( (__  )(_)(  )  (  )(_) )   )   / )__)  /(__)\  )(__  _)(_   )(   \  / 
//  (___/(____)\___)(_____)(_)\_)(____/   (_)\_)(____)(__)(__)(____)(____) (__)  (__) 
//
//                    ┌─────────────────────────────────────────┐
//                    │  ■ The winning demo of Assembly'1993 ■  │
//                    └─────────────────────────────────────────┘
//
//                                       O r i g i n a l   b y   F u t u r e   C r e w



// Main file, manage all Parts


const Config=
{
    MusicSync: true,    //if false all parts/sequence linked to a music event will terminate quickly
    DemoLoop: true
}

/* Original parts organization (from MAIN\U2.ASM)
exemus  db 'STARTMUS.EXE'
exe0    db 'START.EXE'
exe     db 'ALKU.EXE','Alkutekstit I (WILDF)'
exe2    db 'U2A.EXE', 'Alkutekstit II (PSI)'
exe3a   db 'PAM.EXE','Alkutekstit III (TRUG/WILDF)'
exe3    db 'BEGLOGO.EXE'
exe4    db 'GLENZ.EXE','Glenz (PSI)'
exe5    db 'TUNNELI.EXE','Dottitunneli (TRUG)' 
exe6    db 'TECHNO.EXE','Techno (PSI)'
exe7    db 'PANICEND.EXE','Panicfake (WILDF)' 
exe9    db 'MNTSCRL.EXE','Vuori-Scrolli (TRUG)'   
exe1112 db 'LNS&ZOOM.EXE','Lens (PSI) + Rotazoomer (PSI)' 
exe1314 db 'PLZPART.EXE','Plasma (WILDF) + Plasmacube (WILDF)'
exe15   db 'MINVBALL.EXE','MiniVectorBalls (PSI)'
exe16   db 'RAYSCRL.EXE','Peilipalloscroll (TRUG)'
exe17   db '3DSINFLD.EXE','3D-Sinusfield (PSI)'
exe18   db 'JPLOGO.EXE','Jellypic (PSI)'
exe19   db 'U2E.EXE', 'Vector Part II (PSI)',0
exe2021 db 'ENDLOGO.EXE', 'Endpictureflash (?) '
exe22   db 'CRED.EXE', 'Credits (?)'
exe23   db 'ENDSCRL.EXE','Greetings scrl (WILDFIRE)
exehid  db 'DDSTARS.EXE','Hidden part'
*/
// Parts organisation in JS implementation:
// Parts is an array of Part objects, each representing a part of the demo sequence.
const Parts=[
    STARTMUS(),                                                //                                                  
    ALKU(),                   // Text + scrolling of landscape //   1                               
    U2A(),                    // 3D ships                      //   2
    PAM(),                    // explosion                     //   3
    BEGLOGO(),                // Title screen                  //   4
    MusicChanger1(),          // change song                   //   5                        
    GLENZ_TRANSITION(),       // checkerboard fall             //   6           
    GLENZ_3D(),               // Bouncing Glenz vectors        //   7   
    TUNNELI(),                // Tunnel effect;                //   8                   
    TECHNO_CIRCLES(),         // Circle interferences          //   9                                   
    TECHNO_BARS_TRANSITION(), // 4 bars music synced           //  10                    
    TECHNO_BARS(),            // Bar interferences             //  11
    TECHNO_TROLL(),           // Troll picture                 //  12
    FOREST(),                 // Another way to scroll         //  13
    LENS_TRANSITION(),        // Lens picture comes in         //  14
    LENS_LENS(),              // Lens bouncing                 //  15
    LENS_ROTO(),              // Lens rotating face            //  16
    PLZ_PLASMA(),             // Smoky/cloudy Plasma effect    //  17
    PLZ_CUBE(),               // Textured Plasma cube          //  18
    DOTS(),                   // Dot tunnel                    //  19
    WATER(),                  // "raytraced" scrolling sword   //  20 
    COMAN(),                  // 3D sinusfield                 //  21   
    JPLOGO(),                 // Jellypic                      //  22  
    PartDelay(),              // wait before changing music    //  23
    MusicChanger2(),          // change song                   //  24                        
    U2E(),                    // Vector part II                //  25
    ENDLOGO(),                // End picture                   //  26
    CREDITS(),                // Credits                       //  27
    ENDSCRL(),                // Greetings scroll              //  28
    MusicFinalFadeout()       // final music fade out         //  29
]; 




//TODO check which timing variables are actually used!

// variables used for managing part sequences:
let CurrentPartIndex;
let InitialDemoTimestamp;
let	FirstDemoCycle;
let isPartInitialized;
let isFirstRunningCycle;
let HasPartEnded;
let CurrentSyncPoint;
let LastSyncPointChangeTimestamp; //used to compute time elapsed since last sync point change
let MUSIC0_SUSPENDED;  //used to manage songs sequences

// variable set by parts:
let PartName;  //set by current part
let PartTargetFrameRate;  //in FPS (set by current part), false: animation is run at original demo speed, 1: animation is sync to screen refresh rate may look smooth but may  repeat some animations



//variables that can used by parts to manage animation speed (regardless of screen refresh rate or actual rendering rate)
let ActualTimestamp;   //set by part manager, Position in demo (in ms)
let CurrentTimestamp;   //set by part manager, Position in current part (in ms)
let PreviousTimestamp;  //set by part manager, previous CurrentTimestamp value
let CurrentPartAdditionalDelay; //set by part manager
let CurrentAnimationFrame;   // provide current expected Animation frame according to time (independent of actual screen refresh rate or computer performances)
let CurrentAnimationFrameFloored;   // integer part of CurrentAnimationFrame variable
let CurrentSyncPointTime;   //time elapsed since last sync point change
let CurrentSyncPointFrame;  //Animation frame elapsed since last sync point change
let AnimationFramesToRender;  //number of animation frames to progress in this screen refresh
let ActualRenderedAnimationFrame; //number of animation frames rendered in current part


let mainscreen = {};
//*******************************************************************************
// Main entry point of the demo.   init has to be called in the HTML file loading the script
// (the function needs to be declared in "window" scope  in order to be called by the unpacker, when running the single packed HTML file release,)
window.init = function()
{
    Init_Data();
    
    MUSIC0_SUSPENDED=false;
    //init screen
	mainscreen=new canvas(640,400,"main");
    mainscreen.contex.imageSmoothingEnabled = false;  //disable image smoothing (canva is 640x400 and we use 320x200 or 320x400, we don't want image smoothing)
	InitGraphics();

    //init music player
    InitMusicPlayer();

	//go!
	requestAnimFrame( FrameUpdateCallback ); //start main loop

}	

//*******************************************************************************

// Init demo global variables
 function Init_Data()
 {
    CurrentPartIndex = 0;
    PreviousTimestamp=0;
    InitialDemoTimestamp=0;
    CurrentSyncPoint=-1;
    LastSyncPointChangeTimestamp=-1;
    FirstDemoCycle=true;
    isPartInitialized=false;
    isFirstRunningCycle=false;
    HasPartEnded=false;
 }

//*****************************************************************************
//Called Each time a frame is requested (max rate=Screen refresh rate)
//this function schedule each frame of each parts
function FrameUpdateCallback(Timestamp)
{
	//Compute current Timestamp (position in the demo)
	if (FirstDemoCycle)
	{		
        InitialDemoTimestamp=Timestamp;
        FirstDemoCycle=false;
	}
	ActualTimestamp=	Math.round(Timestamp-InitialDemoTimestamp);
	RunPart(ActualTimestamp);
    SpecificFrameProcessing();
	//*************************** 

	requestAnimFrame( FrameUpdateCallback ); //ask to be called back when it's time to generate the next frame
}

//*******************************************************************************
//RunPart: function called each time a new frame has to be rendered
// it initializes the current part if not already done, and calls its update function until part ends. 
// When part is over, it increments the CurrentPartIndex to move to the next part.

function RunPart(Timestamp)
{
    CurrentTimestamp=Timestamp-CurrentPartAdditionalDelay;
    if (CurrentPartIndex < Parts.length) 
    {
        UpdateSyncInfo();
        let CurrentPart = Parts[CurrentPartIndex];
        if (!isPartInitialized) //first cycle of the part
        {
            
            HasPartEnded=false;
            CurrentAnimationFrame=CurrentAnimationFrameFloored=0;
            CurrentPartAdditionalDelay=Timestamp;
            CurrentTimestamp=Timestamp-CurrentPartAdditionalDelay;  
            ActualRenderedAnimationFrame=0;
            PreviousTimestamp= CurrentTimestamp; //store for next cycle
            CurrentPart.init();   //Initialise part and set PartName
            isPartInitialized = true;
            isFirstRunningCycle=true;
            console.log("Starting part: " + PartName);  
        }

        else if (!HasPartEnded)   // part running
        {   // Most common PC screens run at 60Hz but we may encounter different refresh rate  in different hardware (e.g. 75Hz, 120Hz, 144Hz on PC or smartphone with 60Hz, 90Hz, 120Hz)
            // Second reality was adjusted to run (on most parts) on 70Hz screen refresh rate
            // we want to respect demo length, but preserve smoothness as much as possible 
            // some parts can run longer and "loop", some other are designed to run an exact number of frames
            // Parts manager provides progress data to parts according to a "virtual" animation frame rate (70Hz).
            if (isFirstRunningCycle)   //First running cycle, ajdust timers to take in account initialisation time
            {
                isFirstRunningCycle=false;
                CurrentPartAdditionalDelay=Timestamp;
                CurrentTimestamp=0;
            }
            // run part for next frame
            CurrentAnimationFrame= CurrentTimestamp/1000*PartTargetFrameRate ;
            CurrentAnimationFrameFloored=Math.floor(CurrentAnimationFrame);
            CurrentSyncPointFrame=CurrentSyncPointTime/1000*PartTargetFrameRate;  //frame elapsed since last sync point change
            AnimationFramesToRender=CurrentAnimationFrameFloored-ActualRenderedAnimationFrame;  //number of animation frames to progress in this screen refresh
            if (AnimationFramesToRender<0) AnimationFramesToRender=0; //happens in some case, when part is waiting and increasing CurrentPartAdditionalDelay
            
            CurrentPart.update(Timestamp);   //Call the part update function
            ActualRenderedAnimationFrame=CurrentAnimationFrameFloored;
            PreviousTimestamp= CurrentTimestamp; //store for next cycle
        }
        else //part finished
        {
            CurrentPart.end();
            isPartInitialized=false;
           
            CurrentPartIndex++;
            if (CurrentPartIndex < Parts.length) 
                console.log("Part '" + PartName+ "' ended. Moving to next part.");
            else 
                console.log("Part '" + PartName+ "' ended. All parts completed.");
        }
    }
}

//*******************************************************************************
function UpdateSyncInfo()
{   
    let s=dis_sync();  //get current sync point index
    if (s!=CurrentSyncPoint)
    {
        LastSyncPointChangeTimestamp=CurrentTimestamp; //store time of last sync point change
        CurrentSyncPoint=s;
		let SyncPointName="unknown";
        if (s!= undefined) SyncPointName= dis_sync_table[s].name;

        console.log("SYNC POINT CROSSED: "+CurrentSyncPoint+ " ("+ SyncPointName+")" +" Timestamp="+ActualTimestamp);
    }
    CurrentSyncPointTime=CurrentTimestamp-LastSyncPointChangeTimestamp   //time elapsed since last sync point change
}

//*******************************************************************************
function ResetPartClock()
{
    CurrentPartAdditionalDelay=ActualTimestamp;
}


//*******************************************************************************
// The function below is called each frames, it perform actions out of part scope that have to be done at a specific moment
// (first music has to be stopped at a specific moment)

function SpecificFrameProcessing()
{
    //Stop music during title screen 
    if ((IsDisSyncPointReached("MUSIC0_STOP") && (PartName=="BEGLOGO")) && (!MUSIC0_SUSPENDED))
    {
        console.log("Suspend first song, next part will start second song");
        MusicPause();
        MUSIC0_SUSPENDED=true;
    }
    

}
