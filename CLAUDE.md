# Briefing for an AI session working on this show

A cinematic, clicker-driven web presentation: "South Korea's Clean Hydrogen Portfolio Standard (CHPS)".
- **Audience:** energy-policy specialists, hydrogen strategy executives and investors.
- **Length:** 15–20 minutes.
- **Look:** light, clean, calm; ocean blue `#1d6fb1` and mint teal `#12a488` on pale paper `#f4f8fb`.
- **Presenter's computer:** Windows, so the launchers are `.bat` files.

## Hard rules (from the owner)

- **Runs offline from file://** by double-clicking `index.html` in Chrome or Edge. No server, no build step, no frameworks, no CDN.
- **Classic `<script>` tags only.** No ES modules, no fetch or XHR, and no WebGL textures from image files. Drawing images on a 2D canvas is fine.
- **Vendored files only:** GSAP 3 core in `vendor/`, fonts as woff2 in `assets/fonts/`. Everything else is hand-written.
- **Never invent facts.** Use the owner's material, or research it and cite it:
  - a small `.source` line on the slide;
  - the details in `docs/sources.md`;
  - caveats in the speaker notes.
  - Label charts "illustrative" and placeholder numbers "demo data".
- **Minimal text on screen.** One idea per click: a kicker, a headline, big numbers. What the speaker says goes in the notes.
- **Plain language** in help, notes and README.
- **Build only the slides the owner asks for.** No filler, agenda or thank-you slides. Suggest them in chat instead.
- The Test page has been deleted. Real pages so far: 1 Cover, 2 Regulatory Foundation, 3 Two-Tier Market, 4 Certification, 5 Scorecard, 6 Settlement, 7 Coast, 8 Roadmap (ends on the cover's H₂ molecule), 9 Closing (back to the Start screen's sea). The show is complete; changes from here are the owner's requests only (see README page table).
- **Presenter** (put on the cover): Omar S. Al Saidi, Ministry of Energy and Minerals, Sultanate of Oman.
- **When the owner sends a screenshot saying something looks bad, redo that part properly.** Don't nudge it.

## How it is built

- **Stage:** a fixed 1920×1080 `#stage`, scaled to fit by `engine.js`. Scenes are `<section class="scene">` elements inside it.
- **Master timeline:** one paused GSAP timeline, `Deck.tl`.
  - **Beats** are click stops. Next tweens the timeline's time forward (linear); Back tweens it backward 1.8× faster.
  - A click during an animation finishes it instantly, then moves on.
  - A jump of more than one beat is instant, behind a black flash.
- **Authoring** (in `js/deck.js`): `Deck.start(function (B) {...})` builds the show.
  - `B.scene(title)` starts a new page.
  - `B.beat(name, notes)` marks a click stop. Tweens added since the previous beat play on the click that arrives at it.
  - `B.t()` returns the current end of the timeline.
  - `B.morph(shape, dials, pos)` reshapes the dots; `B.cloud(dials, pos)` tweens dials only; `B.bg({a,b,c}, pos)` shifts the background colours.
- **Keeping Back and jumps exact:**
  - Set every initial state up front with `gsap.set`.
  - On the timeline, use only `.to()` and `.set()`, never `.from()` or `.fromTo()`.
  - Anything drawn by code (canvas, SVG paths computed in JS, counters, typed text) is driven by a watcher: tween a plain object, and `Deck.watch(obj, draw)` redraws when its values change.
  - Labels pinned to the dots use `Cloud.project(x, y, z, true)` (the "still" form), so they depend only on the dials.
  - Each scene hides its own elements when it ends: the next scene's first click tweens them out.
- **Helpers:** `Deck.split`, `Deck.typer`, `Deck.decode`, `Deck.counter`.
- **Growing the show:**
  - `Deck.extras.push(fn)` in a `js/scenes-*.js` file adds pages at the end.
  - `Deck.slots.name = fn` with `B.slot('name')` in `deck.js` inserts pages mid-show.
  - Load scene files before `deck.js` in `index.html`.
- **Page numbers** come from scene order. Start is page 0 and shows no number.
- **The current beat** is in the URL hash, by beat name.
- **Modes** (query string):
  - `?lite`: 9,000 dots instead of 30,000.
  - `?mode=mirror` and `?mode=preview`: the presenter's copies. They have 6,000 dots, ignore input, and are driven by postMessage.
  - `?mode=thumb`: used for snapshots.
- **Flowing shapes:** list the shape in `Cloud.flows`; the lane geometry is in `Cloud.LANES`, and `B.morph` sets the `flowF`/`flowT` dials itself. The `split` dial colours the top part with colour B and the bottom part with colour A.
- **Shape variants that should only partly move** (gauge-t1, gauge-above, gauge-t12) share the same structure dots: same seeds, same counts, same final order. The swirl in flight scales with how far each dot travels, so dots that stay put stay still.
- **The `coherent` dial** (1 on page 5) makes dots move in groups of index mod 100. **Set `coherent: 0` with `tl.set` before page 6's first morph.**
- **Hide every new element up front.** `tools/dev/check.js` fails if anything on the stage is visible on the Start screen. Static SVG parts count too, such as page 6's axis line.
- **Page 6's chart** is drawn by one watcher on the `CHT` state (contract, smp, fill, flat, split, fx).
- **Camera fly-to:** `Cloud.aim(dials, point, stageX, stageY)` returns `x`/`y` dials that put a shape point at a stage position (page 7). Map helpers live in `Cloud.KMAP`.
- **Policy status:** see the 2026 caveats in `docs/sources.md`. The owner has been told and decides what changes on screen.
- **Swirl is set, not tweened:** `B.morph`'s `swirl` applies from the start of that morph.
- **Page 8's road shapes** are drawn in stage coordinates and assume the dials x 0, y 0, scale 1, tilt 0, rotY 0, lock 1.
- **Pinned labels:** `pin(el, point, {flip, dx, dy})` in `deck.js`. Shape anchor points are exported as `Cloud.PIE` and `Cloud.NET`.
- **Point cloud** (`js/particles.js`):
  - One WebGL point cloud; every shape has its own GPU buffer, and the shader morphs between `state.from` and `state.to`.
  - Shapes are built by area-weighted sampling of primitives in `Cloud.P`: box, ellipsoid, cylinder, disc, cone, revolve, curve, plane, text, `at`, `compose`.
  - Register a shape with `Cloud.define(name, fn)`.
  - The camera maths is in the file header.
  - Shapes must mean something for their slide; no generic spheres.
- **Presenter link:** `presenter.html` / `js/presenter.js`. It says hello to `window.opener` every 2 s; the show replies with its beats and notes, then sends `nav` and `blank` messages.

## Before saying something is done

- Run `node tools/dev/check.js`. It checks for console errors and compares forward, back and jump for every beat. Also run it with `--lite`.
- Run `node tools/dev/frames.js <beat> --at 0.2,0.5,0.8,1` and **look at** the mid-animation frames.
- Run `node tools/make-thumbnails.js` to refresh the overview snapshots.
- Update `README.md` (the page table) and `docs/sources.md`.
- Tell the owner plainly what was tested and what could not be (their real clicker, their projector).
