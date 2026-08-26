/**
 * SHIFT: COSMIC RUN - Hostile Sentinel Enemies & Boss AI Engine
 */

class SentinelEnemy {
  constructor(x, y, type = 'saucer') {
    this.x = x;
    this.y = y;
    this.type = type; // 'saucer' | 'interceptor' | 'heavy' | 'boss'
    this.isDestroyed = false;

    // Stats based on type
    this.initStats();

    this.projectiles = [];
    this.fireTimer = 0.8 + Math.random() * 0.8;
    this.age = 0;
    this.angle = 0;

    // Movement pattern
    this.baseX = x;
    this.swayFreq = 2.0 + Math.random() * 1.5;
    this.swayAmp = 60 + Math.random() * 80;
  }

  initStats() {
    switch (this.type) {
      case 'saucer':
        this.maxHealth = 45;
        this.health = 45;
        this.width = 38;
        this.height = 24;
        this.radius = 18;
        this.vy = 110 + Math.random() * 40;
        this.scoreValue = 150;
        this.fireInterval = 1.6;
        break;
      case 'interceptor':
        this.maxHealth = 35;
        this.health = 35;
        this.width = 32;
        this.height = 36;
        this.radius = 16;
        this.vy = 190 + Math.random() * 50;
        this.scoreValue = 200;
        this.fireInterval = 1.1;
        break;
      case 'heavy':
        this.maxHealth = 130;
        this.health = 130;
        this.width = 54;
        this.height = 42;
        this.radius = 26;
        this.vy = 75;
        this.scoreValue = 400;
        this.fireInterval = 2.0;
        break;
      case 'boss':
        this.maxHealth = 1200;
        this.health = 1200;
        this.width = 120;
        this.height = 80;
        this.radius = 55;
        this.vy = 0; // Boss stays at top
        this.scoreValue = 5000;
        this.fireInterval = 0.6;
        this.bossPhase = 1;
        this.laserCharge = 0;
        this.laserFiring = false;
        break;
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.isDestroyed = true;
      const isBoss = this.type === 'boss';
      if (window.particleSystem) {
        window.particleSystem.emitExplosion(this.x, this.y, '#ff2a4b', isBoss ? 70 : 28, isBoss);
      }
      if (window.soundEngine) {
        window.soundEngine.playExplosion(isBoss);
      }
    }
  }

  update(dt, player, bounds) {
    this.age += dt;

    // Movement AI
    if (this.type === 'boss') {
      // Boss floats smoothly across top
      this.x = bounds.width / 2 + Math.sin(this.age * 1.2) * (bounds.width * 0.32);
      this.y = 110 + Math.sin(this.age * 2.0) * 20;

      // Update Boss Phases
      const hpPct = this.health / this.maxHealth;
      if (hpPct < 0.35) {
        this.bossPhase = 3;
      } else if (hpPct < 0.7) {
        this.bossPhase = 2;
      }
    } else {
      this.y += this.vy * dt;
      this.x = this.baseX + Math.sin(this.age * this.swayFreq) * this.swayAmp;
    }

    // Firing AI
    this.fireTimer -= dt;
    if (this.fireTimer <= 0 && player && !player.isDestroyed) {
      this.fireAtPlayer(player);
      this.fireTimer = this.fireInterval + (Math.random() * 0.4);
    }

    // Update enemy projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      if (p.y > bounds.height + 50 || p.x < -50 || p.x > bounds.width + 50 || p.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  fireAtPlayer(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const angle = Math.atan2(dy, dx);
    const speed = 320;

    if (this.type === 'boss') {
      // Boss bullet hell patterns based on phase
      if (this.bossPhase === 1) {
        // Triple spread
        for (let i = -1; i <= 1; i++) {
          const a = angle + i * 0.25;
          this.projectiles.push({
            x: this.x,
            y: this.y + 20,
            vx: Math.cos(a) * speed,
            vy: Math.sin(a) * speed,
            radius: 5,
            color: '#ff2a4b',
            life: 4.0
          });
        }
      } else if (this.bossPhase === 2) {
        // 8-way radial burst
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + (this.age * 2);
          this.projectiles.push({
            x: this.x,
            y: this.y + 20,
            vx: Math.cos(a) * (speed * 0.9),
            vy: Math.sin(a) * (speed * 0.9),
            radius: 5.5,
            color: '#ff8800',
            life: 4.5
          });
        }
      } else if (this.bossPhase === 3) {
        // Rapid 5-stream barrage
        for (let i = -2; i <= 2; i++) {
          const a = angle + i * 0.18;
          this.projectiles.push({
            x: this.x + i * 15,
            y: this.y + 25,
            vx: Math.cos(a) * (speed * 1.2),
            vy: Math.sin(a) * (speed * 1.2),
            radius: 6,
            color: '#ff0055',
            life: 3.5
          });
        }
      }
    } else if (this.type === 'heavy') {
      // Dual targeted plasma bolts
      this.projectiles.push({
        x: this.x - 14,
        y: this.y + 12,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 4.5,
        color: '#ff6600',
        life: 3.5
      });
      this.projectiles.push({
        x: this.x + 14,
        y: this.y + 12,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 4.5,
        color: '#ff6600',
        life: 3.5
      });
    } else {
      // Single plasma orb
      this.projectiles.push({
        x: this.x,
        y: this.y + 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 4,
        color: '#ff2a4b',
        life: 3.5
      });
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === 'boss') {
      this.drawBoss(ctx);
    } else if (this.type === 'saucer') {
      this.drawSaucer(ctx);
    } else if (this.type === 'interceptor') {
      this.drawInterceptor(ctx);
    } else if (this.type === 'heavy') {
      this.drawHeavy(ctx);
    }

    ctx.restore();

    // Draw enemy projectiles
    this.drawProjectiles(ctx);
  }

  drawSaucer(ctx) {
    // Red-Orange Rim-Lit Saucer from the key art!
    ctx.shadowColor = '#ff2a4b';
    ctx.shadowBlur = 12;

    // Dark Silhouette Hull
    ctx.fillStyle = '#100812';
    ctx.strokeStyle = '#ff3344';
    ctx.lineWidth = 1.8;

    // Saucer Disc
    ctx.beginPath();
    ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Upper Dome
    ctx.fillStyle = '#220b18';
    ctx.beginPath();
    ctx.ellipse(0, -4, this.width / 3.5, this.height / 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Emissive Red/Orange Rim Glow
    ctx.strokeStyle = '#ff8800';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 2, this.width / 2.2, this.height / 3, 0, 0, Math.PI);
    ctx.stroke();

    // Glowing Central Scanner Eye
    ctx.fillStyle = '#ff0033';
    ctx.shadowColor = '#ff0033';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(0, -3, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawInterceptor(ctx) {
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#140c10';
    ctx.strokeStyle = '#ff6600';
    ctx.lineWidth = 1.8;

    // Forward swept needle wings
    ctx.beginPath();
    ctx.moveTo(0, 18);
    ctx.lineTo(16, -14);
    ctx.lineTo(8, -18);
    ctx.lineTo(0, -10);
    ctx.lineTo(-8, -18);
    ctx.lineTo(-16, -14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing cockpit slit
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(-3, 2, 6, 8);
  }

  drawHeavy(ctx) {
    ctx.shadowColor = '#ff2a4b';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#1a0810';
    ctx.strokeStyle = '#ff3344';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, 22);
    ctx.lineTo(26, -12);
    ctx.lineTo(18, -20);
    ctx.lineTo(-18, -20);
    ctx.lineTo(-26, -12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dual Weapon Pods
    ctx.fillStyle = '#ff8800';
    ctx.fillRect(-22, -4, 5, 16);
    ctx.fillRect(17, -4, 5, 16);
  }

  drawBoss(ctx) {
    // Massive Dreadnought Mothership
    ctx.shadowColor = '#ff0044';
    ctx.shadowBlur = 25;
    ctx.fillStyle = '#10050c';
    ctx.strokeStyle = '#ff2a4b';
    ctx.lineWidth = 3;

    // Heavy segmented hull
    ctx.beginPath();
    ctx.moveTo(0, 38);
    ctx.lineTo(55, 10);
    ctx.lineTo(60, -25);
    ctx.lineTo(30, -38);
    ctx.lineTo(-30, -38);
    ctx.lineTo(-60, -25);
    ctx.lineTo(-55, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing Core Reactor
    const corePulse = 0.7 + Math.sin(this.age * 6) * 0.3;
    ctx.fillStyle = `rgba(255, 0, 85, ${corePulse})`;
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    // Armored Wing Flaps
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 2;
    ctx.strokeRect(-48, -15, 18, 28);
    ctx.strokeRect(30, -15, 18, 28);
  }

  drawProjectiles(ctx) {
    ctx.save();
    for (const p of this.projectiles) {
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // White Plasma Core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

window.SentinelEnemy = SentinelEnemy;
