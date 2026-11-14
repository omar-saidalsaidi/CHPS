/* ==========================================================================
   particles.js — the living background: one WebGL point cloud.

   Plain WebGL 1, no libraries, no textures. About 30,000 soft dots
   (fewer with ?lite and in the presenter copies).

   SHAPES
     Each shape is a list of N points (x, y, z) in "world units".
     Shapes are built by scattering dots over surfaces in proportion to their
     area (see Cloud.P below: box, ellipsoid, cylinder, cone, surfaces of
     revolution, curves, height-field planes, text sampled from a 2D canvas).
     Register a shape with Cloud.define(name, function (N, P, rnd) {...})
     returning P.compose(N, [parts...]). It is only built when first used.

   MORPHING
     Every shape lives in its own GPU buffer. The shader reads two of them
     (state.from, state.to) and blends with state.morph (0..1). Each dot
     has its own delay, so dots leave at different moments, and swirl
     around the vertical axis while in flight (state.swirl).

   DIALS (all on Cloud.state, all tweenable by the master timeline)
     x, y      offset of the cloud centre from the stage centre, in stage px
     scale     size multiplier
     tilt      rotation about the X axis (radians)        - "lean towards me"
     roll      rotation about the Z axis (radians)
     spin      spin speed about the Y axis (radians / second)
     rotY      the fixed Y angle used when the spin is locked
     lock      0 = free spinning, 1 = locked at rotY (blend in between)
     sway      gentle rocking (0..1)
     opacity   overall opacity (dim when text needs attention)
     size      dot size in stage px
     noise     breathing jitter
     wave      ocean-like wave travelling through the dots
     burst     push every dot outward
     swirl     how much dots swirl while morphing
     flowV     speed of the flow along the lanes (world units / second)
     flowF/flowT  whether the from / to shape flows (B.morph sets these itself
               for shapes listed in Cloud.flows)
     coherent  1 = dots move in groups of (index mod 100): every dot of a
               group shares one departure time and swirl (page 5's balls)
     splitX    colour by left/right: 3 = left part colour A, right part colour B
     split     colour by height: 0 = mixed, 3 = top part colour B, bottom part colour A
     ar ag ab / br bg bb   the two colours (0..1). Use Cloud.expand({colorA:'#hex'})

   CAMERA MATHS (so labels can be pinned to dots; Cloud.project does this)
     p      = shape point * scale
     p      = Rz(roll) * Rx(tilt) * Ry(yaw) * p
              yaw = mix(spinAngle, rotY, lock) + sway * 0.35 * sin(0.5 t)
              tilt += sway * 0.12 * sin(0.37 t)
     persp  = D / (D - p.z)                     D = 5 world units (camera distance)
     stageX = 960 + x + p.x * persp * U         U = 300 stage px per world unit
     stageY = 540 + y - p.y * persp * U
     So a point at the origin with scale 1 sits at (960 + x, 540 + y), and
     one world unit at depth 0 is 300 stage pixels.
   ========================================================================== */
(function () {
  'use strict';

  var U = 300, D = 5.0;
  var Cloud = window.Cloud = { ok: false, N: 0, U: U, D: D };

  /* ---- the dials -------------------------------------------------------- */
  var S = Cloud.state = {
    from: 0, to: 0, morph: 1,
    x: 0, y: 0, scale: 1, tilt: 0, roll: 0,
    spin: 0.05, rotY: 0, lock: 0, sway: 0.3,
    opacity: 1, size: 3, noise: 0.4, wave: 0, burst: 0, swirl: 1,
    flowF: 0, flowT: 0, flowV: 0.35, split: 0, splitX: 0, coherent: 0,
    ar: 0.12, ag: 0.43, ab: 0.69,     // ocean blue
    br: 0.10, bg: 0.66, bb: 0.55      // mint teal
  };

  function hex(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }
  /* Turns {colorA:'#hex', colorB:'#hex'} into the numeric dials. */
  Cloud.expand = function (vars) {
    var v = {}, k;
    for (k in vars) v[k] = vars[k];
    if (v.colorA) { var a = hex(v.colorA); v.ar = a[0]; v.ag = a[1]; v.ab = a[2]; delete v.colorA; }
    if (v.colorB) { var b = hex(v.colorB); v.br = b[0]; v.bg = b[1]; v.bb = b[2]; delete v.colorB; }
    return v;
  };

  /* ---- random numbers (seeded, so shapes are identical on every load) --- */
  function mulberry(seed) {
    return function () {
      seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  Cloud.rng = function (seed) { return mulberry(seed); };
  function hashStr(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  /* ---- surface primitives ---------------------------------------------- */
  /* Each returns { area, sample(r) -> [x,y,z] }. Sampling is uniform by area
     (or close to it), so dense regions only appear where surfaces are big. */
  var P = Cloud.P = {};
  var TAU = Math.PI * 2;

  P.box = function (w, h, d) {
    var fa = [w * h, w * h, w * d, w * d, h * d, h * d], tot = 0, i;
    for (i = 0; i < 6; i++) tot += fa[i];
    return { area: 2 * (w * h + w * d + h * d), sample: function (r) {
      var k = r() * tot, f = 0; while (k > fa[f] && f < 5) { k -= fa[f]; f++; }
      var a = r() - 0.5, b = r() - 0.5;
      switch (f) {
        case 0: return [a * w, b * h, d / 2];
        case 1: return [a * w, b * h, -d / 2];
        case 2: return [a * w, h / 2, b * d];
        case 3: return [a * w, -h / 2, b * d];
        case 4: return [w / 2, a * h, b * d];
        default: return [-w / 2, a * h, b * d];
      }
    } };
  };

  P.ellipsoid = function (rx, ry, rz) {
    var p = 1.6075, ap = Math.pow(rx * ry, p), bp = Math.pow(rx * rz, p), cp = Math.pow(ry * rz, p);
    return { area: 4 * Math.PI * Math.pow((ap + bp + cp) / 3, 1 / p), sample: function (r) {
      var u = r() * 2 - 1, t = r() * TAU, s = Math.sqrt(1 - u * u);
      return [rx * s * Math.cos(t), ry * u, rz * s * Math.sin(t)];
    } };
  };

  /* Vertical cylinder centred on the origin; caps optional. */
  P.cylinder = function (rad, h, caps) {
    var side = TAU * rad * h, cap = caps ? Math.PI * rad * rad : 0;
    return { area: side + 2 * cap, sample: function (r) {
      var k = r() * (side + 2 * cap), t = r() * TAU;
      if (k < side) return [rad * Math.cos(t), (r() - 0.5) * h, rad * Math.sin(t)];
      var rr = rad * Math.sqrt(r()), y = k < side + cap ? h / 2 : -h / 2;
      return [rr * Math.cos(t), y, rr * Math.sin(t)];
    } };
  };

  /* Flat disc in the XY plane (facing the camera). */
  P.disc = function (rad, inner) {
    inner = inner || 0;
    return { area: Math.PI * (rad * rad - inner * inner), sample: function (r) {
      var t = r() * TAU, rr = Math.sqrt(inner * inner + r() * (rad * rad - inner * inner));
      return [rr * Math.cos(t), rr * Math.sin(t), 0];
    } };
  };

  /* Cone, apex up, base radius rad at y = -h/2. */
  P.cone = function (rad, h) {
    return { area: Math.PI * rad * Math.sqrt(rad * rad + h * h), sample: function (r) {
      var f = Math.sqrt(r()), t = r() * TAU, rr = rad * f;
      return [rr * Math.cos(t), h / 2 - f * h, rr * Math.sin(t)];
    } };
  };

  /* Surface of revolution about Y. profile(t) -> [radius, y], t in 0..1. */
  P.revolve = function (profile, steps) {
    steps = steps || 200;
    var cdf = [0], tot = 0, prev = profile(0), i;
    for (i = 1; i <= steps; i++) {
      var q = profile(i / steps), dr = q[0] - prev[0], dy = q[1] - prev[1];
      tot += TAU * (q[0] + prev[0]) / 2 * Math.sqrt(dr * dr + dy * dy);
      cdf.push(tot); prev = q;
    }
    return { area: tot, sample: function (r) {
      var k = r() * tot, lo = 0, hi = steps;
      while (lo < hi) { var m = (lo + hi) >> 1; if (cdf[m] < k) lo = m + 1; else hi = m; }
      var t = Math.max(0, (lo - 1 + r()) / steps), q = profile(t), a = r() * TAU;
      return [q[0] * Math.cos(a), q[1], q[0] * Math.sin(a)];
    } };
  };

  /* A thin tube along a curve fn(t) -> [x,y,z], t in 0..1. */
  P.curve = function (fn, radius, steps) {
    steps = steps || 300; radius = radius || 0.01;
    var pts = [], cdf = [0], len = 0, i;
    for (i = 0; i <= steps; i++) pts.push(fn(i / steps));
    for (i = 1; i <= steps; i++) {
      var a = pts[i - 1], b = pts[i];
      len += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); cdf.push(len);
    }
    return { area: len * TAU * Math.max(radius, 0.004), sample: function (r) {
      var k = r() * len, lo = 0, hi = steps;
      while (lo < hi) { var m = (lo + hi) >> 1; if (cdf[m] < k) lo = m + 1; else hi = m; }
      var t = Math.max(0, (lo - 1 + r()) / steps), p = fn(t);
      return [p[0] + (r() - 0.5) * 2 * radius, p[1] + (r() - 0.5) * 2 * radius, p[2] + (r() - 0.5) * 2 * radius];
    } };
  };

  /* Height field: x in [-w/2,w/2], z in [-d/2,d/2], y = fn(x,z). */
  P.plane = function (w, d, fn) {
    return { area: w * d, sample: function (r) {
      var x = (r() - 0.5) * w, z = (r() - 0.5) * d;
      return [x, fn ? fn(x, z) : 0, z];
    } };
  };

  /* Text drawn on a 2D canvas, sampled in the XY plane. width = world units. */
  P.text = function (str, font, width, depth) {
    var c = document.createElement('canvas'), g = c.getContext('2d');
    g.font = font; var tw = Math.ceil(g.measureText(str).width) + 20, th = Math.ceil(parseFloat(font.match(/(\d+)px/)[1]) * 1.4);
    c.width = tw; c.height = th; g.font = font; g.fillStyle = '#000'; g.textBaseline = 'middle'; g.fillText(str, 10, th / 2);
    var data = g.getImageData(0, 0, tw, th).data, on = [], i;
    for (i = 0; i < tw * th; i++) if (data[i * 4 + 3] > 128) on.push(i);
    var k = width / tw;
    return { area: on.length * k * k, sample: function (r) {
      var idx = on[(r() * on.length) | 0] || 0, px = idx % tw + r(), py = (idx / tw | 0) + r();
      return [(px - tw / 2) * k, (th / 2 - py) * k, (r() - 0.5) * (depth || 0)];
    } };
  };

  /* Move / rotate / scale a primitive. o = { pos:[x,y,z], rot:[rx,ry,rz], scale:s, weight:w } */
  P.at = function (prim, o) {
    var pos = o.pos || [0, 0, 0], rot = o.rot || [0, 0, 0], sc = o.scale || 1;
    var cx = Math.cos(rot[0]), sx = Math.sin(rot[0]), cy = Math.cos(rot[1]), sy = Math.sin(rot[1]), cz = Math.cos(rot[2]), sz = Math.sin(rot[2]);
    return { area: prim.area * sc * sc, weight: o.weight, sample: function (r) {
      var p = prim.sample(r), x = p[0] * sc, y = p[1] * sc, z = p[2] * sc, t;
      t = y * cx - z * sx; z = y * sx + z * cx; y = t;          // X
      t = x * cy + z * sy; z = -x * sy + z * cy; x = t;         // Y
      t = x * cz - y * sz; y = x * sz + y * cz; x = t;          // Z
      return [x + pos[0], y + pos[1], z + pos[2]];
    } };
  };

  /* Spread N dots over the parts in proportion to area x weight. */
  P.compose = function (N, parts, r) {
    var out = new Float32Array(N * 3), tot = 0, i, j, n = 0;
    var w = parts.map(function (p) { var v = p.area * (p.weight || 1); tot += v; return v; });
    for (i = 0; i < parts.length; i++) {
      var cnt = i === parts.length - 1 ? N - n : Math.round(N * w[i] / tot);
      for (j = 0; j < cnt && n < N; j++, n++) {
        var q = parts[i].sample(r);
        out[n * 3] = q[0]; out[n * 3 + 1] = q[1]; out[n * 3 + 2] = q[2];
      }
    }
    // Shuffle so neighbouring dots in a buffer belong to different parts:
    // this makes the morph mix nicely instead of moving part-by-part.
    for (i = N - 1; i > 0; i--) {
      j = (r() * (i + 1)) | 0;
      for (var k = 0; k < 3; k++) { var tmp = out[i * 3 + k]; out[i * 3 + k] = out[j * 3 + k]; out[j * 3 + k] = tmp; }
    }
    return out;
  };

  /* ---- shape registry ---------------------------------------------------- */
  var gens = {}, shapes = {}, buffers = [];
  Cloud.define = function (name, fn) { gens[name] = fn; };
  Cloud.has = function (name) { return !!gens[name]; };
  Cloud.id = function (name) {
    if (shapes[name] !== undefined) return shapes[name];
    if (!gens[name]) throw new Error('Cloud: unknown shape "' + name + '"');
    var data = gens[name](Cloud.N, P, mulberry(hashStr(name)));
    var id = buffers.length;
    if (gl) { var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); buffers.push(b); }
    else buffers.push(null);
    shapes[name] = id;
    return id;
  };

  /* ---- WebGL ------------------------------------------------------------- */
  var VS = [
    'precision highp float;',
    'attribute vec3 aFrom; attribute vec3 aTo; attribute vec4 aSeed; attribute float aIdx;',
    'uniform float uMorph, uSwirl, uTime, uYaw, uTilt, uRoll, uScale, uNoise, uWave, uBurst, uSize, uOpacity, uPx;',
    'uniform float uFlowF, uFlowT, uFlowV, uSplit, uSplitX, uCoh; uniform vec4 uLanes;',
    'float h1(float n){ return fract(sin(n * 12.9898) * 43758.5453); }',
    /* flow: dots inside a lane tube (|z| < 0.4) slide along +x and wrap;
       lane length is uLanes.y above y = 0 and uLanes.z below; start x = uLanes.x */
    'float fade;',
    'vec3 flow(vec3 q, float on){',
    '  if (on < 0.5 || abs(q.z) > 0.4) return q;',
    '  float L = q.y > 0.0 ? uLanes.y : uLanes.z;',
    '  float u = mod(q.x - uLanes.x + uTime * uFlowV, L);',
    '  fade *= smoothstep(0.0, 0.18, u) * smoothstep(L, L - 0.18, u) * (0.62 + 0.38 * sin((q.x - uLanes.x) * 5.0));',  // pulses ride with the dots
    '  return vec3(uLanes.x + u, q.y, q.z);',
    '}',
    'uniform vec2 uCenter; uniform vec3 uColA, uColB;',
    'varying vec3 vCol; varying float vA;',
    'void main(){',
    '  float g = mod(aIdx, 100.0);',
    '  vec4 sd = mix(aSeed, vec4(h1(g + 1.0), h1(g + 2.0), h1(g + 3.0), h1(g + 4.0)), uCoh);',
    '  float delay = sd.y * 0.45;',
    '  float e = clamp((uMorph - delay) / 0.55, 0.0, 1.0);',
    '  e = e * e * (3.0 - 2.0 * e);',
    '  float f0 = 1.0, f1 = 1.0;',
    '  fade = 1.0; vec3 a = flow(aFrom, uFlowF); f0 = fade;',
    '  fade = 1.0; vec3 b = flow(aTo, uFlowT); f1 = fade;',
    '  vec3 p = mix(a, b, e); fade = mix(f0, f1, e);',
    '  float fl = sin(3.14159265 * e);',
    '  float sw = uSwirl * clamp(length(b - a) * 2.5, 0.0, 1.0);',  // dots that stay put do not swirl
    '  float ang = sw * fl * (1.2 + sd.x * 2.4);',
    '  float c = cos(ang), s = sin(ang);',
    '  p.xz = vec2(c * p.x - s * p.z, s * p.x + c * p.z);',
    '  vec3 dir = normalize(vec3(sd.z - 0.5, sd.w - 0.5, sd.x - 0.5) + 0.0001);',
    '  p += dir * fl * sw * 0.45;',
    '  float t = uTime;',
    '  p += uNoise * 0.035 * vec3(sin(t * 0.7 + aSeed.x * 40.0 + p.y * 3.0), sin(t * 0.9 + aSeed.z * 40.0 + p.x * 3.0), sin(t * 0.6 + aSeed.w * 40.0 + p.z * 3.0));',
    '  p.y += uWave * 0.10 * (sin(p.x * 2.1 + t * 1.1) + 0.6 * sin(p.z * 2.7 - t * 0.8 + p.x * 0.7));',
    '  p *= 1.0 + uBurst * (0.6 + aSeed.x * 1.6);',
    '  p *= uScale;',
    '  float cy = cos(uYaw), sy = sin(uYaw);',
    '  p = vec3(cy * p.x + sy * p.z, p.y, -sy * p.x + cy * p.z);',
    '  float cx = cos(uTilt), sx = sin(uTilt);',
    '  p = vec3(p.x, cx * p.y - sx * p.z, sx * p.y + cx * p.z);',
    '  float cz = cos(uRoll), sz = sin(uRoll);',
    '  p = vec3(cz * p.x - sz * p.y, sz * p.x + cz * p.y, p.z);',
    '  if (p.z > ' + (D - 0.3).toFixed(2) + ') { gl_Position = vec4(9.0, 9.0, 9.0, 1.0); gl_PointSize = 0.0; vA = 0.0; return; }',
    '  float persp = ' + D.toFixed(2) + ' / (' + D.toFixed(2) + ' - p.z);',
    '  vec2 sp = uCenter + vec2(p.x, -p.y) * persp * ' + U.toFixed(1) + ';',
    '  gl_Position = vec4(sp.x / 960.0 - 1.0, 1.0 - sp.y / 540.0, 0.0, 1.0);',
    '  gl_PointSize = max(1.0, uSize * (0.55 + aSeed.w * 0.9) * persp * uPx);',
    '  float spl = min(uSplit + uSplitX, 1.0);',
    '  float m = clamp(0.5 + aTo.y * (0.35 * (1.0 - min(uSplitX, 1.0)) + uSplit) + aTo.x * uSplitX + (aSeed.x - 0.5) * 0.7 * (1.0 - spl * 0.8), 0.0, 1.0);',
    '  vCol = mix(uColA, uColB, m);',
    '  vA = fade * uOpacity * (0.45 + 0.55 * aSeed.z) * clamp(persp * 0.85, 0.3, 1.25) / (1.0 + uBurst * 1.5);',
    '}'
  ].join('\n');
  var FS = [
    'precision mediump float;',
    'varying vec3 vCol; varying float vA;',
    'void main(){',
    '  vec2 d = gl_PointCoord - 0.5; float r2 = dot(d, d) * 4.0;',
    '  if (r2 > 1.0) discard;',
    '  float a = (exp(-r2 * 4.0) * 0.85 + 0.15 * (1.0 - r2)) * vA;',
    '  gl_FragColor = vec4(vCol * a, a);',
    '}'
  ].join('\n');

  var gl = null, prog, loc = {}, seedBuf, idxBuf, canvas, pxRatio = 1, clock = 0, spinAngle = 0;

  function shader(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  Cloud.init = function (cv, count) {
    canvas = cv; Cloud.N = count;
    try {
      gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, preserveDrawingBuffer: false });
    } catch (e) { gl = null; }
    if (!gl) { console.warn('Cloud: WebGL is not available, the background dots are off.'); return; }
    prog = gl.createProgram();
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    ['aFrom', 'aTo', 'aSeed', 'aIdx'].forEach(function (n) { loc[n] = gl.getAttribLocation(prog, n); });
    ['uMorph', 'uSwirl', 'uTime', 'uYaw', 'uTilt', 'uRoll', 'uScale', 'uNoise', 'uWave', 'uBurst', 'uSize', 'uOpacity', 'uPx', 'uCenter', 'uColA', 'uColB', 'uFlowF', 'uFlowT', 'uFlowV', 'uSplit', 'uSplitX', 'uCoh', 'uLanes']
      .forEach(function (n) { loc[n] = gl.getUniformLocation(prog, n); });
    var r = mulberry(12345), seeds = new Float32Array(count * 4);
    for (var i = 0; i < seeds.length; i++) seeds[i] = r();
    seedBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, seedBuf); gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
    var idx = new Float32Array(count); for (i = 0; i < count; i++) idx[i] = i;
    idxBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, idxBuf); gl.bufferData(gl.ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); Cloud.ok = false; });
    Cloud.ok = true;
  };

  /* Called by the engine when the stage scale changes. */
  Cloud.resize = function (stageScale) {
    if (!canvas) return;
    var dpr = window.devicePixelRatio || 1;
    pxRatio = Math.min(stageScale * dpr, 1.5);          // canvas px per stage px (capped for speed)
    var w = Math.round(1920 * pxRatio), h = Math.round(1080 * pxRatio);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  };

  function angles() {
    var yaw = spinAngle + (S.rotY - spinAngle) * S.lock + S.sway * 0.35 * Math.sin(clock * 0.5);
    var tilt = S.tilt + S.sway * 0.12 * Math.sin(clock * 0.37);
    return [yaw, tilt, S.roll];
  }

  /* Stage-pixel position of a shape-space point, matching the shader
     (without the per-dot noise and morph). Use it to pin labels to dots. */
  /* Where a shape point lands for a given set of dials (still camera).
     Used at build time to compute "fly-to" camera moves. */
  Cloud.projectWith = function (d, x, y, z) {
    var a = [d.rotY || 0, d.tilt || 0, d.roll || 0], sc = d.scale === undefined ? 1 : d.scale, t;
    x *= sc; y *= sc; z *= sc;
    var cy = Math.cos(a[0]), sy = Math.sin(a[0]); t = cy * x + sy * z; z = -sy * x + cy * z; x = t;
    var cx = Math.cos(a[1]), sx = Math.sin(a[1]); t = cx * y - sx * z; z = sx * y + cx * z; y = t;
    var cz = Math.cos(a[2]), sz = Math.sin(a[2]); t = cz * x - sz * y; y = sz * x + cz * y; x = t;
    var persp = D / (D - z);
    return { x: 960 + (d.x || 0) + x * persp * U, y: 540 + (d.y || 0) - y * persp * U, persp: persp };
  };
  /* Dials {x, y} that put shape point pt at stage point (tx, ty), given the other dials. */
  Cloud.aim = function (d, pt, tx, ty) {
    var o = {}, k; for (k in d) o[k] = d[k]; o.x = 0; o.y = 0;
    var p = Cloud.projectWith(o, pt[0], pt[1], pt[2] || 0);
    o.x = tx - p.x; o.y = ty - p.y; return o;
  };

  Cloud.project = function (x, y, z, still) {
    // still = true: ignore the free spin and sway (use rotY and tilt only).
    // Use it for labels shown while the spin is locked: the result then
    // depends only on the dials, so Back and jumping give the same picture.
    var a = still ? [S.rotY, S.tilt, S.roll] : angles(), sc = S.scale, t;
    x *= sc; y *= sc; z *= sc;
    var cy = Math.cos(a[0]), sy = Math.sin(a[0]); t = cy * x + sy * z; z = -sy * x + cy * z; x = t;
    var cx = Math.cos(a[1]), sx = Math.sin(a[1]); t = cx * y - sx * z; z = sx * y + cx * z; y = t;
    var cz = Math.cos(a[2]), sz = Math.sin(a[2]); t = cz * x - sz * y; y = sz * x + cz * y; x = t;
    var persp = D / (D - z);
    return { x: 960 + S.x + x * persp * U, y: 540 + S.y - y * persp * U, persp: persp };
  };

  Cloud.render = function (dt) {
    dt = Math.min(dt || 0, 0.1);
    clock += dt;
    spinAngle += S.spin * dt * (1 - S.lock);
    // keep the free angle near the lock angle so unlocking never jumps a full turn
    if (spinAngle - S.rotY > Math.PI) spinAngle -= Math.PI * 2;
    if (spinAngle - S.rotY < -Math.PI) spinAngle += Math.PI * 2;
    if (!Cloud.ok) return;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    if (S.opacity <= 0.001 || !buffers.length) return;
    var from = buffers[Math.max(0, Math.min(buffers.length - 1, S.from | 0))];
    var to = buffers[Math.max(0, Math.min(buffers.length - 1, S.to | 0))];
    gl.bindBuffer(gl.ARRAY_BUFFER, from); gl.enableVertexAttribArray(loc.aFrom); gl.vertexAttribPointer(loc.aFrom, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, to); gl.enableVertexAttribArray(loc.aTo); gl.vertexAttribPointer(loc.aTo, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, seedBuf); gl.enableVertexAttribArray(loc.aSeed); gl.vertexAttribPointer(loc.aSeed, 4, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, idxBuf); gl.enableVertexAttribArray(loc.aIdx); gl.vertexAttribPointer(loc.aIdx, 1, gl.FLOAT, false, 0, 0);
    var a = angles();
    gl.uniform1f(loc.uMorph, S.morph); gl.uniform1f(loc.uSwirl, S.swirl); gl.uniform1f(loc.uTime, clock);
    gl.uniform1f(loc.uYaw, a[0]); gl.uniform1f(loc.uTilt, a[1]); gl.uniform1f(loc.uRoll, a[2]);
    gl.uniform1f(loc.uScale, S.scale); gl.uniform1f(loc.uNoise, S.noise); gl.uniform1f(loc.uWave, S.wave);
    gl.uniform1f(loc.uBurst, S.burst); gl.uniform1f(loc.uSize, S.size); gl.uniform1f(loc.uOpacity, Math.min(1, S.opacity));
    gl.uniform1f(loc.uPx, pxRatio);
    gl.uniform1f(loc.uFlowF, S.flowF); gl.uniform1f(loc.uFlowT, S.flowT); gl.uniform1f(loc.uFlowV, S.flowV); gl.uniform1f(loc.uSplit, S.split); gl.uniform1f(loc.uSplitX, S.splitX); gl.uniform1f(loc.uCoh, S.coherent);
    var LN = Cloud.LANES; gl.uniform4f(loc.uLanes, LN.x0, LN.L1, LN.L2, 0);
    gl.uniform2f(loc.uCenter, 960 + S.x, 540 + S.y);
    gl.uniform3f(loc.uColA, S.ar, S.ag, S.ab); gl.uniform3f(loc.uColB, S.br, S.bg, S.bb);
    gl.drawArrays(gl.POINTS, 0, Cloud.N);
  };

  /* ======================================================================
     Built-in shapes used by the engine itself.
     ====================================================================== */

  /* Start screen: a calm sea surface (the coast is where Korea's hydrogen
     and ammonia arrives). Wide, shallow, gently uneven. */
  Cloud.define('ocean', function (N, P, r) {
    return P.compose(N, [
      P.plane(7.4, 4.6, function (x, z) { return 0.08 * Math.sin(x * 1.3 + z * 0.6) + 0.05 * Math.cos(z * 2.1 - x * 0.4); })
    ], r);
  });

  /* ---- Page 1, cover: the hydrogen molecule H2 -------------------------
     Two hydrogen atoms whose electron clouds merge into one bond: the union
     of two overlapping spheres (dots inside the other sphere are dropped),
     a bright nucleus in each, and two faint orbit lines. */
  Cloud.define('h2', function (N, P, r) {
    var R = 0.78, d = 0.52;
    function lobe(sign) {
      var e = P.ellipsoid(R, R, R);
      return { area: e.area * 0.86, sample: function (rr) {
        for (var k = 0; k < 40; k++) {
          var q = e.sample(rr), x = q[0] + sign * d;
          if (Math.hypot(x + sign * d, q[1], q[2]) >= R * 0.999) return [x, q[1], q[2]];
        }
        return [sign * (d + R), 0, 0];
      } };
    }
    function orbit(sign, tilt) {
      return P.at(P.curve(function (t) { var a = t * Math.PI * 2; return [Math.cos(a) * 1.05, 0, Math.sin(a) * 1.05]; }, 0.006, 240),
        { pos: [sign * d, 0, 0], rot: [tilt, 0, sign * 0.5], weight: 0.9 });
    }
    return P.compose(N, [
      lobe(1), lobe(-1),
      P.at(P.ellipsoid(0.07, 0.07, 0.07), { pos: [d, 0, 0], weight: 40 }),
      P.at(P.ellipsoid(0.07, 0.07, 0.07), { pos: [-d, 0, 0], weight: 40 }),
      orbit(1, 1.1), orbit(-1, -1.1)
    ], r);
  });

  /* ---- Page 2, click 1: hydrogen carved out of the RPS ------------------
     A thick portfolio "pie" (a coin-like slab). The big part (300 deg) is
     the Renewable Portfolio Standard, divided by radial seams into several
     technologies; one 60 deg wedge (hydrogen) is pulled out and forward.
     Faces in the XY plane, so it reads like a chart when seen head-on. */
  function sector(a0, a1, R, th, off) {
    var span = a1 - a0, faceA = span / 2 * R * R, rimA = span * R * th, cutA = R * th;
    var tot = 2 * faceA + rimA + 2 * cutA;
    return { area: tot, sample: function (r) {
      var k = r() * tot, a, rr, z;
      if (k < 2 * faceA) { a = a0 + r() * span; rr = R * Math.sqrt(r()); z = k < faceA ? th / 2 : -th / 2; }
      else if (k < 2 * faceA + rimA) { a = a0 + r() * span; rr = R; z = (r() - 0.5) * th; }
      else { a = k < 2 * faceA + rimA + cutA ? a0 : a1; rr = R * r(); z = (r() - 0.5) * th; }
      return [rr * Math.cos(a) + off[0], rr * Math.sin(a) + off[1], z + off[2]];
    } };
  }
  Cloud.PIE = { R: 1.15, wedge: [Math.PI * 0.12, Math.PI * 0.12 + Math.PI / 3], pull: 0.42 };
  Cloud.define('rps-split', function (N, P, r) {
    var C = Cloud.PIE, R = C.R, w0 = C.wedge[0], w1 = C.wedge[1], mid = (w0 + w1) / 2;
    var off = [Math.cos(mid) * C.pull, Math.sin(mid) * C.pull, 0.25];
    var seams = [];
    [w1 + 1.0, w1 + 2.1, w1 + 3.3, w1 + 4.4].forEach(function (a) {
      seams.push(P.curve(function (t) { return [Math.cos(a) * R * t, Math.sin(a) * R * t, 0.07]; }, 0.008, 60));
    });
    var main = sector(w1 + 0.06, w0 + Math.PI * 2 - 0.06, R, 0.16, [0, 0, 0]);
    var wedge = sector(w0, w1, R, 0.16, off); wedge.weight = 2.2;
    return P.compose(N, [main, wedge].concat(seams.map(function (sm) { sm.weight = 1.5; return sm; })), r);
  });

  /* ---- Page 2, timeline: the auctioneer's gavel --------------------------
     Head (a horizontal cylinder with two bands), a handle and the sound
     block it strikes. The whole thing leans; the "strike" is a roll dial. */
  Cloud.define('gavel', function (N, P, r) {
    var hx = -0.15, hy = 0.45, ang = -0.95;              // head centre; handle leans down-right
    var hl = 1.55, hcx = hx + Math.cos(ang) * hl / 2, hcy = hy + Math.sin(ang) * hl / 2;
    return P.compose(N, [
      P.at(P.cylinder(0.24, 1.05, true), { rot: [0, 0, ang + Math.PI], pos: [hx, hy, 0] }),           // head, at right angles to the handle
      P.at(P.cylinder(0.265, 0.07, false), { rot: [0, 0, ang + Math.PI], pos: [hx + Math.cos(ang + Math.PI / 2) * 0.36, hy + Math.sin(ang + Math.PI / 2) * 0.36, 0], weight: 1.4 }),
      P.at(P.cylinder(0.265, 0.07, false), { rot: [0, 0, ang + Math.PI], pos: [hx - Math.cos(ang + Math.PI / 2) * 0.36, hy - Math.sin(ang + Math.PI / 2) * 0.36, 0], weight: 1.4 }),
      P.at(P.cylinder(0.06, hl, true), { rot: [0, 0, ang + Math.PI / 2], pos: [hcx, hcy, 0], weight: 1.6 }), // handle
      P.at(P.cylinder(0.55, 0.16, true), { pos: [-0.55, -0.95, 0], weight: 0.9 })                       // sound block
    ], r);
  });

  /* ---- Page 2, roles: who does what --------------------------------------
     A small network. MOTIE (policy) feeds KPX (the auction) and mandates
     KEPCO (the buyer). Six generator plants bid into KPX (the first clean
     hydrogen auction had 6 plants bidding), and the winner links to KEPCO.
     Node positions are exported in Cloud.NET so labels can be pinned. */
  Cloud.NET = {
    motie: [-0.95, 0.95, 0], kpx: [0.0, 0.0, 0.1], kepco: [1.05, 0.75, -0.1],
    plants: [[-1.25, -0.95, 0.2], [-0.75, -1.2, -0.15], [-0.2, -1.32, 0.15], [0.35, -1.28, -0.1], [0.85, -1.1, 0.2], [1.3, -0.8, 0]]
  };
  Cloud.define('roles-net', function (N, P, r) {
    var T = Cloud.NET, parts = [];
    function node(p, rad, w) { parts.push(P.at(P.ellipsoid(rad, rad, rad), { pos: p, weight: w })); }
    function edge(a, b, w, bow) {
      var c = P.curve(function (t) {
        var m = Math.sin(Math.PI * t) * (bow || 0);
        return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + m, a[2] + (b[2] - a[2]) * t];
      }, 0.007, 120);
      c.weight = w; parts.push(c);
    }
    node(T.motie, 0.19, 1.6); node(T.kpx, 0.23, 1.6); node(T.kepco, 0.18, 1.6);
    T.plants.forEach(function (p, i) { node(p, i === 3 ? 0.12 : 0.09, i === 3 ? 3 : 2.2); edge(p, T.kpx, 1.4, 0); });
    edge(T.motie, T.kpx, 2.4, 0.05); edge(T.motie, T.kepco, 2.4, 0.35); edge(T.kpx, T.kepco, 2.4, 0.08);
    edge(T.plants[3], T.kepco, 1.6, -0.25);
    return P.compose(N, parts, r);
  });
  /* ---- Page 3: the two tiers as two lanes ---------------------------------
     Time runs left to right. Top lane = General tier (20-year contracts),
     bottom lane = Clean tier (15-year contracts): lengths are to scale.
     Each lane is a tube of dots that flows (see the flow dial); one tick
     per contract year sits just behind each lane (above the top lane, below the bottom one) (z = -0.5, so it does not
     flow). 'lanes-vol' makes the tube cross-sections proportional to the
     target volumes (1,300 vs 6,500 GWh/yr -> radius ratio sqrt(5)). */
  Cloud.LANES = { x0: -1.8, L1: 3.6, L2: 2.7, yG: 0.45, yC: -0.45 };
  Cloud.flows = { lanes: true, 'lanes-vol': true };
  function lanes(N, P, r, rG, rC) {
    var LN = Cloud.LANES, parts = [];
    function tube(y, L, rad, w) {
      var t = { area: L * rad * 6, weight: w, sample: function (rr) {
        var a = rr() * Math.PI * 2, d = rad * Math.sqrt(rr());
        return [LN.x0 + rr() * L, y + Math.cos(a) * d, Math.sin(a) * d * 0.9];
      } };
      parts.push(t);
    }
    function ticks(y, rad, years, w) {
      var step = LN.L1 / 20;
      for (var i = 0; i <= years; i++) (function (x, big) {
        var c = P.curve(function (t) { var sg = y > 0 ? 1 : -1; return [x, y + sg * (rad + 0.07 + t * (big ? 0.16 : 0.08)), -0.5]; }, 0.006, 20);
        c.weight = w * (big ? 2 : 1); parts.push(c);
      })(LN.x0 + i * step, i % 5 === 0);
    }
    tube(LN.yG, LN.L1, rG, 1); tube(LN.yC, LN.L2, rC, 1);
    ticks(LN.yG, rG, 20, 14); ticks(LN.yC, rC, 15, 14);
    return P.compose(N, parts, r);
  }
  Cloud.define('lanes', function (N, P, r) { return lanes(N, P, r, 0.11, 0.11); });
  Cloud.define('lanes-vol', function (N, P, r) { return lanes(N, P, r, 0.1, 0.1 * Math.sqrt(5)); });
  /* ---- Page 4: the certification gauge ------------------------------------
     A dotted column on a true-to-scale axis of lifecycle emissions:
     y = y0 + kg * k (0 kg at the bottom, the 4.0 kg ceiling at the top).
     Grade bands are shells of the column separated by thin gaps; Grade 1
     (0-0.1 kg) is therefore a thin ring: its strictness is visible.
     A wide dense ring marks the 4.0 kg ceiling; sparse haze above it is
     "ineligible". A "source" cluster (a quarter of the dots) settles into
     the band being discussed: gauge-t1, gauge-t12, gauge-above. */
  Cloud.GAUGE = { y0: -1.3, k: 0.65, R: 0.55, bands: [[0, 0.1], [0.1, 1.0], [1.0, 2.0], [2.0, 4.0]] };
  function gauge(N, P, r, focus) {
    // All gauge variants share the SAME structure dots (same seed, same
    // count, same final order), so morphing between them moves only the
    // quarter of the dots that form the "source" cluster.
    var G = Cloud.GAUGE, parts = [], y = function (kg) { return G.y0 + kg * G.k; };
    var nC = Math.round(N * 0.25), nS = N - nC;
    G.bands.forEach(function (b, i) {
      var y1 = y(b[0]) + (i ? 0.06 : 0), y2 = y(b[1]) - 0.02, h = Math.max(0.02, y2 - y1);
      parts.push(P.at(P.cylinder(G.R, h, false), { pos: [0, (y1 + y2) / 2, 0], weight: i === 0 ? 6 : 0.8 }));
      // a bright, slightly wider ring marks the bottom of each grade
      parts.push(P.at(P.curve(function (t) { var a = t * Math.PI * 2; return [Math.cos(a) * (G.R + 0.05), 0, Math.sin(a) * (G.R + 0.05)]; }, 0.012, 200), { pos: [0, y(b[0]) + (i ? 0.02 : 0), 0], weight: 5 }));
    });
    parts.push(P.at(P.disc(1.0, G.R + 0.04), { pos: [0, y(4), 0], rot: [Math.PI / 2, 0, 0], weight: 2.2 }));           // the ceiling
    parts.push({ area: 1, weight: 0.15, sample: function (rr) { var a = rr() * 6.283, d = G.R * Math.sqrt(rr()); return [Math.cos(a) * d, y(4) + 0.08 + rr() * 0.55, Math.sin(a) * d]; } });
    var struct = P.compose(nS, parts, Cloud.rng(7001));
    var rc = Cloud.rng(7002), clus = focus ? null : P.compose(nC, parts, Cloud.rng(7003));
    if (!clus) {
      clus = new Float32Array(nC * 3);
      for (var i = 0; i < nC; i++) {
        var f = focus[i % focus.length], a = rc() * 6.283, d = (G.R - 0.06) * Math.sqrt(rc());
        clus[i * 3] = Math.cos(a) * d; clus[i * 3 + 1] = y(f[0]) + (y(f[1]) - y(f[0])) * (0.15 + 0.7 * rc()); clus[i * 3 + 2] = Math.sin(a) * d;
      }
    }
    var out = new Float32Array(N * 3), perm = [], k, rp = Cloud.rng(7004);
    for (k = 0; k < N; k++) perm.push(k);
    for (k = N - 1; k > 0; k--) { var j = (rp() * (k + 1)) | 0, t = perm[k]; perm[k] = perm[j]; perm[j] = t; }
    for (k = 0; k < N; k++) {
      var src = k < nS ? struct : clus, o = k < nS ? k : k - nS;
      out[perm[k] * 3] = src[o * 3]; out[perm[k] * 3 + 1] = src[o * 3 + 1]; out[perm[k] * 3 + 2] = src[o * 3 + 2];
    }
    return out;
  }
  Cloud.define('gauge', function (N, P, r) { return gauge(N, P, r, null); });
  Cloud.define('gauge-t1', function (N, P, r) { return gauge(N, P, r, [[0, 0.1]]); });
  Cloud.define('gauge-above', function (N, P, r) { return gauge(N, P, r, [[4.15, 4.9]]); });
  Cloud.define('gauge-t12', function (N, P, r) { return gauge(N, P, r, [[0, 0.1], [0.1, 1.0]]); });

  /* ---- Page 4: the supply chain and the well-to-gate boundary --------------
     Left to right: extraction (a well head), the production plant (a block
     with two stacks and a tank), the production gate (a frame), the sea
     route with an ammonia carrier (hull + three spherical tanks), and a
     Korean port (quay + two cranes). x positions in Cloud.CHAIN. */
  Cloud.CHAIN = { well: -2.0, plant: -1.25, gate: -0.45, ship: 0.6, port: 1.75, base: -0.35 };
  Cloud.define('chain', function (N, P, r) {
    var C = Cloud.CHAIN, b = C.base, parts = [];
    function add(p, o) { parts.push(P.at(p, o)); }
    add(P.cone(0.16, 0.5), { pos: [C.well, b + 0.25, 0], weight: 1.4 });
    add(P.box(0.7, 0.45, 0.45), { pos: [C.plant, b + 0.225, 0] });
    add(P.cylinder(0.06, 0.5, true), { pos: [C.plant - 0.2, b + 0.65, 0], weight: 1.5 });
    add(P.cylinder(0.06, 0.4, true), { pos: [C.plant + 0.05, b + 0.6, 0], weight: 1.5 });
    add(P.ellipsoid(0.16, 0.16, 0.16), { pos: [C.plant + 0.52, b + 0.16, 0] });
    parts.push(P.curve(function (t) { return [C.gate - 0.22, b + t * 0.9, 0]; }, 0.01, 40));
    parts.push(P.curve(function (t) { return [C.gate + 0.22, b + t * 0.9, 0]; }, 0.01, 40));
    parts.push(P.curve(function (t) { return [C.gate - 0.22 + t * 0.44, b + 0.9, 0]; }, 0.01, 40));
    parts.push(P.curve(function (t) { return [C.well + t * (C.gate - C.well), b, 0]; }, 0.008, 120));                // pipeline to the gate
    var route = P.curve(function (t) { var x = C.gate + 0.25 + t * (C.port - C.gate - 0.6); return [x, b - 0.04 + 0.03 * Math.sin(x * 14), 0]; }, 0.012, 300);
    route.weight = 1.2; parts.push(route);                                                                                // the sea route
    add(P.box(0.95, 0.16, 0.24), { pos: [C.ship, b + 0.06, 0] });
    [-0.28, 0, 0.28].forEach(function (dx) { add(P.ellipsoid(0.12, 0.12, 0.12), { pos: [C.ship + dx, b + 0.25, 0], weight: 1.2 }); });
    add(P.box(0.6, 0.12, 0.4), { pos: [C.port, b - 0.02, 0] });
    [-0.15, 0.18].forEach(function (dx) {
      parts.push(P.curve(function (t) { return [C.port + dx, b + 0.04 + t * 0.7, 0]; }, 0.01, 40));
      parts.push(P.curve(function (t) { return [C.port + dx - 0.25 + t * 0.4, b + 0.72, 0]; }, 0.01, 40));
    });
    return P.compose(N, parts, r);
  });
  /* ---- Page 5: the 100-point scorecard -------------------------------------
     100 "points" drawn as 100 small balls of dots. Every dot belongs to a
     fixed ball (dot k -> ball k mod 100) with a fixed local offset, so when
     the layout changes, each ball travels as one unit. Layouts:
       score-grid    10 x 10
       score-split   60 price balls (6 x 10, left) | 40 non-price (5 x 8, right)
       score-groups  the 40 split into criteria (top to bottom): supply 10,
                     domestic 10, grade 10, 5 swing points (drawn as rings),
                     execution 5
       bids / bids-cut  six bid columns (illustrative heights); in bids-cut
                     the columns above the ceiling collapse to the floor.
     Positions are exported in Cloud.SCORE for labels and highlight boxes. */
  var S5 = Cloud.SCORE = {
    s: 0.2, rb: 0.068,
    priceX: function (c) { return -1.25 + c * 0.2; }, rowY: function (r) { return 0.9 - r * 0.2; },
    npX: function (c) { return 0.15 + c * 0.2; },
    npSplitY: function (r) { return 0.7 - r * 0.2; },
    groupOfRow: [0, 0, 1, 1, 2, 2, 3, 4],
    npGroupY: function (r) { return 0.9 - r * 0.2 - S5.groupOfRow[r] * 0.12; },
    bidRows: [9, 10, 8, 11, 5, 7], bidX: function (i) { return -1.5 + i * 0.6; }, bidY0: -1.0, cap: 0.0, winner: 4
  };
  // which ball is which: grid cell (r, c); c < 6 -> price ball p, else non-price ball q
  function ballRole(b) { var r = (b / 10) | 0, c = b % 10; return c < 6 ? { price: true, i: r * 6 + c } : { price: false, i: r * 4 + (c - 6) }; }
  var localCache = {};
  function locals(N) {
    if (localCache[N]) return localCache[N];
    var r = Cloud.rng(9001), L = new Float32Array(N * 4);
    for (var k = 0; k < N; k++) {
      var u = r() * 2 - 1, t = r() * Math.PI * 2, q = Math.sqrt(1 - u * u), d = Math.pow(r(), 0.25);
      L[k * 4] = q * Math.cos(t) * d; L[k * 4 + 1] = u * d; L[k * 4 + 2] = q * Math.sin(t) * d; L[k * 4 + 3] = t;
    }
    return (localCache[N] = L);
  }
  function balls(N, centre) {      // centre(b) -> [x, y, z, ring?]
    var L = locals(N), out = new Float32Array(N * 3), C = [];
    for (var b = 0; b < 100; b++) C.push(centre(b));
    for (var k = 0; k < N; k++) {
      var c = C[k % 100], R = S5.rb;
      if (c[3]) { out[k * 3] = c[0] + Math.cos(L[k * 4 + 3]) * R; out[k * 3 + 1] = c[1] + Math.sin(L[k * 4 + 3]) * R; out[k * 3 + 2] = c[2]; }
      else { out[k * 3] = c[0] + L[k * 4] * R; out[k * 3 + 1] = c[1] + L[k * 4 + 1] * R; out[k * 3 + 2] = c[2] + L[k * 4 + 2] * R; }
    }
    return out;
  }
  Cloud.define('score-grid', function (N) { return balls(N, function (b) { return [-1.05 + (b % 10) * 0.2, S5.rowY((b / 10) | 0), 0]; }); });
  Cloud.define('score-split', function (N) {
    return balls(N, function (b) {
      var R = ballRole(b);
      return R.price ? [S5.priceX(R.i % 6), S5.rowY((R.i / 6) | 0), 0] : [S5.npX(R.i % 5), S5.npSplitY((R.i / 5) | 0), 0];
    });
  });
  Cloud.define('score-groups', function (N) {
    return balls(N, function (b) {
      var R = ballRole(b);
      if (R.price) return [S5.priceX(R.i % 6), S5.rowY((R.i / 6) | 0), 0];
      var row = (R.i / 5) | 0;
      return [S5.npX(R.i % 5), S5.npGroupY(row), 0, row === 6 ? 1 : 0];
    });
  });
  function bidSlot(b) {               // ball b -> [column, k-th ball in that column]
    var n = b, i = 0;
    while (n >= S5.bidRows[i] * 2) { n -= S5.bidRows[i] * 2; i++; }
    return [i, n];
  }
  function bidPos(i, n) { return [S5.bidX(i) + (n % 2 ? 0.1 : -0.1), S5.bidY0 + ((n / 2) | 0) * 0.2, 0]; }
  Cloud.define('bids', function (N) { return balls(N, function (b) { var s = bidSlot(b); return bidPos(s[0], s[1]); }); });
  Cloud.define('bids-cut', function (N) {
    var jr = Cloud.rng(9002), J = []; for (var b = 0; b < 100; b++) J.push([jr() - 0.5, jr() - 0.5]);
    return balls(N, function (b) {
      var s = bidSlot(b), i = s[0], n = s[1];
      if (i === S5.winner) return bidPos(i, n);
      // disqualified: the column tumbles into a low heap on the floor
      return [S5.bidX(i) + ((n % 4) - 1.5) * 0.13 + J[b][0] * 0.05, S5.bidY0 + ((n / 12) | 0) * 0.13 + J[b][1] * 0.03, ((((n / 4) | 0) % 3) - 1) * 0.15];
    });
  });
  /* ---- Page 6: fifteen contract years ---------------------------------------
     Every dot belongs to one year (dot k -> year k mod 15) with a fixed local
     position (u, v, w in 0..1), so the three layouts share their dots:
       years-tiles  15 flat slabs under the chart: the 15-year contract
       years-vol    15 equal columns: the contracted annual volume
       years-carry  year 3 delivers 15% less; that top slice sits on top of
                    year 4 (carried over to the next year)
     Year centres and the floor height are in Cloud.YEARS. */
  var YR = Cloud.YEARS = { dx: 0.36, y0: -0.833, w: 0.28, d: 0.28, short: 2, cut: 0.85, h: 1.3 };
  YR.x = function (i) { return (i - 7) * YR.dx; };
  var yrCache = {};
  function yrLocals(N) {
    if (yrCache[N]) return yrCache[N];
    var r = Cloud.rng(9101), L = new Float32Array(N * 4);
    for (var k = 0; k < N * 4; k++) L[k] = r();
    return (yrCache[N] = L);
  }
  function years(N, h, carry) {
    var L = yrLocals(N), out = new Float32Array(N * 3);
    for (var k = 0; k < N; k++) {
      var c = k % 15, u = L[k * 4], v = L[k * 4 + 1], w = L[k * 4 + 2], q = L[k * 4 + 3], x, y, z;
      if (!carry && h < 0.1) {
        // flat 3D slab: put each dot on one of the box faces
        var f = Math.floor(q * 6), uu = u, vv = v, ww = w;
        if (f === 0) uu = 0; else if (f === 1) uu = 1; else if (f === 2) ww = 0; else if (f === 3) ww = 1; else if (f === 4) vv = 1;
        x = YR.x(c) + (uu - 0.5) * YR.w; y = YR.y0 + vv * h; z = (ww - 0.5) * YR.d;
      } else {
        // a flat bar facing the camera: 70% fill, 30% on the outline
        var uu2 = u, vv2 = v;
        if (q < 0.3) { var e = Math.floor(q / 0.075); if (e === 0) uu2 = 0; else if (e === 1) uu2 = 1; else if (e === 2) vv2 = 0; else vv2 = 1; }
        x = YR.x(c) + (uu2 - 0.5) * YR.w; y = YR.y0 + vv2 * h; z = (w - 0.5) * 0.03;
        if (carry && c === YR.short && vv2 > YR.cut) { x += YR.dx; y = YR.y0 + h + 0.04 + (vv2 - YR.cut) * h; }
      }
      out[k * 3] = x; out[k * 3 + 1] = y; out[k * 3 + 2] = z;
    }
    return out;
  }
  Cloud.define('years-tiles', function (N) { return years(N, 0.05, false); });
  Cloud.define('years-vol', function (N) { return years(N, YR.h, false); });
  Cloud.define('years-carry', function (N) { return years(N, YR.h, true); });
  /* ---- Page 7: South Korea's coast and the four sites ----------------------
     Outline: window.KOREA_RINGS (js/data-korea.js, Natural Earth, public
     domain). Map in the XY plane: x = (lon - 127.8) * 0.5 * cos(36 deg),
     y = (lat - 36) * 0.5; +z points up off the map. 85% of the dots are the
     map (coast lines + sparse land), shared by every variant; the other 15%
     are "beacon" dots: four small rings in korea-map, one light beam over
     the focused site in korea-<site>, a sea route to the south-west in
     korea-corridor. */
  var KM = Cloud.KMAP = {
    xy: function (lon, lat) { return [(lon - 127.8) * 0.5 * Math.cos(36 * Math.PI / 180), (lat - 36) * 0.5, 0]; },
    sites: { samcheok: [129.19, 37.42], ulsan: [129.38, 35.5], yeosu: [127.7, 34.85], boryeong: [126.52, 36.33] }
  };
  KM.at = function (name) { var s = KM.sites[name]; return KM.xy(s[0], s[1]); };
  function inside(px, py, ring) {
    var c = false;
    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      var xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
      if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) c = !c;
    }
    return c;
  }
  var kmBase = {};
  function koreaBase(N) {
    if (kmBase[N]) return kmBase[N];
    var R = window.KOREA_RINGS || [], parts = [];
    R.forEach(function (ring, i) {
      var pts = ring.map(function (p) { return KM.xy(p[0], p[1]); });
      var c = P.curve(function (t) {
        var f = t * (pts.length - 1), k = Math.min(pts.length - 2, Math.floor(f)), u = f - k;
        return [pts[k][0] + (pts[k + 1][0] - pts[k][0]) * u, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * u, 0];
      }, 0.006, pts.length * 4);
      c.weight = 3; parts.push(c);
    });
    // sparse land fill (rejection-sampled inside the outline)
    parts.push({ area: 1.4, weight: 1.2, sample: function (r) {
      for (var n = 0; n < 60; n++) {
        var lon = 126 + r() * 3.7, lat = 33.1 + r() * 5.6;
        for (var i = 0; i < R.length; i++) if (inside(lon, lat, R[i])) { var q = KM.xy(lon, lat); return [q[0], q[1], (r() - 0.5) * 0.01]; }
      }
      return KM.xy(127.8, 36.5);
    } });
    return (kmBase[N] = P.compose(N - Math.round(N * 0.15), parts, Cloud.rng(9201)));
  }
  function korea(N, beacon) {
    var base = koreaBase(N), nB = Math.round(N * 0.15), nS = N - nB, r = Cloud.rng(9202), bea = new Float32Array(nB * 3), k;
    for (k = 0; k < nB; k++) { var q = beacon(k, nB, r); bea[k * 3] = q[0]; bea[k * 3 + 1] = q[1]; bea[k * 3 + 2] = q[2]; }
    var out = new Float32Array(N * 3), perm = [], rp = Cloud.rng(9203);
    for (k = 0; k < N; k++) perm.push(k);
    for (k = N - 1; k > 0; k--) { var j = (rp() * (k + 1)) | 0, t = perm[k]; perm[k] = perm[j]; perm[j] = t; }
    for (k = 0; k < N; k++) {
      var src = k < nS ? base : bea, o = k < nS ? k : k - nS;
      out[perm[k] * 3] = src[o * 3]; out[perm[k] * 3 + 1] = src[o * 3 + 1]; out[perm[k] * 3 + 2] = src[o * 3 + 2];
    }
    return out;
  }
  var siteList = ['samcheok', 'ulsan', 'yeosu', 'boryeong'];
  function ringAt(c, rad, r) { var a = r() * 6.2832, d = rad * (0.75 + 0.25 * r()); return [c[0] + Math.cos(a) * d, c[1] + Math.sin(a) * d, 0.005]; }
  Cloud.define('korea-map', function (N) {
    return korea(N, function (k, n, r) { return ringAt(KM.at(siteList[k % 4]), 0.05, r); });
  });
  siteList.forEach(function (name) {
    Cloud.define('korea-' + name, function (N) {
      return korea(N, function (k, n, r) {
        var c = KM.at(name);
        if (k % 3 === 0) return ringAt(c, 0.07, r);                                          // a ring on the ground
        var h = Math.pow(r(), 0.7) * 0.38, a = r() * 6.2832, d = 0.016 * r();               // a beam of light rising off the map
        return [c[0] + Math.cos(a) * d, c[1] + Math.sin(a) * d, h];
      });
    });
  });
  Cloud.KMAP.route = function (t) {                                                           // south coast -> out to sea, south-west
    var a = KM.xy(127.9, 34.55), b = KM.xy(124.2, 31.6);
    return [a[0] + (b[0] - a[0]) * t + Math.sin(t * Math.PI) * 0.18, a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * 0.05, 0.01];
  };
  Cloud.define('korea-corridor', function (N) {
    return korea(N, function (k, n, r) {
      if (k % 5 === 0) return ringAt(KM.at(siteList[k % 4]), 0.05, r);
      var t = r(), p = KM.route(t), j = 0.012;
      return [p[0] + (r() - 0.5) * j, p[1] + (r() - 0.5) * j, p[2]];
    });
  });
  /* ---- Page 8: the 2038 roadmap ---------------------------------------------
     A dotted area chart drawn in STAGE coordinates (so it lines up with the
     SVG axes exactly); it assumes the dials x = 0, y = 0, scale = 1, tilt = 0,
     rotY = 0, lock = 1 while it is shown. Generation V(year) passes through
     the three milestones (2024: 0.75, 2030: 13.0, 2038: 42.0 TWh); the shape
     of the curve between them is illustrative (a quadratic through the three).
     road-2030 bunches every dot beyond 2030 at the 2030 front; road-2038 lets
     them flow on to 2038 (same dots, so the morph streams forward). */
  var RD = Cloud.ROAD = { x0: 840, x1: 1760, yb: 830, k: 12.2, y0: 2024, y1: 2038 };
  RD.V = function (yr) { var t = yr - 2024; return 0.75 + 1.363 * t + 0.1131 * t * t; };
  RD.sx = function (yr) { return RD.x0 + (yr - RD.y0) / (RD.y1 - RD.y0) * (RD.x1 - RD.x0); };
  RD.sy = function (v) { return RD.yb - v * RD.k; };
  function stageToWorld(sx, sy, z) { var p = D / (D - z); return [(sx - 960) / (U * p), (540 - sy) / (U * p), z]; }
  var rdCache = {};
  function road(N, until) {
    var key = N; if (!rdCache[key]) { var r = Cloud.rng(9301), L = new Float32Array(N * 3); for (var i = 0; i < N * 3; i++) L[i] = r(); rdCache[key] = L; }
    var L2 = rdCache[key], out = new Float32Array(N * 3);
    for (var k = 0; k < N; k++) {
      var yr = RD.y0 + L2[k * 3] * (RD.y1 - RD.y0), top = L2[k * 3 + 1] < 0.35, f = top ? 1 : Math.pow((L2[k * 3 + 1] - 0.35) / 0.65, 0.6);
      if (yr > until) { yr = until - L2[k * 3 + 2] * 0.25; f = top ? 1 : f; }
      var v = RD.V(yr) * f, z = (L2[k * 3 + 2] - 0.5) * 0.04;
      var w = stageToWorld(RD.sx(yr), RD.sy(v) + (top ? (L2[k * 3 + 2] - 0.5) * 6 : 0), z);
      out[k * 3] = w[0]; out[k * 3 + 1] = w[1]; out[k * 3 + 2] = w[2];
    }
    return out;
  }
  Cloud.define('road-2030', function (N) { return road(N, 2030); });
  Cloud.define('road-2038', function (N) { return road(N, 2038); });

  /* ---- Page 8: ammonia is the carrier, hydrogen is the fuel -----------------
     Left: an ammonia molecule NH3 (nitrogen at the apex, three hydrogens in a
     pyramid, bonds as lines). Right: the hydrogen molecule H2. Between them,
     an arrow of dots: cracking. */
  Cloud.define('nh3-h2', function (N, P, r) {
    var n = [-1.15, 0.15, 0], parts = [P.at(P.ellipsoid(0.34, 0.34, 0.34), { pos: n, weight: 1.2 })];
    for (var i = 0; i < 3; i++) {
      var a = i * Math.PI * 2 / 3 + 0.4, h = [n[0] + Math.cos(a) * 0.62, n[1] - 0.42, Math.sin(a) * 0.62];
      parts.push(P.at(P.ellipsoid(0.19, 0.19, 0.19), { pos: h }));
      (function (h) { var c = P.curve(function (t) { return [n[0] + (h[0] - n[0]) * t, n[1] + (h[1] - n[1]) * t, n[2] + (h[2] - n[2]) * t]; }, 0.012, 40); c.weight = 3; parts.push(c); })(h);
    }
    var R = 0.32, d = 0.22, hc = [1.1, 0.05, 0];
    [-1, 1].forEach(function (sg) {
      var e = P.ellipsoid(R, R, R);
      parts.push({ area: e.area * 0.86, sample: function (rr) {
        for (var k = 0; k < 40; k++) { var q = e.sample(rr), x = q[0] + sg * d; if (Math.hypot(x + sg * d, q[1], q[2]) >= R * 0.999) return [hc[0] + x, hc[1] + q[1], q[2]]; }
        return [hc[0] + sg * (d + R), hc[1], 0];
      } });
    });
    var arrow = P.curve(function (t) { return [-0.35 + t * 0.85, 0.08, 0]; }, 0.015, 60); arrow.weight = 3; parts.push(arrow);
    [1, -1].forEach(function (sg) { var c = P.curve(function (t) { return [0.5 - t * 0.14, 0.08 + sg * t * 0.12, 0]; }, 0.015, 20); c.weight = 3; parts.push(c); });
    return P.compose(N, parts, r);
  });

  /* ---- Page 8: four strategic pillars ----------------------------------------
     Four classical columns (base slab, shaft, capital) standing on one plinth.
     Pillar x positions in Cloud.PILLARS. */
  Cloud.PILLARS = [-1.05, -0.35, 0.35, 1.05];
  Cloud.define('pillars', function (N, P, r) {
    var parts = [P.at(P.box(2.7, 0.08, 0.6), { pos: [0, -0.85, 0], weight: 0.8 })];
    Cloud.PILLARS.forEach(function (x) {
      parts.push(P.at(P.box(0.42, 0.08, 0.42), { pos: [x, -0.76, 0] }));
      parts.push(P.at(P.cylinder(0.13, 1.25, false), { pos: [x, -0.1, 0] }));
      parts.push(P.at(P.box(0.44, 0.1, 0.44), { pos: [x, 0.58, 0] }));
    });
    parts.push(P.at(P.box(2.7, 0.1, 0.5), { pos: [0, 0.7, 0], weight: 0.8 }));
    return P.compose(N, parts, r);
  });
})();
