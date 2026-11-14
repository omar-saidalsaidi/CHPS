# South Korea's Clean Hydrogen Portfolio Standard (CHPS): the show

Nine pages and 48 clicks, plus the Start screen. Running time is about 15–20 minutes.

This is a web page, not PowerPoint. You drive it with a presentation clicker the same way you would drive PowerPoint.

## How to present

1. Unzip the folder anywhere. Keep all the files together.
2. Double-click **index.html**. It opens in Chrome or Edge and needs no internet.
3. Press **F** (or F5) for full screen. Drag the window onto the projector first if you have two screens.
4. Press **P** to open the **presenter view** in a second window. Keep it on your laptop screen.
5. The show starts on a quiet **Start** screen with only the drifting background. Your first click brings in page 1.

**Slow laptop?** Open `index.html?lite` instead. Type `?lite` after `index.html` in the address bar and press Enter. The background then uses far fewer dots.

**Reloading is safe.** The show reopens on the same click, and the presenter view links up again by itself within about 2 seconds.

## Controls

| Key or button | What it does |
|---|---|
| → ↓ PageDown Space N Enter, left-click | Next click |
| ← ↑ PageUp Backspace, right-click | Back one click |
| F or F5 | Full screen on / off (F5 does not reload the page) |
| B or . | Black screen |
| W or , | White screen |
| P | Open the presenter view |
| G or O | Overview of every click |
| a number, then Enter | Jump to that page |
| Home / End | First / last click |
| H or ? | Help (this table, on screen) |
| D | Key tester on / off |
| L | Progress line on / off |
| Esc | Close any overlay |

- While the screen is black or white, your next click only brings the picture back. It does not move the show.
- Keys pressed with Ctrl, Alt or Cmd held down are ignored.
- The mouse pointer hides after 2 seconds without movement.
- Moving one click forward or back animates. A jump of more than one click (overview, page number, Home, End) is instant, behind a short black flash.

### Check your clicker

Press **D** and then press each button on your clicker. A small box at the bottom right shows the key name each button sends and what the show did with it ("next", "back", "not mapped"). Press **D** again to hide the box.

## Presenter view (P)

- **Top bar:** click number, page number, page title, click name, the time of day, and a timer. The timer starts on your first click.
- **Now:** a live copy of what the audience sees, with a progress bar under it.
- **Next click:** a copy parked on the next click, with that click's name.
- **Speaker notes** for the current click, in large type.
- **Buttons:** Back, Next, Black, Reset timer.

The clicker keys work in this window too: Next, Back, B and W all drive the show.

If Chrome or Edge blocks the window, allow pop-ups for this file and press P again.

## Overview (G)

The overview shows a small picture of every click, grouped by page. Use the arrow keys or the clicker to move, Enter or Space to jump, and Esc to close.

The pictures come from the **snapshot maker**. After any change to the show, refresh them:

- Double-click **tools\make-thumbnails.bat**. It needs [Node.js](https://nodejs.org) version 22 or newer; install the LTS version once.
- It opens Edge or Chrome hidden, visits every click and saves the pictures in `assets\thumbs\`. It takes about a second per click.

## What is on each page

| Page | Title | Clicks | What happens |
|---|---|---|---|
| 0 | Start | 1 | Only the drifting background: a calm sea of dots. |
| 1 | Cover | 2 | 1. The sea gathers into a hydrogen molecule (H₂); the title, occasion and your name arrive. 2. The four parts of the talk appear. |
| 2 | Regulatory Foundation | 6 | 1. A portfolio "pie" with the hydrogen slice pulled out of the RPS. 2–4. A timeline: 2023 general market, 24 May 2024 launch (6,500 GWh/yr), 2 Dec 2024 results (750 GWh/yr); a gavel comes down on the results. 5–6. A network of MOTIE, KPX, KEPCO and the bidding plants, with one card for MOTIE and one for KPX. |
| 3 | Two-Tier Market Structure | 5 | 1. The dots form two flowing lanes drawn to scale: General tier, 20-year contracts (top) and Clean tier, 15-year contracts (bottom), with one tick per contract year. 2. Target volume: the clean lane swells (thickness to scale, 1,300 vs 6,500 GWh/yr). 3. Eligible fuel: the general lane turns gray, the clean lane green-teal. 4. Technologies. 5. Primary objective. |
| 4 | Clean Hydrogen Certification | 6 | 1. The lanes rise into a dotted column on a true-to-scale kg CO₂e/kg H₂ axis: four grade rings and a hard ceiling ring at 4.0 kg. 2. A cluster of dots settles into the thin Grade 1 ring (≤ 0.1). 3. The cluster rises above the ceiling: ineligible. 4. The cluster splits into Grades 1–2: more non-price points. 5. The column becomes a supply chain (well, plant, gate, ammonia carrier, Korean port) with a "well to gate" boundary. 6. Shipping is boxed off as excluded. |
| 5 | Bidding Evaluation Scorecard | 8 | 1. The supply chain breaks into 100 balls, one per point. 2. They regroup into 60 price and 40 non-price blocks, each ball travelling as a unit. 3. Price: ranked bid price under an undisclosed ceiling. 4. Six bid columns rise (illustrative heights). 5. The secret ceiling is revealed and every bid above it collapses; 750 of 6,500 GWh. 6. The 40 opens into criteria: supply 10, domestic 10, grade 10–15, 5 swing points (open rings), execution 5–10. 7. Grade highlighted. 8. Oman takeaway: supply stability + Grade 1. |
| 6 | Financial Settlement & Risk Hedging | 8 | 1. The balls flatten into 15 dotted year tiles; the contract price draws across a chart. 2. An illustrative SMP line wanders. 3. The gaps fill: KEPCO pays the producer (below) or the producer refunds KEPCO (above). 4. SMP is pulled flat onto the contract price. 5. The price splits into fixed (KRW) and fuel bands. 6. An FX dial swings and the fuel band steps year by year (illustrative). 7. The tiles rise into annual volume bars; year 3's shortfall slides onto year 4. 8. Oman takeaway: bankable, USD-linked, fifteen-year off-take. |
| 7 | Market Reality & Coastal Infrastructure | 6 | 1. The bars become a dotted map of South Korea; Samcheok, Ulsan, Yeosu·Gwangyang and Boryeong light up. 2–5. The camera flies to each site in turn, and a beam of light moves with it: KOSPO Samcheok (750 GWh/yr, 15 years, 2028, 20% ammonia), then the three import hubs. 6. Pull back: a schematic sea route heads south-west, "To Oman · Duqm · Sohar · Salalah". |
| 8 | 2038 Roadmap & Strategic Export Opportunities | 6 | 1. The sea route becomes a rising dotted area chart: 0.75 TWh (2024) to 13 TWh (2030). 2. The dots stream on to 42 TWh in 2038 (≈ 6% of the power mix). 3. November 2026 update (MCEE): 500 GWh/yr, 50:50, coal co-firing out. 4. An ammonia molecule cracks into hydrogen: "NH₃ ships · H₂ burns". 5. Four dotted pillars: the four opportunities for Oman. 6. The dots return to the cover's hydrogen molecule: the strategic conclusion. |
| 9 | Closing / Q&A | 1 | The H₂ molecule dissolves back into the calm sea of the Start screen: "Thank you · Questions & Discussion", the sub-line and your sign-off. |

## Files

| Path | What it is |
|---|---|
| `index.html` | the show: the stage, every page's text, the overlays |
| `presenter.html` | the presenter view |
| `css/` | styles (`show.css`, `presenter.css`, `fonts.css`) |
| `js/engine.js` | clicks, navigation, keys, overlays, presenter link |
| `js/particles.js` | the background dots (WebGL) and their shapes |
| `js/data-korea.js` | South Korea's outline (Natural Earth, public domain) for page 7 |
| `js/deck.js` | the choreography: every click, every animation, every speaker note |
| `js/presenter.js` | the presenter window |
| `vendor/gsap.min.js` | GSAP 3.12.5, the animation library (core only) |
| `assets/fonts/` | Inter Tight, Instrument Serif, JetBrains Mono (open licence) |
| `assets/thumbs/` | overview snapshots + `thumbs.js` |
| `tools/make-thumbnails.bat` | double-click to refresh the snapshots |
| `tools/dev/` | check scripts used while building the show |
| `docs/sources.md` | where every fact on the slides comes from |

## Known limits

- It is made for **Chrome or Edge**. Firefox and Safari probably work but are not tested.
- If the computer cannot run WebGL, the background dots are switched off. Everything else still works.
