# 📂 Source Code Architecture

This directory contains the complete source code for the **Second Reality JavaScript port**. The project is structured to mirror the original demo's sequence while providing a clean, modular approach.

---

## 🏗️ Core Engine & Logic
These files handle the foundation of the demo: parts orchestration, graphics rendering, and music handling and synchronization.

| File | Role |
| :--- | :--- |
| **`main.js`** | The entry point. Manages the global timer, scene transitions, and the main loop. |
| **`main.html`** | The main (very basic) page, calling script in main.js |
| **`utils.js`** | General helper functions (math, binary manipulations, etc.). |
| **`graphics.js`** | Core pixel and VGA palette  manipulation routines and VGA-to-Canvas abstraction. |
| **`MusicPlayer.js`** | High-level controller for the music player (webaudio-mod-player). Contains synchronisation points |
| **`customised-webaudio-mod-player.js`** | Override of some webaudio-mod-player function (to load file from base64) |

---

## 🎬 The Demo Parts (Sequence)
Each file corresponds to a specific scene from the original 1993 masterpiece.

| Part | File | Description |
| :---: | :--- | :--- |
| 01 | `part01_ALKU.js` | Intro (text+scrolling landscape). |
| 02 | `part02_U2A.js` |  Intro, 3D engine part (spaceships over background) |
| 03 | `part03_PAM.js` |  Intro, explosion! |
| 04 | `part04_BEGLOGO.js` | Second Reality logo. |
| 05 | `part05_GLENZ_TRANSITION.js` | Chessboard is falling before Glenz |
| 06 | `part06_GLENZ_3D.js` | Bouncing Glenz vectors |
| 07 | `part07_TUNNELI.js` | Tunnel. |
| 08 | `part08_TECHNO_CIRCLES.js` | Techno part  (Circles interference) |
| 09 | `part09_TECHNO_TRANSITION.js` | Techno part  transition (1,2,3,4 bars) |
| 10 | `part10_TECHNO_BARS` | Techno part (Bars interferences) |
| 11 | `part11_TECHNO_TROLL.js` | "Troll" picture with CRT TV shutdown effect |
| 12 | `part12_FOREST.js` | Forest scroller |
| 13 | `part13_LENS_TRANSITION.js` | Transition before Lens effect (picture appears) |
| 14 | `part15_LENS_LENS.js` | Boucing Lens effect |
| 15 | `part15_LENS_ROTO.js` | Atomic playboy roto-zoomer |
| 16 | `part16_PLZ_PLASMA.js` | Smoky Plasma effectse |
| 17 | `part17_PLZ_CUBE.js` | 3D plasma spinning cube |
| 18 | `part18_DOTS.js` | Dot fountain |
| 19 | `part19_WATER.js` | Scrolling sword, 10 seconds to transmission |
| 20 | `part20_COMAN.js`  | Voxel sequence |
| 21 | `part21_JPLOGO.js` | Knight picture |
| 22 | `part22_U2E.js` | 3D City overfly |
| 23 | `part23_ENDLOGO.js` | Future crew final logo |
| 24 | `part24_CREDITS.js` | Credits part |
| 25 | `part25_ENDSCRL.js` | Final vertical scroll-text |

---

## 📐 3D Engine (U2 System)
The files prefixed with `u2_` represent the specific 3D engine used during part 02 (spaceships in intro ) and 22 (3D city overfly)
* `u2_main.js`, `u2_calc.js`, `u2_drawclip.js`, `u2_fillpoly.js`
Additionnaly, U2 polygon filling functions have been completed and are re-used by part 06 (Glenz)  and 10 (Techno bars)
---

## 📦 Data & Dependencies
* **`/data`**: Contains all static assets (converted graphics, palettes, and pre-calculated tables) stored as JavaScript objects for easy loading.
* **`/dependencies`**:
    * `codef`: Used for core canvas and stats management during development.
    * `webaudio-mod-player`: The S3M/MOD engine used to play the soundtrack.

---

## 🛠️ Build System
* `bundle_header.html` & `bundle_footer.html`: Are Used to wrap the source files into a single standalone HTML file during the "Release" process (not included here).


  
