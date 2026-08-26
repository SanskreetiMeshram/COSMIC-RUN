/**
 * SHIFT: COSMIC RUN - Heads-Up Display (HUD) Controller
 */

class HUDController {
  constructor() {
    this.hudElement = document.getElementById('hud');
    this.shieldFill = document.getElementById('fill-shield');
    this.hullFill = document.getElementById('fill-hull');
    this.overdriveFill = document.getElementById('fill-overdrive');
    this.dimensionBadge = document.getElementById('dimension-badge');
    this.dimensionText = document.getElementById('dimension-text');
    this.sectorProgressFill = document.getElementById('sector-progress-fill');
    this.scoreText = document.getElementById('hud-score');
    this.multiplierText = document.getElementById('hud-multiplier');
    this.shardsText = document.getElementById('hud-shards');
    this.speedText = document.getElementById('hud-speed');
    this.empCountText = document.getElementById('hud-emp-count');
    this.shiftCooldownOverlay = document.getElementById('shift-cooldown-overlay');

    // Boss Bar
    this.bossBarContainer = document.getElementById('boss-bar-container');
    this.bossBarFill = document.getElementById('boss-bar-fill');
    this.bossNameText = document.getElementById('boss-name-text');
  }

  show() {
    if (this.hudElement) this.hudElement.style.display = 'flex';
  }

  hide() {
    if (this.hudElement) this.hudElement.style.display = 'none';
    if (this.bossBarContainer) this.bossBarContainer.style.display = 'none';
  }

  update(player, spawner, enemies, speedMultiplier = 1.0) {
    if (!player) return;

    // 1. Shield & Hull Bars
    const shieldPct = Math.max(0, (player.shields / player.maxShields) * 100);
    const hullPct = Math.max(0, (player.hull / player.maxHull) * 100);
    const overdrivePct = Math.max(0, (player.overdrive / player.maxOverdrive) * 100);

    if (this.shieldFill) this.shieldFill.style.width = `${shieldPct}%`;
    if (this.hullFill) this.hullFill.style.width = `${hullPct}%`;
    if (this.overdriveFill) this.overdriveFill.style.width = `${overdrivePct}%`;

    // 2. Dimension Badge
    if (this.dimensionBadge && this.dimensionText) {
      if (player.dimension === 'rift') {
        this.dimensionBadge.className = 'dimension-badge dim-rift';
        this.dimensionText.textContent = 'SINGULARITY RIFT';
      } else {
        this.dimensionBadge.className = 'dimension-badge dim-void';
        this.dimensionText.textContent = 'DEEP VOID';
      }
    }

    // 3. Sector Progress
    if (this.sectorProgressFill && spawner) {
      const prog = spawner.getProgressRatio() * 100;
      this.sectorProgressFill.style.width = `${prog}%`;
    }

    // 4. Score, Multiplier, Shards
    if (this.scoreText) {
      this.scoreText.textContent = player.score.toLocaleString();
    }
    if (this.multiplierText) {
      this.multiplierText.textContent = `x${player.comboMultiplier.toFixed(1)}`;
      this.multiplierText.style.display = player.comboMultiplier > 1.0 ? 'inline-block' : 'none';
    }
    if (this.shardsText) {
      this.shardsText.textContent = player.shards;
    }

    // 5. Speedometer
    if (this.speedText) {
      const warpSpeed = Math.round(speedMultiplier * (player.isOverdriveActive ? 2200 : 950));
      this.speedText.textContent = warpSpeed.toLocaleString();
    }

    // 6. Abilities & EMP count
    if (this.empCountText) {
      this.empCountText.textContent = player.empCharges;
    }
    if (this.shiftCooldownOverlay) {
      const cdPct = (player.shiftCooldown / player.maxShiftCooldown) * 100;
      this.shiftCooldownOverlay.style.height = `${Math.max(0, cdPct)}%`;
    }

    // 7. Boss Bar
    const boss = enemies.find(e => e.type === 'boss' && !e.isDestroyed);
    if (boss && this.bossBarContainer && this.bossBarFill) {
      this.bossBarContainer.style.display = 'flex';
      const bossHpPct = Math.max(0, (boss.health / boss.maxHealth) * 100);
      this.bossBarFill.style.width = `${bossHpPct}%`;
      if (this.bossNameText) {
        this.bossNameText.textContent = 'OMEGA SENTINEL DREADNOUGHT';
      }
    } else if (this.bossBarContainer) {
      this.bossBarContainer.style.display = 'none';
    }
  }
}

window.hudController = new HUDController();
