# Second Reality - JavaScript Port

A web-based port of the legendary **Second Reality** demo (1993) by **Future Crew**, rewritten entirely in JavaScript.

The goal of this project is to recreate the iconic visual and auditory experience of the original masterpiece. When **Second Reality** was released in 1993, it was a total "geek shock" to me. It was one of the catalysts that pushed me to dive deep into x86 assembly, VGA programming, and the hidden guts of the PC.

More than 30 years later, I finally took the time to deconstruct and analyze the original code. This project is the result of that journey: a tribute to the past, while exploring the capabilities of modern JavaScript and web browsers.

## 🚀 Live Demo
The project is released as a single, self-contained HTML file:
**[CLICK HERE TO LAUNCH THE DEMO](https://covalichou.github.io/second-reality-js/)**

---

## 📜 A Bit of History & Context

**Second Reality** by **Future Crew** was a revolution when it premiered at Assembly '93. Here are the main events of its journey through time:

* **1993:** The original release shocks the world, pushing PC hardware to its limits. (Original release and related links available on its [Pouët.net](https://www.pouet.net/prod.php?which=63) page).
* **2013:** For the 20th anniversary, Future Crew generously releases the original [source code](https://github.com/mtuomi/SecondReality).
* **2013:** **[Fabien Sanglard](https://fabiensanglard.net/)** publishes one of his famous technical breakdowns, analyzing the demo's [inner workings](https://fabiensanglard.net/second_reality/index.php).
* **2013:** **Claudio Matsuoka** ports parts of the demo to C/OpenGL for Windows and Linux. Details are available [here](https://github.com/cmatsuoka/sr-port/wiki/Second-Reality-port-notes).
* **Mid-2025:** For the 32nd anniversary, [Conspiracy](https://conspiracy.hu/) releases a reconstructed version, adapting the original code (C, Pascal, and Assembly) for Win32 compatibility and modern PC architecture. SecondRealityW32 source code is available [here](https://github.com/ConspiracyHu/SecondRealityW32). This is arguably the most hardware-accurate port to date.
* **Late-2025:** **[XorJS](https://www.jsr-productions.com/)** releases [SecondRealityPlusPlus](https://www.jsr-productions.com/secondreality.html), a C++ port targeting Windows, Linux, and Web (via WASM). Based on the Conspiracy release, Jean-Sebastien successfully ported all assembly and Pascal code to C++.

For more historical info, visit the demo's [Wikipedia page](https://en.wikipedia.org/wiki/Second_Reality).

## My Journey
I began this project in **early 2024**, after discovering implementations of old-school demos in JavaScript (notably using the **CODEF** framework). Driven by a lifelong fascination with Second Reality, I felt it was time to explore it myself.

My approach was primarily educational. I wanted to learn more about JavaScript, which has the advantage of requiring nothing more than a text editor and a web browser to code and debug.

Being fluent in x86 assembly as a former PC demomaker from the 90s, I was able to quickly identify and implement most routines in JS. However, I occasionally spent hours using the **DosBox Debugger** to step through the original code line-by-line when my results didn't match the original demo. Along the way, I also experimented with AI to assist in analyzing obscure assembly routines or specific VGA register tweaking.

My core goal remained unchanged: to truly understand every trick and "hack" used by Future Crew. Working on this intermittently over two years, it was inspiring to see other modern ports emerge, confirming that the passion for this masterpiece is still very much alive.



## 🎨 Inspiration & Credits
This project wouldn't exist without these incredible resources:
* **Future Crew:** For the original masterpiece and for releasing the source code.
* **Fabien Sanglard:** For his technical insights that gave me the will to dive into the demo's internals.
* **Claudio Matsuoka**: His release helped me start the project and fix my 3D computations errors
* **[CodeF Gallery](https://codef.santo.fr/):** For making old-school screens live again in modern browsers.
* **Conspiracy:** Their release came late but allowed me to debug directly the COMAN part from Visual Studio, which was far more convenient than DosBox Debugger.
* **The French PC Demoscene (1990s):** To all the peers from the **ACE BBS** or **3615 RTEL** era!.

## 🛠️ Open Source Libraries & Tools
This project uses two libraries:
* **[CodeF](https://codef.santo.fr/)**: Not actively used in the final code, but it was my major source of inspiration for the graphic processing in javascript.
* **[Webaudio Mod Player](https://github.com/electronoora/webaudio-mod-player)**: Used to play the music, with slight modifications to support custom speed adjustments. 

## 📖 Educational Approach & Code Clarity
One of my main goals was to **demystify** the effects implemented in Second Reality. Original demo coding often relied on cryptic Assembly and VGA hardware tricks. 

* **Readability over Obscurity:** Algorithms are implemented in clear JavaScript, making the logic accessible to anyone without x86 knowledge.
* **Documentation:** Every major effect includes headers and inline comments explaining the underlying concepts.

## 📝 Development Status
* **Current Status:** * Stable release, tested with 60-70Hz refresh rates.
  * Timing is aligned with a reference video.
* **Known Issues:** * Room for performance improvements (though not the primary goal).
  * High refresh rate screens (>70Hz) may require further adjustments in certain parts.
  * Seeking "pixel perfect" accuracy on a few remaining effects.
  * The release file is currently unpacked/unminified, there is room to improve that!
  * 

JS Source code is available in the src folder!

---
If you enjoyed this journey through Second Reality, a small coffee is always appreciated to keep the gears turning [you can buy me a coffee!](https://www.buymeacoffee.com/covalichou) !
