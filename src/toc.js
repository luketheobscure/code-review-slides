// Theory of Constraints — canvas visualization (instance-based)
// Each call to createToC() returns an independent controller with its own
// particles, state, and DOM refs. Multiple canvases can run simultaneously.

const W = 920, H = 270;
const CY = H / 2 + 14;

const WIDE_R   = 74;
const NAR_R    = 22;
const XCS      = 320;
const XCE      = 470;
const XC       = (XCS + XCE) / 2;
const PR       = 9.5;
const DEFAULT_SPAWN_MS = 300;
const INPUT_CAP = 180;
const HEAT_SAT  = 80;

const SDLC_STAGES = [
  { label: 'Backlog',      x0:   0, x1: 120, color: 'rgba(99,179,237,0.18)'  },
  { label: 'Planning',     x0: 120, x1: 230, color: 'rgba(154,205,108,0.18)' },
  { label: 'Development',  x0: 230, x1: 340, color: 'rgba(246,173,85,0.18)'  },
  { label: 'Code Review',  x0: 340, x1: 450, color: 'rgba(252,129,129,0.22)' },
  { label: 'QA / Testing', x0: 450, x1: 620, color: 'rgba(154,205,108,0.18)' },
  { label: 'Staging',      x0: 620, x1: 760, color: 'rgba(99,179,237,0.18)'  },
  { label: 'Production',   x0: 760, x1: 920, color: 'rgba(154,205,108,0.22)' },
];

export function createToC({ canvas, refs = {}, initialConstrained = true, initialShowSDLC = false, initialSpawnMs = DEFAULT_SPAWN_MS, prefillCount = 0, narrowRadius = NAR_R, showConstraintMarker: initialShowConstraintMarker = true, constraintLabel = '◆  CONSTRAINT  (bottleneck)', spawnPerCycle = 3, leftWideRadius = WIDE_R }) {
  const ctx = canvas.getContext('2d');
  let constrained          = initialConstrained;
  let showSDLC             = initialShowSDLC;
  let showConstraintMarker = initialShowConstraintMarker;
  let spawnMs              = initialSpawnMs;
  const topR = Math.max(leftWideRadius, WIDE_R);
  let particles   = [];
  let lastSpawnMs = 0;
  let tpCount     = 0;
  let lastStatMs  = 0;
  let pipeCache   = null;

  function pipeR(x) {
    if (!constrained) return x < XCS ? leftWideRadius : WIDE_R;
    if (x <= XCS) return leftWideRadius;
    if (x >= XCE) return WIDE_R;
    const t = (x - XCS) / (XCE - XCS);
    const e = t < .5 ? 2*t*t : 1 - (-2*t+2)**2/2;
    return leftWideRadius + (narrowRadius - leftWideRadius) * e;
  }

  function buildPipeCache() {
    const N = 500, top = [], bot = [];
    for (let i = 0; i <= N; i++) {
      const x = i / N * W, r = pipeR(x);
      top.push([x, CY - r]);
      bot.push([x, CY + r]);
    }
    pipeCache = { top, bot };
  }

  function spawn(preCount) {
    if (preCount >= INPUT_CAP) return;
    const yRange = leftWideRadius * 2 - PR * 2 - 6;
    const spd = 0.5 + Math.random() * 0.3;
    particles.push({
      x: PR + 2 + Math.random() * 8,
      y: CY - yRange / 2 + Math.random() * yRange,
      vx: spd, vy: (Math.random() - .5) * 0.4,
      hue: 190 + Math.random() * 60,
      spd,
      passed:  false,
      counted: false,
    });
  }

  function separate() {
    const CELL = PR * 3, cols = Math.ceil(W / CELL);
    const grid = new Map();
    for (const p of particles) {
      const key = Math.floor(p.x / CELL) + Math.floor(p.y / CELL) * cols;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(p);
    }
    const MIN_D = PR * 2 + 1;
    for (const p of particles) {
      const cx = Math.floor(p.x / CELL), cy = Math.floor(p.y / CELL);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const neighbors = grid.get((cx + dx) + (cy + dy) * cols);
          if (!neighbors) continue;
          for (const q of neighbors) {
            if (q === p) continue;
            const ex = p.x - q.x, ey = p.y - q.y;
            const d = Math.sqrt(ex*ex + ey*ey);
            if (d < MIN_D && d > 0.01) {
              const f = (MIN_D - d) / d * 0.32;
              p.vx += ex * f; p.vy += ey * f;
              q.vx -= ex * f; q.vy -= ey * f;

              // X-velocity transfer: trailing particle slows toward the leader.
              // Without this, separation side-push lets fast particles slip past
              // slow ones instead of actually queuing.
              const front = q.x > p.x ? q : p;
              const back  = q.x > p.x ? p : q;
              if (back.vx > front.vx) {
                const dv = back.vx - front.vx;
                back.vx  -= dv * 0.45;
                front.vx += dv * 0.20;
              }
            }
          }
        }
      }
    }
  }

  function update() {
    for (const p of particles) {
      if (!p.passed && p.x > XCE) p.passed = true;

      // Weak pull back to natural speed — once collisions slow a particle, it
      // stays slow until the queue ahead clears. (Strong pull-back lets fast
      // particles muscle through the narrowing instead of queuing.)
      p.vx += (p.spd - p.vx) * 0.04;

      p.vx = Math.max(0, Math.min(p.vx, 2.0));
      p.vy = Math.max(-1.0, Math.min(p.vy, 1.0));

      p.x += p.vx;
      p.y += p.vy;
      p.vy *= 0.92;

      const r = pipeR(p.x);
      const yMin = CY - r + PR + 1, yMax = CY + r - PR - 1;
      // Wall friction: particles sliding along the funnel walls lose some
      // forward speed — this is what physically slows things in the narrowing.
      if (p.y < yMin) { p.y = yMin; p.vy =  Math.abs(p.vy) * 0.3; p.vx *= 0.88; }
      if (p.y > yMax) { p.y = yMax; p.vy = -Math.abs(p.vy) * 0.3; p.vx *= 0.88; }

      if (!p.counted && p.x > W - PR - 5) { p.counted = true; tpCount++; }
    }
    particles = particles.filter(p => p.x < W + 20);
  }

  function drawPipe() {
    const { top, bot } = pipeCache;
    ctx.beginPath();
    ctx.moveTo(top[0][0], top[0][1]);
    top.forEach(([x, y]) => ctx.lineTo(x, y));
    [...bot].reverse().forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.closePath();
    const g = ctx.createLinearGradient(0, CY - WIDE_R, 0, CY + WIDE_R);
    g.addColorStop(0, '#171b2c'); g.addColorStop(.45, '#1e2440'); g.addColorStop(1, '#171b2c');
    ctx.fillStyle = g;
    ctx.fill();

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(80,110,210,0.28)';
    for (const pts of [top, bot]) {
      ctx.beginPath();
      pts.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
      ctx.stroke();
    }

    ctx.lineWidth = 16;
    ctx.strokeStyle = 'rgba(140,170,255,0.04)';
    ctx.beginPath();
    top.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y + 10) : ctx.lineTo(x, y + 12));
    ctx.stroke();
  }

  function drawConstraintMarker() {
    if (!constrained || !showConstraintMarker) return;
    const g = ctx.createRadialGradient(XC, CY, 0, XC, CY, 110);
    g.addColorStop(0, 'rgba(230,50,50,.20)'); g.addColorStop(.55, 'rgba(230,50,50,.06)'); g.addColorStop(1, 'rgba(230,50,50,0)');
    ctx.fillStyle = g;
    ctx.fillRect(XCS - 60, CY - 120, 280, 240);
    ctx.save();
    ctx.setLineDash([4, 5]);
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(252,129,129,.30)';
    for (const x of [XCS, XCE]) {
      const r = pipeR(x === XCE ? XCE - 0.01 : x);
      ctx.beginPath(); ctx.moveTo(x, CY - r - 4); ctx.lineTo(x, CY + r + 4); ctx.stroke();
    }
    ctx.setLineDash([]); ctx.restore();
    ctx.save();
    ctx.font = '600 11px Segoe UI'; ctx.fillStyle = '#fc8181'; ctx.textAlign = 'center';
    ctx.fillText(constraintLabel, XC, CY - topR - 10);
    ctx.restore();
  }

  function drawQueueGlow(preCount) {
    if (!constrained || preCount < INPUT_CAP * 0.1) return;
    const alpha = Math.min(preCount / INPUT_CAP, 1) * 0.22;
    const g = ctx.createLinearGradient(0, 0, XCS, 0);
    g.addColorStop(0, 'rgba(255,100,60,0)');
    g.addColorStop(.6, `rgba(255,100,60,${alpha})`);
    g.addColorStop(1,  `rgba(255,60,60,${alpha * 1.5})`);
    ctx.fillStyle = g;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, CY - leftWideRadius, XCS, leftWideRadius * 2); ctx.clip();
    ctx.fillRect(0, CY - leftWideRadius, XCS, leftWideRadius * 2);
    ctx.restore();

    if (preCount >= INPUT_CAP * 0.85) {
      ctx.save();
      ctx.font = 'bold 11px Segoe UI'; ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(252,129,129,${0.5 + 0.5 * Math.sin(Date.now() / 300)})`;
      ctx.fillText('⚠ INPUT BACKED UP', XCS / 2, CY + leftWideRadius + 18);
      ctx.restore();
    }
  }

  function drawLabels() {
    ctx.save();
    ctx.font = '600 11px Segoe UI'; ctx.fillStyle = '#4a5568';
    ctx.textAlign = 'left';  ctx.fillText('► INPUT',    8,     CY - topR - 10);
    ctx.textAlign = 'right'; ctx.fillText('OUTPUT ►',   W - 8, CY - topR - 10);
    ctx.restore();
  }

  function drawSDLCLabels() {
    if (!showSDLC) return;

    // Fill stage colors clipped to the pipe shape so they don't bleed outside.
    ctx.save();
    const { top, bot } = pipeCache;
    ctx.beginPath();
    ctx.moveTo(top[0][0], top[0][1]);
    for (const [x, y] of top) ctx.lineTo(x, y);
    for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]);
    ctx.closePath();
    ctx.clip();
    for (const s of SDLC_STAGES) {
      const isBottleneck = s.label === 'Code Review';
      ctx.fillStyle = isBottleneck && constrained ? 'rgba(252,129,129,0.28)' : s.color;
      ctx.fillRect(s.x0, CY - topR, s.x1 - s.x0, topR * 2);
    }
    ctx.restore();

    // Stage dividers + labels (no clip).
    ctx.save();
    for (const s of SDLC_STAGES) {
      const mx = (s.x0 + s.x1) / 2;
      const isBottleneck = s.label === 'Code Review';

      if (s.x0 > 0) {
        ctx.beginPath();
        ctx.moveTo(s.x0, CY - topR - 28); ctx.lineTo(s.x0, CY + topR);
        ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const color = isBottleneck && constrained ? '#fc8181' : 'rgba(226,232,240,0.9)';
      ctx.font = `${isBottleneck ? '700' : '600'} 13px sans-serif`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.fillText(s.label, mx, CY - topR - 10);
    }
    ctx.restore();
  }

  function drawParticles(preCount) {
    const heat = Math.min(preCount / HEAT_SAT, 1);
    for (const p of particles) {
      const fade = p.x > W - 12 ? Math.max(0, (W - p.x) / 12) : 1;
      const hue = p.passed ? p.hue - heat * 150 : p.hue;
      const sat = 75 + (p.passed ? heat * 15 : 0);
      const lit  = 65 - (p.passed ? heat * 10 : 0);

      ctx.globalAlpha = fade;
      ctx.beginPath(); ctx.arc(p.x, p.y, PR, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${hue},${sat}%,${lit}%)`;
      ctx.fill();

      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, PR * 2.6);
      g.addColorStop(0, `hsla(${hue},80%,70%,.18)`); g.addColorStop(1, `hsla(${hue},80%,70%,0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, PR * 2.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function updateStats(now, preCount) {
    if (now - lastStatMs < 1000) return;
    const dt = (now - lastStatMs) / 1000;
    if (refs.tp) refs.tp.textContent = Math.round(tpCount / dt);
    if (refs.q)  refs.q.textContent  = preCount;
    tpCount = 0; lastStatMs = now;

    if (refs.in) {
      const fillPct  = preCount / INPUT_CAP;
      const isBacked = fillPct > 0.85;
      refs.in.textContent = !constrained ? 'FLOWING' : isBacked ? 'BACKED UP' : fillPct > 0.5 ? 'FILLING' : 'FLOWING';
      refs.in.className   = 'stat-value v-input' + (isBacked ? ' backed' : '');
    }
  }

  function loop(now) {
    const preCount = particles.filter(p => !p.passed && p.x < XC).length;

    if (now - lastSpawnMs > spawnMs) {
      for (let i = 0; i < spawnPerCycle; i++) spawn(preCount);
      lastSpawnMs = now;
    }

    separate();
    update();

    ctx.clearRect(0, 0, W, H);
    drawPipe();
    drawConstraintMarker();
    drawQueueGlow(preCount);
    drawLabels();
    drawSDLCLabels();
    drawParticles(preCount);
    updateStats(now, preCount);

    requestAnimationFrame(loop);
  }

  function init() {
    const DPR = window.devicePixelRatio || 1;
    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    ctx.scale(DPR, DPR);
    lastStatMs = performance.now();
    buildPipeCache();

    for (let i = 0; i < prefillCount; i++) {
      spawn(particles.filter(p => !p.passed && p.x < XC).length);
    }

    requestAnimationFrame(loop);
  }

  function setConstrained(v) {
    if (v === constrained) return;
    constrained = v;
    pipeCache = null;
    buildPipeCache();
    for (const p of particles) {
      p.passed = !constrained ? true : p.x > XCE;
    }
  }

  function setShowSDLC(v) { showSDLC = v; }
  function setShowConstraintMarker(v) { showConstraintMarker = v; }
  function setSpawnMs(v)  { spawnMs = v; }

  function reset() {
    particles            = [];
    tpCount              = 0;
    lastSpawnMs          = 0;
    lastStatMs           = performance.now();
    showSDLC             = initialShowSDLC;
    showConstraintMarker = initialShowConstraintMarker;
    spawnMs              = initialSpawnMs;
    for (let i = 0; i < prefillCount; i++) {
      spawn(particles.filter(p => !p.passed && p.x < XC).length);
    }
  }

  return { init, setConstrained, setShowSDLC, setShowConstraintMarker, setSpawnMs, reset };
}
