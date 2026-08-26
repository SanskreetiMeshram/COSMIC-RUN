/**
 * SHIFT: COSMIC RUN - Collectible Pickups & Powerups Engine
 */

class Pickup {
  constructor(x, y, type = 'shard') {
    this.x = x;
    this.y = y;
    this.type = type; // 'shard' | 'shield' | 'emp' | 'overdrive' | 'star'
    this.isCollected = false;
    this.radius = 12;
    this.age = 0;

    this.vy = 120 + Math.random() * 40;
    this.vx = (Math.random() - 0.5) * 20;

    this.initColors();
  }

  initColors() {
    switch (this.type) {
      case 'shard':
        this.color = '#00f3ff';
        this.value = 1;
        break;
      case 'shield':
        this.color = '#00ffaa';
        this.radius = 14;
        break;
      case 'emp':
        this.color = '#ffaa00';
        this.radius = 14;
        break;
      case 'overdrive':
        this.color = '#ff007f';
        this.radius = 15;
        break;
      case 'star':
        this.color = '#ffe600';
        this.radius = 13;
        break;
    }
  }

  update(dt, player) {
    this.age += dt;
    this.y += this.vy * dt;
    this.x += this.vx * dt;

    // Magnetic Attraction to Player
    if (player) {
      const magnetDist = player.getMagnetRadius();
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist < magnetDist && dist > 2) {
        const pullSpeed = (1 - dist / magnetDist) * 550;
        this.vx += (dx / dist) * pullSpeed * dt;
        this.vy += (dy / dist) * pullSpeed * dt;
      }

      // Check Collection
      if (dist < (this.radius + player.hitboxRadius)) {
        this.collect(player);
      }
    }
  }

  collect(player) {
    this.isCollected = true;

    if (this.type === 'shard') {
      player.addShards(1);
      if (window.soundEngine) window.soundEngine.playPickup('shard');
    } else if (this.type === 'shield') {
      player.heal(45, 10);
      if (window.soundEngine) window.soundEngine.playPickup('shield');
    } else if (this.type === 'emp') {
      player.empCharges = Math.min(player.maxEmpCharges, player.empCharges + 1);
      if (window.soundEngine) window.soundEngine.playPickup('emp');
    } else if (this.type === 'overdrive') {
      player.overdrive = Math.min(player.maxOverdrive, player.overdrive + 40);
      if (window.soundEngine) window.soundEngine.playPickup('shard');
    } else if (this.type === 'star') {
      player.comboMultiplier = Math.min(8.0, +(player.comboMultiplier + 1.0).toFixed(1));
      player.comboTimer = 5.0;
      if (window.soundEngine) window.soundEngine.playPickup('shard');
    }

    if (window.particleSystem) {
      window.particleSystem.emitExplosion(this.x, this.y, this.color, 12);
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const bob = Math.sin(this.age * 6) * 3;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12;

    if (this.type === 'shard') {
      // Rotating Rhombus Crystal
      ctx.fillStyle = this.color;
      ctx.rotate(this.age * 3);
      ctx.beginPath();
      ctx.moveTo(0, -this.radius);
      ctx.lineTo(this.radius * 0.7, 0);
      ctx.lineTo(0, this.radius);
      ctx.lineTo(-this.radius * 0.7, 0);
      ctx.closePath();
      ctx.fill();

      // White Glint
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'shield') {
      // Green Shield Capsule
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, bob, this.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = this.color;
      ctx.fillRect(-4, -4 + bob, 8, 8);
    } else if (this.type === 'emp') {
      // Amber EMP Core
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, bob, this.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Orbitron';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('EMP', 0, bob);
    } else if (this.type === 'overdrive') {
      // Magenta Overdrive Flame
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, bob, this.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, bob, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

window.Pickup = Pickup;
