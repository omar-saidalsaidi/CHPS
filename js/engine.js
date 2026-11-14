/* ==========================================================================
   engine.js — beats, navigation, keys, overlays, presenter link.

   THE IDEA
     The whole show is ONE paused GSAP timeline (Deck.tl).
     A "beat" is a point on that timeline where the show stops and waits
     for a click. A "scene" is one page; it can hold several beats.
     Page numbers come from the order of scenes. The Start screen is page 0.

   AUTHORING (used by js/deck.js and js/scenes-*.js)
     Deck.start(function (B) { ... })   builds the show
     B.scene(title)                     starts a new page
     B.beat(name, notes)                a click stop. Everything added to the
                                        timeline since the previous beat plays
                                        on the click that arrives here.
     B.t()                              current end of the timeline
     B.tl                               the master timeline (use .to / .set only)
     B.morph(shape, dials, pos)         reshape the point cloud (+ tween dials)
     B.cloud(dials, pos)                tween cloud dials
     B.bg({a,b,c, duration}, pos)       shift the background gradient colours
     B.slot(name)                       run Deck.slots[name](B) if a scene file set it
     Deck.extras.push(fn)               scene files add whole pages at the end

   RULES THAT KEEP BACK AND JUMPING CORRECT
     - Set every initial state up front with gsap.set (outside the timeline).
     - On the master timeline use only .to() and .set(); never .from()/.fromTo().
     - Anything drawn by code is driven by watchers: tween a plain object,
       and Deck.watch(obj, draw) redraws when its values change.
     - Each scene hides its own elements when it ends.
   ========================================================================== */
(function () {
  'use strict';

  var Q = new URLSearchParams(location.search);
  var MODE = Q.get('mode') || 'show';                 // show | mirror | preview | thumb
  var EMBED = MODE === 'mirror' || MODE === 'preview';
  var THUMB = MODE === 'thumb';
  var INTERACTIVE = !EMBED && !THUMB;
  var LITE = Q.has('lite');
  var NS = 'chps-deck';                               // tag on every postMessage

  var Deck = window.Deck = {
    mode: MODE, embedded: EMBED, lite: LITE, interactive: INTERACTIVE,
    extras: [], slots: {}, beats: [], scenes: [], tl: null, ready: false
  };

  var START_NOTES = 'Start screen. Only the drifting background is showing. ' +
    'Take your time; your first click brings in page 1.';

  var beats = Deck.beats, scenes = Deck.scenes, tl = null, buildFn = null;
  var cur = 0, anim = null, animTarget = -1, flashT = null, flashTarget = -1;
  var blank = null, overlay = null, presenterWin = null;
  var $ = function (id) { return document.getElementById(id); };
  var stage;

  document.documentElement.classList.add('mode-' + MODE);
  if (EMBED) document.documentElement.classList.add('mode-embed');

  /* ---------------------------------------------------------------- watchers */
  var watchers = [];
  function checkWatcher(w, force) {
    var o = w.o, changed = force, k;
    for (k in o) { if (k === '_gsap') continue; if (w.last[k] !== o[k]) { w.last[k] = o[k]; changed = true; } }
    if (changed) w.f(o);
  }
  function runWatchers() { for (var i = 0; i < watchers.length; i++) checkWatcher(watchers[i], false); }
  Deck.watch = function (obj, fn) { var w = { o: obj, f: fn, last: {} }; watchers.push(w); checkWatcher(w, true); return obj; };

  /* ---------------------------------------------------------- text helpers */
  /* Wraps words (.w) and characters (.c) so they can be staggered. */
  Deck.split = function (el) {
    if (typeof el === 'string') el = document.querySelector(el);
    if (el._split) return el._split;
    var words = [], chars = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span'); w.className = 'w';
            Array.from(part).forEach(function (ch) {
              var c = document.createElement('span'); c.className = 'c'; c.textContent = ch;
              w.appendChild(c); chars.push(c);
            });
            words.push(w); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(el);
    return (el._split = { el: el, words: words, chars: chars });
  };

  /* Typewriter. Untyped characters keep their space, so nothing shifts.
     Returns a state {p: 0..1} to tween on the timeline. */
  Deck.typer = function (el) {
    var sp = Deck.split(el), n = sp.chars.length, st = { p: 0 };
    el.classList.add('typer');
    Deck.watch(st, function () {
      var k = Math.round(st.p * n);
      for (var i = 0; i < n; i++) {
        var c = sp.chars[i];
        c.style.visibility = i < k ? 'visible' : 'hidden';
        c.classList.toggle('caret', st.p > 0 && st.p < 1 && i === Math.min(k, n - 1));
      }
    });
    return st;
  };

  /* Random glyphs resolve into the text, left to right. Widths are locked,
     so the line never jumps. Returns a state {p: 0..1}. */
  var GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+=/<>';
  Deck.decode = function (el) {
    var sp = Deck.split(el), n = sp.chars.length, st = { p: 0 };
    sp.chars.forEach(function (c) { c._real = c.textContent; c.style.width = c.offsetWidth + 'px'; c.style.textAlign = 'center'; });
    Deck.watch(st, function () {
      for (var i = 0; i < n; i++) {
        var c = sp.chars[i], s = (i / Math.max(1, n)) * 0.65, e = s + 0.35, txt, vis;
        if (st.p <= s) { vis = 'hidden'; txt = c._real; }
        else if (st.p >= e) { vis = 'visible'; txt = c._real; }
        else { vis = 'visible'; txt = c._real === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0]; }
        c.style.visibility = vis; if (c.textContent !== txt) c.textContent = txt;
      }
    });
    return st;
  };

  /* Animated number. Returns a state {v} to tween. format(v) -> string. */
  Deck.counter = function (el, format, start) {
    format = format || function (v) { return Math.round(v).toLocaleString('en-US'); };
    var st = { v: start || 0 };
    el.classList.add('counter');
    Deck.watch(st, function () { el.textContent = format(st.v); });
    return st;
  };

  /* ---------------------------------------------------------- background */
  var BG = Deck.bgState = { ar: 243, ag: 248, ab: 251, br: 207, bg: 230, bb: 244, cr: 212, cg: 242, cb: 232 };
  function rgb(h) { h = h.replace('#', ''); var n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function bgExpand(v) {
    var o = {}, k; for (k in v) o[k] = v[k];
    ['a', 'b', 'c'].forEach(function (key) { if (o[key]) { var c = rgb(o[key]); o[key + 'r'] = c[0]; o[key + 'g'] = c[1]; o[key + 'b'] = c[2]; delete o[key]; } });
    return o;
  }
  function drawBg() {
    var s = $('bg').style, r = Math.round;
    s.setProperty('--bg-a', 'rgb(' + r(BG.ar) + ',' + r(BG.ag) + ',' + r(BG.ab) + ')');
    s.setProperty('--bg-b', 'rgb(' + r(BG.br) + ',' + r(BG.bg) + ',' + r(BG.bb) + ')');
    s.setProperty('--bg-c', 'rgb(' + r(BG.cr) + ',' + r(BG.cg) + ',' + r(BG.cb) + ')');
  }

  /* ---------------------------------------------------------------- builder */
  function makeBuilder() {
    var B = { tl: tl, _shape: Cloud.state.to, _shapeName: 'ocean' };
    B.t = function () { return tl.duration(); };
    B.scene = function (title) {
      scenes.push({ title: title, page: scenes.length, first: beats.length, beats: [] });
      return B;
    };
    B.beat = function (name, notes) {
      if (!scenes.length) throw new Error('B.beat("' + name + '") before any B.scene()');
      var t = tl.duration(), last = beats[beats.length - 1];
      if (last && t <= last.time + 1e-4) { tl.to({}, { duration: 0.05 }); t = tl.duration(); }
      var base = name || 'beat', nm = base, k = 2;
      while (beats.some(function (b) { return b.name === nm; })) nm = base + '-' + (k++);
      var sc = scenes[scenes.length - 1];
      beats.push({ name: nm, notes: notes || '', time: t, scene: sc.page });
      sc.beats.push(beats.length - 1);
      return B;
    };
    B.slot = function (name) { var f = Deck.slots[name]; if (typeof f === 'function') f(B); return B; };
    function at(pos) { return pos === undefined ? tl.duration() : pos; }
    B.cloud = function (vars, pos) {
      var v = Cloud.expand(Object.assign({ duration: 1.6, ease: 'power2.inOut' }, vars));
      tl.to(Cloud.state, v, at(pos)); return B;
    };
    B.morph = function (shape, vars, pos) {
      var id = Cloud.id(shape);
      var flows = Cloud.flows || {};
      var sv = { from: B._shape, to: id, morph: 0, flowF: flows[B._shapeName] ? 1 : 0, flowT: flows[shape] ? 1 : 0 };
      if (vars && vars.swirl !== undefined) sv.swirl = vars.swirl;     // swirl applies to this whole morph, from its start
      tl.set(Cloud.state, sv, at(pos));
      var st = tl.recent().startTime();
      var v = Cloud.expand(Object.assign({ duration: 2.6, ease: 'power2.inOut' }, vars || {}));
      tl.to(Cloud.state, { morph: 1, duration: v.duration, ease: 'none' }, st);
      var dials = {}, n = 0, k;
      for (k in v) if (k !== 'duration' && k !== 'ease' && k !== 'swirl') { dials[k] = v[k]; n++; }
      if (n) { dials.duration = v.duration; dials.ease = v.ease; tl.to(Cloud.state, dials, st); }
      B._shape = id; B._shapeName = shape; return B;
    };
    B.bg = function (vars, pos) {
      tl.to(BG, bgExpand(Object.assign({ duration: 2.2, ease: 'power1.inOut' }, vars)), at(pos)); return B;
    };
    return B;
  }

  Deck.start = function (fn) { buildFn = fn; };

  /* ------------------------------------------------------------- navigation */
  function settle() {
    if (flashT) { flashT.kill(); flashT = null; tl.time(beats[flashTarget].time, true); runWatchers(); gsap.to($('flash'), { opacity: 0, duration: 0.3 }); }
    if (anim) { anim.kill(); anim = null; tl.time(beats[animTarget].time, true); runWatchers(); }
  }
  function playTo(i) {
    var to = beats[i].time, from = tl.time(), fwd = to >= from;
    var d = Math.abs(to - from) / (fwd ? 1 : 1.8);
    cur = i; animTarget = i;
    if (d < 0.001) { tl.time(to, true); runWatchers(); }
    else anim = gsap.to(tl, { time: to, duration: d, ease: 'none', onComplete: function () { anim = null; } });
    arrived('play');
  }
  function setInstant(i) {
    cur = i; tl.time(beats[i].time, true); runWatchers(); arrived('instant');
  }
  function jumpTo(i, noFlash) {
    i = Math.max(0, Math.min(beats.length - 1, i | 0));
    settle();
    if (i === cur) return;
    if (Math.abs(i - cur) === 1) return playTo(i);
    if (noFlash || !INTERACTIVE) return setInstant(i);
    cur = i; flashTarget = i;
    var f = $('flash');
    flashT = gsap.to(f, { opacity: 1, duration: 0.12, ease: 'power1.in', onComplete: function () {
      flashT = null; tl.time(beats[i].time, true); runWatchers();
      gsap.to(f, { opacity: 0, duration: 0.35, delay: 0.05, ease: 'power1.out' });
    } });
    arrived('instant');
  }
  function next() { if (blank) return setBlank(null); settle(); if (cur < beats.length - 1) playTo(cur + 1); }
  function back() { if (blank) return setBlank(null); settle(); if (cur > 0) playTo(cur - 1); }
  function gotoPage(n) { var s = scenes[n]; if (s && s.beats.length) jumpTo(s.beats[0]); }
  Deck.next = next; Deck.back = back; Deck.jumpTo = jumpTo; Deck.gotoPage = gotoPage;
  Deck.current = function () { return cur; };

  function arrived(how) {
    updateChrome();
    if (INTERACTIVE) {
      try { history.replaceState(null, '', '#' + encodeURIComponent(beats[cur].name)); } catch (e) { /* file:// quirks */ }
      sendPresenter({ type: 'nav', index: cur, how: how });
    }
  }

  /* --------------------------------------------------------- black / white */
  function setBlank(kind) {
    blank = kind;
    var el = $('blank');
    if (kind) el.style.background = kind === 'white' ? '#ffffff' : '#000000';
    gsap.to(el, { opacity: kind ? 1 : 0, duration: kind ? 0.5 : 0.4, ease: 'power1.inOut' });
    if (INTERACTIVE) sendPresenter({ type: 'blank', blank: blank });
  }
  Deck.setBlank = setBlank;

  /* ------------------------------------------------------------- chrome UI */
  var showProgress = false, showTester = false;
  function updateChrome() {
    if (!beats.length) return;
    var page = beats[cur].scene;
    $('pageno').textContent = page > 0 ? String(page) : '';
    $('progress').firstElementChild.style.transform = 'scaleX(' + (beats.length > 1 ? cur / (beats.length - 1) : 0) + ')';
    if (overlay === 'overview') ovMark();
  }

  function tester(label, action) {
    if (!showTester) return;
    var box = $('keytest'), row = document.createElement('div');
    row.innerHTML = '<b></b><span></span>';
    row.firstChild.textContent = label; row.lastChild.textContent = action;
    box.insertBefore(row, box.firstChild.nextSibling);
    while (box.children.length > 7) box.removeChild(box.lastChild);
  }
  function keyName(e) {
    if (e.key === ' ') return 'Space';
    if (e.key && e.key.length === 1) return e.key.toUpperCase() === e.key.toLowerCase() ? '"' + e.key + '"' : e.key.toUpperCase();
    return e.key || e.code;
  }

  var toastT = null;
  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.style.opacity = 1;
    clearTimeout(toastT); toastT = setTimeout(function () { t.style.opacity = 0; }, 2600);
  }

  /* digits + Enter = jump to page */
  var digits = '', digitT = null;
  function digit(d) {
    digits = (digits + d).slice(-3);
    var j = $('jumpbox'); j.textContent = 'Go to page ' + digits + ' ⏎'; j.style.opacity = 1;
    clearTimeout(digitT); digitT = setTimeout(clearDigits, 4000);
  }
  function clearDigits() { digits = ''; $('jumpbox').style.opacity = 0; }

  /* --------------------------------------------------------- the controls */
  var CONTROLS = Deck.controls = [
    ['→  ↓  PageDown  Space  N  Enter  left-click', 'Next click'],
    ['←  ↑  PageUp  Backspace  right-click', 'Back one click'],
    ['F  or  F5', 'Full screen on / off'],
    ['B  or  .', 'Black screen (press again, or click, to return)'],
    ['W  or  ,', 'White screen'],
    ['P', 'Open the presenter view (second window)'],
    ['G  or  O', 'Overview of every click'],
    ['number, then Enter', 'Jump to that page'],
    ['Home  /  End', 'First / last click'],
    ['H  or  ?', 'This help'],
    ['D', 'Key tester on / off (shows what your clicker sends)'],
    ['L', 'Progress line on / off'],
    ['Esc', 'Close any overlay']
  ];
  function buildHelp() {
    var h = '<div class="ov-card help-card"><p class="kicker">Controls</p><h2>How to drive the show</h2><table>';
    CONTROLS.forEach(function (c) { h += '<tr><td>' + c[0] + '</td><td>' + c[1] + '</td></tr>'; });
    h += '</table><p class="help-foot">While the screen is black or white, the next click only brings the picture back. ' +
      'Add <code>?lite</code> to the address for fewer dots on a slow laptop.</p></div>';
    $('help').innerHTML = h;
  }

  function openOverlay(name) {
    closeOverlay();
    overlay = name;
    if (name === 'overview') buildOverview();
    var el = $(name); el.classList.add('open');
  }
  function closeOverlay() {
    if (!overlay) return;
    $(overlay).classList.remove('open'); overlay = null;
  }

  /* --------------------------------------------------------------- overview */
  var ovSel = 0;
  function buildOverview() {
    var T = window.DECK_THUMBS || null, map = (T && T.beats) || {};
    var h = '<div class="ov-head"><p class="kicker">Overview</p><span>' + beats.length + ' clicks on ' + (scenes.length - 1) +
      (scenes.length === 2 ? ' page' : ' pages') + ' · arrows move · Enter jumps · Esc closes</span></div>';
    if (!T) h += '<p class="ov-note">No snapshots yet. Double-click <b>tools\\make-thumbnails.bat</b> to make them.</p>';
    else h += '<p class="ov-note">Snapshots made ' + (T.made || '') + '. Out of date? Double-click <b>tools\\make-thumbnails.bat</b> again.</p>';
    scenes.forEach(function (s) {
      h += '<section class="ov-group"><h3><b>' + (s.page > 0 ? s.page : '–') + '</b>' + esc(s.title) +
        '<i>' + s.beats.length + (s.beats.length === 1 ? ' click' : ' clicks') + '</i></h3><div class="ov-row">';
      s.beats.forEach(function (bi, k) {
        var b = beats[bi], f = map[b.name];
        h += '<button class="ov-item" data-i="' + bi + '"><span class="ov-pic">' +
          (f ? '<img alt="" src="assets/thumbs/' + f + '">' : '<span class="ov-missing">' + esc(b.name) + '<small>no snapshot yet – run tools\\make-thumbnails.bat</small></span>') +
          '</span><span class="ov-cap">' + (k + 1) + ' · ' + esc(b.name) + '</span></button>';
      });
      h += '</div></section>';
    });
    var ov = $('overview'); ov.innerHTML = h;
    Array.prototype.forEach.call(ov.querySelectorAll('img'), function (img) {
      img.onerror = function () { var p = img.parentNode; p.innerHTML = '<span class="ov-missing">' + esc(beats[+p.parentNode.dataset.i].name) + '<small>snapshot missing – run tools\\make-thumbnails.bat</small></span>'; };
    });
    ovSel = cur; ovMark();
  }
  function ovMark() {
    var ov = $('overview');
    Array.prototype.forEach.call(ov.querySelectorAll('.ov-item'), function (el) {
      var i = +el.dataset.i; el.classList.toggle('cur', i === cur); el.classList.toggle('sel', i === ovSel);
      if (i === ovSel) el.scrollIntoView({ block: 'nearest' });
    });
  }
  function ovMove(d) { ovSel = Math.max(0, Math.min(beats.length - 1, ovSel + d)); ovMark(); }
  function ovPage(d) {
    var p = beats[ovSel].scene + d;
    if (p < 0 || p >= scenes.length) return;
    ovSel = scenes[p].first; ovMark();
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ------------------------------------------------------------- keyboard */
  function toggleFull() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function () {});
  }
  function openPresenter() {
    var w = window.open('presenter.html', 'chps-presenter', 'width=1400,height=860');
    if (!w) toast('The browser blocked the presenter window. Allow pop-ups for this file and press P again.');
    else { presenterWin = w; try { w.focus(); } catch (e) {} }
  }

  function onKey(e) {
    var k = e.key, name = keyName(e), act = null;
    if (e.ctrlKey || e.altKey || e.metaKey) { tester(name + ' + modifier', 'ignored'); return; }
    if (k === 'F5' || k === 'F11') e.preventDefault();

    /* overview has its own keys */
    if (overlay === 'overview') {
      if (k === 'ArrowRight' || k === 'PageDown' || k === 'n' || k === 'N') { ovMove(1); act = 'overview: move'; }
      else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace') { ovMove(-1); act = 'overview: move'; }
      else if (k === 'ArrowDown') { ovPage(1); act = 'overview: next page'; }
      else if (k === 'ArrowUp') { ovPage(-1); act = 'overview: previous page'; }
      else if (k === 'Enter' || k === ' ') { closeOverlay(); jumpTo(ovSel); act = 'overview: jump'; }
      else if (k === 'Escape' || k === 'g' || k === 'G' || k === 'o' || k === 'O') { closeOverlay(); act = 'close overview'; }
      if (act) { e.preventDefault(); tester(name, act); } else tester(name, 'not mapped here');
      return;
    }
    if (overlay === 'help') {
      if (k === 'Escape' || k === 'h' || k === 'H' || k === '?') { closeOverlay(); tester(name, 'close help'); e.preventDefault(); return; }
    }

    if (/^[0-9]$/.test(k)) { digit(k); act = 'page number ' + digits; }
    else if (k === 'Enter' && digits) { var n = +digits; clearDigits(); if (n < scenes.length) { gotoPage(n); act = 'jump to page ' + n; } else { toast('There is no page ' + n + '.'); act = 'no such page'; } }
    else if (k === 'Backspace' && digits) { digits = digits.slice(0, -1); if (digits) digit(''); else clearDigits(); act = 'delete digit'; }
    else if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || k === ' ' || k === 'n' || k === 'N' || k === 'Enter') { closeOverlay(); act = blank ? 'unblank' : 'next'; next(); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || k === 'Backspace') { closeOverlay(); act = blank ? 'unblank' : 'back'; back(); }
    else if (k === 'f' || k === 'F' || k === 'F5') { toggleFull(); act = 'full screen'; }
    else if (k === 'b' || k === 'B' || k === '.') { setBlank(blank === 'black' ? null : 'black'); act = 'black screen'; }
    else if (k === 'w' || k === 'W' || k === ',') { setBlank(blank === 'white' ? null : 'white'); act = 'white screen'; }
    else if (k === 'p' || k === 'P') { openPresenter(); act = 'presenter view'; }
    else if (k === 'g' || k === 'G' || k === 'o' || k === 'O') { openOverlay('overview'); act = 'overview'; }
    else if (k === 'Home') { jumpTo(0); act = 'first click'; }
    else if (k === 'End') { jumpTo(beats.length - 1); act = 'last click'; }
    else if (k === 'h' || k === 'H' || k === '?') { if (overlay === 'help') closeOverlay(); else openOverlay('help'); act = 'help'; }
    else if (k === 'd' || k === 'D') { showTester = !showTester; $('keytest').classList.toggle('on', showTester); act = 'key tester'; }
    else if (k === 'l' || k === 'L') { showProgress = !showProgress; $('progress').classList.toggle('on', showProgress); act = 'progress line'; }
    else if (k === 'Escape') { if (digits) clearDigits(); closeOverlay(); act = 'close'; }
    if (act) { e.preventDefault(); tester(name, act); } else tester(name, 'not mapped');
  }

  /* --------------------------------------------------------------- mouse */
  var cursorT = null;
  function wakeCursor() {
    document.documentElement.classList.remove('nocursor');
    clearTimeout(cursorT); cursorT = setTimeout(function () { document.documentElement.classList.add('nocursor'); }, 2000);
  }
  function onMouseDown(e) {
    wakeCursor();
    if (e.target.closest && e.target.closest('.overlay.open, #toast')) {
      if (overlay === 'overview' && e.button === 0) {
        var it = e.target.closest('.ov-item'); if (it) { closeOverlay(); jumpTo(+it.dataset.i); tester('mouse', 'overview: jump'); }
      } else if (overlay === 'help' && e.button === 0) { closeOverlay(); }
      return;
    }
    if (e.button === 0) { tester('left click', blank ? 'unblank' : 'next'); next(); }
    else if (e.button === 2) { tester('right click', blank ? 'unblank' : 'back'); back(); }
  }

  /* ------------------------------------------------------- presenter link */
  function meta() {
    return {
      type: 'deck', index: cur, blank: blank,
      beats: beats.map(function (b) { return { name: b.name, notes: b.notes, scene: b.scene }; }),
      scenes: scenes.map(function (s) { return { title: s.title, page: s.page, first: s.first, count: s.beats.length }; })
    };
  }
  function sendPresenter(msg) {
    if (!presenterWin) return;
    try { if (presenterWin.closed) { presenterWin = null; return; } msg.ns = NS; presenterWin.postMessage(msg, '*'); }
    catch (e) { presenterWin = null; }
  }
  function onMessage(e) {
    var d = e.data;
    if (!d || typeof d !== 'object' || d.ns !== NS) return;
    if (EMBED) {
      if (!Deck.ready) { pendingGo = d; return; }
      if (d.type === 'go') {
        settle();
        if (d.how === 'play' && Math.abs(d.index - cur) === 1) playTo(d.index);
        else if (d.index !== cur) setInstant(d.index);
      } else if (d.type === 'blank') setBlank(d.blank);
      return;
    }
    if (!INTERACTIVE) return;
    if (d.type === 'hello') { presenterWin = e.source; if (Deck.ready) sendPresenter(meta()); }
    else if (d.type === 'cmd') {
      if (!Deck.ready) return;
      if (d.cmd === 'next') next();
      else if (d.cmd === 'back') back();
      else if (d.cmd === 'black') setBlank(blank === 'black' ? null : 'black');
      else if (d.cmd === 'white') setBlank(blank === 'white' ? null : 'white');
      else if (d.cmd === 'goto') jumpTo(d.index);
    }
  }
  var pendingGo = null;

  /* ------------------------------------------------------------------ fit */
  function fit() {
    var w = window.innerWidth, h = window.innerHeight, s = Math.min(w / 1920, h / 1080);
    stage.style.transform = 'translate(' + ((w - 1920 * s) / 2) + 'px,' + ((h - 1080 * s) / 2) + 'px) scale(' + s + ')';
    Deck.stageScale = s;
    Cloud.resize(s);
  }

  /* ---------------------------------------------------------------- boot */
  function timeout(p, ms) { return Promise.race([p, new Promise(function (r) { setTimeout(r, ms); })]); }
  function waitFonts() {
    if (!document.fonts) return Promise.resolve();
    var faces = ['300 40px "Inter Tight"', '400 40px "Inter Tight"', '500 40px "Inter Tight"', '600 40px "Inter Tight"',
      '700 40px "Inter Tight"', '800 40px "Inter Tight"', 'italic 400 40px "Instrument Serif"', '400 40px "Instrument Serif"',
      '400 20px "JetBrains Mono"', '500 20px "JetBrains Mono"', '700 20px "JetBrains Mono"'];
    return Promise.all(faces.map(function (f) { return document.fonts.load(f).catch(function () {}); }))
      .then(function () { return document.fonts.ready; });
  }
  function waitImages() {
    return Promise.all(Array.prototype.map.call(document.images, function (img) {
      return img.complete ? null : new Promise(function (r) { img.addEventListener('load', r); img.addEventListener('error', r); });
    }));
  }

  function boot() {
    stage = $('stage');
    var count = THUMB ? 30000 : EMBED ? 6000 : LITE ? 9000 : 30000;
    Cloud.init($('cloud'), count);
    fit();
    window.addEventListener('resize', fit);
    Deck.watch(BG, drawBg);
    gsap.ticker.add(function (time, dt) { runWatchers(); Cloud.render(dt / 1000); });

    if (INTERACTIVE) {
      document.addEventListener('keydown', onKey);
      document.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mousemove', wakeCursor);
      document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      buildHelp();
      wakeCursor();
    }
    window.addEventListener('message', onMessage);

    Promise.all([timeout(waitFonts(), 5000), timeout(waitImages(), 8000)]).then(build);
  }

  function build() {
    tl = Deck.tl = gsap.timeline({ paused: true });
    Cloud.state.from = Cloud.state.to = Cloud.id('ocean');
    // Start screen pose: a calm sea seen from slightly above, drifting.
    gsap.set(Cloud.state, { tilt: 0.42, y: 170, scale: 1, spin: 0.025, wave: 1, sway: 0.15, size: 3, opacity: 1, noise: 0.5 });
    var B = makeBuilder();
    B.scene('Start').beat('start', START_NOTES);
    try {
      if (buildFn) buildFn(B);
      Deck.extras.forEach(function (fn) { fn(B); });
    } catch (err) {
      console.error('Deck build failed:', err);
    }
    tl.time(0, true); runWatchers();

    var startAt = 0;
    if (INTERACTIVE && location.hash.length > 1) {
      var nm = decodeURIComponent(location.hash.slice(1));
      beats.forEach(function (b, i) { if (b.name === nm) startAt = i; });
    }
    if (startAt) setInstant(startAt); else { cur = 0; updateChrome(); }

    Deck.ready = true;
    gsap.to($('loader'), { opacity: 0, duration: 0.6, onComplete: function () { $('loader').style.display = 'none'; } });
    if (EMBED) {
      if (pendingGo) { var g = pendingGo; pendingGo = null; onMessage({ data: g }); }
      try { parent.postMessage({ ns: NS, type: 'ready', mode: MODE }, '*'); } catch (e) {}
    }
  }

  /* ---------------------------------------------- hooks for tools/ scripts */
  window.__deck = {
    get ready() { return Deck.ready; },
    list: function () {
      return beats.map(function (b, i) { return { i: i, name: b.name, page: b.scene, title: scenes[b.scene].title, time: +b.time.toFixed(3) }; });
    },
    go: function (i) { settle(); if (i !== cur) setInstant(i); else { tl.time(beats[i].time, true); runWatchers(); } return cur; },
    next: function () { next(); return cur; },
    back: function () { back(); return cur; },
    finish: function () { settle(); return cur; },
    busy: function () { return !!(anim || flashT); },
    seek: function (t) { settle(); tl.time(t, true); runWatchers(); return t; },
    time: function (i) { return beats[i].time; },
    /* A fingerprint of what is on screen: for every element on the stage,
       its COMPUTED opacity, visibility and transform (so two different but
       equivalent inline styles count as equal), SVG drawing attributes,
       and leaf text; plus the cloud and background dials. Numbers are
       rounded so tiny float noise does not count as a difference. */
    sig: function () {
      var round = function (s) { return s.replace(/-?\d+\.\d+(e-?\d+)?/g, function (m) { var v = (+m).toFixed(1); return v === '-0.0' ? '0.0' : v; }); };
      var plain = function (o) { var r = {}, k; for (k in o) if (k.charAt(0) !== '_') r[k] = o[k]; return JSON.stringify(r); };
      var out = [];
      Array.prototype.forEach.call($('stage').querySelectorAll('*'), function (el) {
        var cs = getComputedStyle(el), tf = cs.transform;
        if (tf !== 'none') {                       // an identity matrix looks the same as no transform
          var n = tf.replace(/^matrix(3d)?\(|\)$/g, '').split(',').map(function (v) { return Math.round(+v * 1000) / 1000; });
          var id = n.length === 6 ? [1, 0, 0, 1, 0, 0] : [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
          if (n.every(function (v, i) { return Math.abs(v - id[i]) < 1e-3; })) tf = 'none';
        }
        var row = el.tagName + '#' + el.id + ' ' + cs.opacity + ' ' + cs.visibility + ' ' + tf;
        ['stroke-dashoffset', 'd', 'width', 'height', 'x', 'y', 'cx', 'cy', 'r'].forEach(function (a) { if (el.namespaceURI !== 'http://www.w3.org/1999/xhtml' && el.hasAttribute(a)) row += ' ' + a + '=' + el.getAttribute(a); });
        if (!el.children.length) row += ' "' + el.textContent + '"';
        out.push(row);
      });
      return round(out.join('\n') + '|' + plain(Cloud.state) + '|' + plain(BG));
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
