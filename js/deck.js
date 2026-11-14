/* ==========================================================================
   deck.js — the choreography: every page, every click, every note.

   Pattern for a page:
     1. gsap.set(...) the starting state of its elements (up front, once).
     2. B.scene('Title')
     3. add tweens for the first click, then B.beat('name', 'notes')
     4. more tweens, B.beat(...) for each further click
     5. the NEXT page's first click hides this page's elements.
   Only .to() and .set() on the timeline. Code-drawn things use watchers.
   ========================================================================== */
Deck.start(function (B) {
  var tl = B.tl;
  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (v) { return Math.round(v).toLocaleString('en-US'); };

  /* Pin an HTML label to a point of the dot cloud (shape coordinates).
     Uses the "still" projection, so it depends only on the cloud dials.
     flip: label sits to the LEFT of the point. dx/dy: extra offset. */
  function pin(el, pt, o) {
    o = o || {};
    if (o.flip) el.classList.add('flip');
    Deck.watch(Cloud.state, function () {
      var p = Cloud.project(pt[0], pt[1], pt[2], true);
      var x = o.flip ? p.x - 70 - el.offsetWidth : p.x + 70;
      el.style.transform = 'translate(' + (x + (o.dx || 0)).toFixed(1) + 'px,' + (p.y - 12 + (o.dy || 0)).toFixed(1) + 'px)';
    });
  }

  /* ==================================================================
     PAGE 1 — COVER
     ================================================================== */
  var cvKick = Deck.decode($('cv-kicker'));
  var cvTitle = Deck.split('#cv-title');

  gsap.set('#sc-cover', { autoAlpha: 1 });
  gsap.set(cvTitle.words, { yPercent: 60, autoAlpha: 0, rotateX: -50, transformPerspective: 700, transformOrigin: '50% 100%' });
  gsap.set('#cv-by', { autoAlpha: 0, y: 20 });
  gsap.set('#cv-line', { attr: { 'stroke-dasharray': '1620 1620', 'stroke-dashoffset': 1620 } });
  gsap.set('#cv-parts li', { autoAlpha: 0, y: 30 });

  B.scene('Cover: South Korea\'s Clean Hydrogen Portfolio Standard (CHPS)');

  // click 1 — the sea gathers into a hydrogen molecule; the title rises
  B.morph('h2', { duration: 3.0, x: 540, y: -30, scale: 0.85, tilt: 0.3, spin: 0.22, sway: 0.4, wave: 0, noise: 0.35, swirl: 1.3, size: 3.1, opacity: 1 });
  B.bg({ b: '#cbe4f5', c: '#d3f1e7', duration: 3.0 }, '<');
  tl.to(cvKick, { p: 1, duration: 1.1, ease: 'none' }, '<0.5');
  tl.to(cvTitle.words, { yPercent: 0, autoAlpha: 1, rotateX: 0, duration: 1.0, ease: 'power3.out', stagger: 0.07 }, '<0.2');
  tl.to('#cv-by', { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '>-0.3');
  B.beat('cover',
    'Introduce yourself: <b>Omar S. Al Saidi</b>, Electrical Engineer, Hydrogen Policies &amp; Strategies Department, ' +
    'Ministry of Energy and Minerals, Sultanate of Oman.<br><br>' +
    'Today: South Korea\'s <b>Clean Hydrogen Portfolio Standard</b>, CHPS: how Korea buys electricity made from clean hydrogen.');

  // click 2 — the four parts of the talk; the molecule lifts to make room
  B.cloud({ y: -150, scale: 0.66, duration: 1.4 });
  tl.to('#cv-line', { attr: { 'stroke-dashoffset': 0 }, duration: 1.2, ease: 'power2.inOut' }, '<0.1');
  tl.to('#cv-parts li', { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.14 }, '<0.3');
  B.beat('cover-parts',
    'Four parts: the <b>regulatory framework</b>, the <b>bidding criteria</b>, the <b>financial settlement</b>, ' +
    'and the <b>export opportunities</b> it opens.');

  /* ==================================================================
     PAGE 2 — REGULATORY FOUNDATION
     ================================================================== */
  var fdTitle = Deck.split('#fd-title');
  var num2 = Deck.counter($('fd-num2'), fmt);
  var num3 = Deck.counter($('fd-num3'), fmt);
  var PIE = Cloud.PIE, mid = (PIE.wedge[0] + PIE.wedge[1]) / 2, NET = Cloud.NET;

  gsap.set('#sc-found', { autoAlpha: 1 });
  gsap.set('#fd-kicker', { autoAlpha: 0, x: -20 });
  gsap.set(fdTitle.words, { yPercent: 60, autoAlpha: 0, rotateX: -50, transformPerspective: 700, transformOrigin: '50% 100%' });
  gsap.set(['#fd-lead', '#fd-src1'], { autoAlpha: 0, y: 20 });
  gsap.set(['#fd-pin-rps', '#fd-pin-h2', '#fd-pin-motie', '#fd-pin-kpx', '#fd-pin-kepco', '#fd-pin-plants'], { autoAlpha: 0 });
  gsap.set('#fd-axis-line', { attr: { 'stroke-dasharray': '1620 1620', 'stroke-dashoffset': 1620 } });
  gsap.set('.fd-dot', { scale: 0 });
  gsap.set('.fd-node', { autoAlpha: 0, y: 26 });
  gsap.set(['#fd-k2', '#fd-motie', '#fd-kpx'], { autoAlpha: 0, x: -30 });

  // labels pinned to the dots
  var rimR = PIE.R * 1.02;
  pin($('fd-pin-h2'), [Math.cos(mid) * (PIE.R + PIE.pull) + 0.05, Math.sin(mid) * (PIE.R + PIE.pull), 0.25], { flip: true, dy: -34 });
  pin($('fd-pin-rps'), [Math.cos(4.4) * rimR, Math.sin(4.4) * rimR, 0], { dy: 46 });
  pin($('fd-pin-motie'), NET.motie, { dx: -60, dy: -84 });
  pin($('fd-pin-kpx'), NET.kpx, { dx: 52 });
  pin($('fd-pin-kepco'), NET.kepco, { dx: -60, dy: -80 });
  pin($('fd-pin-plants'), NET.plants[5], { flip: true, dy: 52, dx: 40 });

  B.scene('Regulatory Foundation: World\'s First Clean Hydrogen Power Bidding Market (MOTIE & KPX)');

  // click 1 — hydrogen is carved out of the RPS
  tl.to(['#cv-kicker', '#cv-title', '#cv-rule', '#cv-parts', '#cv-by'], { autoAlpha: 0, y: -30, duration: 0.7, ease: 'power2.in', stagger: 0.05 });
  B.morph('rps-split', { duration: 2.8, x: 470, y: 0, scale: 0.85, tilt: 0.32, rotY: -0.3, lock: 1, spin: 0, sway: 0, noise: 0.25, swirl: 1.1, size: 3.0 }, '<0.2');
  B.bg({ b: '#d2ebf3', c: '#d6f3ea', duration: 2.8 }, '<');
  tl.to('#fd-kicker', { autoAlpha: 1, x: 0, duration: 0.7, ease: 'power2.out' }, '<0.6');
  tl.to(fdTitle.words, { yPercent: 0, autoAlpha: 1, rotateX: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07 }, '<0.1');
  tl.to(['#fd-lead', '#fd-src1'], { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.15 }, '>-0.3');
  tl.to(['#fd-pin-h2', '#fd-pin-rps'], { autoAlpha: 1, duration: 0.6, stagger: 0.2 }, '>-0.4');
  B.beat('found-carve',
    'South Korea created CHPS by <b>carving hydrogen out of its traditional renewable quota system, the RPS</b>, ' +
    'so hydrogen projects would not have to compete directly against solar and wind on cost.<br><br>' +
    'Legal basis: MOTIE amended the Hydrogen Economy Promotion and Hydrogen Safety Management Act.');

  // click 2 — the timeline: 2023, the general hydrogen market
  tl.to(['#fd-lead', '#fd-src1', '#fd-pin-h2', '#fd-pin-rps'], { autoAlpha: 0, y: -16, duration: 0.5, ease: 'power2.in' });
  tl.to('#fd-kicker', { y: -230, duration: 1.2, ease: 'power3.inOut' }, '<0.1');
  tl.to('#fd-title', { y: -230, scale: 0.55, duration: 1.2, ease: 'power3.inOut' }, '<');
  B.morph('gavel', { duration: 2.4, x: 560, y: -290, scale: 0.44, tilt: 0.15, rotY: 0.35, roll: 0.3, swirl: 0.9 }, '<');
  tl.to('#fd-axis-line', { attr: { 'stroke-dashoffset': 0 }, duration: 1.6, ease: 'power2.inOut' }, '<0.5');
  tl.to('#fd-dot1', { scale: 1, duration: 0.5, ease: 'back.out(3)' }, '<0.3');
  tl.to('#fd-n1', { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '<0.1');
  B.beat('found-2023',
    'It started in <b>2023</b> with the <b>general</b> hydrogen power bidding market: the first auctions, ' +
    '<b>20-year contracts</b>, mainly for distributed fuel cells.');

  // click 3 — 24 May 2024: the world's first clean hydrogen market
  tl.to('#fd-dot2', { scale: 1, duration: 0.5, ease: 'back.out(3)' });
  tl.to('#fd-n2', { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '<0.1');
  tl.to(num2, { v: 6500, duration: 1.6, ease: 'power2.out' }, '<0.2');
  B.cloud({ rotY: 0.95, duration: 1.6 }, '<');
  B.beat('found-2024',
    'On <b>24 May 2024</b>, MOTIE and KPX officially opened the <b>world\'s first</b> competitive bidding market dedicated to clean hydrogen power.<br><br>' +
    'Target <b>6,500 GWh a year</b>, a 24-week bid window, <b>15-year contracts</b>, plants operating by 2028.<br><br>' +
    '<i>Note: the on-screen wording follows MOTIE\'s press release. "Mandatory" in your page title refers to the duty on KEPCO and the utilities to buy the contracted power.</i>');

  // click 4 — 2 Dec 2024: first results; the gavel comes down
  tl.to('#fd-dot3', { scale: 1, duration: 0.5, ease: 'back.out(3)' });
  tl.to('#fd-n3', { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '<0.1');
  tl.to(num3, { v: 750, duration: 1.4, ease: 'power2.out' }, '<0.2');
  B.cloud({ roll: -0.1, duration: 0.28, ease: 'power4.in' }, '<0.1');
  B.cloud({ burst: 0.06, duration: 0.12, ease: 'power2.out' });
  B.cloud({ burst: 0, roll: 0.02, duration: 0.7, ease: 'power2.out' });
  B.beat('found-results',
    'On <b>2 December 2024</b>, KPX announced the first results: <b>5 companies</b> bid <b>6 plants</b>, <b>6,172 GWh</b> in total. ' +
    'Only <b>one plant</b> won: <b>750 GWh a year</b>, about 11.5% of the 6,500 GWh target. We look at that winner on page 7.<br><br>' +
    '<i>Check before presenting: news reports in 2025 (Korea JoongAng Daily, Argus) describe KPX cancelling the 2025 clean hydrogen round. Confirm the latest status.</i>');

  // click 5 — who does what: MOTIE
  tl.to(['#fd-kicker', '#fd-title', '#fd-axis', '.fd-node'], { autoAlpha: 0, y: '-=24', duration: 0.6, ease: 'power2.in', stagger: 0.04 });
  B.morph('roles-net', { duration: 2.6, x: 480, y: 30, scale: 0.92, tilt: 0.22, rotY: 0.28, roll: 0, swirl: 1.1, size: 3.0 }, '<0.2');
  B.bg({ b: '#d4e6f6', c: '#d1efe6', duration: 2.6 }, '<');
  tl.to('#fd-k2', { autoAlpha: 1, x: 0, duration: 0.7, ease: 'power2.out' }, '<0.8');
  tl.to('#fd-motie', { autoAlpha: 1, x: 0, duration: 0.9, ease: 'power3.out' }, '<0.15');
  tl.to(['#fd-pin-motie', '#fd-pin-kpx', '#fd-pin-kepco', '#fd-pin-plants'], { autoAlpha: function (i) { return i === 0 ? 1 : 0.4; }, duration: 0.6, stagger: 0.12 }, '>-0.2');
  B.beat('roles-motie',
    'The structure is straightforward. <b>MOTIE sets the policy</b>: annual volumes, contract lengths, ' +
    'the emissions ceiling of <b>4.0 kg CO<sub>2</sub>e per kg of hydrogen</b>, and the rule that <b>KEPCO</b> and the distribution utilities must buy the contracted power.');

  // click 6 — KPX
  tl.to('#fd-kpx', { autoAlpha: 1, x: 0, duration: 0.9, ease: 'power3.out' });
  tl.to('#fd-pin-motie', { autoAlpha: 0.4, duration: 0.5 }, '<');
  tl.to('#fd-pin-kpx', { autoAlpha: 1, duration: 0.5 }, '<');
  tl.to('#fd-pin-plants', { autoAlpha: 1, duration: 0.5 }, '<0.2');
  B.beat('roles-kpx',
    '<b>KPX runs the auctions</b> and the independent evaluations: bid notices, the bidding market committee, expert panels, and the winners. Bids go through kchps.kmos.kr.<br><br>' +
    '<b>Why this matters for Oman:</b> Korean generators cannot sign binding long-term fuel offtake agreements abroad until they first secure a 15-year power contract through CHPS.');

  /* ==================================================================
     PAGE 3 — TWO-TIER MARKET ARCHITECTURE
     ================================================================== */
  var trTitle = Deck.split('#tr-title');
  var LN = Cloud.LANES;
  var rows = ['#tr-r2', '#tr-r3', '#tr-r4', '#tr-r5'];

  gsap.set('#sc-tiers', { autoAlpha: 1 });
  gsap.set('#tr-kicker', { autoAlpha: 0, x: -20 });
  gsap.set(trTitle.words, { yPercent: 60, autoAlpha: 0, rotateX: -50, transformPerspective: 700, transformOrigin: '50% 100%' });
  gsap.set(['#tr-gen', '#tr-cln'], { autoAlpha: 0, x: -30 });
  gsap.set(['#tr-pin-g', '#tr-pin-c'], { autoAlpha: 0 });
  rows.forEach(function (r) { gsap.set(r + ' > *', { autoAlpha: 0, y: 22 }); });
  pin($('tr-pin-g'), [LN.x0 + LN.L1, LN.yG, 0], { dx: -10 });
  pin($('tr-pin-c'), [LN.x0 + LN.L2, LN.yC, 0], { dx: -10 });

  function rowIn(r, pos) { tl.to(r + ' > *', { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.12 }, pos); }
  function rowOut(r, pos) { tl.to(r + ' > *', { autoAlpha: 0, y: -18, duration: 0.45, ease: 'power2.in', stagger: 0.04 }, pos); }

  B.scene('Two-Tier Market Structure: General Hydrogen (20-yr) vs. Clean Hydrogen (15-yr)');

  // click 1 — two lanes: 20 years and 15 years, dots flowing along them
  tl.to(['#fd-k2', '#fd-motie', '#fd-kpx', '#fd-pin-motie', '#fd-pin-kpx', '#fd-pin-kepco', '#fd-pin-plants'],
    { autoAlpha: 0, x: -24, duration: 0.6, ease: 'power2.in', stagger: 0.04 });
  B.morph('lanes', { duration: 2.8, x: 166, y: 0, scale: 0.9, tilt: 0.12, rotY: 0, roll: 0, lock: 1, spin: 0, sway: 0, noise: 0.15, swirl: 1.0, size: 2.8 }, '<0.2');
  B.bg({ b: '#d0e7f4', c: '#d5f2e8', duration: 2.8 }, '<');
  tl.to('#tr-kicker', { autoAlpha: 1, x: 0, duration: 0.7, ease: 'power2.out' }, '<0.7');
  tl.to(trTitle.words, { yPercent: 0, autoAlpha: 1, rotateX: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07 }, '<0.1');
  tl.to(['#tr-gen', '#tr-cln'], { autoAlpha: 1, x: 0, duration: 0.9, ease: 'power3.out', stagger: 0.25 }, '>-0.4');
  tl.to(['#tr-pin-g', '#tr-pin-c'], { autoAlpha: 1, duration: 0.5, stagger: 0.2 }, '>-0.3');
  B.beat('tiers-lanes',
    'South Korea <b>deliberately split CHPS into two tiers</b>, rather than treating all hydrogen equally.<br><br>' +
    'Top lane: the <b>General</b> tier, with <b>20-year</b> contracts. Bottom lane: the <b>Clean</b> tier, with <b>15-year</b> contracts. The lane lengths are to scale.');

  // click 2 — target volume: the clean lane swells to five times the cross-section
  B.morph('lanes-vol', { duration: 1.8, swirl: 0.15 });
  rowIn('#tr-r2', '<0.3');
  B.beat('tiers-volume',
    'Volumes. <b>General: 1,300 GWh a year</b> (the 2023 pilot round, and ongoing). <b>Clean: 6,500 GWh a year</b> in the inaugural 2024 tender, five times larger.<br><br>' +
    'The thickness of each lane is drawn to that ratio.<br><br>' +
    '<i>Caveat: the General figure is the 2023 volume from your material; later General rounds may differ.</i>');

  // click 3 — eligible fuel: the general lane turns gray, the clean lane green-teal
  rowOut('#tr-r2');
  B.cloud({ colorB: '#8e9ba7', colorA: '#0fa37f', split: 3, duration: 1.4 }, '<0.2');
  rowIn('#tr-r3', '<0.3');
  B.beat('tiers-fuel',
    'The <b>General</b> tier is a bridge for existing fuel cell operators using <b>gray or by-product hydrogen</b>.<br><br>' +
    'The <b>Clean</b> tier requires strict lifecycle-emissions certification: <b>at most 4.0 kg CO<sub>2</sub>e per kg of hydrogen</b>. That means blue or green hydrogen.');

  // click 4 — technologies: the clean lane speeds up
  rowOut('#tr-r3');
  rowIn('#tr-r4', '<0.3');
  B.cloud({ flowV: 0.6, duration: 1.2 }, '<');
  B.beat('tiers-tech',
    '<b>General</b>: fuel cells, for example phosphoric acid (PAFC) and solid oxide (SOFC).<br><br>' +
    '<b>Clean</b>: the core engine for decarbonisation. It opens the door to <b>large-scale co-firing</b> in power plants: ammonia with coal, and hydrogen with LNG. Clean fuel cells also qualify.');

  // click 5 — primary objective
  rowOut('#tr-r4');
  rowIn('#tr-r5', '<0.3');
  B.cloud({ flowV: 0.4, duration: 1.2 }, '<');
  B.beat('tiers-goal',
    '<b>General</b>: move the existing fuel cell market out of the old RPS. <b>Clean</b>: deep decarbonisation and large-scale demand for clean hydrogen.<br><br>' +
    '<b>For Oman, the takeaway:</b> this two-tier split shows how a market can manage transition fuels while ring-fencing long-term subsidies strictly for certified low-carbon hydrogen.');

  /* ==================================================================
     PAGE 4 — CLEAN HYDROGEN CERTIFICATION
     ================================================================== */
  var ctTitle = Deck.split('#ct-title');
  var G = Cloud.GAUGE, gy = function (kg) { return G.y0 + kg * G.k; }, CH = Cloud.CHAIN;
  var axPins = ['#ct-ax0', '#ct-ax1', '#ct-ax2', '#ct-ax3'];  // the 4 kg mark is the ceiling label
  var gPins = ['#ct-g1', '#ct-g2', '#ct-g3', '#ct-g4'];
  var cPins = ['#ct-c-well', '#ct-c-plant', '#ct-c-gate', '#ct-c-ship', '#ct-c-port'];

  gsap.set('#sc-cert', { autoAlpha: 1 });
  gsap.set('#ct-kicker', { autoAlpha: 0, x: -20 });
  gsap.set(ctTitle.words, { yPercent: 60, autoAlpha: 0, rotateX: -50, transformPerspective: 700, transformOrigin: '50% 100%' });
  gsap.set('#ct-lead', { autoAlpha: 0, y: 20 });
  gsap.set(axPins.concat(gPins, ['#ct-gc', '#ct-gx'], cPins), { autoAlpha: 0 });
  gsap.set('.ct-focus', { autoAlpha: 0, y: 24 });
  gsap.set(['#ct-box-in', '#ct-box-out'], { autoAlpha: 0 });

  [0, 1, 2, 3].forEach(function (kg, i) { pin($('ct-ax' + i), [-G.R - 0.06, gy(kg), 0], { flip: true, dx: 40 }); });
  G.bands.forEach(function (b, i) { pin($('ct-g' + (i + 1)), [G.R + 0.02, gy((b[0] + b[1]) / 2), 0], { dy: i === 0 ? 8 : 0 }); });
  pin($('ct-gc'), [1.0, gy(4), 0]);
  pin($('ct-gx'), [G.R, gy(4) + 0.42, 0]);

  // captions centred under each part of the supply chain
  function caption(el, x) {
    Deck.watch(Cloud.state, function () {
      var p = Cloud.project(x, CH.base - 0.3, 0, true);
      el.style.transform = 'translate(' + (p.x - el.offsetWidth / 2).toFixed(1) + 'px,' + p.y.toFixed(1) + 'px)';
    });
  }
  caption($('ct-c-well'), CH.well); caption($('ct-c-plant'), CH.plant); caption($('ct-c-gate'), CH.gate);
  caption($('ct-c-ship'), CH.ship); caption($('ct-c-port'), CH.port);
  // the dashed boundary boxes follow the cloud's camera
  function box(el, x1, x2) {
    Deck.watch(Cloud.state, function () {
      var a = Cloud.project(x1, CH.base + 1.08, 0, true), b = Cloud.project(x2, CH.base - 0.42, 0, true);
      el.style.transform = 'translate(' + a.x.toFixed(1) + 'px,' + a.y.toFixed(1) + 'px)';
      el.style.width = (b.x - a.x).toFixed(1) + 'px'; el.style.height = (b.y - a.y).toFixed(1) + 'px';
    });
  }
  box($('ct-box-in'), CH.well - 0.32, CH.gate + 0.34);
  box($('ct-box-out'), CH.gate + 0.42, CH.port + 0.48);

  B.scene('Clean Hydrogen Certification: 4-Tier Lifecycle Emissions System (≤ 4.0 kg CO2e/kg H2)');

  // click 1 — the lanes rise into a column: four grades on a true-to-scale axis
  tl.to(['#tr-kicker', '#tr-title', '#tr-gen', '#tr-cln', '#tr-pin-g', '#tr-pin-c', '#tr-r5 > *'],
    { autoAlpha: 0, y: -20, duration: 0.6, ease: 'power2.in', stagger: 0.03 });
  B.morph('gauge', { duration: 2.9, x: 400, y: 30, scale: 0.9, tilt: 0.28, rotY: 0, colorA: '#0fa37f', colorB: '#2f73b5', split: 0.6, flowV: 0.35, swirl: 1.2, size: 2.9, noise: 0.2 }, '<0.2');
  B.bg({ b: '#cfe8f2', c: '#d3f3e6', duration: 2.9 }, '<');
  tl.to('#ct-kicker', { autoAlpha: 1, x: 0, duration: 0.7, ease: 'power2.out' }, '<0.7');
  tl.to(ctTitle.words, { yPercent: 0, autoAlpha: 1, rotateX: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07 }, '<0.1');
  tl.to('#ct-lead', { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '>-0.3');
  tl.to(axPins, { autoAlpha: 1, duration: 0.4, stagger: 0.06 }, '>-0.5');
  tl.to(gPins.concat(['#ct-gc']), { autoAlpha: 1, duration: 0.5, stagger: 0.12 }, '<0.1');
  B.beat('cert-scale',
    'South Korea does <b>not</b> use colour labels like "green" or "blue" in its law. It uses a strict, <b>technology-neutral carbon-intensity scale</b>, capped at <b>4.0 kg CO<sub>2</sub>e per kg of hydrogen</b>.<br><br>' +
    'Four grades: Grade 1 up to 0.1, Grade 2 up to 1.0, Grade 3 up to 2.0, Grade 4 up to 4.0. The column is drawn to scale.');

  // click 2 — Grade 1: the dots settle into the thin bottom ring
  tl.to('#ct-lead', { autoAlpha: 0, y: -16, duration: 0.5, ease: 'power2.in' });
  B.morph('gauge-t1', { duration: 2.0, swirl: 0.35 }, '<');
  tl.to(['#ct-g2', '#ct-g3', '#ct-g4', '#ct-gc'], { autoAlpha: 0.3, duration: 0.6 }, '<0.3');
  tl.to('#ct-f1', { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '<0.2');
  B.beat('cert-grade1',
    'Notice how strict <b>Grade 1</b> is: <b>at most 0.1 kg CO<sub>2</sub>e per kg of hydrogen</b>. That sets a gold standard for pure renewable hydrogen, typically electrolysis on renewable power.<br><br>' +
    'On the column, Grade 1 is the thin ring at the very bottom.');

  // click 3 — the 4.0 kg ceiling: anything above is ineligible
  tl.to('#ct-f1', { autoAlpha: 0, y: -16, duration: 0.5, ease: 'power2.in' });
  B.morph('gauge-above', { duration: 2.0, swirl: 0.35 }, '<');
  tl.to('#ct-g1', { autoAlpha: 0.3, duration: 0.6 }, '<0.3');
  tl.to(['#ct-gc', '#ct-gx'], { autoAlpha: 1, duration: 0.6 }, '<');
  tl.to('#ct-f2', { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '<0.2');
  B.beat('cert-ceiling',
    'Meeting <b>4.0 kg or less</b> is a <b>mandatory eligibility gate</b>. Grades 1 to 4 may enter the Clean CHPS auction; anything above 4.0 kg is <b>ineligible</b>.');

  // click 4 — scoring: Grades 1 and 2 earn more non-price points
  tl.to('#ct-f2', { autoAlpha: 0, y: -16, duration: 0.5, ease: 'power2.in' });
  B.morph('gauge-t12', { duration: 2.0, swirl: 0.35 }, '<');
  tl.to(['#ct-gx', '#ct-gc'], { autoAlpha: 0.3, duration: 0.6 }, '<0.3');
  tl.to(['#ct-g1', '#ct-g2'], { autoAlpha: 1, duration: 0.6 }, '<');
  tl.to('#ct-f3', { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '<0.2');
  B.beat('cert-score',
    'Grades matter for scoring. <b>Grades 1 and 2</b>, with lower carbon intensity, receive <b>more non-price evaluation points</b>, within the 40 non-price points, than Grades 3 and 4.<br><br>' +
    'That boosts their chances of winning even if their cost of power (LCOE) is slightly higher. The full scorecard is on the next page.');

  // click 5 — the boundary: well to gate
  tl.to(['#ct-f3'].concat(axPins, gPins, ['#ct-gc', '#ct-gx']), { autoAlpha: 0, duration: 0.5, ease: 'power2.in', stagger: 0.02 });
  tl.to('#ct-kicker', { y: -50, duration: 1.1, ease: 'power3.inOut' }, '<0.1');
  tl.to('#ct-title', { y: -60, scale: 0.6, duration: 1.1, ease: 'power3.inOut' }, '<');
  B.morph('chain', { duration: 2.8, x: 0, y: 70, scale: 1.05, tilt: 0.12, split: 0.4, swirl: 1.2, size: 2.8 }, '<');
  tl.to('#ct-box-in', { autoAlpha: 1, duration: 0.8 }, '>-0.6');
  tl.to(cPins, { autoAlpha: 1, duration: 0.5, stagger: 0.1 }, '<');
  tl.to('#ct-f4', { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '<0.2');
  B.beat('cert-wtg',
    'What is counted: the <b>well-to-gate</b> boundary. Raw material extraction, upstream fuel production and transport, hydrogen production (electrolysis, or reforming with carbon capture), and purification and compression at the production gate.');

  // click 6 — shipping is outside the boundary
  tl.to('#ct-f4', { autoAlpha: 0, y: -16, duration: 0.5, ease: 'power2.in' });
  tl.to('#ct-box-out', { autoAlpha: 1, duration: 0.9 }, '<0.2');
  tl.to(['#ct-c-ship', '#ct-c-port'], { autoAlpha: 0.45, duration: 0.6 }, '<');
  tl.to('#ct-f5', { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '<0.3');
  B.beat('cert-ship',
    '<b>Crucial takeaway for Oman:</b> Korea\'s well-to-gate boundary <b>excludes international maritime shipping</b>. Only production-site emissions count toward the 4.0 kg limit. ' +
    'That removes the distance penalty for Omani green hydrogen and green ammonia, so Oman\'s Grade 1 hydrogen competes on equal footing with closer suppliers.<br><br>' +
    '<i>Caveat: Argus (2024) and Korean government briefings describe the shipping exclusion as <b>temporary</b>, pending cleaner shipping technology. Worth saying if asked how durable the advantage is.</i>');

  /* ==================================================================
     PAGE 5 — BIDDING SCORECARD
     ================================================================== */
  var scTitle = Deck.split('#sc-title');
  var SC = Cloud.SCORE;
  var scT = ['#sc-t1', '#sc-t2', '#sc-t3', '#sc-t4', '#sc-t5', '#sc-t6', '#sc-t7'];
  var scG = ['#sc-gs', '#sc-gd', '#sc-gg', '#sc-gf', '#sc-ge'];

  gsap.set('#sc-score', { autoAlpha: 1 });
  gsap.set('#sc-kicker', { autoAlpha: 0, x: -20 });
  gsap.set(scTitle.words, { yPercent: 60, autoAlpha: 0, rotateX: -50, transformPerspective: 700, transformOrigin: '50% 100%' });
  gsap.set(scT, { autoAlpha: 0, y: 24 });
  gsap.set(['#sc-l60', '#sc-l40', '#sc-hl-price', '#sc-hl-grade', '#sc-hl-oman', '#sc-illu'].concat(scG), { autoAlpha: 0 });
  gsap.set('#sc-cap', { autoAlpha: 0, scaleX: 0, transformOrigin: '0% 50%' });

  // a label centred above a point of the cloud
  function above(el, pt) {
    Deck.watch(Cloud.state, function () {
      var p = Cloud.project(pt[0], pt[1], pt[2], true);
      el.style.transform = 'translate(' + (p.x - el.offsetWidth / 2).toFixed(1) + 'px,' + (p.y - el.offsetHeight).toFixed(1) + 'px)';
    });
  }
  // an HTML rectangle spanning a box of the cloud's coordinates
  function rect(el, x1, y1, x2, y2) {
    Deck.watch(Cloud.state, function () {
      var a = Cloud.project(x1, y1, 0, true), b = Cloud.project(x2, y2, 0, true);
      el.style.transform = 'translate(' + a.x.toFixed(1) + 'px,' + a.y.toFixed(1) + 'px)';
      el.style.width = (b.x - a.x).toFixed(1) + 'px'; el.style.height = Math.max(0, b.y - a.y).toFixed(1) + 'px';
    });
  }
  var gy0 = function (rows) { var t = 0; rows.forEach(function (r) { t += SC.npGroupY(r); }); return t / rows.length; };
  above($('sc-l60'), [-0.75, 1.06, 0]);
  above($('sc-l40'), [0.55, 1.06, 0]);
  pin($('sc-gs'), [1.02, gy0([0, 1]), 0], { dx: -30 });
  pin($('sc-gd'), [1.02, gy0([2, 3]), 0], { dx: -30 });
  pin($('sc-gg'), [1.02, gy0([4, 5]), 0], { dx: -30 });
  pin($('sc-gf'), [1.02, SC.npGroupY(6), 0], { dx: -30 });
  pin($('sc-ge'), [1.02, SC.npGroupY(7), 0], { dx: -30 });
  rect($('sc-hl-price'), -1.39, 1.03, -0.11, -1.03);
  rect($('sc-hl-grade'), 0.03, SC.npGroupY(4) + 0.13, 1.07, SC.npGroupY(7) - 0.13);
  rect($('sc-hl-oman'), 0.03, SC.npGroupY(0) + 0.13, 1.07, SC.npGroupY(1) - 0.13);
  rect($('sc-cap'), SC.bidX(0) - 0.35, SC.cap, SC.bidX(5) + 0.35, SC.cap);

  function tIn(id, pos) { tl.to(id, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, pos); }
  function tOut(id, pos) { tl.to(id, { autoAlpha: 0, y: -16, duration: 0.5, ease: 'power2.in' }, pos); }

  B.scene('Bidding Evaluation Scorecard: 60% Price (LCOE & Undisclosed Caps) vs. 40% Non-Price Criteria');

  // click 1 — the supply chain breaks into 100 points
  tl.to(['#ct-kicker', '#ct-title', '#ct-box-in', '#ct-box-out', '#ct-f5'].concat(cPins), { autoAlpha: 0, duration: 0.6, ease: 'power2.in', stagger: 0.03 });
  B.morph('score-grid', { duration: 2.8, x: 330, y: 90, scale: 0.8, tilt: 0.08, rotY: 0, split: 0, splitX: 0, colorA: '#1d6fb1', colorB: '#12a488', swirl: 1.1, size: 2.6, noise: 0.1 }, '<0.2');
  B.bg({ b: '#cfe3f5', c: '#d6f2e9', duration: 2.8 }, '<');
  tl.to('#sc-kicker', { autoAlpha: 1, x: 0, duration: 0.7, ease: 'power2.out' }, '<0.8');
  tl.to(scTitle.words, { yPercent: 0, autoAlpha: 1, rotateX: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07 }, '<0.1');
  B.beat('score-100',
    'How do bids win? Every bid is scored out of <b>100 points</b>. Each ball here is one point.');

  // click 2 — the 100 split into 60 price and 40 non-price
  tl.set(Cloud.state, { coherent: 1 });
  B.morph('score-split', { duration: 1.9, swirl: 0.6, splitX: 3 });
  tl.to(['#sc-l60', '#sc-l40'], { autoAlpha: 1, duration: 0.6, stagger: 0.2 }, '<0.9');
  tIn('#sc-t1', '<0.1');
  B.beat('score-split',
    'Winning a CHPS contract is <b>not a pure race to the bottom on price</b>. <b>60 points</b> are price; <b>40 points</b> are non-price: execution and sustainability criteria.');

  // click 3 — price: 60 points, ranked, under a ceiling
  tOut('#sc-t1');
  tl.to('#sc-hl-price', { autoAlpha: 1, duration: 0.6 }, '<0.2');
  tl.to('#sc-l40', { autoAlpha: 0.35, duration: 0.6 }, '<');
  tIn('#sc-t2', '<0.1');
  B.beat('score-price',
    'The <b>price score</b>, 60 points, is based on the bidder\'s proposed generation price, its levelised cost of electricity, in <b>Korean won per kWh</b>, relative to the other bids. And it is subject to an <b>undisclosed ceiling price</b>.');

  // click 4 — six bids rise; the ceiling exists but nobody can see it
  tOut('#sc-t2');
  tl.to(['#sc-hl-price', '#sc-l60', '#sc-l40'], { autoAlpha: 0, duration: 0.5 }, '<');
  B.morph('bids', { duration: 2.4, swirl: 0.8, splitX: 0, split: 0.5 }, '<0.1');
  tl.to('#sc-illu', { autoAlpha: 1, duration: 0.6 }, '>-0.8');
  tIn('#sc-t3', '<');
  B.beat('score-bids',
    'Before the auction opens, <b>KPX sets a strict maximum bid price</b>, in won per kWh, and keeps it <b>confidential</b>. Bidders do not know where the line is.<br><br>' +
    'Six columns for the six plants that bid in December 2024. Heights are <b>illustrative</b>: the real bid prices are not published.');

  // click 5 — the ceiling is revealed; bids above it collapse
  tl.to('#sc-cap', { autoAlpha: 1, scaleX: 1, duration: 0.9, ease: 'power2.inOut' });
  B.morph('bids-cut', { duration: 1.7, swirl: 0.25 }, '<0.5');
  tOut('#sc-t3', '<');
  tIn('#sc-t4', '<0.3');
  B.beat('score-cap',
    'Any bid <b>above the secret ceiling is disqualified</b>, even if the auction is undersubscribed. It prevents price inflation and forces cost efficiency.<br><br>' +
    'That is why the December 2024 tender awarded only <b>750 GWh of the 6,500 GWh</b> target. KPX turned down about 88% of the target volume rather than overpay.<br><br>' +
    '<i>Precise version, if asked: 6,172 GWh was bid, so part of the gap was never bid at all. Of the volume that was bid, about 88% was not awarded. News reports said most bids exceeded the undisclosed ceiling.</i>');

  // click 6 — back to the scorecard: the 40 non-price points open up
  tOut('#sc-t4');
  tl.to(['#sc-cap', '#sc-illu'], { autoAlpha: 0, duration: 0.5 }, '<');
  B.morph('score-groups', { duration: 2.6, swirl: 0.9, splitX: 3, split: 0 }, '<0.1');
  tl.to(['#sc-l60', '#sc-l40'], { autoAlpha: 1, duration: 0.6, stagger: 0.1 }, '>-0.8');
  tl.to(scG, { autoAlpha: 1, duration: 0.5, stagger: 0.12 }, '<0.2');
  tIn('#sc-t5', '<');
  B.beat('score-groups',
    'The 40 non-price points: <b>clean hydrogen grade</b>, 10 to 15 points; <b>fuel supply stability and readiness</b>, 10; <b>domestic industrial and ecosystem contribution</b>, 10; <b>project execution and grid acceptance</b>, 5 to 10.<br><br>' +
    'The ranges overlap. The open rings are the 5 points that sit with either grade or execution, depending on the bid notice.');

  // click 7 — grade carries points
  tOut('#sc-t5');
  tl.to('#sc-hl-grade', { autoAlpha: 1, duration: 0.6 }, '<0.2');
  tl.to(['#sc-gs', '#sc-gd'], { autoAlpha: 0.35, duration: 0.6 }, '<');
  tIn('#sc-t6', '<0.1');
  B.beat('score-grade',
    'Because the <b>clean hydrogen grade carries non-price points</b>, a <b>Grade 1</b> project (0.1 kg CO<sub>2</sub>e per kg or less) can beat a slightly cheaper Grade 4 project on total score.');

  // click 8 — the takeaway for Oman
  tOut('#sc-t6');
  tl.to('#sc-hl-oman', { autoAlpha: 1, duration: 0.6 }, '<0.2');
  tl.to('#sc-gs', { autoAlpha: 1, duration: 0.6 }, '<');
  tl.to(['#sc-ge'], { autoAlpha: 0.35, duration: 0.6 }, '<');
  tIn('#sc-t7', '<0.1');
  B.beat('score-oman',
    '<b>Key takeaway for Oman:</b> Omani exporters should not compete only on the raw FOB price of the molecule. Partnering with Korean off-takers who score high on <b>supply stability</b>, with <b>Grade 1</b> certification, gives Omani green hydrogen a decisive edge inside the 40-point non-price block.');

  /* ==================================================================
     PAGE 6 — FINANCIAL SETTLEMENT & RISK HEDGING
     ================================================================== */
  var stTitle = Deck.split('#st-title');
  var YRS = Cloud.YEARS;
  var stL = ['#st-l1', '#st-l2', '#st-l3', '#st-l4', '#st-l5', '#st-l6', '#st-l7', '#st-l8'];
  var stYr = ['#st-yr1', '#st-yr5', '#st-yr10', '#st-yr15'];

  /* The chart is drawn from this state by a watcher (illustrative shapes):
     contract / smp: how much of each line is drawn (0..1)
     fill: settlement areas; flat: SMP pulled onto the contract line
     split: fixed + fuel bands; fx: annual FX steps applied year by year */
  var CHT = { contract: 0, smp: 0, fill: 0, flat: 0, split: 0, fx: 0 };
  var PW = 108, PH = 420, VK = 210, FIXED = 0.6;
  var FXF = [1, 1.06, 1.12, 1.03, 0.97, 1.08, 1.15, 1.1, 1.02, 1.05, 1.12, 1.18, 1.1, 1.06, 1.09];  // illustrative
  function vy(v) { return PH - v * VK; }
  function fxFactor(y) { y = Math.max(0, Math.min(14, y)); return 1 + (FXF[y] - 1) * Math.max(0, Math.min(1, CHT.fx * 15 - y)); }
  function contractV(t) { return FIXED + 0.4 * fxFactor(Math.floor(Math.min(t, 14.999))); }
  function smpV(t) { var v = 1 + 0.24 * Math.sin(0.85 * t + 0.4) + 0.11 * Math.sin(2.2 * t + 1.3) + 0.06 * Math.sin(4.9 * t + 0.2); return v + (contractV(t) - v) * CHT.flat; }
  function samples(t1) { var ts = [], n = 300, i; for (i = 0; i <= n; i++) ts.push(15 * i / n); for (i = 1; i < 15; i++) { ts.push(i - 1e-4); ts.push(i); } ts = ts.filter(function (t) { return t <= t1; }); ts.push(t1); return ts.sort(function (a, b) { return a - b; }); }
  function line(ts, f) { return ts.map(function (t, i) { return (i ? 'L' : 'M') + (t * PW).toFixed(1) + ' ' + vy(f(t)).toFixed(1); }).join(''); }
  function band(ts, lo, hi) {
    var up = ts.map(function (t, i) { return (i ? 'L' : 'M') + (t * PW).toFixed(1) + ' ' + vy(hi(t)).toFixed(1); }).join('');
    var dn = ts.slice().reverse().map(function (t) { return 'L' + (t * PW).toFixed(1) + ' ' + vy(lo(t)).toFixed(1); }).join('');
    return up + dn + 'Z';
  }
  Deck.watch(CHT, function () {
    var tc = 15 * CHT.contract, tsC = samples(tc), tS = 15 * CHT.smp, tsS = samples(tS), all = samples(15);
    $('st-contract').setAttribute('d', tc > 0 ? line(tsC, contractV) : '');
    $('st-smp').setAttribute('d', tS > 0 ? line(tsS, smpV) : '');
    $('st-smp').style.opacity = 1 - CHT.flat * 0.9;
    $('st-below').setAttribute('d', tS > 0 ? band(tsS, function (t) { return Math.min(smpV(t), contractV(t)); }, contractV) : '');
    $('st-above').setAttribute('d', tS > 0 ? band(tsS, contractV, function (t) { return Math.max(smpV(t), contractV(t)); }) : '');
    $('st-below').style.opacity = $('st-above').style.opacity = CHT.fill;
    $('st-legend').style.opacity = CHT.fill * (1 - CHT.flat);
    $('st-tcontract').setAttribute('y', (vy(contractV(11.4)) - 16).toFixed(1)); $('st-tcontract').style.opacity = CHT.contract;
    $('st-tsmp').setAttribute('x', (tS * PW - 230).toFixed(1)); $('st-tsmp').setAttribute('y', (vy(smpV(Math.max(tS - 2.1, 0))) + 34).toFixed(1));
    $('st-tsmp').style.opacity = Math.max(0, CHT.smp * 3 - 2) * (1 - CHT.flat);
    $('st-fixed').setAttribute('d', band(all, function () { return 0; }, function () { return FIXED; }));
    $('st-fuel').setAttribute('d', band(all, function () { return FIXED; }, contractV));
    $('st-fixed').style.opacity = $('st-fuel').style.opacity = CHT.split;
    $('st-tfixed').setAttribute('y', (vy(FIXED / 2) + 6).toFixed(1)); $('st-tfuel').setAttribute('y', (vy(FIXED + 0.2) + 6).toFixed(1));
    $('st-tfixed').style.opacity = $('st-tfuel').style.opacity = CHT.split;
    var yr = Math.max(0, Math.min(14, Math.floor(CHT.fx * 15))), f = fxFactor(yr);
    $('st-needle').setAttribute('transform', 'rotate(' + ((f - 1.06) * 400).toFixed(1) + ')');
  });

  gsap.set('#sc-settle', { autoAlpha: 1 });
  gsap.set('#st-kicker', { autoAlpha: 0, x: -20 });
  gsap.set(stTitle.words, { yPercent: 60, autoAlpha: 0, rotateX: -50, transformPerspective: 700, transformOrigin: '50% 100%' });
  gsap.set(stL, { autoAlpha: 0, y: 20 });
  gsap.set(stYr.concat(['#st-dial', '#st-illu', '#st-pin-short', '#st-pin-carry', '#st-ylab', '#st-gap', '#st-chart']), { autoAlpha: 0 });
  rect($('st-gap'), YRS.x(YRS.short) - YRS.w / 2 - 0.02, YRS.y0 + YRS.h + 0.02, YRS.x(YRS.short) + YRS.w / 2 + 0.02, YRS.y0 + YRS.h * YRS.cut);
  pin($('st-pin-short'), [YRS.x(YRS.short) - 0.17, YRS.y0 + YRS.h * (YRS.cut + 1) / 2, 0], { flip: true });
  pin($('st-pin-carry'), [YRS.x(YRS.short + 1) + 0.16, YRS.y0 + YRS.h + 0.04 + YRS.h * (1 - YRS.cut) / 2, 0]);

  function lineSwap(outId, inId) {
    tl.to(outId, { autoAlpha: 0, y: -14, duration: 0.45, ease: 'power2.in' });
    tl.to(inId, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '>-0.05');
  }

  B.scene('Financial Settlement & Risk Hedging: 15-Year PPA, SMP Difference Settlement, FX-Linkage, and Volume Carryover');

  // click 1 — the 100 balls flatten into 15 contract years; the contract price draws across
  tl.to(['#sc-kicker', '#sc-title', '#sc-l60', '#sc-l40', '#sc-hl-grade', '#sc-hl-oman', '#sc-t7'].concat(scG),
    { autoAlpha: 0, duration: 0.6, ease: 'power2.in', stagger: 0.02 });
  tl.set(Cloud.state, { coherent: 0 }, '<');
  B.morph('years-tiles', { duration: 2.6, x: 0, y: 0, scale: 1, tilt: 0.25, rotY: 0, splitX: 0, split: 0.5, colorA: '#1d6fb1', colorB: '#12a488', swirl: 1.0, size: 2.5, noise: 0.08 }, '<0.2');
  B.bg({ b: '#d2e6f4', c: '#d5f1e8', duration: 2.6 }, '<');
  tl.to('#st-kicker', { autoAlpha: 1, x: 0, duration: 0.7, ease: 'power2.out' }, '<0.8');
  tl.to(stTitle.words, { yPercent: 0, autoAlpha: 1, rotateX: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07 }, '<0.1');
  tl.to(['#st-chart', '#st-ylab'].concat(stYr), { autoAlpha: 1, duration: 0.5, stagger: 0.08 }, '>-0.4');
  tl.to(CHT, { contract: 1, duration: 1.4, ease: 'power2.inOut' }, '<');
  tl.to('#st-l1', { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '<0.3');
  B.beat('set-strip',
    '<b>Bankability is the backbone of CHPS.</b> Winners sign a <b>15-year contract for difference</b>: fifteen contract years, each one a tile here, with the contracted bid price drawn across the top.');

  // click 2 — the wholesale price wanders
  lineSwap('#st-l1', '#st-l2');
  tl.to(CHT, { smp: 1, duration: 2.2, ease: 'power1.inOut' }, '<');
  tl.to('#st-illu', { autoAlpha: 1, duration: 0.5 }, '<0.5');
  B.beat('set-smp',
    'Against it: Korea\'s wholesale electricity price, the <b>system marginal price, SMP</b>, which fluctuates. This SMP path is <b>illustrative</b>.');

  // click 3 — the gaps are settled, both ways
  lineSwap('#st-l2', '#st-l3');
  tl.to(CHT, { fill: 1, duration: 1.2, ease: 'power2.out' }, '<');
  B.beat('set-pay',
    'Settlement = <b>contract price minus SMP</b>, in both directions.<br><br>' +
    'When SMP is <b>below</b> the contract price, <b>KEPCO and the utilities pay the difference</b> to the producer: a revenue floor.<br>' +
    'When SMP is <b>above</b>, the <b>producer refunds the excess</b>: consumers are protected from windfall profits.');

  // click 4 — volatility disappears
  lineSwap('#st-l3', '#st-l4');
  tl.to(CHT, { flat: 1, duration: 1.8, ease: 'power2.inOut' }, '<');
  B.beat('set-flat',
    'The result: the CfD <b>insulates hydrogen power plants from SMP volatility</b> for the full 15-year term. The producer earns the contract price.');

  // click 5 — the price is two parts
  lineSwap('#st-l4', '#st-l5');
  tl.to(CHT, { split: 1, duration: 1.2, ease: 'power2.out' }, '<');
  B.beat('set-twopart',
    'The contracted price is split in two. A <b>fixed component</b>, covering CAPEX, O&amp;M and financing, is <b>locked in won for 15 years</b>. A <b>fuel component</b> covers clean hydrogen or ammonia procurement.');

  // click 6 — the fuel part follows the exchange rate, year by year
  lineSwap('#st-l5', '#st-l6');
  tl.to('#st-dial', { autoAlpha: 1, duration: 0.6 }, '<');
  tl.to(CHT, { fx: 1, duration: 3.2, ease: 'none' }, '<0.3');
  B.beat('set-fx',
    'Imported clean hydrogen and ammonia are priced in dollars, so the <b>fuel component is linked to the KRW/USD exchange rate</b>. It is reset periodically, typically <b>once a year</b> or at set settlement intervals, against reference rates (Korea Exchange Bank or the Bank of Korea).<br><br>' +
    'This solves one of the biggest headaches in international hydrogen trade: <b>currency mismatch</b> between dollar-priced ammonia imports and won-denominated electricity revenue.<br><br><i>The FX steps shown are illustrative.</i>');

  // click 7 — volume: a short year carries into the next
  lineSwap('#st-l6', '#st-l7');
  tl.to(['#st-chart', '#st-dial', '#st-illu', '#st-ylab'], { autoAlpha: 0, duration: 0.6, ease: 'power2.in' }, '<');
  B.morph('years-vol', { duration: 1.8, swirl: 0.15, tilt: 0, split: 0.3, size: 3.2 }, '<0.2');
  B.morph('years-carry', { duration: 1.5, swirl: 0.25 });
  tl.to(['#st-gap', '#st-pin-short', '#st-pin-carry'], { autoAlpha: 1, duration: 0.5, stagger: 0.2 }, '>-0.4');
  B.beat('set-carry',
    'Each generator commits to an <b>annual contracted volume</b>. To allow for maintenance, commissioning ramp-up or shipping delays, a <b>shortfall or surplus within a tolerance band</b>, typically <b>&plusmn;10 to &plusmn;20%</b> of the annual volume, can be <b>carried into the following year</b>, for up to one to two years, without immediate termination penalties.<br><br>' +
    'It gives operators breathing room in the early years.');

  // click 8 — the takeaway for Oman
  lineSwap('#st-l7', '#st-l8');
  tl.to(['#st-gap', '#st-pin-short', '#st-pin-carry'], { autoAlpha: 0, duration: 0.5 }, '<');
  B.cloud({ y: 40, sway: 0.12, duration: 1.8 }, '<');
  B.beat('set-oman',
    '<b>Key takeaway for Oman:</b> this structure creates <b>bankable, long-term off-take certainty</b>. Korean utilities, backed by sovereign-grade settlement, can sign <b>15-year, USD-linked supply contracts</b> with Omani green hydrogen and ammonia producers, which makes Omani export projects far easier to finance.');

  /* ==================================================================
     PAGE 7 — MARKET REALITY & COASTAL INFRASTRUCTURE
     ================================================================== */
  var coTitle = Deck.split('#co-title');
  var KM = Cloud.KMAP;
  var coCards = ['#co-c0', '#co-c1', '#co-c2', '#co-c3', '#co-c4', '#co-c5'];
  var coPins = ['#co-p-samcheok', '#co-p-ulsan', '#co-p-yeosu', '#co-p-boryeong'];
  var VIEW = Cloud.aim({ scale: 1.25, tilt: -0.55, rotY: 0, roll: 0 }, KM.xy(127.8, 36.0), 1310, 575); VIEW.opacity = 1;
  function fly(site) { var d = Cloud.aim({ scale: 1.95, tilt: -0.6, rotY: 0, roll: 0 }, KM.at(site), 1380, 640); d.opacity = 0.85; return d; }
  var WIDE = Cloud.aim({ scale: 1.0, tilt: -0.5, rotY: 0, roll: 0 }, KM.xy(127.8, 36.0), 1360, 470); WIDE.opacity = 1;

  gsap.set('#sc-coast', { autoAlpha: 1 });
  gsap.set('#co-kicker', { autoAlpha: 0, x: -20 });
  gsap.set(coTitle.words, { yPercent: 60, autoAlpha: 0, rotateX: -50, transformPerspective: 700, transformOrigin: '50% 100%' });
  gsap.set(coCards, { autoAlpha: 0, y: 24 });
  gsap.set(coPins.concat(['#co-p-oman']), { autoAlpha: 0 });
  pin($('co-p-samcheok'), KM.at('samcheok'), { dx: -20 });
  pin($('co-p-ulsan'), KM.at('ulsan'), { dx: -20 });
  pin($('co-p-yeosu'), KM.at('yeosu'), { dx: -20, dy: 26 });
  pin($('co-p-boryeong'), KM.at('boryeong'), { flip: true, dx: 20 });
  pin($('co-p-oman'), KM.route(0.62), { flip: true, dx: 10 });

  function card(from, to) {
    tl.to(from, { autoAlpha: 0, y: -16, duration: 0.5, ease: 'power2.in' });
    tl.to(to, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '>0.25');
  }
  function focusPin(id) {
    tl.to(coPins.filter(function (p) { return p !== id; }), { autoAlpha: 0.25, duration: 0.6 }, '<');
    tl.to(id, { autoAlpha: 1, duration: 0.6 }, '<');
  }

  B.scene('Market Reality & Coastal Infrastructure: 2024 Samcheok Tender Result (750 GWh) & Ulsan/Yeosu/Boryeong Hubs');

  // click 1 — the bars become South Korea's coastline; four sites light up
  tl.to(['#st-kicker', '#st-title', '#st-l8'].concat(stYr), { autoAlpha: 0, duration: 0.6, ease: 'power2.in', stagger: 0.03 });
  B.morph('korea-map', Object.assign({ duration: 3.0, sway: 0, split: 0.3, swirl: 1.1, size: 2.6, noise: 0.08, lock: 1 }, VIEW), '<0.2');
  B.bg({ b: '#cbe3f3', c: '#d3efe8', duration: 3.0 }, '<');
  tl.to('#co-kicker', { autoAlpha: 1, x: 0, duration: 0.7, ease: 'power2.out' }, '<0.9');
  tl.to(coTitle.words, { yPercent: 0, autoAlpha: 1, rotateX: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07 }, '<0.1');
  tl.to('#co-c0', { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '>-0.3');
  tl.to(coPins, { autoAlpha: 1, duration: 0.5, stagger: 0.15 }, '<0.2');
  B.beat('coast-map',
    'Moving from policy design to <b>physical reality</b>.<br><br>' +
    'South Korea lacks the domestic renewable land to produce low-cost green hydrogen at scale. So the whole CHPS architecture relies on <b>coastal import hubs</b>: Ulsan, Yeosu and Boryeong, plus the first winning plant at Samcheok.');

  // click 2 — fly to Samcheok: the December 2024 winner
  card('#co-c0', '#co-c1');
  B.morph('korea-samcheok', Object.assign({ duration: 2.4, swirl: 0.3 }, fly('samcheok')), '<-0.6');
  focusPin('#co-p-samcheok');
  B.beat('coast-samcheok',
    'The December 2024 auction: <b>Korea Southern Power (KOSPO)</b>, at its <b>Samcheok Bitdream</b> power plant on the east coast, in Gangwon Province. ' +
    '<b>20% clean-ammonia co-firing</b> in an existing coal-fired unit. <b>750 GWh a year for 15 years</b>, operating from <b>2028</b>. It was the only winner among 6 bidding plants.<br><br>' +
    'It showed that ammonia co-firing at existing coastal coal plants was the fastest, most cost-competitive path to scale under CHPS.<br><br>' +
    '<i>Check before presenting: trade press (Ammonia Energy Association) describes Unit 1 and "at least 20%" co-firing. 2026 reports say the 2026 clean round excludes coal co-firing (coal phase-out by 2040), while the Samcheok award has not been cancelled. Confirm the current status.</i>');

  // click 3 — Ulsan
  card('#co-c1', '#co-c2');
  B.morph('korea-ulsan', Object.assign({ duration: 2.4, swirl: 0.3 }, fly('ulsan')), '<-0.6');
  focusPin('#co-p-ulsan');
  B.beat('coast-ulsan',
    '<b>Ulsan</b>, the east coast industrial hub: a large-scale clean <b>ammonia import and storage terminal</b>, a <b>hydrogen pipeline network</b>, and industrial and power <b>co-firing</b>, building on existing petrochemical and port infrastructure.');

  // click 4 — Yeosu / Gwangyang
  card('#co-c2', '#co-c3');
  B.morph('korea-yeosu', Object.assign({ duration: 2.4, swirl: 0.3 }, fly('yeosu')), '<-0.6');
  focusPin('#co-p-yeosu');
  B.beat('coast-yeosu',
    '<b>Yeosu and Gwangyang</b>, the south coast petrochemical and power hub: a clean <b>ammonia receiving terminal</b>, an <b>ammonia cracking</b> facility that turns imported NH<sub>3</sub> back into hydrogen, and an LNG / hydrogen <b>co-firing</b> cluster serving major off-takers such as KEPCO subsidiaries and POSCO.');

  // click 5 — Boryeong
  card('#co-c3', '#co-c4');
  B.morph('korea-boryeong', Object.assign({ duration: 2.4, swirl: 0.3 }, fly('boryeong')), '<-0.6');
  focusPin('#co-p-boryeong');
  B.beat('coast-boryeong',
    '<b>Boryeong</b>, the west coast clean hydrogen hub: a major hydrogen / ammonia <b>import terminal</b>, a large hydrogen <b>production and cracking</b> complex, and the fuel supply for west-coast co-firing and hydrogen turbines (for example KOMIPO and SK E&amp;S projects).<br><br>' +
    'All three ports are being built as integrated receiving terminals, storage tanks and cracking hubs, wired directly into coastal power plants.');

  // click 6 — pull back: the sea route towards Oman
  card('#co-c4', '#co-c5');
  B.morph('korea-corridor', Object.assign({ duration: 2.8, swirl: 0.6 }, WIDE), '<-0.6');
  tl.to(coPins, { autoAlpha: 1, duration: 0.6 }, '<0.4');
  tl.to('#co-p-oman', { autoAlpha: 1, duration: 0.6 }, '>-0.6');
  B.beat('coast-corridor',
    '<b>Key takeaway for Oman:</b> look at Korea\'s coastal geography. Ulsan, Yeosu and Boryeong are deep-water import terminals designed to receive <b>seaborne clean ammonia carriers</b>. ' +
    'That lines up with Oman\'s export infrastructure at <b>Duqm, Salalah and Sohar</b>: a direct maritime energy corridor between Omani production ports and Korean CHPS demand centres.<br><br>' +
    '<i>The route line is schematic, not a shipping lane.</i>');

  /* ==================================================================
     PAGE 8 — 2038 ROADMAP & STRATEGIC EXPORT OPPORTUNITIES
     ================================================================== */
  var rdTitle = Deck.split('#rd-title');
  var rdNum = Deck.counter($('rd-num'), function (v) { return v < 20 ? v.toFixed(v < 1 ? 2 : 0) : Math.round(v).toString(); }, 0.75);
  var PIL = Cloud.PILLARS;
  var rdChart = ['#rd-chart', '#rd-m1', '#rd-m2', '#rd-m3', '#rd-m26'];
  var rdCards = ['#rd-c26', '#rd-cmol', '#rd-cpil'];
  var rdPins = ['#rd-p1', '#rd-p2', '#rd-p3', '#rd-p4'], molPins = ['#rd-l-nh3', '#rd-l-h2', '#rd-l-crack'];
  var CHART = { x: 0, y: 0, scale: 1, tilt: 0, rotY: 0, roll: 0, lock: 1, sway: 0, spin: 0 };

  gsap.set('#sc-road', { autoAlpha: 1 });
  gsap.set('#rd-kicker', { autoAlpha: 0, x: -20 });
  gsap.set(rdTitle.words, { yPercent: 60, autoAlpha: 0, rotateX: -50, transformPerspective: 700, transformOrigin: '50% 100%' });
  gsap.set(rdChart.concat(['#rd-illu', '#rd-s30', '#rd-s38'], rdPins, molPins), { autoAlpha: 0 });
  gsap.set(['#rd-big'].concat(rdCards, ['#rd-end']), { autoAlpha: 0, y: 24 });
  rdPins.forEach(function (id, i) { above($(id.slice(1)), [PIL[i], 1.0, 0]); });
  pin($('rd-l-nh3'), [-1.15, 0.6, 0], { dx: -20 });
  pin($('rd-l-h2'), [1.1, 0.5, 0], { flip: true, dx: 30 });
  pin($('rd-l-crack'), [0.08, -0.1, 0], { dx: -80, dy: 30 });

  B.scene('2038 National Roadmap (11th BPLE): Scaling to 42 TWh (6% of Power Mix) & Strategic Export Opportunities');

  // click 1 — the corridor becomes a rising area of dots: 2024 to 2030
  tl.to(['#co-kicker', '#co-title', '#co-c5', '#co-p-oman'].concat(coPins), { autoAlpha: 0, duration: 0.6, ease: 'power2.in', stagger: 0.03 });
  B.morph('road-2030', Object.assign({ duration: 3.0, split: 0.9, splitX: 0, swirl: 1.0, size: 2.4, noise: 0.06, opacity: 1 }, CHART), '<0.2');
  B.bg({ b: '#cfe6f3', c: '#d2f1e6', duration: 3.0 }, '<');
  tl.to('#rd-kicker', { autoAlpha: 1, x: 0, duration: 0.7, ease: 'power2.out' }, '<0.8');
  tl.to(rdTitle.words, { yPercent: 0, autoAlpha: 1, rotateX: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07 }, '<0.1');
  tl.to(['#rd-chart', '#rd-m1', '#rd-m2'], { autoAlpha: 1, duration: 0.6, stagger: 0.25 }, '>-0.6');
  tl.to('#rd-big', { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '<');
  tl.to(rdNum, { v: 13, duration: 1.4, ease: 'power2.out' }, '<');
  tl.to('#rd-s30', { autoAlpha: 1, duration: 0.6 }, '<0.4');
  B.beat('road-2030',
    'Stepping back to the big picture. South Korea scales clean hydrogen power from the <b>0.75 TWh</b> awarded in 2024 to about <b>13 TWh a year by 2030</b>, around 2.1% of generation.');

  // click 2 — on to 2038: 42 TWh
  B.morph('road-2038', { duration: 2.6, swirl: 0 });
  tl.to(rdNum, { v: 42, duration: 2.2, ease: 'power2.out' }, '<');
  tl.to('#rd-s30', { autoAlpha: 0, duration: 0.4 }, '<');
  tl.to('#rd-s38', { autoAlpha: 1, duration: 0.6 }, '<0.5');
  tl.to(['#rd-m3', '#rd-illu'], { autoAlpha: 1, duration: 0.6 }, '>-0.6');
  B.beat('road-2038',
    'The <b>11th Basic Plan for Electricity Supply and Demand</b> takes it to about <b>42 TWh by 2038</b>, roughly <b>6% of the entire national grid</b>.<br><br>' +
    '<i>The 2024, 2030 and 2038 points are the milestones; the curve between them is illustrative. The 2036 benchmark from your notes is left out: the IEA gives the 10th Plan\'s 2036 figure as 47.4 TWh (7.1%), not 26.5 TWh, so it needs checking before use.</i>');

  // click 3 — the November 2026 market update
  tl.to('#rd-big', { autoAlpha: 0, y: -16, duration: 0.5, ease: 'power2.in' });
  tl.to('#rd-s38', { autoAlpha: 0, duration: 0.4 }, '<');
  tl.to('#rd-m26', { autoAlpha: 1, duration: 0.6 }, '<0.2');
  B.cloud({ opacity: 0.6, duration: 0.8 }, '<');
  tl.to('#rd-c26', { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '<0.2');
  B.beat('road-2026',
    'Our briefing is up to date as of <b>November 2026</b>. The new round under the <b>Ministry of Climate, Energy and Environment (MCEE)</b> offers <b>500 GWh a year</b> of clean hydrogen power, operating by 2030. It <b>excludes coal co-firing</b> and raises the <b>non-price evaluation to 50%</b>.<br><br>' +
    'The structural demand for imported clean ammonia and cracked hydrogen remains large; it shifts toward <b>LNG-hydrogen gas turbines and fuel cells</b>.<br><br>' +
    '<i>Caveat: the 50% non-price figure comes from trade press (Energynews, Nov 2026); the coal exclusion and the volumes come from MCEE\'s notice.</i>');

  // click 4 — two molecules: ammonia ships, hydrogen burns
  tl.to(['#rd-c26', '#rd-chart', '#rd-m1', '#rd-m2', '#rd-m3', '#rd-m26', '#rd-illu'], { autoAlpha: 0, duration: 0.6, ease: 'power2.in', stagger: 0.02 });
  B.morph('nh3-h2', { duration: 2.8, x: 470, y: 30, scale: 0.95, tilt: 0.15, rotY: 0, lock: 1, sway: 0.25, split: 0.2, opacity: 1, swirl: 1.1, size: 2.8 }, '<0.2');
  tl.to('#rd-cmol', { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '<1.0');
  tl.to(molPins, { autoAlpha: 1, duration: 0.5, stagger: 0.15 }, '>-0.3');
  B.beat('road-molecules',
    '<b>Clean ammonia</b> is the main carrier for seaborne imports and for large-scale thermal power. It is expected to be around <b>60–70% of imported volume</b> in the early-to-mid stages, because ammonia shipping is mature.<br><br>' +
    '<b>Pure clean hydrogen</b> comes from cracking that ammonia at the coastal hubs (Ulsan, Yeosu, Boryeong). It feeds combined-cycle hydrogen gas turbines and large fuel cells, increasingly prioritised as coal co-firing phases out by 2040.<br><br>' +
    '<i>The 60–70% share is your estimate; no source is cited for it.</i>');

  // click 5 — four pillars for Oman
  tl.to(['#rd-cmol'].concat(molPins), { autoAlpha: 0, duration: 0.5, ease: 'power2.in' });
  B.morph('pillars', { duration: 2.6, x: 470, y: 40, scale: 0.95, tilt: 0.22, rotY: -0.25, sway: 0.15, split: 0.6, swirl: 1.0 }, '<0.1');
  tl.to('#rd-cpil', { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '<0.9');
  tl.to(rdPins, { autoAlpha: 1, duration: 0.4, stagger: 0.15 }, '>-0.3');
  B.beat('road-pillars',
    '<b>1. Off-take at scale.</b> 42 TWh by 2038 needs millions of tonnes of imported clean hydrogen and ammonia. Oman targets <b>1+ million tonnes a year of green hydrogen by 2030</b>, and up to 8.5 Mtpa by 2050.<br>' +
    '<b>2. Grade 1 potential.</b> Solar-and-wind green hydrogen can target Grade 1 (0.1 kg CO<sub>2</sub>e or less), which earns the most non-price points, now weighted at 50%.<br>' +
    '<b>3. Bankable contracts.</b> CfD-backed, 15-year, USD-linked off-take de-risks financing in Duqm, Salalah and Sohar.<br>' +
    '<b>4. Korean partners already in Oman.</b> <b>Hydrogen Duqm LLC</b> (Block Z1-02: 220 ktpa green hydrogen, about 1.2 Mtpa green ammonia) is owned by <b>POSCO Holdings (44.8%)</b>, ENGIE (25%), <b>Samsung Engineering (19.2%)</b> and PTTEP (11%). The <b>SalalaH2</b> consortium (Block Z2-04: 175 ktpa green hydrogen) includes <b>Samsung C&amp;T (25%)</b>, with OQ (25%), Marubeni (30%) and Dutco (20%). Together they form an integrated mine-to-grid chain, from Omani production ports to Korea\'s coastal power hubs.<br><br>' +
    '<i>Shareholdings per Hydrom\'s February 2025 quarterly report. Samsung Engineering now trades as Samsung E&amp;A.</i>');

  // click 6 — the conclusion; the dots return to the hydrogen molecule of the cover
  tl.to(['#rd-cpil', '#rd-kicker', '#rd-title'].concat(rdPins), { autoAlpha: 0, duration: 0.6, ease: 'power2.in', stagger: 0.02 });
  B.morph('h2', { duration: 3.0, x: 560, y: -40, scale: 0.85, tilt: 0.3, rotY: 0, lock: 0, spin: 0.22, sway: 0.4, split: 0, swirl: 1.3, size: 3.1, noise: 0.35 }, '<0.2');
  B.bg({ b: '#cbe4f5', c: '#d3f1e7', duration: 3.0 }, '<');
  tl.to('#rd-end', { autoAlpha: 1, y: 0, duration: 1.0, ease: 'power3.out' }, '<1.0');
  B.beat('road-close',
    '<b>Strategic conclusion for Oman:</b> Oman is uniquely placed to be a premier supplier to Korea\'s CHPS market. Hydrom\'s world-scale green hydrogen projects in Duqm and Salalah, several with Korean consortia, offer <b>Grade 1 ultra-low-carbon molecules</b>, <b>15-year bankable supply</b>, and a <b>direct maritime corridor</b> to Korea\'s coastal hubs.');

  /* ==================================================================
     PAGE 9 — CLOSING / Q&A
     ================================================================== */
  var clTitle = Deck.split('#cl-title');
  gsap.set('#sc-close', { autoAlpha: 1 });
  gsap.set(clTitle.words, { yPercent: 60, autoAlpha: 0, rotateX: -50, transformPerspective: 700, transformOrigin: '50% 100%' });
  gsap.set(['#cl-sub', '#cl-by'], { autoAlpha: 0, y: 20 });

  B.scene('Closing / Q&A');

  // one click — the molecule dissolves back into the calm sea of the Start screen
  tl.to('#rd-end', { autoAlpha: 0, y: -20, duration: 0.7, ease: 'power2.in' });
  B.morph('ocean', { duration: 3.4, x: 0, y: 240, scale: 1, tilt: 0.42, rotY: 0, roll: 0, lock: 0, spin: 0.025, wave: 1, sway: 0.15, size: 3, opacity: 1, noise: 0.5, split: 0, swirl: 1.4 }, '<0.2');
  B.bg({ a: '#f3f8fb', b: '#cfe6f4', c: '#d4f2e8', duration: 3.4 }, '<');
  tl.to(clTitle.words, { yPercent: 0, autoAlpha: 1, rotateX: 0, duration: 1.0, ease: 'power3.out', stagger: 0.08 }, '<1.2');
  tl.to(['#cl-sub', '#cl-by'], { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power2.out', stagger: 0.25 }, '>-0.4');
  B.beat('close',
    'Thank you for your attention. I welcome your questions and discussion on South Korea\'s CHPS market design and the strategic export opportunities for the Sultanate of Oman.');
});
