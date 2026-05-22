// Scene animations for the two-approaches slide.
// PAST   → Oregon Trail (covered wagon + oxen, amber phosphor)
// FUTURE → Flying saucer + tractor beam (neon cyan/magenta)
//
// Scenes are designed at a reference frame (REF_W × REF_H) and scaled
// uniformly to whatever size the canvas actually renders at on screen.

const REF_W = 520, REF_H = 220;
const AMBER = '#ffb000';

export function createThemedPipe(canvas, theme) {
  const ctx = canvas.getContext('2d');
  let W = REF_W, H = REF_H, SCL = 1;
  let t0 = 0;
  let stars = [];

  function measure() {
    const DPR = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const newW = Math.max(120, Math.round(rect.width));
    const newH = Math.max(120, Math.round(rect.height));
    if (newW === W && newH === H && canvas.width === newW * DPR) return;
    W = newW; H = newH;
    SCL = Math.max(1, Math.min(W / REF_W, H / REF_H));
    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (theme === 'future') initStars();
  }

  function initStars() {
    stars = [];
    const count = Math.round((W * H) / 2400);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * (H - 40 * SCL),
        r: (0.4 + Math.random() * 1.3) * Math.min(SCL, 1.6),
        phase: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 2.4,
      });
    }
  }

  function init() {
    measure();
    t0 = performance.now();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(measure);
      ro.observe(canvas);
    }
    requestAnimationFrame(loop);
  }

  function loop(now) {
    const t = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    if (theme === 'past') drawOregonTrail(t);
    else                  drawFlyingSaucer(t);
    requestAnimationFrame(loop);
  }

  function reset() { t0 = performance.now(); }

  // ── PAST: Oregon Trail ───────────────────────────────────

  const HORIZON_R = 0.62;

  function drawOregonTrail(t) {
    drawSun(t);
    drawClouds(t);
    drawDistantHills();
    drawHorizon();
    drawGround(t);
    drawCaravan(t);
  }

  function drawSun(t) {
    const cx = W * 0.13, cy = H * 0.18;
    const r = 11 * SCL;
    ctx.fillStyle = AMBER;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 176, 0, 0.35)';
    ctx.lineWidth = 1;
    for (let dr = 4; dr <= 12; dr += 3) {
      ctx.beginPath();
      ctx.arc(cx, cy, r + dr * SCL + Math.sin(t * 0.7) * 0.6, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawClouds(t) {
    const speed = 7 * SCL;
    const ys = [H * 0.10, H * 0.20, H * 0.32, H * 0.07];
    const ws = [42, 30, 52, 26];
    for (let i = 0; i < ys.length; i++) {
      const baseX = (i / ys.length) * (W + 80 * SCL) + 90;
      let x = baseX - t * speed;
      const span = W + 80 * SCL;
      x = ((x % span) + span) % span - 40 * SCL;
      drawCloud(x, ys[i], ws[i] * SCL);
    }
  }

  function drawCloud(x, y, w) {
    const s = SCL;
    ctx.fillStyle = AMBER;
    ctx.fillRect(x, y, w, 5 * s);
    ctx.fillRect(x + 5 * s, y - 4 * s, w - 10 * s, 4 * s);
    ctx.fillRect(x + 12 * s, y - 7 * s, Math.max(0, w - 22 * s), 3 * s);
  }

  function drawDistantHills() {
    const hY = H * HORIZON_R;
    ctx.strokeStyle = 'rgba(255, 176, 0, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, hY);
    for (let x = 0; x <= W; x += 4) {
      const hill = (14 + 9 * Math.sin(x * 0.05) + 4 * Math.sin(x * 0.13 + 1.5)) * SCL;
      ctx.lineTo(x, hY - hill);
    }
    ctx.lineTo(W, hY);
    ctx.stroke();
  }

  function drawHorizon() {
    ctx.fillStyle = AMBER;
    ctx.fillRect(0, H * HORIZON_R, W, 1);
  }

  function drawGround(t) {
    const s = SCL;
    const speed = 44 * s;
    const hY = H * HORIZON_R;
    const tuftCount = Math.max(12, Math.round(W / 22));
    for (let i = 0; i < tuftCount; i++) {
      const baseX = (i / tuftCount) * (W + 40 * s);
      let x = baseX - t * speed;
      const span = W + 60 * s;
      x = ((x % span) + span) % span - 30 * s;
      const y = hY + (12 + (i % 3) * 6) * s;
      drawTuft(x, y);
    }
    const rockCount = Math.max(4, Math.round(W / 100));
    const rockY = H - 16 * s;
    for (let i = 0; i < rockCount; i++) {
      const baseX = (i / rockCount) * (W + 80) + 40;
      let x = baseX - t * (speed * 1.4);
      const span = W + 100 * s;
      x = ((x % span) + span) % span - 50 * s;
      ctx.fillStyle = AMBER;
      ctx.fillRect(x, rockY, 4 * s, 3 * s);
      ctx.fillRect(x - 2 * s, rockY + 3 * s, 8 * s, 2 * s);
    }
  }

  function drawTuft(x, y) {
    const s = SCL;
    ctx.fillStyle = AMBER;
    ctx.fillRect(x,           y,         2 * s, 4 * s);
    ctx.fillRect(x + 3 * s,   y + 2 * s, 2 * s, 4 * s);
    ctx.fillRect(x - 2 * s,   y + 3 * s, 2 * s, 4 * s);
  }

  function drawCaravan(t) {
    const s = SCL;
    const hY = H * HORIZON_R;
    const wagonX = W * 0.40 - 30 * s;
    const wagonY = hY - 8 * s;
    const bob = Math.sin(t * 3.2) * 1.2 * s;

    drawWagon(wagonX, wagonY + bob, t);
    ctx.strokeStyle = AMBER;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(wagonX + 56 * s, wagonY + bob - 4 * s);
    ctx.lineTo(wagonX + 64 * s, wagonY + bob - 4 * s);
    ctx.stroke();
    drawOx(wagonX + 64 * s, wagonY + bob, t);
    drawOx(wagonX + 96 * s, wagonY + bob, t + 0.4);
  }

  function drawOx(x, y, t) {
    const s = SCL;
    ctx.fillStyle = AMBER;
    ctx.fillRect(x,           y - 14 * s, 22 * s, 10 * s);
    ctx.fillRect(x + 18 * s,  y - 16 * s,  8 * s,  6 * s);
    ctx.fillRect(x + 24 * s,  y - 17 * s,  1 * s,  2 * s);
    ctx.fillRect(x + 22 * s,  y - 18 * s,  1 * s,  2 * s);
    ctx.fillRect(x - 2 * s,   y - 10 * s,  2 * s,  2 * s);
    const step = Math.floor(t * 6) % 2;
    if (step === 0) {
      ctx.fillRect(x + 2 * s,  y - 4 * s, 2 * s, 6 * s);
      ctx.fillRect(x + 18 * s, y - 4 * s, 2 * s, 6 * s);
    } else {
      ctx.fillRect(x + 6 * s,  y - 4 * s, 2 * s, 6 * s);
      ctx.fillRect(x + 14 * s, y - 4 * s, 2 * s, 6 * s);
    }
  }

  function drawWagon(x, y, t) {
    const s = SCL;
    ctx.fillStyle = AMBER;
    ctx.fillRect(x, y - 14 * s, 56 * s, 10 * s);

    ctx.strokeStyle = AMBER;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + 28 * s, y - 14 * s, 22 * s, Math.PI, 0);
    ctx.stroke();

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 176, 0, 0.45)';
    for (let rib = 0; rib < 4; rib++) {
      const rx = x + (8 + rib * 13) * s;
      ctx.beginPath();
      ctx.moveTo(rx, y - 14 * s);
      const dx2 = Math.pow(rx - (x + 28 * s), 2);
      const arch = Math.sqrt(Math.max(0, (22 * s) * (22 * s) - dx2));
      ctx.lineTo(rx, y - 14 * s - arch);
      ctx.stroke();
    }

    drawWheel(x + 10 * s, y, t);
    drawWheel(x + 46 * s, y, t);
  }

  function drawWheel(cx, cy, t) {
    const r = 6 * SCL;
    ctx.strokeStyle = AMBER;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    const angle = -t * 7;
    for (let i = 0; i < 4; i++) {
      const a = angle + (i * Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * (r - 1), cy + Math.sin(a) * (r - 1));
      ctx.stroke();
    }
  }

  // ── FUTURE: Flying saucer ────────────────────────────────

  function drawFlyingSaucer(t) {
    drawStars(t);
    drawDistantPlanet();

    const cx = W / 2 + Math.cos(t * 0.55) * (W * 0.18);
    const cy = H * 0.32 + Math.sin(t * 1.05) * 10 * SCL;

    drawTractorBeam(cx, cy, t);
    drawSaucerGlow(cx, cy);
    drawSaucerBody(cx, cy, t);
  }

  function drawStars(t) {
    for (const s of stars) {
      const a = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
      ctx.fillStyle = `rgba(210, 235, 255, ${a})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawDistantPlanet() {
    const s = SCL;
    const px = W * 0.85, py = H * 0.18;
    const r = 16 * s;
    const g = ctx.createRadialGradient(px - 4 * s, py - 4 * s, 0, px, py, r * 1.4);
    g.addColorStop(0, 'rgba(244, 114, 182, 0.85)');
    g.addColorStop(0.6, 'rgba(124, 58, 237, 0.4)');
    g.addColorStop(1, 'rgba(124, 58, 237, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-0.4);
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 24 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawTractorBeam(cx, cy, t) {
    const s = SCL;
    const beamBottom = H - 6 * s;
    const beamTopW = 10 * s;
    const beamBotW = 78 * s;
    const cyBeam = cy + 6 * s;

    const grad = ctx.createLinearGradient(0, cyBeam, 0, beamBottom);
    grad.addColorStop(0,   'rgba(0, 255, 255, 0.55)');
    grad.addColorStop(0.5, 'rgba(0, 255, 255, 0.18)');
    grad.addColorStop(1,   'rgba(0, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx - beamTopW / 2, cyBeam);
    ctx.lineTo(cx + beamTopW / 2, cyBeam);
    ctx.lineTo(cx + beamBotW / 2, beamBottom);
    ctx.lineTo(cx - beamBotW / 2, beamBottom);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#0ff';
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - beamTopW / 2, cyBeam);
    ctx.lineTo(cx - beamBotW / 2, beamBottom);
    ctx.moveTo(cx + beamTopW / 2, cyBeam);
    ctx.lineTo(cx + beamBotW / 2, beamBottom);
    ctx.stroke();
    ctx.restore();

    const N = 9;
    for (let i = 0; i < N; i++) {
      const phase = ((t * 0.4 + i / N) % 1);
      const yPos = beamBottom - phase * (beamBottom - cyBeam);
      const beamW = beamBotW + (beamTopW - beamBotW) * (1 - phase);
      const offset = Math.sin(i * 7.3 + t * 0.2) * beamW * 0.32;
      const a = 0.9 * (1 - phase * phase);
      ctx.fillStyle = `rgba(190, 240, 255, ${a})`;
      ctx.beginPath();
      ctx.arc(cx + offset, yPos, 1.6 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawSaucerGlow(cx, cy) {
    const r = 70 * SCL;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0,   'rgba(0, 255, 255, 0.32)');
    g.addColorStop(0.6, 'rgba(0, 255, 255, 0.06)');
    g.addColorStop(1,   'rgba(0, 255, 255, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSaucerBody(cx, cy, t) {
    const s = SCL;
    ctx.save();
    ctx.shadowBlur = 14;
    ctx.shadowColor = '#0ff';
    ctx.fillStyle = '#04122a';
    ctx.strokeStyle = '#22e7ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2 * s, 38 * s, 7 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#0a1f3a';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 1 * s, 28 * s, 4 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#f0f';
    ctx.fillStyle = 'rgba(255, 100, 255, 0.4)';
    ctx.strokeStyle = '#ff7bf0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 2 * s, 14 * s, 9 * s, 0, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.ellipse(cx - 6 * s, cy - 6 * s, 3 * s, 1.5 * s, -0.5, 0, Math.PI * 2);
    ctx.fill();

    const N = 7;
    const active = Math.floor(t * 5) % N;
    for (let i = 0; i < N; i++) {
      const lx = cx - 30 * s + (i / (N - 1)) * 60 * s;
      const ly = cy + 7 * s;
      const on = i === active;
      if (on) {
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#fff700';
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(lx, ly, 2 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = 'rgba(255, 80, 200, 0.55)';
        ctx.beginPath();
        ctx.arc(lx, ly, 1.4 * s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  return { init, reset };
}
