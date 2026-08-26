/**
 * SHIFT: COSMIC RUN - Dimension-Specific Obstacle & Hazard Entities
 */

class Obstacle {
  constructor(x, y, type, dimension) {
    this.x = x;
    this.y = y;
    this.type = type; // 'laserGate' | 'plasmaMine' | 'asteroid' | 'stationDebris' | 'gravityVortex'
    this.dimension = dimension; // 'void' | 'rift' | 'both'
    this.isDestroyed = false;
    this.health = 40;
    this.maxHealth = 40;
    
    // Physics
    this.vx = (Math.random() - 0.5) * 30;
    this.vy = 180 + Math.random() * 80;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 1.5;
    this.radius = 24;

    this.initTypeProperties();
  }

  initTypeProperties() {
    switch (this.type) {
      case 'laserGate':
        this.width = 180 + Math.random() * 120;
        this.height = 14;
        this.radius = this.width / 2;
        this.health = 80;
        this.pulseTime = 0;
        break;
      case 'plasmaMine':
        this.radius = 18;
        this.health = 25;
        this.pulse = 0;
        break;
      case 'asteroid':
        this.radius = 22 + Math.random() * 28;
        this.health = this.radius * 2.5;
        this.vertices = this.generatePolygonVertices(this.radius, 7 + Math.floor(Math.random() * 4));
        break;
      case 'stationDebris':
        this.radius = 35;
        this.width = 70;
        this.height = 24;
        this.health = 120;
        break;
      case 'gravityVortex':
        this.radius = 45;
        this.health = 9999; // Invulnerable
        this.swirl = 0;
        break;
    }
  }

  generatePolygonVertices(radius, count) {
    const verts = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = radius * (0.75 + Math.random() * 0.45);
      verts.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r
      });
    }
    return verts;
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.isDestroyed = true;
      if (window.particleSystem) {
        const color = this.dimension === 'rift' ? '#ff007f' : '#00f3ff';
        window.particleSystem.emitExplosion(this.x, this.y, color, 20);
      }
      if (window.soundEngine) {
        window.soundEngine.playExplosion();
      }
    }
  }

  update(dt, gameSpeedMultiplier = 1.0, player = null) {
    this.y += this.vy * gameSpeedMultiplier * dt;
    this.x += this.vx * dt;
    this.rotation += this.rotSpeed * dt;

    if (this.type === 'laserGate') {
      this.pulseTime += dt * 5;
    } else if (this.type === 'plasmaMine') {
      this.pulse += dt * 6;
    } else if (this.type === 'gravityVortex') {
      this.swirl += dt * 3;
      // Pull player if in Rift dimension
      if (player && player.dimension === 'rift') {
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 220 && dist > 10) {
          const force = (1 - dist / 220) * 140;
          player.vx += (dx / dist) * force * dt;
          player.vy += (dy / dist) * force * dt;
        }
      }
    }
  }

  checkCollision(player) {
    if (this.isDestroyed) return false;

    // Dimension Phase Check:
    // If obstacle is tied to a specific dimension and player is in the OTHER dimension,
    // the starfighter phases right through without taking damage!
    if (this.dimension !== 'both' && this.dimension !== player.dimension) {
      return false;
    }

    if (this.type === 'laserGate') {
      const halfW = this.width / 2;
      const insideX = player.x >= this.x - halfW && player.x <= this.x + halfW;
      const insideY = Math.abs(player.y - this.y) <= (this.height / 2 + player.hitboxRadius);
      return insideX && insideY;
    }

    const dist = Math.hypot(this.x - player.x, this.y - player.y);
    return dist < (this.radius + player.hitboxRadius);
  }

  draw(ctx, activeDimension) {
    const isPhased = (this.dimension !== 'both' && this.dimension !== activeDimension);

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Hologram transparency if in alternate dimension
    if (isPhased) {
      ctx.globalAlpha = 0.18;
    }

    if (this.type === 'laserGate') {
      this.drawLaserGate(ctx, isPhased);
    } else if (this.type === 'plasmaMine') {
      this.drawPlasmaMine(ctx, isPhased);
    } else if (this.type === 'asteroid') {
      this.drawAsteroid(ctx, isPhased);
    } else if (this.type === 'stationDebris') {
      this.drawStationDebris(ctx, isPhased);
    } else if (this.type === 'gravityVortex') {
      this.drawGravityVortex(ctx, isPhased);
    }

    ctx.restore();
  }

  drawLaserGate(ctx, isPhased) {
    const halfW = this.width / 2;
    const color = '#00f3ff';

    // Left & Right Emitters
    ctx.fillStyle = '#1c2942';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.fillRect(-halfW - 8, -12, 16, 24);
    ctx.strokeRect(-halfW - 8, -12, 16, 24);
    ctx.fillRect(halfW - 8, -12, 16, 24);
    ctx.strokeRect(halfW - 8, -12, 16, 24);

    // Laser Beam with Pulse
    const beamAlpha = 0.65 + Math.sin(this.pulseTime) * 0.35;
    ctx.strokeStyle = `rgba(0, 243, 255, ${beamAlpha})`;
    ctx.lineWidth = 4;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.moveTo(-halfW, 0);
    ctx.lineTo(halfW, 0);
    ctx.stroke();

    // Beam Core
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-halfW, 0);
    ctx.lineTo(halfW, 0);
    ctx.stroke();
  }

  drawPlasmaMine(ctx, isPhased) {
    const color = '#00f3ff';
    ctx.fillStyle = '#0a1525';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    // Spikes
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * (this.radius + 6), Math.sin(angle) * (this.radius + 6));
      ctx.stroke();
    }

    // Central Sphere
    ctx.beginPath();
    ctx.arc(0, 0, this.radius - 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Blinking Core
    const pulseAlpha = 0.5 + Math.sin(this.pulse) * 0.5;
    ctx.fillStyle = `rgba(0, 243, 255, ${pulseAlpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  drawAsteroid(ctx, isPhased) {
    const color = '#ff007f';
    ctx.fillStyle = '#1e1124';
    ctx.strokeStyle = isPhased ? '#ff007f' : '#b30059';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = isPhased ? 0 : 8;

    ctx.beginPath();
    ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
    for (let i = 1; i < this.vertices.length; i++) {
      ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crystalline facet lines
    ctx.strokeStyle = 'rgba(255, 0, 127, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < this.vertices.length; i += 2) {
      ctx.moveTo(0, 0);
      ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
    }
    ctx.stroke();
  }

  drawStationDebris(ctx, isPhased) {
    ctx.fillStyle = '#181026';
    ctx.strokeStyle = '#9d00ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#9d00ff';
    ctx.shadowBlur = 6;

    // Truss Girder Grid
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

    // Cross Braces
    ctx.beginPath();
    ctx.moveTo(-this.width / 2, -this.height / 2);
    ctx.lineTo(this.width / 2, this.height / 2);
    ctx.moveTo(-this.width / 2, this.height / 2);
    ctx.lineTo(this.width / 2, -this.height / 2);
    ctx.stroke();
  }

  drawGravityVortex(ctx, isPhased) {
    const color = '#ff00aa';
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;

    for (let i = 0; i < 3; i++) {
      const r = this.radius * (0.4 + i * 0.3);
      ctx.lineWidth = 3 - i * 0.7;
      ctx.beginPath();
      ctx.arc(0, 0, r, this.swirl + (i * Math.PI / 3), this.swirl + (i * Math.PI / 3) + Math.PI * 1.4);
      ctx.stroke();
    }
  }
}

window.Obstacle = Obstacle;
