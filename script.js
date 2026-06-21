/* ===================================================================
   TOMŌ — App Showcase Recreation
   script.js — waveform canvas, generative swirl art, tab interactions
=================================================================== */

(() => {
  'use strict';

  /* ---------------------------------------------------------------
     1. TAB BAR — Home / Profile toggle on each phone
  --------------------------------------------------------------- */
  document.querySelectorAll('.tab-bar').forEach((bar) => {
    bar.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-bar__item');
      if (!btn) return;
      bar.querySelectorAll('.tab-bar__item').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
    });
  });

  /* ---------------------------------------------------------------
     2. WAVEFORM CANVAS — layered mountain-ridge audio visualization
  --------------------------------------------------------------- */
  function smoothNoise(seed, points) {
    // Generate a smooth pseudo-random ridge line using interpolated
    // control points (cosine-eased), seeded for reproducibility.
    let s = seed;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    const controlCount = 9;
    const controls = Array.from({ length: controlCount }, () => rand());
    const out = new Array(points);
    for (let i = 0; i < points; i++) {
      const t = (i / (points - 1)) * (controlCount - 1);
      const i0 = Math.floor(t);
      const i1 = Math.min(i0 + 1, controlCount - 1);
      const f = t - i0;
      const ef = (1 - Math.cos(f * Math.PI)) / 2; // cosine ease
      out[i] = controls[i0] * (1 - ef) + controls[i1] * ef;
    }
    return out;
  }

  function lerpColor(c1, c2, t) {
    const a = c1.match(/\w\w/g).map((h) => parseInt(h, 16));
    const b = c2.match(/\w\w/g).map((h) => parseInt(h, 16));
    const r = a.map((v, i) => Math.round(v + (b[i] - v) * t));
    return `rgb(${r[0]},${r[1]},${r[2]})`;
  }

  function drawWaveform() {
    const canvas = document.getElementById('waveformCanvas');
    if (!canvas) return;
    const wrap = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const baseline = h * 0.78;
    const colorStops = ['#9b7fd6', '#e8607a', '#f0975a', '#6fa8d8'];

    // three overlapping ridge layers for depth, large -> small amplitude
    const layers = [
      { seed: 12, amp: h * 0.62, alpha: 0.55, lines: 230 },
      { seed: 47, amp: h * 0.46, alpha: 0.45, lines: 230 },
      { seed: 91, amp: h * 0.30, alpha: 0.35, lines: 230 },
    ];

    layers.forEach((layer) => {
      const ridge = smoothNoise(layer.seed, layer.lines);
      for (let i = 0; i < layer.lines; i++) {
        const x = (i / (layer.lines - 1)) * w;
        const t = i / (layer.lines - 1);
        // color gradient across the width: purple -> pink/red -> orange -> blue
        let color;
        if (t < 0.38) color = lerpColor(colorStops[0], colorStops[1], t / 0.38);
        else if (t < 0.55) color = lerpColor(colorStops[1], colorStops[2], (t - 0.38) / 0.17);
        else color = lerpColor(colorStops[2], colorStops[3], (t - 0.55) / 0.45);

        const peak = ridge[i] * ridge[i]; // emphasize tall peaks
        const lineH = peak * layer.amp;

        const grad = ctx.createLinearGradient(0, baseline - lineH, 0, baseline);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.strokeStyle = grad;
        ctx.globalAlpha = layer.alpha;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, baseline);
        ctx.lineTo(x, baseline - lineH);
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;
  }

  /* ---------------------------------------------------------------
     3. GENERATIVE SWIRL ART — concentric contour-line motifs
  --------------------------------------------------------------- */
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function buildSwirlPath(cx, cy, baseR, lobes, amp, rotation) {
    const steps = 90;
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * Math.PI * 2;
      const r =
        baseR +
        amp * Math.sin(lobes * theta + rotation) +
        amp * 0.35 * Math.sin((lobes + 1) * theta - rotation * 1.3);
      const x = cx + r * Math.cos(theta);
      const y = cy + r * Math.sin(theta) * 0.92; // slight vertical compression
      d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1) + ' ';
    }
    return d + 'Z';
  }

  function renderSwirl(groupSelector, { lobes, baseColor, cx, cy }) {
    const group = document.querySelector(groupSelector);
    if (!group) return;
    group.innerHTML = '';
    const ringCount = 17;
    for (let i = 0; i < ringCount; i++) {
      const t = i / (ringCount - 1); // 0 = innermost, 1 = outermost
      const r = 24 + t * 78;
      const amp = 14 + t * 30;
      const rotation = t * 1.6;
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', buildSwirlPath(cx, cy, r, lobes, amp, rotation));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', baseColor);
      path.setAttribute('stroke-width', '0.7');
      path.setAttribute('opacity', (0.12 + t * 0.28).toFixed(2));
      group.appendChild(path);
    }
  }

  function paintSwirls() {
    renderSwirl('.swirl--violet', { lobes: 3, baseColor: '#a986e8', cx: 95, cy: 150 });
    renderSwirl('.swirl--amber', { lobes: 2, baseColor: '#e8784a', cx: 105, cy: 140 });
  }

  /* ---------------------------------------------------------------
     4. INIT
  --------------------------------------------------------------- */
  function init() {
    drawWaveform();
    paintSwirls();
  }

  window.addEventListener('load', init);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      drawWaveform();
    }, 150);
  });
})();
