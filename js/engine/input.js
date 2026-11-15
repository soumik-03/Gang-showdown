/**
 * ===================================================================
 *  INPUT CONTROLLER (Keyboard + Multi-Touch Mobile Virtual Gamepad)
 * ===================================================================
 */

class InputController {
  constructor() {
    this.keys = {};
    
    // Player 1 state
    this.p1 = {
      left: false,
      right: false,
      up: false,
      down: false,
      punch: false,
      kick: false,
      block: false,
      super: false
    };

    // Player 2 state (for local 2P)
    this.p2 = {
      left: false,
      right: false,
      up: false,
      down: false,
      punch: false,
      kick: false,
      block: false,
      super: false
    };

    this.initKeyboard();
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      this.updateState();
      
      // Prevent scrolling on space / arrow keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      this.updateState();
    });
  }

  updateState() {
    // Player 1 Keyboard mapping: WASD + J (Punch), K (Kick), Space/L (Super)
    this.p1.left = !!(this.keys['KeyA'] || this.keys['ArrowLeft']);
    this.p1.right = !!(this.keys['KeyD'] || this.keys['ArrowRight']);
    this.p1.up = !!(this.keys['KeyW'] || this.keys['ArrowUp']);
    this.p1.down = !!(this.keys['KeyS'] || this.keys['ArrowDown']);
    this.p1.punch = !!this.keys['KeyJ'];
    this.p1.kick = !!this.keys['KeyK'];
    this.p1.super = !!(this.keys['KeyL'] || this.keys['Space']);
    this.p1.block = !!this.keys['KeyH'];

    // Player 2 Keyboard mapping (for 2P versus mode on same PC)
    this.p2.left = !!this.keys['Numpad4'];
    this.p2.right = !!this.keys['Numpad6'];
    this.p2.up = !!this.keys['Numpad8'];
    this.p2.down = !!this.keys['Numpad5'];
    this.p2.punch = !!this.keys['Numpad1'];
    this.p2.kick = !!this.keys['Numpad2'];
    this.p2.super = !!this.keys['Numpad0'];
  }

  // Mobile Touch Bindings
  bindTouchButton(elementId, actionName, player = 'p1') {
    const el = document.getElementById(elementId);
    if (!el) return;

    const handleStart = (e) => {
      e.preventDefault();
      this[player][actionName] = true;
      el.classList.add('active');
    };

    const handleEnd = (e) => {
      e.preventDefault();
      this[player][actionName] = false;
      el.classList.remove('active');
    };

    el.addEventListener('touchstart', handleStart, { passive: false });
    el.addEventListener('touchend', handleEnd, { passive: false });
    el.addEventListener('touchcancel', handleEnd, { passive: false });
    el.addEventListener('mousedown', handleStart);
    el.addEventListener('mouseup', handleEnd);
    el.addEventListener('mouseleave', handleEnd);
  }

  reset() {
    for (let k in this.keys) this.keys[k] = false;
    for (let k in this.p1) this.p1[k] = false;
    for (let k in this.p2) this.p2[k] = false;
  }
}

window.inputController = new InputController();
