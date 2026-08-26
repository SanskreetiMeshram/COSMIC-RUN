/**
 * SHIFT: COSMIC RUN - High-Performance Particle & Visual Effects Engine
 */
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.shockwaves = [];
    this.hyperspaceStreaks = [];
    this.lightningArcs = [];
  }

  reset() {
    this.particles = [];
    this.shockwaves = [];
    this.lightningArcs = [];
  }

  // --- Hyperspace Speed Streaks ---
  initStreaks(width, height, count = 60) {
    this.hyperspaceStreaks = [];
    for (let i = 0; i < count; i++) {
      this.hyperspaceStreaks.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: 20 + Math.random() * 80,
        speed: 12 + Math.random() * 25,
        alpha: 0.2 + Math.random() * 0.7,
        color: Math.random() > 0.4 ? '#00f3ff' : '#ffffff',
        width: 1 + Math.random() * 2.5
      });
    }
  }

  updateStreaks(width, height, speedMultiplier = 1.0) {
    for (const streak of this.hyperspaceStreaks) {
      streak.y += streak.speed * speedMultiplier;
      if (streak.y - streak.length > height) {
        streak.y = -streak.length;
        streak.x = Math.random() * width;
        streak.speed = 12 + Math.random() * 25;
        streak.length = 20 + Math.random() * 100 * speedMultiplier;
      }
    }
  }

  drawStreaks(ctx) {
    ctx.save();
    for (const s of this.hyperspaceStreaks) {
      ctx.globalAlpha = s.alpha;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.moveTo(s.x, s.y - s.length);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // --- Engine Thruster Particles ---
  emitThruster(x, y, dimension, isBoosting = false, tilt = 0) {
    const count = isBoosting ? 6 : 3;
    const baseColor = dimension === 'rift' ? '#ff007f' : '#00f3ff';
    const coreColor = '#ffffff';

    for (let i = 0; i < count; i++) {
      const spreadX = (Math.random() - 0.5) * 8 - tilt * 12;
      const speedY = (isBoosting ? 14 : 7) + Math.random() * 6;

      this.particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + 8,
        vx: spreadX,
        vy: speedY,
        size: (isBoosting ? 5 : 3.5) * (0.8 + Math.random() * 0.5),
        color: Math.random() > 0.3 ? baseColor : coreColor,
        life: 1.0,
        decay: 0.04 + Math.random() * 0.05,
        type: 'glow'
      });
    }
  }

  // --- Reality Shift Dimensional Pulse ---
  emitShiftPulse(x, y, toRift) {
    const color = toRift ? '#ff007f' : '#00f3ff';
    
    // Expanding Shockwave
    this.shockwaves.push({
      x, y,
      radius: 10,
      maxRadius: 350,
      width: 8,
      color,
      alpha: 1.0,
      decay: 0.035
    });

    // Radial High-Speed Spark Burst
    for (let i = 0; i < 48; i++) {
      const angle = (i / 48) * Math.PI * 2 + (Math.random() * 0.2);
      const speed = 4 + Math.random() * 12;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: Math.random() > 0.4 ? color : '#ffffff',
        life: 1.0,
        decay: 0.02 + Math.random() * 0.02,
        type: 'spark'
      });
    }
  }

  // --- Explosions & Impact Bursts ---
  emitExplosion(x, y, color = '#ffaa00', count = 35, isLarge = false) {
    // Shockwave ring
    this.shockwaves.push({
      x, y,
      radius: 5,
      maxRadius: isLarge ? 220 : 120,
      width: isLarge ? 10 : 6,
      color,
      alpha: 1.0,
      decay: isLarge ? 0.025 : 0.045
    });

    // Explosive Debris Shards
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (isLarge ? 4 : 2) + Math.random() * (isLarge ? 14 : 9);
      const shardColors = [color, '#ffffff', '#ff3344', '#ff8800'];
      const chosenColor = shardColors[Math.floor(Math.random() * shardColors.length)];

      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * (isLarge ? 7 : 4),
        color: chosenColor,
        life: 1.0,
        decay: 0.015 + Math.random() * 0.03,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.3,
        type: 'debris'
      });
    }
  }

  // --- Shield Deflection Sparkles ---
  emitShieldDeflection(x, y) {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        color: '#00ffaa',
        life: 1.0,
        decay: 0.04 + Math.random() * 0.04,
        type: 'spark'
      });
    }
  }

  // --- Reality Fracture Electric Arcs ---
  emitFractureArc(x1, y1, x2, y2) {
    this.lightningArcs.push({
      x1, y1, x2, y2,
      life: 1.0,
      decay: 0.12,
      segments: this.generateLightningSegments(x1, y1, x2, y2)
    });
  }

  generateLightningSegments(x1, y1, x2, y2) {
    const points = [{ x: x1, y: y1 }];
    const steps = 6;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const lx = x1 + (x2 - x1) * t;
      const ly = y1 + (y2 - y1) * t;
      const offset = (Math.random() - 0.5) * 35;
      points.push({ x: lx + offset, y: ly });
    }
    points.push({ x: x2, y: y2 });
    return points;
  }

  update(dt = 1) {
    // 1. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= p.decay * dt;

      if (p.rot !== undefined) {
        p.rot += p.vRot * dt;
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 2. Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.radius += (s.maxRadius - s.radius) * 0.14 * dt;
      s.alpha -= s.decay * dt;

      if (s.alpha <= 0 || s.radius >= s.maxRadius - 2) {
        this.shockwaves.splice(i, 1);
      }
    }

    // 3. Update Lightning Arcs
    for (let i = this.lightningArcs.length - 1; i >= 0; i--) {
      const arc = this.lightningArcs[i];
      arc.life -= arc.decay * dt;
      if (arc.life <= 0) {
        this.lightningArcs.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    ctx.save();

    // 1. Draw Shockwaves
    for (const s of this.shockwaves) {
      ctx.globalAlpha = Math.max(0, s.alpha);
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width * s.alpha;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 15;

      ctx.beginPath();
      ctx.arc(s.x, s.y, Math.max(1, s.radius), 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. Draw Lightning Arcs
    for (const arc of this.lightningArcs) {
      ctx.globalAlpha = Math.max(0, arc.life);
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.moveTo(arc.segments[0].x, arc.segments[0].y);
      for (let i = 1; i < arc.segments.length; i++) {
        ctx.lineTo(arc.segments[i].x, arc.segments[i].y);
      }
      ctx.stroke();
    }

    // 3. Draw Particles
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.type === 'glow' ? 12 : 6;

      if (p.type === 'debris') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot || 0);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size * p.life), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

window.particleSystem = new ParticleSystem();
