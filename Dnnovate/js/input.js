/**
 * SHIFT: COSMIC RUN - Multi-Device Input Controller
 * Handles Keyboard, Mouse, Touch Virtual Controls, and Gamepad API.
 */
class InputHandler {
  constructor() {
    this.keys = {};
    this.justPressed = {};
    
    // Normalized directional axes [-1, 1]
    this.axisX = 0;
    this.axisY = 0;
    
    // Action flags
    this.isFiring = false;
    this.isBoosting = false;
    this.isBraking = false;
    this.shiftTriggered = false;
    this.empTriggered = false;
    this.pauseTriggered = false;

    // Mouse
    this.mouseX = 0;
    this.mouseY = 0;
    this.isMouseSteering = false;
    this.mouseActive = false;

    // Touch
    this.touchActive = false;
    this.touchStickOrigin = { x: 0, y: 0 };
    this.touchStickCurrent = { x: 0, y: 0 };
    this.touchStickId = null;

    // Gamepad
    this.gamepadIndex = null;

    this.setupKeyboard();
    this.setupMouse();
    this.setupTouch();
    this.setupGamepad();
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      if (!this.keys[e.code]) {
        this.justPressed[e.code] = true;
      }
      this.keys[e.code] = true;

      // Special triggers
      if (e.code === 'Space' || e.code === 'KeyQ' || e.code === 'KeyE') {
        this.shiftTriggered = true;
      }
      if (e.code === 'KeyK' || e.code === 'KeyC') {
        this.empTriggered = true;
      }
      if (e.code === 'Escape' || e.code === 'KeyP') {
        this.pauseTriggered = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      this.justPressed[e.code] = false;
    });
  }

  setupMouse() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;

    window.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
      this.mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;
      this.mouseActive = true;
    });

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isFiring = true;
      } else if (e.button === 2) {
        e.preventDefault();
        this.empTriggered = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isFiring = false;
      }
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  setupTouch() {
    const touchArea = document.getElementById('touch-stick-area');
    const knob = document.getElementById('touch-stick-knob');
    const touchControls = document.getElementById('touch-controls');
    
    // Auto-enable touch controls if touch supported
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      if (touchControls) touchControls.style.display = 'block';
    }

    if (touchArea && knob) {
      const maxDist = 45;

      touchArea.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        this.touchStickId = touch.identifier;
        const rect = touchArea.getBoundingClientRect();
        this.touchStickOrigin = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
        this.updateTouchStick(touch.clientX, touch.clientY, maxDist, knob);
      }, { passive: false });

      window.addEventListener('touchmove', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === this.touchStickId) {
            e.preventDefault();
            this.updateTouchStick(touch.clientX, touch.clientY, maxDist, knob);
            break;
          }
        }
      }, { passive: false });

      const resetTouch = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === this.touchStickId) {
            this.touchStickId = null;
            this.axisX = 0;
            this.axisY = 0;
            knob.style.transform = `translate(-50%, -50%)`;
            break;
          }
        }
      };

      window.addEventListener('touchend', resetTouch);
      window.addEventListener('touchcancel', resetTouch);
    }

    // Touch Action Buttons
    const btnShift = document.getElementById('btn-touch-shift');
    const btnFire = document.getElementById('btn-touch-fire');
    const btnEmp = document.getElementById('btn-touch-emp');

    if (btnShift) {
      btnShift.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.shiftTriggered = true;
      });
    }

    if (btnFire) {
      btnFire.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.isFiring = true;
      });
      btnFire.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.isFiring = false;
      });
    }

    if (btnEmp) {
      btnEmp.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.empTriggered = true;
      });
    }
  }

  updateTouchStick(clientX, clientY, maxDist, knob) {
    const dx = clientX - this.touchStickOrigin.x;
    const dy = clientY - this.touchStickOrigin.y;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(dist, maxDist);

    const nx = Math.cos(angle) * clampedDist;
    const ny = Math.sin(angle) * clampedDist;

    knob.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;

    this.axisX = nx / maxDist;
    this.axisY = ny / maxDist;
  }

  setupGamepad() {
    window.addEventListener('gamepadconnected', (e) => {
      this.gamepadIndex = e.gamepad.index;
      console.log('Gamepad connected:', e.gamepad.id);
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      if (this.gamepadIndex === e.gamepad.index) {
        this.gamepadIndex = null;
      }
    });
  }

  pollGamepad() {
    if (this.gamepadIndex === null) return;
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[this.gamepadIndex];
    if (!gp) return;

    // Analog stick with deadzone
    const deadzone = 0.15;
    let gx = gp.axes[0] || 0;
    let gy = gp.axes[1] || 0;

    if (Math.abs(gx) < deadzone) gx = 0;
    if (Math.abs(gy) < deadzone) gy = 0;

    if (Math.hypot(gx, gy) > 0) {
      this.axisX = gx;
      this.axisY = gy;
    }

    // Buttons (0: A/Cross, 1: B/Circle, 2: X/Square, 3: Y/Triangle, 7: R2)
    if (gp.buttons[0]?.pressed || gp.buttons[2]?.pressed) {
      this.shiftTriggered = true;
    }
    if (gp.buttons[7]?.pressed || gp.buttons[5]?.pressed) {
      this.isFiring = true;
    }
    if (gp.buttons[1]?.pressed || gp.buttons[4]?.pressed) {
      this.empTriggered = true;
    }
    if (gp.buttons[9]?.pressed) { // Start / Options
      this.pauseTriggered = true;
    }
  }

  update() {
    this.pollGamepad();

    // Keyboard axis aggregation if not using touch stick
    if (this.touchStickId === null && this.gamepadIndex === null) {
      let x = 0;
      let y = 0;

      if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;
      if (this.keys['KeyW'] || this.keys['ArrowUp']) y -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) y += 1;

      // Normalize diagonal keyboard movement
      if (x !== 0 && y !== 0) {
        x *= 0.7071;
        y *= 0.7071;
      }

      this.axisX = x;
      this.axisY = y;
    }

    this.isBoosting = this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.keys['KeyW'] || this.keys['ArrowUp'];
    this.isBraking = this.keys['KeyS'] || this.keys['ArrowDown'];
    
    if (this.keys['KeyJ'] || this.keys['KeyZ']) {
      this.isFiring = true;
    }
  }

  // Clear single-frame action triggers
  consumeTriggers() {
    const shift = this.shiftTriggered;
    const emp = this.empTriggered;
    const pause = this.pauseTriggered;

    this.shiftTriggered = false;
    this.empTriggered = false;
    this.pauseTriggered = false;
    this.justPressed = {};

    return { shift, emp, pause };
  }
}

window.inputHandler = new InputHandler();
