/**
 * SHIFT: COSMIC RUN - Save & Storage Manager
 * Persists high scores, unlocked starfighters, upgrade tiers, and settings in localStorage.
 */

const STORAGE_KEY = 'SHIFT_COSMIC_RUN_DATA_V1';

const DEFAULT_SAVE_DATA = {
  highScore: 0,
  shards: 150, // Starting bonus shards
  unlockedShips: ['ghostblade'],
  selectedShip: 'ghostblade',
  upgrades: {
    blasterTier: 1,
    shieldTier: 1,
    boostTier: 1,
    empTier: 1,
    magnetTier: 1
  },
  completedSectors: [1],
  settings: {
    musicVolume: 0.6,
    sfxVolume: 0.8,
    screenShake: true,
    bloom: true
  }
};

class StorageManager {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SAVE_DATA, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Unable to load save data from localStorage:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Unable to save data to localStorage:', e);
    }
  }

  updateHighScore(score) {
    if (score > this.data.highScore) {
      this.data.highScore = score;
      this.save();
      return true;
    }
    return false;
  }

  addShards(amount) {
    this.data.shards += amount;
    this.save();
  }

  spendShards(amount) {
    if (this.data.shards >= amount) {
      this.data.shards -= amount;
      this.save();
      return true;
    }
    return false;
  }

  unlockShip(shipId) {
    if (!this.data.unlockedShips.includes(shipId)) {
      this.data.unlockedShips.push(shipId);
      this.save();
      return true;
    }
    return false;
  }

  selectShip(shipId) {
    if (this.data.unlockedShips.includes(shipId)) {
      this.data.selectedShip = shipId;
      this.save();
      return true;
    }
    return false;
  }

  upgradeTech(upgradeKey) {
    const cost = this.getUpgradeCost(upgradeKey);
    if (this.spendShards(cost)) {
      this.data.upgrades[upgradeKey] = (this.data.upgrades[upgradeKey] || 1) + 1;
      this.save();
      return true;
    }
    return false;
  }

  getUpgradeCost(upgradeKey) {
    const level = this.data.upgrades[upgradeKey] || 1;
    return level * 150;
  }

  completeSector(sectorId) {
    if (!this.data.completedSectors.includes(sectorId)) {
      this.data.completedSectors.push(sectorId);
    }
    // Unlock next sector
    const nextSector = sectorId + 1;
    if (nextSector <= 5 && !this.data.completedSectors.includes(nextSector)) {
      this.data.completedSectors.push(nextSector);
    }
    this.save();
  }
}

window.storageManager = new StorageManager();
