/**
 * SHIFT: COSMIC RUN - Menus & Modal UI Controller
 */

class MenuManager {
  constructor() {
    this.screens = {
      mainMenu: document.getElementById('main-menu'),
      sectorSelect: document.getElementById('screen-sectors'),
      hangar: document.getElementById('screen-hangar'),
      upgrades: document.getElementById('screen-upgrades'),
      settings: document.getElementById('screen-settings'),
      howToPlay: document.getElementById('screen-howtoplay'),
      pause: document.getElementById('screen-pause'),
      gameOver: document.getElementById('screen-gameover'),
      victory: document.getElementById('screen-victory')
    };

    this.currentShipIndex = 0;
    this.shipKeys = Object.keys(SHIP_DEFINITIONS);
    
    this.initEventListeners();
  }

  showScreen(screenName) {
    Object.values(this.screens).forEach(scr => {
      if (scr) scr.classList.remove('active');
    });

    if (this.screens[screenName]) {
      this.screens[screenName].classList.add('active');
    }

    if (window.soundEngine) {
      window.soundEngine.playUIClick();
    }
  }

  hideAll() {
    Object.values(this.screens).forEach(scr => {
      if (scr) scr.classList.remove('active');
    });
  }

  initEventListeners() {
    // Main Menu Buttons
    document.getElementById('btn-play-campaign')?.addEventListener('click', () => {
      this.renderSectorList();
      this.showScreen('sectorSelect');
    });

    document.getElementById('btn-play-endless')?.addEventListener('click', () => {
      this.hideAll();
      window.game.startEndless();
    });

    document.getElementById('btn-hangar')?.addEventListener('click', () => {
      this.updateHangarUI();
      this.showScreen('hangar');
    });

    document.getElementById('btn-upgrades')?.addEventListener('click', () => {
      this.updateUpgradesUI();
      this.showScreen('upgrades');
    });

    document.getElementById('btn-settings')?.addEventListener('click', () => {
      this.showScreen('settings');
    });

    document.getElementById('btn-howtoplay')?.addEventListener('click', () => {
      this.showScreen('howToPlay');
    });

    // Close Modals
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        this.showScreen('mainMenu');
      });
    });

    // Hangar Navigation
    document.getElementById('btn-ship-prev')?.addEventListener('click', () => {
      this.currentShipIndex = (this.currentShipIndex - 1 + this.shipKeys.length) % this.shipKeys.length;
      this.updateHangarUI();
    });

    document.getElementById('btn-ship-next')?.addEventListener('click', () => {
      this.currentShipIndex = (this.currentShipIndex + 1) % this.shipKeys.length;
      this.updateHangarUI();
    });

    document.getElementById('btn-select-ship')?.addEventListener('click', () => {
      const shipKey = this.shipKeys[this.currentShipIndex];
      const isUnlocked = window.storageManager.data.unlockedShips.includes(shipKey);
      const shipDef = SHIP_DEFINITIONS[shipKey];

      if (isUnlocked) {
        window.storageManager.selectShip(shipKey);
        this.updateHangarUI();
      } else {
        // Try purchase
        if (window.storageManager.spendShards(shipDef.price)) {
          window.storageManager.unlockShip(shipKey);
          window.storageManager.selectShip(shipKey);
          if (window.soundEngine) window.soundEngine.playVictory();
          this.updateHangarUI();
        } else {
          alert('Not enough Cosmic Shards!');
        }
      }
    });

    // Pause Screen Buttons
    document.getElementById('btn-resume')?.addEventListener('click', () => {
      window.game.resume();
    });

    document.getElementById('btn-pause-restart')?.addEventListener('click', () => {
      window.game.restart();
    });

    document.getElementById('btn-pause-menu')?.addEventListener('click', () => {
      window.game.goToMenu();
    });

    // Game Over & Victory Buttons
    document.getElementById('btn-gameover-retry')?.addEventListener('click', () => {
      window.game.restart();
    });

    document.getElementById('btn-gameover-menu')?.addEventListener('click', () => {
      window.game.goToMenu();
    });

    document.getElementById('btn-victory-next')?.addEventListener('click', () => {
      window.game.startNextSector();
    });

    document.getElementById('btn-victory-menu')?.addEventListener('click', () => {
      window.game.goToMenu();
    });

    // Settings Inputs
    const musicVol = document.getElementById('setting-music');
    const sfxVol = document.getElementById('setting-sfx');

    musicVol?.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      if (window.soundEngine && window.soundEngine.musicGain) {
        window.soundEngine.musicGain.gain.setValueAtTime(v, window.soundEngine.ctx.currentTime);
      }
    });

    sfxVol?.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      if (window.soundEngine && window.soundEngine.sfxGain) {
        window.soundEngine.sfxGain.gain.setValueAtTime(v, window.soundEngine.ctx.currentTime);
      }
    });
  }

  renderSectorList() {
    const listEl = document.getElementById('sectors-container');
    if (!listEl) return;

    listEl.innerHTML = '';
    const completed = window.storageManager.data.completedSectors || [1];

    SECTOR_DEFINITIONS.forEach(sector => {
      const isUnlocked = completed.includes(sector.id);
      const div = document.createElement('div');
      div.className = 'sector-item';
      div.style.opacity = isUnlocked ? '1' : '0.45';

      div.innerHTML = `
        <div class="sector-info">
          <h4>${sector.name} ${isUnlocked ? '✦' : '🔒'}</h4>
          <p>${sector.desc}</p>
        </div>
        <div class="sector-reward">
          ${isUnlocked ? `REWARD: ${sector.rewardShards} ✦` : 'LOCKED'}
        </div>
      `;

      if (isUnlocked) {
        div.addEventListener('click', () => {
          this.hideAll();
          window.game.startSector(sector.id);
        });
      }

      listEl.appendChild(div);
    });
  }

  updateHangarUI() {
    const shipKey = this.shipKeys[this.currentShipIndex];
    const shipDef = SHIP_DEFINITIONS[shipKey];
    const isUnlocked = window.storageManager.data.unlockedShips.includes(shipKey);
    const isSelected = window.storageManager.data.selectedShip === shipKey;

    document.getElementById('hangar-ship-name').textContent = shipDef.name;
    document.getElementById('hangar-ship-lore').textContent = shipDef.lore;
    document.getElementById('hangar-shards-count').textContent = window.storageManager.data.shards;

    // Stat bars
    document.getElementById('stat-speed').style.width = `${(shipDef.stats.speed / 12) * 100}%`;
    document.getElementById('stat-shields').style.width = `${(shipDef.stats.shields / 180) * 100}%`;
    document.getElementById('stat-hull').style.width = `${(shipDef.stats.hull / 180) * 100}%`;
    document.getElementById('stat-handling').style.width = `${(shipDef.stats.handling / 12) * 100}%`;

    const btnSelect = document.getElementById('btn-select-ship');
    if (isSelected) {
      btnSelect.textContent = 'SELECTED';
      btnSelect.className = 'cyber-btn btn-magenta';
    } else if (isUnlocked) {
      btnSelect.textContent = 'SELECT SHIP';
      btnSelect.className = 'cyber-btn';
    } else {
      btnSelect.textContent = `UNLOCK FOR ${shipDef.price} ✦`;
      btnSelect.className = 'cyber-btn btn-amber';
    }

    // Render Preview Model on Hangar Canvas
    this.renderShipPreview(shipDef);
  }

  renderShipPreview(shipDef) {
    const previewCanvas = document.getElementById('ship-preview-canvas');
    if (!previewCanvas) return;
    const ctx = previewCanvas.getContext('2d');
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    ctx.save();
    ctx.translate(previewCanvas.width / 2, previewCanvas.height / 2 + 10);
    ctx.scale(1.4, 1.4);

    // Draw ship hull
    const dummyPlayer = new Player(0, 0);
    dummyPlayer.setShip(shipDef.id);
    dummyPlayer.drawShipHull(ctx);

    ctx.restore();
  }

  updateUpgradesUI() {
    const container = document.getElementById('upgrades-container');
    if (!container) return;
    container.innerHTML = '';

    document.getElementById('upgrades-shards-count').textContent = window.storageManager.data.shards;

    const upgradesConfig = [
      { key: 'blasterTier', name: 'Plasma Blasters', desc: 'Increases projectile damage & fire velocity.' },
      { key: 'shieldTier', name: 'Phase Shields', desc: 'Expands maximum shield capacity & recharge.' },
      { key: 'boostTier', name: 'Afterburners', desc: 'Extends Overdrive boost duration & top speed.' },
      { key: 'empTier', name: 'Singularity EMP', desc: 'Expands EMP blast radius and damage.' },
      { key: 'magnetTier', name: 'Tractor Beam', desc: 'Expands shard & pickup collection magnetism.' }
    ];

    upgradesConfig.forEach(cfg => {
      const level = window.storageManager.data.upgrades[cfg.key] || 1;
      const cost = window.storageManager.getUpgradeCost(cfg.key);

      const card = document.createElement('div');
      card.className = 'upgrade-card';
      card.innerHTML = `
        <div class="upgrade-card-top">
          <span class="upgrade-title">${cfg.name}</span>
          <span class="upgrade-level">LVL ${level}</span>
        </div>
        <p class="upgrade-desc">${cfg.desc}</p>
        <button class="cyber-btn upgrade-btn">UPGRADE (${cost} ✦)</button>
      `;

      card.querySelector('.upgrade-btn').addEventListener('click', () => {
        if (window.storageManager.upgradeTech(cfg.key)) {
          if (window.soundEngine) window.soundEngine.playVictory();
          this.updateUpgradesUI();
        } else {
          alert('Not enough Cosmic Shards!');
        }
      });

      container.appendChild(card);
    });
  }

  showGameOver(stats) {
    document.getElementById('go-score').textContent = stats.score.toLocaleString();
    document.getElementById('go-distance').textContent = `${Math.round(stats.distance)} m`;
    document.getElementById('go-shards').textContent = `+${stats.shards}`;
    document.getElementById('go-highscore').textContent = window.storageManager.data.highScore.toLocaleString();

    this.showScreen('gameOver');
    if (window.soundEngine) window.soundEngine.playGameOver();
  }

  showVictory(stats, sector) {
    document.getElementById('vic-sector-name').textContent = sector.name;
    document.getElementById('vic-score').textContent = stats.score.toLocaleString();
    document.getElementById('vic-reward').textContent = `+${sector.rewardShards} ✦`;

    this.showScreen('victory');
    if (window.soundEngine) window.soundEngine.playVictory();
  }
}

window.menuManager = new MenuManager();
