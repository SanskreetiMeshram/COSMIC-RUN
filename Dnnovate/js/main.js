/**
 * SHIFT: COSMIC RUN - Core Game Engine & Lifecycle Orchestrator
 */

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new GameRenderer(this.canvas);
    this.state = 'MENU'; // 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY'

    this.player = null;
    this.spawner = new SpawnerSystem();
    this.obstacles = [];
    this.enemies = [];
    this.pickups = [];

    this.lastTime = 0;
    this.gameSpeedMultiplier = 1.0;
    this.isEndless = false;

    this.init();
  }

  init() {
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());

    // Game loop request
    requestAnimationFrame((t) => this.loop(t));
  }

  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.resize(width, height);
  }

  startSector(sectorId) {
    this.isEndless = false;
    this.initGameSession();
    this.spawner.startSector(sectorId, 'sector');
    this.gameSpeedMultiplier = this.spawner.currentSector.speedBase;
  }

  startEndless() {
    this.isEndless = true;
    this.initGameSession();
    this.spawner.startSector(5, 'endless');
    this.gameSpeedMultiplier = 1.2;
  }

  initGameSession() {
    const selectedShipId = window.storageManager.data.selectedShip || 'ghostblade';
    const upgrades = window.storageManager.data.upgrades;

    this.player = new Player(this.renderer.width / 2, this.renderer.height * 0.78);
    this.player.setShip(selectedShipId, upgrades);

    this.obstacles = [];
    this.enemies = [];
    this.pickups = [];
    if (window.particleSystem) window.particleSystem.reset();

    this.state = 'PLAYING';
    window.menuManager.hideAll();
    window.hudController.show();

    if (window.soundEngine) {
      window.soundEngine.startMusic();
      window.soundEngine.setDimension(this.player.dimension);
    }
  }

  pause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      window.menuManager.showScreen('pause');
      if (window.soundEngine) window.soundEngine.stopMusic();
    }
  }

  resume() {
    if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      window.menuManager.hideAll();
      window.hudController.show();
      if (window.soundEngine) window.soundEngine.startMusic();
    }
  }

  restart() {
    if (this.isEndless) {
      this.startEndless();
    } else {
      this.startSector(this.spawner.currentSector.id);
    }
  }

  startNextSector() {
    const nextId = this.spawner.currentSector.id + 1;
    if (nextId <= 5) {
      this.startSector(nextId);
    } else {
      this.startEndless();
    }
  }

  goToMenu() {
    this.state = 'MENU';
    window.hudController.hide();
    window.menuManager.showScreen('mainMenu');
    if (window.soundEngine) window.soundEngine.stopMusic();
  }

  loop(currentTime) {
    if (!this.lastTime) this.lastTime = currentTime;
    const dt = Math.min(0.08, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    if (this.state === 'PLAYING') {
      this.update(dt);
    }

    // Always render visual canvas
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    // 1. Input Processing
    window.inputHandler.update();

    if (window.inputHandler.pauseTriggered) {
      window.inputHandler.consumeTriggers();
      this.pause();
      return;
    }

    // 2. Dynamic Warp Speed Acceleration
    if (this.isEndless) {
      this.gameSpeedMultiplier = Math.min(2.8, 1.2 + (this.spawner.distance / 3000) * 0.8);
    } else {
      this.gameSpeedMultiplier = this.spawner.currentSector.speedBase;
    }

    if (this.player.isOverdriveActive) {
      this.gameSpeedMultiplier *= 1.65;
    }

    // 3. Spawner & Sector Progress
    this.spawner.update(
      dt, 
      this.gameSpeedMultiplier, 
      { width: this.renderer.width, height: this.renderer.height },
      this.obstacles, 
      this.enemies, 
      this.pickups
    );

    // 4. Update Player Entity
    this.player.update(dt, window.inputHandler, { width: this.renderer.width, height: this.renderer.height });
    this.player.distanceTraveled = this.spawner.distance;

    // 5. Update Dimension & Particles
    if (window.dimensionEngine) {
      window.dimensionEngine.update(dt, this.renderer.width, this.renderer.height);
    }
    if (window.particleSystem) {
      window.particleSystem.update(dt);
      window.particleSystem.updateStreaks(this.renderer.width, this.renderer.height, this.gameSpeedMultiplier);
    }

    // 6. Update Background Renderer
    this.renderer.update(dt, this.gameSpeedMultiplier);

    // 7. Update Obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.update(dt, this.gameSpeedMultiplier, this.player);

      // Check collision with player
      if (obs.checkCollision(this.player)) {
        if (this.player.isOverdriveActive) {
          // Overdrive destroys obstacles on contact!
          obs.takeDamage(999);
          this.player.addScore(100);
        } else {
          this.player.takeDamage(35);
          obs.takeDamage(999);
          this.renderer.shake(12, 0.35);
        }
      }

      if (obs.y > this.renderer.height + 100 || obs.isDestroyed) {
        this.obstacles.splice(i, 1);
      }
    }

    // 8. Update Hostile Sentinel Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(dt, this.player, { width: this.renderer.width, height: this.renderer.height });

      // Check Enemy Bullet Collisions against Player
      for (let j = enemy.projectiles.length - 1; j >= 0; j--) {
        const ep = enemy.projectiles[j];
        const dist = Math.hypot(ep.x - this.player.x, ep.y - this.player.y);
        if (dist < (ep.radius + this.player.hitboxRadius)) {
          this.player.takeDamage(20);
          this.renderer.shake(8, 0.25);
          enemy.projectiles.splice(j, 1);
        }
      }

      // Check Player Collision with Enemy body
      const bodyDist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
      if (bodyDist < (enemy.radius + this.player.hitboxRadius) && !enemy.isDestroyed) {
        if (this.player.isOverdriveActive) {
          enemy.takeDamage(999);
        } else {
          this.player.takeDamage(30);
          if (enemy.type !== 'boss') enemy.takeDamage(60);
          this.renderer.shake(10, 0.3);
        }
      }

      if (enemy.y > this.renderer.height + 80 || enemy.isDestroyed) {
        if (enemy.isDestroyed) {
          this.player.addScore(enemy.scoreValue);
          window.storageManager.addShards(Math.ceil(enemy.scoreValue / 25));
          
          // If boss defeated in sector mode, trigger victory!
          if (enemy.type === 'boss' && !this.isEndless) {
            this.handleVictory();
            return;
          }
        }
        this.enemies.splice(i, 1);
      }
    }

    // 9. Update Player Blaster Collisions against Obstacles & Enemies
    for (const proj of this.player.projectiles) {
      // Against Obstacles
      for (const obs of this.obstacles) {
        if (!obs.isDestroyed) {
          const dist = Math.hypot(proj.x - obs.x, proj.y - obs.y);
          if (dist < (obs.radius + 8)) {
            obs.takeDamage(proj.damage);
            proj.destroyed = true;
            if (window.particleSystem) window.particleSystem.emitExplosion(proj.x, proj.y, proj.color, 6);
            break;
          }
        }
      }

      // Against Enemies
      if (!proj.destroyed) {
        for (const enemy of this.enemies) {
          if (!enemy.isDestroyed) {
            const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
            if (dist < (enemy.radius + 10)) {
              enemy.takeDamage(proj.damage);
              proj.destroyed = true;
              if (window.particleSystem) window.particleSystem.emitExplosion(proj.x, proj.y, proj.color, 8);
              break;
            }
          }
        }
      }
    }

    // 10. Update Pickups
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.update(dt, this.player);

      if (p.isCollected) {
        if (p.type === 'shard') {
          window.storageManager.addShards(1);
        }
        this.pickups.splice(i, 1);
      } else if (p.y > this.renderer.height + 50) {
        this.pickups.splice(i, 1);
      }
    }

    // 11. Check Player Death (Hull <= 0)
    if (this.player.hull <= 0) {
      this.handleGameOver();
      return;
    }

    // 12. Update HUD
    window.hudController.update(this.player, this.spawner, this.enemies, this.gameSpeedMultiplier);
  }

  handleGameOver() {
    this.state = 'GAMEOVER';
    window.storageManager.updateHighScore(this.player.score);
    window.hudController.hide();

    window.menuManager.showGameOver({
      score: this.player.score,
      distance: this.spawner.distance,
      shards: this.player.shards
    });
  }

  handleVictory() {
    this.state = 'VICTORY';
    window.storageManager.completeSector(this.spawner.currentSector.id);
    window.storageManager.addShards(this.spawner.currentSector.rewardShards);
    window.storageManager.updateHighScore(this.player.score);
    window.hudController.hide();

    window.menuManager.showVictory({
      score: this.player.score,
      distance: this.spawner.distance
    }, this.spawner.currentSector);
  }

  render() {
    this.renderer.render({
      player: this.player || new Player(this.renderer.width / 2, this.renderer.height * 0.78),
      obstacles: this.obstacles,
      enemies: this.enemies,
      pickups: this.pickups,
      dimensionEngine: window.dimensionEngine,
      particleSystem: window.particleSystem,
      gameSpeedMultiplier: this.gameSpeedMultiplier
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new GameEngine();
});
