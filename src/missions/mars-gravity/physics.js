(function () {
  'use strict';

  // ---- Global physics -----------------------------------------------------
  const GRAVITY = 3.72;            // m/s^2, global gravity for this mission

  // ---- Rover ---------------------------------------------------------------
  const ROVER_MASS  = 180;         // kg
  const CHASSIS_W   = 2.2;         // m
  const CHASSIS_H   = 0.5;         // m
  const INERTIA     = ROVER_MASS * (CHASSIS_W * CHASSIS_W + CHASSIS_H * CHASSIS_H) / 12;
  const WHEEL_R     = 0.38;        // m
  // Wheel contact points in the chassis frame (x forward, y up), in metres
  const WHEELS = [
    { x: -0.95, y: -0.3 },
    { x: -0.32, y: -0.3 },
    { x:  0.32, y: -0.3 },
    { x:  0.95, y: -0.3 }
  ];
  const SPRING_K   = 2500;         // N/m, suspension stiffness per wheel
  const SPRING_C   = 270;          // N*s/m, suspension damping per wheel
  const ROLL_RES   = 25;           // N*s/m, rolling resistance per wheel
  const START_HP   = 50;           // rover health, same for every difficulty
  const IMPACT_SPEED = 2.0;        // m/s, wheel hitting the ground/rock this hard counts as a strong collision
  const IMPACT_COOLDOWN = 0.5;     // s, so one crash only costs HP once
  const DAMAGE_TILT_DEG = 10;      // a strong collision only costs HP when the tilt is above this (degrees)
  const STOP_SPEED = 0.1;          // m/s, the rover must be this still before a sample can be collected
  const SUB_DT     = 1 / 480;      // fixed physics step (s)
  const AUTO_RESTART_SECONDS = 3;
  const FLIP_FAIL_DEG = 90;        // the rover only tips over when its tilt is strictly greater than this (degrees), on every stage
  const MIN_FLIP_ANGLE_DEG = 24;
  const MAX_SPEED_PENALTY_DEG = 24;
  const MAX_SLOPE_PENALTY_DEG = 16;

  // ---- Difficulty levels ------------------------------------------------------
  // drive: motor force per wheel (N); maxSpeed: m/s before the motor fades;
  // safeSpeed: speed where terrain begins to reduce the safe rollover angle;
  // grip: friction coefficient; flipAngle: tilt (rad) that tips the rover over;
  // roughness: how rocky the ground is; bumps / bigBumps: how many rocks and boulders
  const LEVELS = {
    easy: {
      name: 'Mars Plains', label: 'Mars Plains',
      drive: 410, maxSpeed: 2.2, safeSpeed: 1.35, grip: 0.92, flipAngle: 56 * Math.PI / 180,
      instability: 1, roughness: 0.95, bumps: 60, bigBumps: 12, bumpWidth: 1.15, decorDensity: 0.6
    },
    medium: {
      name: 'Highlands', label: 'Highlands',
      drive: 460, maxSpeed: 2.8, safeSpeed: 1.2, grip: 0.8, flipAngle: 49 * Math.PI / 180,
      instability: 1.25, roughness: 1.25, bumps: 100, bigBumps: 20, bumpWidth: 1.35, decorDensity: 0.75
    },
    hard: {
      name: 'Mountainous Area', label: 'Mountainous Area',
      drive: 560, maxSpeed: 3.4, safeSpeed: 1.05, grip: 0.62, flipAngle: 43 * Math.PI / 180,
      instability: 1.55, roughness: 1.55, bumps: 150, bigBumps: 30, bumpWidth: 1.8, decorDensity: 0.9
    }
  };
  const LEVEL_ORDER = ['easy', 'medium', 'hard'];

  // ---- World ----------------------------------------------------------------
  const WORLD_LEN   = 300;         // m
  const TERRAIN_STEP = 0.1;        // m between terrain samples
  const START_X     = 5;           // m
  // Static, offline profiles adapted from NASA's Mars Rock Samples catalog:
  // https://science.nasa.gov/mission/mars-2020-perseverance/mars-rock-samples/
  // Context: NASA/JPL features for Rochette, Wildcat Ridge, and Berea.
  const SAMPLES = [
    {
      x: 70,
      name: 'Montdenier',
      feature: 'Rochette',
      rockType: 'Igneous rock core',
      year: 2021,
      description: 'A basaltic core recording volcanic activity and later interaction with water.',
      color: { main: '#33D6FF', dark: '#0A6F9E' }
    },
    {
      x: 115,
      name: 'Hazeltop',
      feature: 'Wildcat Ridge',
      rockType: 'Sedimentary mudstone',
      year: 2022,
      description: 'Fine lake sediment with a mineral vein left by ancient Martian water.',
      color: { main: '#FFC24A', dark: '#A8650B' }
    },
    {
      x: 160,
      name: 'Melyn',
      feature: 'Berea',
      rockType: 'Carbonate-rich sedimentary core',
      year: 2023,
      description: 'Ancient rivers carried this material from outside Jezero Crater.',
      color: { main: '#C58BFF', dark: '#5B2D9E' }
    }
  ];
  const SAMPLE_TOTAL = SAMPLES.length;
  const PICK_RADIUS = 1.0;         // m, how close (sideways) the rover must stop to collect
  const VIEW_TOP_M  = 12;          // m of height shown vertically
  const HORIZON_FRAC = 0.7;        // where y = 2 m sits on screen (fraction of height)
  const FONT = '"Inter", "Segoe UI", system-ui, Arial, sans-serif';

  // ---- Seeded random (same terrain every run for a given level) -------------
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---- Smooth value noise ---------------------------------------------------
  const LAT = 512;
  const lattice = new Float64Array(LAT);
  (function fillLattice() {
    const rng = mulberry32(20260714);
    for (let i = 0; i < LAT; i++) lattice[i] = rng() * 2 - 1;
  })();

  function vnoise(x) {
    const i = Math.floor(x);
    const f = x - i;
    const s = f * f * (3 - 2 * f);
    const a = lattice[((i % LAT) + LAT) % LAT];
    const b = lattice[(((i + 1) % LAT) + LAT) % LAT];
    return a + (b - a) * s;
  }

  function smoothstep(e0, e1, x) {
    const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  }

  // ---- Terrain ----------------------------------------------------------------
  const N = Math.round(WORLD_LEN / TERRAIN_STEP) + 1;
  let terrain = new Float64Array(N);
  let decor = [];

  function buildTerrain(cfg) {
    const rng = mulberry32(4242);
    const bumps = [];
    for (let k = 0; k < cfg.bumps; k++) {       // small and medium rocks
      bumps.push({ c: 12 + rng() * (WORLD_LEN - 24), a: (0.12 + rng() * 0.3) * cfg.roughness, w: (0.5 + rng() * 0.6) * cfg.bumpWidth });
    }
    for (let k = 0; k < cfg.bigBumps; k++) {    // big boulders
      bumps.push({ c: 20 + rng() * (WORLD_LEN - 40), a: (0.3 + rng() * 0.15) * cfg.roughness, w: (0.9 + rng() * 0.4) * cfg.bumpWidth });
    }

    const next = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      const x = i * TERRAIN_STEP;
      const ramp = smoothstep(8, 25, x);        // flat landing zone at the start
      let h = 1.5 + 0.9 * vnoise(x / 25)
                + ramp * cfg.roughness * (0.35 * vnoise(x / 7 + 13.1) + 0.12 * vnoise(x / 1.6 + 71.3));
      for (let k = 0; k < bumps.length; k++) {
        const b = bumps[k];
        const d = (x - b.c) / b.w;
        if (Math.abs(d) < 3) h += ramp * b.a * Math.exp(-d * d);
      }
      next[i] = h;
    }
    terrain = next;

    // Decorative surface rocks (purely visual, do not affect physics)
    const decorRng = mulberry32(777);
    const nextDecor = [];
    for (let x = 0; x < WORLD_LEN; x += 1.5) {
      if (decorRng() < cfg.decorDensity) {
        nextDecor.push({ x: x + decorRng() * 1.5, r: 0.08 + decorRng() * 0.25, shade: decorRng() });
      }
    }
    decor = nextDecor;
  }

  function heightAt(x) {
    const clamped = Math.min(WORLD_LEN, Math.max(0, x));
    const idx = clamped / TERRAIN_STEP;
    const i0 = Math.floor(idx);
    const t = idx - i0;
    const i1 = Math.min(N - 1, i0 + 1);
    return terrain[i0] * (1 - t) + terrain[i1] * t;
  }

  function slopeAt(x) {
    return (heightAt(x + 0.05) - heightAt(x - 0.05)) / 0.1;
  }

  // ---- DOM ------------------------------------------------------------------
  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const overlayText = document.getElementById('overlayText');
  const hudHp = document.getElementById('hudHp');
  const tryAgainBtn = document.getElementById('tryAgainBtn');
  const restartBtn = document.getElementById('restartBtn');
  const hudSamples = document.getElementById('hudSamples');
  const hudSpeed = document.getElementById('hudSpeed');
  const hudTilt = document.getElementById('hudTilt');
  const hudLevel = document.getElementById('hudLevel');
  const hudStability = document.getElementById('hudStability');
  const messageEl = document.getElementById('message');
  const hintEl = document.getElementById('hint');
  const levelButtons = Array.prototype.slice.call(document.querySelectorAll('button.level'));

  // ---- State ----------------------------------------------------------------
  let levelKey = 'easy';
  let cfg = LEVELS.easy;
  const unlocked = { easy: true, medium: true, hard: true };   // every difficulty is always open
  const beaten = { easy: false, medium: false, hard: false };
  let completionSent = false;      // the dashboard completion event is sent once, after the final challenge

  const rover = {
    x: 0, y: 0, vx: 0, vy: 0, th: 0, w: 0, wheelRot: 0,
    flipped: false
  };
  const collected = new Set();
  const keys = { left: false, right: false };
  let throttle = 0;
  let hp = START_HP;
  let impactCooldown = 0;
  let camX = 0;
  let restartCountdown = 0;
  let failureReason = '';

  function clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  function resetRover() {
    rover.x = START_X;
    rover.y = heightAt(START_X) + WHEEL_R + 0.6;
    rover.vx = 0;
    rover.vy = 0;
    rover.th = 0;
    rover.w = 0;
    rover.flipped = false;
    hp = START_HP;
    impactCooldown = 0;
    restartCountdown = 0;
    failureReason = '';
    keys.left = false;
    keys.right = false;
    overlay.classList.remove('show');
  }

  function restartLevel() {
    collected.clear();
    resetRover();
    messageEl.textContent = '';
  }

  // ---- Difficulty -------------------------------------------------------------
  function updateLevelButtons() {
    levelButtons.forEach(function (btn) {
      const key = btn.getAttribute('data-level');
      const isLocked = !unlocked[key];
      btn.setAttribute('aria-pressed', key === levelKey ? 'true' : 'false');
      btn.setAttribute('aria-disabled', isLocked ? 'true' : 'false');
      btn.textContent = LEVELS[key].label
        + (beaten[key] ? ' ✓' : '')
        + (isLocked ? ' (locked)' : '');
    });
  }

  function setLevel(key) {
    if (!unlocked[key]) {
      messageEl.textContent = 'Finish the level before this one to unlock it.';
      return;
    }
    levelKey = key;
    cfg = LEVELS[key];
    buildTerrain(cfg);
    hudLevel.textContent = cfg.name;
    updateLevelButtons();
    restartLevel();
    hintEl.textContent = 'Safe speed: about ' + cfg.safeSpeed.toFixed(1) + ' m/s. Slow down before hills.';
  }

  function failRover(reason) {
    if (rover.flipped) return;
    rover.flipped = true;
    restartCountdown = AUTO_RESTART_SECONDS;
    failureReason = reason;
    keys.left = false;
    keys.right = false;
    overlay.classList.add('show');
    updateRestartOverlay();
  }

  function updateRestartOverlay() {
    const seconds = Math.max(1, Math.ceil(restartCountdown));
    overlayText.textContent = failureReason + ' Auto-restarting in ' + seconds + '…';
  }

  levelButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setLevel(btn.getAttribute('data-level'));
    });
  });

  const stability = {
    speed: 0,
    slopeDeg: 0,
    tiltDeg: 0,
    flipLimitDeg: 0,
    risk: 0,
    state: 'stable',
    label: 'Stable'
  };

  function updateStabilityMetrics() {
    stability.speed = Math.abs(rover.vx);
    stability.slopeDeg = Math.abs(Math.atan(slopeAt(rover.x))) * 180 / Math.PI;
    stability.tiltDeg = Math.abs(Math.atan2(Math.sin(rover.th), Math.cos(rover.th))) * 180 / Math.PI;

    const speedRatio = stability.speed / cfg.safeSpeed;
    const speedPenalty = clamp((speedRatio - 0.65) * 20, 0, MAX_SPEED_PENALTY_DEG);
    const slopePenalty = clamp((stability.slopeDeg - 4) * 0.65, 0, MAX_SLOPE_PENALTY_DEG);
    const baseLimit = cfg.flipAngle * 180 / Math.PI;
    stability.flipLimitDeg = Math.max(MIN_FLIP_ANGLE_DEG, baseLimit - speedPenalty - slopePenalty);

    const tiltRisk = stability.tiltDeg / stability.flipLimitDeg;
    const terrainRisk = speedRatio * 0.55 + stability.slopeDeg / 45;
    stability.risk = Math.max(tiltRisk, terrainRisk);
    if (stability.risk >= 0.9) {
      stability.state = 'danger';
      stability.label = 'Danger';
    } else if (stability.risk >= 0.6) {
      stability.state = 'caution';
      stability.label = 'Caution';
    } else {
      stability.state = 'stable';
      stability.label = 'Stable';
    }
    return stability;
  }

  // ---- Physics --------------------------------------------------------------
  function physicsStep(dt) {
    const r = rover;
    throttle = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    if (impactCooldown > 0) impactCooldown -= dt;

    const c = Math.cos(r.th);
    const s = Math.sin(r.th);
    let fx = 0;
    let fy = -ROVER_MASS * GRAVITY;   // gravity
    let tau = 0;

    for (let i = 0; i < WHEELS.length; i++) {
      const m = WHEELS[i];
      const rx = c * m.x - s * m.y;   // wheel offset from centre of mass (world frame)
      const ry = s * m.x + c * m.y;
      const wx = r.x + rx;
      const wy = r.y + ry;

      const pen = heightAt(wx) + WHEEL_R - wy;   // how far the wheel is pushed into the ground
      if (pen <= 0) continue;

      const slope = slopeAt(wx);
      const nLen = Math.sqrt(1 + slope * slope);
      const nx = -slope / nLen, ny = 1 / nLen;   // ground normal
      const tx = 1 / nLen, ty = slope / nLen;    // ground tangent (forward)

      // Velocity of the contact point (linear + rotational)
      const vpx = r.vx - r.w * ry;
      const vpy = r.vy + r.w * rx;
      const vn = vpx * nx + vpy * ny;
      const Fn = SPRING_K * pen - SPRING_C * vn;  // suspension force along the normal
      if (Fn <= 0) continue;

      // Strong collision: the wheel slams into the ground or a rock
      if (vn < -IMPACT_SPEED && impactCooldown <= 0) registerImpact();

      const vt = vpx * tx + vpy * ty;             // forward speed at this wheel
      // Motor force fades as speed approaches the level's top speed
      const motor = throttle * cfg.drive * clamp(1 - throttle * vt / cfg.maxSpeed, 0, 1);
      let Ft = motor - ROLL_RES * vt;
      const lim = cfg.grip * Fn;                  // friction cannot exceed grip
      Ft = clamp(Ft, -lim, lim);

      const Fx = Fn * nx + Ft * tx;
      const Fy = Fn * ny + Ft * ty;
      fx += Fx;
      fy += Fy;
      tau += rx * Fy - ry * Fx;
    }

    // A fast rover crossing a sudden slope change receives a realistic pitch.
    // This makes full-throttle driving over hills much less forgiving.
    const travelDirection = r.vx < 0 ? -1 : 1;
    const frontSlope = slopeAt(r.x + travelDirection * 0.85);
    const rearSlope = slopeAt(r.x - travelDirection * 0.85);
    const excessSpeed = Math.max(0, Math.abs(r.vx) / cfg.safeSpeed - 0.7);
    tau -= (frontSlope - rearSlope) * excessSpeed * ROVER_MASS * cfg.instability * 3;
    tau -= 2 * r.w;                               // a little rotational damping

    // Semi-implicit Euler integration
    r.vx += (fx / ROVER_MASS) * dt;
    r.vy += (fy / ROVER_MASS) * dt;
    r.w  += (tau / INERTIA) * dt;
    r.x  += r.vx * dt;
    r.y  += r.vy * dt;
    r.th += r.w * dt;

    // Keep the rover on the map
    if (r.x < 1)              { r.x = 1; if (r.vx < 0) r.vx = 0; }
    if (r.x > WORLD_LEN - 2)  { r.x = WORLD_LEN - 2; if (r.vx > 0) r.vx = 0; }

    r.wheelRot += (r.vx / WHEEL_R) * dt;
  }

  // Damage = tilt in degrees / 10 at the moment of a strong collision
  function registerImpact() {
    impactCooldown = IMPACT_COOLDOWN;
    const tiltDeg = Math.abs(Math.atan2(Math.sin(rover.th), Math.cos(rover.th))) * 180 / Math.PI;
    const excessSpeed = Math.max(0, Math.abs(rover.vx) - cfg.safeSpeed);
    if (tiltDeg <= DAMAGE_TILT_DEG && excessSpeed === 0) return;
    hp = Math.max(0, hp - tiltDeg / 10 - excessSpeed * 3);
    rover.w += Math.sign(rover.vx || 1) * excessSpeed * cfg.instability * 0.12;
  }

  function checkFlip() {
    const current = updateStabilityMetrics();
    if (current.tiltDeg > FLIP_FAIL_DEG) {
      failRover('The rover tipped over. Slow down before steep ground.');
      return true;
    }
    return false;
  }

  // ---- Progress -----------------------------------------------------------------
  function onLevelComplete() {
    if (beaten[levelKey]) return;
    beaten[levelKey] = true;

    if (levelKey === 'hard') {
      if (!completionSent) {
        completionSent = true;
        messageEl.textContent = 'Final boss defeated! Mission complete.';
        window.parent.postMessage(
          {
            type: 'ZGA_MISSION_COMPLETE',
            missionId: 'mars-gravity',
            score: SAMPLE_TOTAL * LEVEL_ORDER.length * 100
          },
          window.location.origin
        );
      }
    } else {
      messageEl.textContent = LEVELS[levelKey].name + ' level complete! Try a harder one.';
    }
    updateLevelButtons();
  }

  // Samples are collected only when the rover is stopped right above one
  // and the player presses Down / S (or the Collect button).
  function tryCollect() {
    if (rover.flipped) return;
    const onGround = rover.y - heightAt(rover.x) < 1.0;
    for (let i = 0; i < SAMPLES.length; i++) {
      if (collected.has(i)) continue;
      const sample = SAMPLES[i];
      const close = Math.abs(rover.x - sample.x) < PICK_RADIUS;
      if (close && onGround) {
        if (Math.abs(rover.vx) > STOP_SPEED || Math.abs(rover.w) > STOP_SPEED) {
          messageEl.textContent = 'Stop completely before collecting the sample.';
          return;
        }
        collected.add(i);
        messageEl.textContent = sample.name + ' collected — ' + sample.rockType + ', NASA ' + sample.year + '.';
        if (collected.size === SAMPLE_TOTAL) onLevelComplete();
        return;
      }
    }
    messageEl.textContent = 'No sample here. Stop right above a sample, then press Down.';
  }

  // ---- Drawing --------------------------------------------------------------
  let W = 0, H = 0, ppm = 40;

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ppm = H / VIEW_TOP_M;
  }

  function toScreen(wx, wy) {
    return [(wx - camX) * ppm, H * HORIZON_FRAC - (wy - 2) * ppm];
  }

  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, H * HORIZON_FRAC);
    sky.addColorStop(0, '#0E0A08');
    sky.addColorStop(1, '#6B3A27');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Distant ridge (slower parallax)
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let sx = 0; sx <= W; sx += 8) {
      const wx = camX * 0.4 + sx / ppm;
      const ridge = H * HORIZON_FRAC - 40 - (1.2 + 0.9 * vnoise(wx / 18 + 200)) * ppm;
      ctx.lineTo(sx, ridge);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fillStyle = '#3F2216';
    ctx.fill();
  }

  function drawTerrain() {
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let sx = 0; sx <= W; sx += 3) {
      const wx = camX + sx / ppm;
      const [, y] = toScreen(wx, heightAt(wx));
      ctx.lineTo(sx, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, H * HORIZON_FRAC - 6 * ppm, 0, H);
    g.addColorStop(0, '#B9562A');
    g.addColorStop(1, '#5C2715');
    ctx.fillStyle = g;
    ctx.fill();

    // Surface edge
    ctx.beginPath();
    for (let sx = 0; sx <= W; sx += 3) {
      const wx = camX + sx / ppm;
      const [px, py] = toScreen(wx, heightAt(wx));
      if (sx === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#E08A5A';
    ctx.stroke();

    // Rocks lying on the surface
    for (let i = 0; i < decor.length; i++) {
      const d = decor[i];
      if (d.x < camX - 1 || d.x > camX + W / ppm + 1) continue;
      const [px, py] = toScreen(d.x, heightAt(d.x));
      const rr = d.r * ppm;
      ctx.beginPath();
      ctx.ellipse(px, py - rr * 0.3, rr, rr * 0.7, 0, 0, Math.PI * 2);
      ctx.fillStyle = d.shade > 0.5 ? '#7A3A20' : '#4A2213';
      ctx.fill();
    }
  }

  // A beautiful crystal rock sitting on the ground at (px, py)
  function drawGemRock(px, py, c, done, inRange) {
    const s = 0.75 * ppm;

    // Shadow on the surface
    ctx.beginPath();
    ctx.ellipse(px, py + 2, s * 0.95, s * 0.22, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fill();

    // Faceted crystal outline (units of s; negative y is up)
    const pts = [[-0.9, 0], [-0.7, -0.75], [-0.1, -1.05], [0.55, -0.85], [0.95, -0.25], [0.75, 0], [0.2, 0.05]];
    ctx.beginPath();
    pts.forEach(function (p, k) {
      const x = px + p[0] * s;
      const y = py + p[1] * s;
      if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
    const g = ctx.createLinearGradient(px - s, py - s * 1.05, px + s, py);
    g.addColorStop(0, done ? '#6B727C' : c.main);
    g.addColorStop(1, done ? '#3A3F46' : c.dark);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = done ? '#A7ADB5' : '#FFFFFF';
    ctx.stroke();

    if (!done) {
      // Facet lines
      ctx.beginPath();
      ctx.moveTo(px - 0.1 * s, py - 1.05 * s); ctx.lineTo(px - 0.3 * s, py);
      ctx.moveTo(px + 0.55 * s, py - 0.85 * s); ctx.lineTo(px + 0.2 * s, py);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Twinkling sparkle
      const tw = 0.5 + 0.5 * Math.sin(performance.now() / 300 + px);
      const sx = px - 0.45 * s, sy = py - 0.85 * s, sr = 3 + 5 * tw;
      ctx.beginPath();
      ctx.moveTo(sx, sy - sr); ctx.lineTo(sx + sr * 0.25, sy);
      ctx.lineTo(sx, sy + sr); ctx.lineTo(sx - sr * 0.25, sy);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, ' + (0.5 + 0.5 * tw).toFixed(2) + ')';
      ctx.fill();
    } else {
      // Check mark for a collected sample
      ctx.beginPath();
      ctx.moveTo(px - 0.25 * s, py - 0.5 * s);
      ctx.lineTo(px - 0.05 * s, py - 0.3 * s);
      ctx.lineTo(px + 0.3 * s, py - 0.7 * s);
      ctx.strokeStyle = '#3DDC84';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Dashed ring shows the spot to stop on
    if (inRange) {
      ctx.beginPath();
      ctx.arc(px, py - 0.4 * s, 1.3 * s, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 183, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function wrapCanvasText(text, maxWidth, maxLines) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (let i = 0; i < words.length; i++) {
      const candidate = line ? line + ' ' + words[i] : words[i];
      if (line && ctx.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = words[i];
        if (lines.length === maxLines - 1) {
          const rest = words.slice(i + 1).join(' ');
          line = rest ? line + ' ' + rest : line;
          break;
        }
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    return lines.slice(0, maxLines);
  }

  function drawSampleInfo(sample, px, py) {
    const boxWidth = Math.min(340, W - 24);
    const boxHeight = 112;
    const boxX = clamp(px - boxWidth / 2, 12, W - boxWidth - 12);
    const boxY = Math.max(58, py - boxHeight - 62);

    ctx.beginPath();
    ctx.moveTo(px, boxY + boxHeight);
    ctx.lineTo(px, py - 0.8 * ppm);
    ctx.strokeStyle = '#3DDC84';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'rgba(11, 13, 16, 0.96)';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.strokeStyle = '#3DDC84';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 18px ' + FONT;
    ctx.fillText(sample.name + ' · ' + sample.feature, boxX + 12, boxY + 10);

    ctx.fillStyle = '#3DDC84';
    ctx.font = '700 14px ' + FONT;
    ctx.fillText(sample.rockType + ' · Collected ' + sample.year, boxX + 12, boxY + 36);

    ctx.fillStyle = '#D7DBE0';
    ctx.font = '500 14px ' + FONT;
    const lines = wrapCanvasText(sample.description, boxWidth - 24, 2);
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], boxX + 12, boxY + 61 + i * 18);
    }
  }

  function drawSamples() {
    for (let i = 0; i < SAMPLES.length; i++) {
      const sample = SAMPLES[i];
      const sx = sample.x;
      if (sx < camX - 2 || sx > camX + W / ppm + 2) continue;
      const [px, py] = toScreen(sx, heightAt(sx));
      const done = collected.has(i);
      const inRange = !done && Math.abs(rover.x - sx) < PICK_RADIUS;
      drawGemRock(px, py, sample.color, done, inRange);
      ctx.fillStyle = done ? '#A7ADB5' : '#FFFFFF';
      ctx.font = '700 18px ' + FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      const labelText = done ? 'Collected' : (inRange ? 'Press Down / S' : 'Sample ' + (i + 1));
      ctx.fillText(labelText, px, py - 0.9 * ppm);
    }
  }

  function drawCollectedSampleInfo() {
    for (let i = 0; i < SAMPLES.length; i++) {
      if (!collected.has(i)) continue;
      const sample = SAMPLES[i];
      if (sample.x < camX - 2 || sample.x > camX + W / ppm + 2) continue;
      const point = toScreen(sample.x, heightAt(sample.x));
      drawSampleInfo(sample, point[0], point[1]);
    }
  }

  function drawRover() {
    const [sx, sy] = toScreen(rover.x, rover.y);
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(-rover.th);            // world rotation is counter-clockwise on screen

    const toLocal = function (mx, my) { return [mx * ppm, -my * ppm]; };

    // Wheels
    for (let i = 0; i < WHEELS.length; i++) {
      const [wx, wy] = toLocal(WHEELS[i].x, WHEELS[i].y);
      ctx.beginPath();
      ctx.arc(wx, wy, WHEEL_R * ppm, 0, Math.PI * 2);
      ctx.fillStyle = '#2A2F36';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#A7ADB5';
      ctx.stroke();
      // Spoke shows wheel spin
      const a = rover.wheelRot;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + Math.cos(a) * WHEEL_R * ppm * 0.9, wy + Math.sin(a) * WHEEL_R * ppm * 0.9);
      ctx.strokeStyle = '#6B727C';
      ctx.stroke();
    }

    // Chassis
    const [cxL, cyT] = toLocal(-CHASSIS_W / 2, CHASSIS_H / 2);
    ctx.fillStyle = '#D9D9D9';
    ctx.fillRect(cxL, cyT, CHASSIS_W * ppm, CHASSIS_H * ppm);

    // Solar panels (dark blue)
    ctx.fillStyle = '#1B3A6B';
    const [pxL, pyT] = toLocal(-CHASSIS_W / 2 + 0.2, CHASSIS_H / 2 + 0.55);
    ctx.fillRect(pxL, pyT, 0.9 * ppm, 0.5 * ppm);
    ctx.strokeStyle = '#A7ADB5';
    ctx.lineWidth = 1;
    ctx.strokeRect(pxL, pyT, 0.9 * ppm, 0.5 * ppm);

    // Mast with camera
    const [mxL, myT] = toLocal(0.45, CHASSIS_H / 2);
    ctx.beginPath();
    ctx.moveTo(mxL, myT);
    ctx.lineTo(mxL, myT - 0.6 * ppm);
    ctx.strokeStyle = '#D9D9D9';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#00B7FF';
    ctx.fillRect(mxL - 0.12 * ppm, myT - 0.75 * ppm, 0.3 * ppm, 0.2 * ppm);

    ctx.restore();
  }

  function drawFrame() {
    camX = clamp(rover.x - 0.35 * W / ppm, 0, Math.max(0, WORLD_LEN - W / ppm));
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    drawTerrain();
    drawSamples();
    drawRover();
    drawCollectedSampleInfo();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 18px ' + FONT;
    ctx.fillText('NASA PERSEVERANCE ROVER', 12, 12);
    ctx.fillStyle = '#A7ADB5';
    ctx.font = '500 18px ' + FONT;
    ctx.fillText('Gravity 3.72 m/s²  ·  ' + cfg.name, 12, 34);
  }

  function updateHud() {
    const current = updateStabilityMetrics();
    hudSamples.textContent = collected.size + ' / ' + SAMPLE_TOTAL;
    hudSpeed.textContent = current.speed.toFixed(1) + ' m/s';
    hudTilt.textContent = Math.round(current.tiltDeg) + '°';
    hudHp.textContent = Math.ceil(hp) + ' / ' + START_HP;
    hudStability.textContent = current.label + ' · ' + Math.round(current.flipLimitDeg) + '°';
    hudStability.dataset.state = current.state;
  }

  // ---- Hint text --------------------------------------------------------------
  let hintShownOnce = false;
  function markControlsUsed() {
    if (hintShownOnce) return;
    hintShownOnce = true;
    hintEl.textContent = 'Safe speed: about ' + cfg.safeSpeed.toFixed(1) + ' m/s. Slow down before hills.';
  }

  // ---- Keyboard -------------------------------------------------------------
  function setKey(e, down) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.left = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.right = down;
    if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || k === ' ') {
      e.preventDefault();
    }
    if (down) markControlsUsed();
  }

  window.addEventListener('keydown', function (e) {
    setKey(e, true);
    if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && !e.repeat) tryCollect();
  });
  window.addEventListener('keyup', function (e) { setKey(e, false); });
  window.addEventListener('blur', function () { keys.left = false; keys.right = false; });

  // Clicking the game gives it keyboard focus (needed when embedded in an iframe)
  canvas.addEventListener('pointerdown', function () { canvas.focus(); });

  // ---- On-screen drive buttons (work without a keyboard) ----------------------
  const reverseBtn = document.getElementById('reverseBtn');
  const forwardBtn = document.getElementById('forwardBtn');

  function holdButton(btn, key) {
    function press(e) {
      e.preventDefault();
      keys[key] = true;
      btn.classList.add('held');
      markControlsUsed();
    }
    function release() {
      keys[key] = false;
      btn.classList.remove('held');
    }
    btn.addEventListener('pointerdown', press);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointerleave', release);
    btn.addEventListener('pointercancel', release);
  }

  holdButton(reverseBtn, 'left');
  holdButton(forwardBtn, 'right');

  // ---- Buttons --------------------------------------------------------------
  tryAgainBtn.addEventListener('click', function () {
    resetRover();
    messageEl.textContent = 'Rover restarted. Collected samples are still secured.';
  });
  restartBtn.addEventListener('click', restartLevel);
  document.getElementById('collectBtn').addEventListener('click', tryCollect);
  window.addEventListener('resize', resizeCanvas);

  // ---- Loop -----------------------------------------------------------------
  let last = performance.now();
  let acc = 0;
  let rafId = 0;

  function frame(now) {
    const elapsed = Math.min((now - last) / 1000, 0.05);
    last = now;

    if (!rover.flipped && hp <= 0) {
      failRover('The rover took too much impact damage.');
    }

    if (!rover.flipped) {
      acc += elapsed;
      while (acc >= SUB_DT) {
        physicsStep(SUB_DT);
        acc -= SUB_DT;
        if (checkFlip()) { acc = 0; break; }
      }
    } else {
      acc = 0;
      restartCountdown -= elapsed;
      if (restartCountdown <= 0) {
        resetRover();
        messageEl.textContent = 'Rover recovered. Collected samples are still secured.';
      } else {
        updateRestartOverlay();
      }
    }

    drawFrame();
    updateHud();
    rafId = requestAnimationFrame(frame);
  }

  function startLoop() {
    last = performance.now();
    acc = 0;
    rafId = requestAnimationFrame(frame);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
      rafId = 0;
      keys.left = false;
      keys.right = false;
    } else if (!rafId) {
      startLoop();
    }
  });

  window.addEventListener('pagehide', function () {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }, { once: true });

  // ---- Start ----------------------------------------------------------------
  resizeCanvas();
  buildTerrain(cfg);
  hudLevel.textContent = cfg.name;
  updateLevelButtons();
  resetRover();
  startLoop();
})();
