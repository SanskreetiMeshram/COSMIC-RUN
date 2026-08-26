/**
 * SHIFT: COSMIC RUN - Wave Spawner & Sector Progression Engine
 */

const SECTOR_DEFINITIONS = [
  {
    id: 1,
    name: 'Sector 1: The Fracture',
    desc: 'Cosmic corridor split by initial dimensional rupture. Low hazard density.',
    distanceGoal: 800,
    speedBase: 1.0,
    rewardShards: 200,
    bossType: 'saucer'
  },
  {
    id: 2,
    name: 'Sector 2: Asteroid Graveyard',
    desc: 'Derelict orbital scrapyard in Singularity space with tumbling asteroids & gravity vortexes.',
    distanceGoal: 1100,
    speedBase: 1.15,
    rewardShards: 350,
    bossType: 'heavy'
  },
  {
    id: 3,
    name: 'Sector 3: Sentinel Hive',
    desc: 'Territory of hostile red-orange sentinel saucers and heavy interceptor squadrons.',
    distanceGoal: 1400,
    speedBase: 1.3,
    rewardShards: 500,
    bossType: 'heavy'
  },
  {
    id: 4,
    name: 'Sector 4: Singularity Core',
    desc: 'Dense gravitational anomaly with reality distortion and the Omega Dreadnought boss.',
    distanceGoal: 1800,
    speedBase: 1.45,
    rewardShards: 800,
    bossType: 'boss'
  },
  {
    id: 5,
    name: 'Sector 5: Beyond Horizon',
    desc: 'Relativistic hyperspace corridor. Infinite survival run with escalating speeds.',
    distanceGoal: Infinity,
    speedBase: 1.6,
    rewardShards: 1200,
    bossType: 'boss'
  }
];

class SpawnerSystem {
  constructor() {
    this.currentSector = SECTOR_DEFINITIONS[0];
    this.mode = 'sector'; // 'sector' | 'endless'
    this.distance = 0;
    this.bossSpawned = false;
    this.bossDefeated = false;
    
    this.obstacleTimer = 0;
    this.enemyTimer = 0;
    this.pickupTimer = 0;
  }

  startSector(sectorId, mode = 'sector') {
    this.mode = mode;
    const found = SECTOR_DEFINITIONS.find(s => s.id === sectorId);
    this.currentSector = found || SECTOR_DEFINITIONS[0];
    this.distance = 0;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.obstacleTimer = 0.5;
    this.enemyTimer = 1.8;
    this.pickupTimer = 1.0;
  }

  update(dt, gameSpeedMultiplier, bounds, obstacles, enemies, pickups) {
    this.distance += (45 * gameSpeedMultiplier) * dt;

    // Check Boss Spawn at sector milestone
    if (this.mode === 'sector' && this.distance >= this.currentSector.distanceGoal && !this.bossSpawned) {
      this.spawnBoss(bounds, enemies);
      return;
    }

    // Don't spawn regular waves if boss is active
    const isBossAlive = enemies.some(e => e.type === 'boss');
    if (isBossAlive) return;

    // 1. Spawn Obstacles
    this.obstacleTimer -= dt;
    if (this.obstacleTimer <= 0) {
      this.spawnObstacleWave(bounds, obstacles);
      const interval = Math.max(0.65, (1.8 / gameSpeedMultiplier));
      this.obstacleTimer = interval * (0.8 + Math.random() * 0.4);
    }

    // 2. Spawn Hostile Enemies
    this.enemyTimer -= dt;
    if (this.enemyTimer <= 0) {
      this.spawnEnemyWave(bounds, enemies);
      const interval = Math.max(1.2, (3.2 / gameSpeedMultiplier));
      this.enemyTimer = interval * (0.8 + Math.random() * 0.4);
    }

    // 3. Spawn Pickups
    this.pickupTimer -= dt;
    if (this.pickupTimer <= 0) {
      this.spawnPickup(bounds, pickups);
      this.pickupTimer = 1.4 + Math.random() * 1.6;
    }
  }

  spawnObstacleWave(bounds, obstacles) {
    const types = ['laserGate', 'plasmaMine', 'asteroid', 'stationDebris', 'gravityVortex'];
    const side = Math.random() > 0.5 ? 'void' : 'rift';
    
    // Choose appropriate type for side
    let type;
    if (side === 'void') {
      type = Math.random() > 0.4 ? 'laserGate' : 'plasmaMine';
    } else {
      const riftTypes = ['asteroid', 'stationDebris', 'gravityVortex'];
      type = riftTypes[Math.floor(Math.random() * riftTypes.length)];
    }

    const pad = 80;
    const x = side === 'void' 
      ? pad + Math.random() * (bounds.width / 2 - pad - 20)
      : (bounds.width / 2 + 20) + Math.random() * (bounds.width / 2 - pad - 20);

    const obs = new Obstacle(x, -60, type, side);
    obstacles.push(obs);
  }

  spawnEnemyWave(bounds, enemies) {
    const types = ['saucer', 'interceptor', 'heavy'];
    let chosenType = types[0];

    const rand = Math.random();
    if (this.currentSector.id >= 3 && rand > 0.65) {
      chosenType = 'heavy';
    } else if (this.currentSector.id >= 2 && rand > 0.4) {
      chosenType = 'interceptor';
    }

    const pad = 70;
    const x = pad + Math.random() * (bounds.width - pad * 2);
    enemies.push(new SentinelEnemy(x, -50, chosenType));
  }

  spawnPickup(bounds, pickups) {
    const rand = Math.random();
    let type = 'shard';

    if (rand < 0.12) {
      type = 'overdrive';
    } else if (rand < 0.28) {
      type = 'shield';
    } else if (rand < 0.4) {
      type = 'emp';
    } else if (rand < 0.52) {
      type = 'star';
    }

    const pad = 60;
    const x = pad + Math.random() * (bounds.width - pad * 2);
    pickups.push(new Pickup(x, -30, type));
  }

  spawnBoss(bounds, enemies) {
    this.bossSpawned = true;
    if (window.soundEngine) {
      window.soundEngine.playWarning();
    }
    const boss = new SentinelEnemy(bounds.width / 2, -100, 'boss');
    enemies.push(boss);
  }

  getProgressRatio() {
    if (this.mode === 'endless' || this.currentSector.distanceGoal === Infinity) {
      return 1.0;
    }
    return Math.min(1.0, this.distance / this.currentSector.distanceGoal);
  }
}

window.SpawnerSystem = SpawnerSystem;
window.SECTOR_DEFINITIONS = SECTOR_DEFINITIONS;
