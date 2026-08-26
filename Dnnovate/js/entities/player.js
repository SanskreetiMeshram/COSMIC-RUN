/**
 * SHIFT: COSMIC RUN - Player Starfighter Entity & Physics Engine
 */

const SHIP_DEFINITIONS = {
  ghostblade: {
    id: 'ghostblade',
    name: 'Apex-7 Ghostblade',
    lore: 'Experimental deep-space superiority fighter equipped with dual-phase dimensional slipstream drives.',
    unlocked: true,
    price: 0,
    stats: { speed: 8.5, shields: 100, hull: 100, handling: 8.5, fireRate: 0.12 },
    color: '#00f3ff',
    accentColor: '#9d00ff'
  },
  phantom: {
    id: 'phantom',
    name: 'Void Phantom',
    lore: 'Ultra-light interceptor tuned for extreme speeds and near-zero drift friction in vacuum corridors.',
    unlocked: false,
    price: 500,
    stats: { speed: 10.5, shields: 75, hull: 70, handling: 10.0, fireRate: 0.09 },
    color: '#00ffaa',
    accentColor: '#00a8b3'
  },
  striker: {
    id: 'striker',
    name: 'Nebula Striker',
    lore: 'Heavy armored assault craft with reinforced ablative hull plating and quad plasma cannons.',
    unlocked: false,
    price: 1200,
    stats: { speed: 6.8, shields: 160, hull: 150, handling: 6.0, fireRate: 0.14 },
    color: '#ffaa00',
    accentColor: '#ff2a4b'
  },
  chronovector: {
    id: 'chronovector',
    name: 'Chrono Vector',
    lore: 'Singularity prototype featuring instant phase-refraction matrices and hyper-frequency EMP resonators.',
    unlocked: false,
    price: 2500,
    stats: { speed: 9.0, shields: 110, hull: 100, handling: 9.0, fireRate: 0.10 },
    color: '#ff007f',
    accentColor: '#00f3ff'
  }
};

class Player {
  constructor(x, y) {
    this.shipId = 'ghostblade';
    this.def = SHIP_DEFINITIONS[this.shipId];

    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 44;
    this.height = 54;
    this.hitboxRadius = 16;

    // Visual flight roll/tilt angle
    this.roll = 0;
    this.targetRoll = 0;
    this.pitch = 0;

    // Upgrades modifiers
    this.upgrades = {
      blasterTier: 1,
      shieldTier: 1,
      boostTier: 1,
      empTier: 1,
      magnetTier: 1
    };

    // Health & Shields
    this.maxShields = this.def.stats.shields;
    this.shields = this.maxShields;
    this.maxHull = this.def.stats.hull;
    this.hull = this.maxHull;
    this.shieldRechargeDelay = 2.5; // seconds
    this.shieldTimer = 0;
    this.shieldRechargeRate = 18; // per sec

    // Dimension & Phase state
    this.dimension = 'void'; // 'void' | 'rift'
    this.invulnerableTime = 0;
    this.shiftCooldown = 0;
    this.maxShiftCooldown = 0.4;

    // Overdrive & Warp Speed
    this.overdrive = 0;
    this.maxOverdrive = 100;
    this.isOverdriveActive = false;
    this.overdriveTimer = 0;

    // Weapons
    this.fireTimer = 0;
    this.empCharges = 2;
    this.maxEmpCharges = 3;
    this.projectiles = [];

    // Score & Multipliers
    this.score = 0;
    this.shards = 0;
    this.comboMultiplier = 1.0;
    this.comboTimer = 0;
    this.distanceTraveled = 0;
  }

  setShip(shipId, upgrades = null) {
    if (SHIP_DEFINITIONS[shipId]) {
      this.shipId = shipId;
      this.def = SHIP_DEFINITIONS[shipId];
    }
    if (upgrades) {
      this.upgrades = upgrades;
    }
    this.applyUpgrades();
  }

  applyUpgrades() {
    const shieldBonus = (this.upgrades.shieldTier - 1) * 25;
    this.maxShields = this.def.stats.shields + shieldBonus;
    this.shields = this.maxShields;

    const hullBonus = (this.upgrades.shieldTier - 1) * 20;
    this.maxHull = this.def.stats.hull + hullBonus;
    this.hull = this.maxHull;
  }

  getFireRate() {
    const blasterMod = 1.0 - (this.upgrades.blasterTier - 1) * 0.12;
    return this.def.stats.fireRate * Math.max(0.4, blasterMod);
  }

  getMagnetRadius() {
    return 60 + (this.upgrades.magnetTier - 1) * 45;
  }

  shiftDimension() {
    if (this.shiftCooldown > 0) return false;

    const toRift = this.dimension === 'void';
    this.dimension = toRift ? 'rift' : 'void';
    this.shiftCooldown = this.def.id === 'chronovector' ? 0.25 : this.maxShiftCooldown;
    
    // I-frame during phase shift
    this.invulnerableTime = 0.28;

    // Particle & Audio
    if (window.particleSystem) {
      window.particleSystem.emitShiftPulse(this.x, this.y, toRift);
    }
    if (window.soundEngine) {
      window.soundEngine.setDimension(this.dimension);
      window.soundEngine.playShift(toRift);
    }

    // Trigger visual screen flash
    const flashEl = document.getElementById('screen-flash');
    if (flashEl) {
      flashEl.className = toRift ? 'flash-rift' : 'flash-void';
      setTimeout(() => { flashEl.className = ''; }, 200);
    }

    return true;
  }

  triggerEMP(enemies, obstacles) {
    if (this.empCharges <= 0) return false;
    this.empCharges--;

    if (window.particleSystem) {
      window.particleSystem.emitExplosion(this.x, this.y, '#00f3ff', 50, true);
      window.particleSystem.emitShiftPulse(this.x, this.y, true);
    }
    if (window.soundEngine) {
      window.soundEngine.playEmp();
    }

    // Destroy/damage nearby enemies & bullets
    if (enemies) {
      enemies.forEach(e => {
        e.takeDamage(120 + (this.upgrades.empTier - 1) * 60);
      });
    }

    // Clear nearby dimension obstacles
    if (obstacles) {
      obstacles.forEach(o => {
        o.isDestroyed = true;
        if (window.particleSystem) {
          window.particleSystem.emitExplosion(o.x, o.y, '#00f3ff', 15);
        }
      });
    }

    return true;
  }

  activateOverdrive() {
    if (this.overdrive < this.maxOverdrive || this.isOverdriveActive) return false;
    this.isOverdriveActive = true;
    this.overdriveTimer = 6.0 + (this.upgrades.boostTier - 1) * 1.5;
    this.invulnerableTime = this.overdriveTimer;
    if (window.soundEngine) {
      window.soundEngine.playVictory();
    }
    return true;
  }

  takeDamage(amount) {
    if (this.invulnerableTime > 0) return;

    if (this.shields > 0) {
      this.shields -= amount;
      if (window.soundEngine) window.soundEngine.playShieldDeflect();
      if (window.particleSystem) window.particleSystem.emitShieldDeflection(this.x, this.y);

      if (this.shields < 0) {
        this.hull += this.shields; // Spill over to hull
        this.shields = 0;
      }
    } else {
      this.hull -= amount;
      if (window.soundEngine) window.soundEngine.playHit();
    }

    this.shieldTimer = this.shieldRechargeDelay;
    this.invulnerableTime = 0.65;
    this.comboMultiplier = 1.0; // Reset combo on hit

    // Damage flash
    const flashEl = document.getElementById('screen-flash');
    if (flashEl) {
      flashEl.className = 'flash-damage';
      setTimeout(() => { flashEl.className = ''; }, 150);
    }

    if (window.particleSystem) {
      window.particleSystem.emitExplosion(this.x, this.y, '#ff2a4b', 20);
    }
  }

  heal(shieldsAmt = 0, hullAmt = 0) {
    this.shields = Math.min(this.maxShields, this.shields + shieldsAmt);
    this.hull = Math.min(this.maxHull, this.hull + hullAmt);
  }

  addScore(pts) {
    const gained = Math.round(pts * this.comboMultiplier);
    this.score += gained;
    this.comboTimer = 3.5; // Reset combo countdown
    this.comboMultiplier = Math.min(8.0, +(this.comboMultiplier + 0.1).toFixed(1));
    
    // Fill overdrive
    this.overdrive = Math.min(this.maxOverdrive, this.overdrive + pts * 0.05);
  }

  addShards(count = 1) {
    this.shards += count;
    this.addScore(25);
  }

  update(dt, input, bounds) {
    // Cooldown timers
    if (this.shiftCooldown > 0) this.shiftCooldown -= dt;
    if (this.invulnerableTime > 0) this.invulnerableTime -= dt;

    // Shield Recharge
    if (this.shieldTimer > 0) {
      this.shieldTimer -= dt;
    } else if (this.shields < this.maxShields) {
      this.shields = Math.min(this.maxShields, this.shields + this.shieldRechargeRate * dt);
    }

    // Combo Timer Decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboMultiplier = 1.0;
      }
    }

    // Overdrive Status
    if (this.isOverdriveActive) {
      this.overdriveTimer -= dt;
      this.overdrive = (this.overdriveTimer / 7.5) * this.maxOverdrive;
      if (this.overdriveTimer <= 0) {
        this.isOverdriveActive = false;
        this.overdrive = 0;
      }
    }

    // Action Triggers
    const triggers = input.consumeTriggers();
    if (triggers.shift) {
      this.shiftDimension();
    }
    if (triggers.emp) {
      this.triggerEMP();
    }

    // Flight Physics & Dimension Influences
    const baseSpeed = this.def.stats.speed * 58;
    const handling = this.def.stats.handling * 10;
    
    // Dimension physics modifier:
    // Void = Snappy, high acceleration; Rift = Slippery Zero-G drift
    const friction = this.dimension === 'void' ? 0.84 : 0.94;
    const accelRate = this.dimension === 'void' ? 1.0 : 0.85;

    let targetVx = input.axisX * baseSpeed * accelRate;
    let targetVy = input.axisY * baseSpeed * accelRate;

    if (input.isBoosting || this.isOverdriveActive) {
      targetVy -= baseSpeed * 0.45;
    }
    if (input.isBraking) {
      targetVy += baseSpeed * 0.45;
    }

    this.vx += (targetVx - this.vx) * (handling * 0.018);
    this.vy += (targetVy - this.vy) * (handling * 0.018);

    this.vx *= friction;
    this.vy *= friction;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Keep within corridor bounds
    const pad = this.width / 2 + 10;
    this.x = Math.max(pad, Math.min(bounds.width - pad, this.x));
    this.y = Math.max(pad + 40, Math.min(bounds.height - pad - 20, this.y));

    // Dynamic Banking Roll Tilt
    this.targetRoll = (this.vx / baseSpeed) * 0.55;
    this.roll += (this.targetRoll - this.roll) * 0.18;

    // Thruster Particle Emission
    if (window.particleSystem) {
      const isBoost = input.isBoosting || this.isOverdriveActive;
      window.particleSystem.emitThruster(this.x - 10, this.y + 20, this.dimension, isBoost, this.roll);
      window.particleSystem.emitThruster(this.x + 10, this.y + 20, this.dimension, isBoost, this.roll);
    }

    // Audio Engine Hum Pitch
    if (window.soundEngine) {
      const thrustPct = Math.hypot(input.axisX, input.axisY);
      window.soundEngine.updateEngine(thrustPct, this.isOverdriveActive ? 1.5 : 1.0);
    }

    // Weapon Firing
    this.fireTimer -= dt;
    if (input.isFiring && this.fireTimer <= 0) {
      this.fireWeapons();
      this.fireTimer = this.getFireRate();
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.y += proj.vy * dt;
      proj.x += proj.vx * dt;
      proj.life -= dt;

      if (proj.y < -50 || proj.life <= 0 || proj.destroyed) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  fireWeapons() {
    const isSpecial = this.isOverdriveActive || this.upgrades.blasterTier >= 3;
    const pColor = this.dimension === 'rift' ? '#ff007f' : '#00f3ff';
    const speed = -850;
    const damage = 35 + (this.upgrades.blasterTier - 1) * 15;

    // Twin Blaster Barrels
    const wingOffset = 16;
    this.projectiles.push({
      x: this.x - wingOffset,
      y: this.y - 12,
      vx: this.vx * 0.15 - 15,
      vy: speed,
      width: 4,
      height: 18,
      damage: damage,
      color: pColor,
      life: 1.5,
      dimension: this.dimension
    });

    this.projectiles.push({
      x: this.x + wingOffset,
      y: this.y - 12,
      vx: this.vx * 0.15 + 15,
      vy: speed,
      width: 4,
      height: 18,
      damage: damage,
      color: pColor,
      life: 1.5,
      dimension: this.dimension
    });

    // Quad cannons for Nebula Striker or Tier 4 blaster
    if (this.shipId === 'striker' || this.upgrades.blasterTier >= 4) {
      this.projectiles.push({
        x: this.x - 28,
        y: this.y + 4,
        vx: -60,
        vy: speed * 0.95,
        width: 3.5,
        height: 14,
        damage: damage * 0.8,
        color: '#ffaa00',
        life: 1.5,
        dimension: this.dimension
      });
      this.projectiles.push({
        x: this.x + 28,
        y: this.y + 4,
        vx: 60,
        vy: speed * 0.95,
        width: 3.5,
        height: 14,
        damage: damage * 0.8,
        color: '#ffaa00',
        life: 1.5,
        dimension: this.dimension
      });
    }

    if (window.soundEngine) {
      window.soundEngine.playLaser(isSpecial);
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.roll);

    // Invulnerability Flicker
    if (this.invulnerableTime > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    // 1. Draw Energy Shield Bubble
    if (this.shields > 0) {
      const shieldRatio = this.shields / this.maxShields;
      ctx.strokeStyle = `rgba(0, 255, 170, ${0.25 + shieldRatio * 0.35})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00ffaa';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.ellipse(0, 0, this.width * 0.85, this.height * 0.7, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. Draw Overdrive Aura
    if (this.isOverdriveActive) {
      ctx.strokeStyle = `rgba(255, 0, 127, 0.8)`;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = 20;

      ctx.beginPath();
      ctx.ellipse(0, 0, this.width * 1.1, this.height * 0.9, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 3. Render Vector Starfighter Hull Geometry
    this.drawShipHull(ctx);

    ctx.restore();

    // 4. Draw Player Projectiles
    this.drawProjectiles(ctx);
  }

  drawShipHull(ctx) {
    const mainColor = this.dimension === 'rift' ? '#ff007f' : this.def.color;
    const darkHull = '#0d1527';
    const lightHull = '#1c2942';

    ctx.shadowColor = mainColor;
    ctx.shadowBlur = 12;

    // Wing Wingspan Path
    ctx.fillStyle = darkHull;
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 2;

    ctx.beginPath();
    // Nose
    ctx.moveTo(0, -28);
    // Right forward wing edge
    ctx.lineTo(12, -8);
    ctx.lineTo(24, 14);
    ctx.lineTo(22, 22);
    // Right engine cutout
    ctx.lineTo(8, 20);
    ctx.lineTo(5, 24);
    // Engine Center
    ctx.lineTo(0, 18);
    // Left engine cutout
    ctx.lineTo(-5, 24);
    ctx.lineTo(-8, 20);
    // Left wing
    ctx.lineTo(-22, 22);
    ctx.lineTo(-24, 14);
    ctx.lineTo(-12, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Upper Hull Armor Plates
    ctx.fillStyle = lightHull;
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(7, -4);
    ctx.lineTo(14, 10);
    ctx.lineTo(0, 14);
    ctx.lineTo(-14, 10);
    ctx.lineTo(-7, -4);
    ctx.closePath();
    ctx.fill();

    // Emissive Glowing Hull Decals
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-16, 12);
    ctx.lineTo(-8, -2);
    ctx.lineTo(0, -18);
    ctx.lineTo(8, -2);
    ctx.lineTo(16, 12);
    ctx.stroke();

    // Glowing Cockpit Canopy
    ctx.fillStyle = this.dimension === 'rift' ? '#ff00aa' : '#00f3ff';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(4, -4);
    ctx.lineTo(0, 2);
    ctx.lineTo(-4, -4);
    ctx.closePath();
    ctx.fill();

    // Glowing Dual Engine Nozzles
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = mainColor;
    ctx.shadowBlur = 10;
    ctx.fillRect(-10, 20, 5, 4);
    ctx.fillRect(5, 20, 5, 4);
  }

  drawProjectiles(ctx) {
    ctx.save();
    for (const p of this.projectiles) {
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.width / 2, p.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Laser Core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.width / 4, p.height / 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

window.Player = Player;
window.SHIP_DEFINITIONS = SHIP_DEFINITIONS;
