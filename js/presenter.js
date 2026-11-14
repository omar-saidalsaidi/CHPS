/* ==========================================================================
   presenter.js — the presenter window.

   Talks to the show window (window.opener) with postMessage, which works on
   file://. It says "hello" every 2 seconds, so if you reload the show the
   link comes back by itself. The two copies of the show are iframes:
     index.html?mode=mirror   follows the show click by click ("Now")
     index.html?mode=preview  parked on the next click ("Next click")
   ========================================================================== */
(function () {
  'use strict';
  var NS = 'chps-deck';
  var $ = function (id) { return document.getElementById(id); };
  var deck = null, index = 0, blank = null, lastSeen = 0, timerStart = null, relayed = { now: -1, next: -1 };
  var fNow = $('f-now'), fNext = $('f-next');

  function show() { return window.opener && !window.opener.closed ? window.opener : null; }
  function send(msg) { var w = show(); if (!w) return; msg.ns = NS; try { w.postMessage(msg, '*'); } catch (e) {} }
  function toFrame(f, msg) { msg.ns = NS; try { f.contentWindow.postMessage(msg, '*'); } catch (e) {} }

  function hello() {
    send({ type: 'hello' });
    var alive = Date.now() - lastSeen < 6000;
    $('p-link').textContent = alive ? 'linked' : 'connecting';
    $('p-link').className = 'link ' + (alive ? 'ok' : 'wait');
    $('p-nolink').classList.toggle('on', !show());
  }
  setInterval(hello, 2000); hello();

  function relay(how) {
    if (!deck) return;
    if (relayed.now !== index || how === 'play') { toFrame(fNow, { type: 'go', index: index, how: how }); relayed.now = index; }
    var n = Math.min(index + 1, deck.beats.length - 1);
    if (relayed.next !== n) { toFrame(fNext, { type: 'go', index: n, how: 'instant' }); relayed.next = n; }
    $('p-end').style.display = index >= deck.beats.length - 1 ? 'flex' : 'none';
  }

  function render() {
    if (!deck) return;
    var b = deck.beats[index], s = deck.scenes[b.scene], total = deck.beats.length;
    $('p-click').textContent = 'click ' + index + ' / ' + (total - 1);
    $('p-page').textContent = s.page > 0 ? 'page ' + s.page + ' / ' + (deck.scenes.length - 1) : 'start';
    $('p-title').textContent = s.title;
    $('p-name').textContent = b.name;
    $('p-notes').innerHTML = b.notes || '';
    $('p-notes').scrollTop = 0;
    var nb = deck.beats[index + 1];
    $('p-nextname').textContent = nb ? nb.name + (nb.scene !== b.scene ? '  → page ' + nb.scene + ': ' + deck.scenes[nb.scene].title : '') : '';
    $('p-progress').firstElementChild.style.width = (total > 1 ? 100 * index / (total - 1) : 0) + '%';
    $('p-blank').textContent = blank ? '● ' + blank + ' screen on' : '';
    $('b-black').textContent = blank === 'black' ? 'Show picture' : 'Black';
  }

  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || typeof d !== 'object' || d.ns !== NS) return;
    if (e.source === fNow.contentWindow || e.source === fNext.contentWindow) {
      if (d.type === 'ready') {                         // a copy (re)loaded: park it
        if (e.source === fNow.contentWindow) { relayed.now = -1; toFrame(fNow, { type: 'blank', blank: blank }); }
        else relayed.next = -1;
        relay('instant');
      }
      return;
    }
    lastSeen = Date.now();
    if (d.type === 'deck') {
      deck = d; blank = d.blank;
      if (d.index !== index || relayed.now !== d.index) { index = d.index; relay('instant'); }
      toFrame(fNow, { type: 'blank', blank: blank });
      render(); hello();
    } else if (d.type === 'nav') {
      if (timerStart === null) timerStart = Date.now();
      index = d.index; relay(d.how); render();
    } else if (d.type === 'blank') {
      blank = d.blank; toFrame(fNow, { type: 'blank', blank: blank }); render();
    }
  });

  /* scale the 1920x1080 copies into their boxes */
  function fitFrames() {
    [['now-box', fNow], ['next-box', fNext]].forEach(function (p) {
      var w = $(p[0]).clientWidth; p[1].style.transform = 'scale(' + (w / 1920) + ')';
    });
  }
  window.addEventListener('resize', fitFrames); fitFrames();
  if (window.ResizeObserver) new ResizeObserver(fitFrames).observe(document.body);

  /* clock and timer */
  function two(n) { return (n < 10 ? '0' : '') + n; }
  setInterval(function () {
    var d = new Date(); $('p-clock').textContent = two(d.getHours()) + ':' + two(d.getMinutes());
    var s = timerStart === null ? 0 : Math.floor((Date.now() - timerStart) / 1000);
    $('p-timer').textContent = (s >= 3600 ? Math.floor(s / 3600) + ':' : '') + two(Math.floor(s / 60) % 60) + ':' + two(s % 60);
  }, 250);

  /* buttons */
  $('b-next').onclick = function () { send({ type: 'cmd', cmd: 'next' }); };
  $('b-back').onclick = function () { send({ type: 'cmd', cmd: 'back' }); };
  $('b-black').onclick = function () { send({ type: 'cmd', cmd: 'black' }); };
  $('b-reset').onclick = function () { timerStart = null; };

  /* keys: Next, Back and black/white drive the show from this window too */
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    var k = e.key, cmd = null;
    if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || k === ' ' || k === 'n' || k === 'N' || k === 'Enter') cmd = 'next';
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || k === 'Backspace') cmd = 'back';
    else if (k === 'b' || k === 'B' || k === '.') cmd = 'black';
    else if (k === 'w' || k === 'W' || k === ',') cmd = 'white';
    if (k === 'F5') e.preventDefault();
    if (cmd) { e.preventDefault(); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); send({ type: 'cmd', cmd: cmd }); }
  });
})();
