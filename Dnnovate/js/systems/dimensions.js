/**
 * SHIFT: COSMIC RUN - Reality Dimension & Fracture Boundary Engine
 */

class DimensionEngine {
  constructor() {
    this.currentDimension = 'void'; // 'void' | 'rift'
    this.fractureTearX = 0;
    this.targetFractureX = 0;
    this.fractureSegments = [];
    this.arcTimer = 0;
  }

  init(width, height) {
    this.fractureTearX = width / 2;
    this.targetFractureX = width / 2;
    this.generateFractureLine(height);
  }

  generateFractureLine(height) {
    this.fractureSegments = [];
    const step = 20;
    const numPoints = Math.ceil(height / step) + 2;

    for (let i = 0; i <= numPoints; i++) {
      this.fractureSegments.push({
        y: i * step,
        offset: (Math.random() - 0.5) * 16,
        targetOffset: (Math.random() - 0.5) * 16
      });
    }
  }

  update(dt, width, height) {
    // Dynamic wobble of the reality fracture line
    this.arcTimer += dt;

    for (let i = 0; i < this.fractureSegments.length; i++) {
      const seg = this.fractureSegments[i];
      seg.offset += (seg.targetOffset - seg.offset) * 0.1;

      if (Math.random() < 0.08) {
        seg.targetOffset = (Math.random() - 0.5) * 25;
      }
    }

    // Occasional lightning arc across the dimensional boundary
    if (this.arcTimer > 0.4 && window.particleSystem) {
      this.arcTimer = 0;
      const idx1 = Math.floor(Math.random() * (this.fractureSegments.length - 2));
      const seg1 = this.fractureSegments[idx1];
      const seg2 = this.fractureSegments[idx1 + 2];

      const x1 = (width / 2) + seg1.offset;
      const y1 = seg1.y;
      const x2 = (width / 2) + seg2.offset;
      const y2 = seg2.y;

      window.particleSystem.emitFractureArc(x1, y1, x2, y2);
    }
  }

  drawBoundary(ctx, width, height) {
    ctx.save();

    // 1. Draw Dual-Color Boundary Glow
    const centerX = width / 2;

    // Void side gradient (Left)
    const voidGlow = ctx.createLinearGradient(centerX - 80, 0, centerX, 0);
    voidGlow.addColorStop(0, 'rgba(0, 243, 255, 0)');
    voidGlow.addColorStop(1, 'rgba(0, 243, 255, 0.18)');
    ctx.fillStyle = voidGlow;
    ctx.fillRect(0, 0, centerX, height);

    // Rift side gradient (Right)
    const riftGlow = ctx.createLinearGradient(centerX, 0, centerX + 80, 0);
    riftGlow.addColorStop(0, 'rgba(255, 0, 127, 0.18)');
    riftGlow.addColorStop(1, 'rgba(255, 0, 127, 0)');
    ctx.fillStyle = riftGlow;
    ctx.fillRect(centerX, 0, width - centerX, height);

    // 2. Draw Crackling Lightning Reality Fracture Line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 15;

    ctx.beginPath();
    for (let i = 0; i < this.fractureSegments.length; i++) {
      const seg = this.fractureSegments[i];
      const px = centerX + seg.offset;
      if (i === 0) {
        ctx.moveTo(px, seg.y);
      } else {
        ctx.lineTo(px, seg.y);
      }
    }
    ctx.stroke();

    // Outer Magenta Bloom
    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 1.2;
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 20;
    ctx.stroke();

    ctx.restore();
  }
}

window.dimensionEngine = new DimensionEngine();
