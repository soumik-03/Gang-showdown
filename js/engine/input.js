/**
 * ===================================================================
 *  INPUT CONTROLLER (FightKaro Controls: Desktop & Mobile)
 * ===================================================================
 */

class InputController {
  constructor() {
    this.keys = {};

    this.p1 = {
      left: false,
      right: false,
      up: false,
      down: false,
      punch: false,
      kick: false,
      grab: false,
      block: false,
      super: false
    };

    this.p2 = {
      left: false,
      right: false,
      up: false,
      down: false,
      punch: false,
      kick: false,
      grab: false,
      block: false,
      super: false
    };

    this.initKeyboard();
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (e.code) this.keys[e.code] = true;
      if (e.key) this.keys[e.key.toLowerCase()] = true;
      this.updateState();

      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code) this.keys[e.code] = false;
      if (e.key) this.keys[e.key.toLowerCase()] = false;
      this.updateState();
    });
  }

  isDown(code, char) {
    return !!(this.keys[code] || (char && this.keys[char.toLowerCase()]));
  }

  updateState() {
    // Player 1: WASD or Arrow keys + (J/Z Punch), (K/X Kick), (I/C Grab), (H/V Block), (Space/L Super)
    this.p1.left = this.isDown('KeyA', 'a') || this.isDown('ArrowLeft');
    this.p1.right = this.isDown('KeyD', 'd') || this.isDown('ArrowRight');
    this.p1.up = this.isDown('KeyW', 'w') || this.isDown('ArrowUp');
    this.p1.down = this.isDown('KeyS', 's') || this.isDown('ArrowDown');

    this.p1.punch = this.isDown('KeyJ', 'j') || this.isDown('KeyZ', 'z') || this.isDown('KeyF', 'f') || this.isDown('KeyU', 'u');
    this.p1.kick = this.isDown('KeyK', 'k') || this.isDown('KeyX', 'x');
    this.p1.grab = this.isDown('KeyI', 'i') || this.isDown('KeyC', 'c') || (this.p1.punch && this.p1.kick);
    this.p1.super = this.isDown('KeyL', 'l') || this.isDown('Space') || this.isDown('KeyQ', 'q') || this.isDown('KeyE', 'e');
    this.p1.block = this.isDown('KeyH', 'h') || this.isDown('KeyV', 'v') || this.isDown('KeyB', 'b');

    // Player 2 (Local 2P Keyboard)
    this.p2.left = this.isDown('Numpad4') || this.isDown('KeyJ', 'j');
    this.p2.right = this.isDown('Numpad6') || this.isDown('KeyL', 'l');
    this.p2.up = this.isDown('Numpad8') || this.isDown('KeyI', 'i');
    this.p2.down = this.isDown('Numpad5') || this.isDown('KeyK', 'k');
    this.p2.punch = this.isDown('Numpad1');
    this.p2.kick = this.isDown('Numpad2');
    this.p2.grab = this.isDown('Numpad3');
    this.p2.super = this.isDown('Numpad0');
  }

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
