/**
 * SHIFT: COSMIC RUN - High Performance Canvas Graphics & FX Renderer
 */

class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    // Parallax Star Layers
    this.stars = [];
    this.nebulaClouds = [];
    this.screenShakeTime = 0;
    this.screenShakeMagnitude = 0;

    this.initBackground(this.width, this.height);
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.initBackground(width, height);
    if (window.particleSystem) {
      window.particleSystem.initStreaks(width, height, 70);
    }
    if (window.dimensionEngine) {
      window.dimensionEngine.init(width, height);
    }
  }

  initBackground(width, height) {
    // 3 Layers of Parallax Stars
    this.stars = [];
    for (let i = 0; i < 140; i++) {
      this.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 0.8 + Math.random() * 2.2,
        speed: 0.5 + Math.random() * 2.5,
        alpha: 0.3 + Math.random() * 0.7,
        color: Math.random() > 0.3 ? '#ffffff' : '#00f3ff'
      });
    }

    // Procedural Nebula Clouds
    this.nebulaClouds = [];
    for (let i = 0; i < 8; i++) {
      this.nebulaClouds.push({
        x: (width * 0.5) + Math.random() * (width * 0.5), // Mostly in Singularity Rift side
        y: Math.random() * height,
        radius: 120 + Math.random() * 160,
        color: i % 2 === 0 ? 'rgba(255, 0, 127, 0.08)' : 'rgba(157, 0, 255, 0.07)',
        vy: 20 + Math.random() * 30
      });
    }
  }

  shake(magnitude = 8, duration = 0.3) {
    this.screenShakeMagnitude = magnitude;
    this.screenShakeTime = duration;
  }

  update(dt, speedMultiplier = 1.0) {
    // Update Stars
    for (const star of this.stars) {
      star.y += (star.speed * 40 * speedMultiplier) * dt;
      if (star.y > this.height) {
        star.y = 0;
        star.x = Math.random() * this.width;
      }
    }

    // Update Nebulae
    for (const neb of this.nebulaClouds) {
      neb.y += (neb.vy * speedMultiplier) * dt;
      if (neb.y - neb.radius > this.height) {
        neb.y = -neb.radius;
        neb.x = (this.width * 0.5) + Math.random() * (this.width * 0.5);
      }
    }

    // Screen Shake decay
    if (this.screenShakeTime > 0) {
      this.screenShakeTime -= dt;
    }
  }

  render(gameState) {
    const { player, obstacles, enemies, pickups, dimensionEngine, particleSystem, gameSpeedMultiplier } = gameState;
    const ctx = this.ctx;

    ctx.save();

    // 1. Camera Screen Shake
    if (this.screenShakeTime > 0) {
      const sx = (Math.random() - 0.5) * this.screenShakeMagnitude;
      const sy = (Math.random() - 0.5) * this.screenShakeMagnitude;
      ctx.translate(sx, sy);
    }

    // 2. Clear Screen / Deep Navy Backdrop
    ctx.fillStyle = '#050711';
    ctx.fillRect(0, 0, this.width, this.height);

    // 3. Render Nebula Clouds (Parallax Background)
    for (const neb of this.nebulaClouds) {
      const grad = ctx.createRadialGradient(neb.x, neb.y, 10, neb.x, neb.y, neb.radius);
      grad.addColorStop(0, neb.color);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(neb.x, neb.y, neb.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Render Starfield
    for (const star of this.stars) {
      ctx.fillStyle = star.color;
      ctx.globalAlpha = star.alpha;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.globalAlpha = 1.0;

    // 5. Draw Dimensional Fracture Split Boundary
    if (dimensionEngine) {
      dimensionEngine.drawBoundary(ctx, this.width, this.height);
    }

    // 6. Draw Hyperspace Speed Streaks
    if (particleSystem) {
      particleSystem.drawStreaks(ctx);
    }

    // 7. Render Pickups
    for (const pickup of pickups) {
      if (!pickup.isCollected) {
        pickup.draw(ctx);
      }
    }

    // 8. Render Obstacles
    for (const obs of obstacles) {
      if (!obs.isDestroyed) {
        obs.draw(ctx, player.dimension);
      }
    }

    // 9. Render Enemies
    for (const enemy of enemies) {
      if (!enemy.isDestroyed) {
        enemy.draw(ctx);
      }
    }

    // 10. Render Player Starfighter
    if (player && !player.isDestroyed) {
      player.draw(ctx);
    }

    // 11. Render Explosions, Arcs, and Particle FX
    if (particleSystem) {
      particleSystem.draw(ctx);
    }

    // 12. Relativistic Warp Speed Edge Glow (when boosting or high speed)
    if (gameSpeedMultiplier > 1.3 || (player && player.isOverdriveActive)) {
      const edgeGlow = ctx.createRadialGradient(
        this.width / 2, this.height / 2, this.height * 0.4,
        this.width / 2, this.height / 2, this.height * 0.75
      );
      edgeGlow.addColorStop(0, 'rgba(0, 243, 255, 0)');
      edgeGlow.addColorStop(1, 'rgba(0, 243, 255, 0.22)');
      ctx.fillStyle = edgeGlow;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    ctx.restore();
  }
}

window.GameRenderer = GameRenderer;
