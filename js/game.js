/**
 * ===================================================================
 *  MAIN GAME STATE MANAGER & LOOP
 * ===================================================================
 */

class GameApp {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.renderer = new GameRenderer(this.canvas);
    this.state = 'TITLE'; // TITLE, SELECT, VERSUS, FIGHT, KO, VICTORY

    // Selection Data
    this.activeSelectSlot = 'p1'; // 'p1' or 'p2'
    this.p1Char = window.CHARACTERS[0];
    this.p2Char = window.CHARACTERS[1];
    this.gameMode = 'cpu'; // 'cpu' or 'local2p'
    this.aiDifficulty = 'medium'; // 'easy', 'medium', 'hard'
    this.selectedStage = 'canteen';

    // Active Match Data
    this.p1 = null;
    this.p2 = null;
    this.ai = null;
    this.matchTime = 60;
    this.winner = null;
    this.loser = null;
    this.stateTimer = 0;

    // Super Move Cinematic State
    this.superCinematic = {
      active: false,
      fighter: null,
      timer: 0
    };

    this.initUI();
    this.initLoop();
  }

  initUI() {
    // Populate Character Select Grid
    const grid = document.getElementById('charGrid');
    if (grid) {
      grid.innerHTML = '';
      window.CHARACTERS.forEach((char, idx) => {
        const card = document.createElement('div');
        card.className = `char-card ${idx === 0 ? 'selected-p1' : (idx === 1 ? 'selected-p2' : '')}`;
        card.dataset.id = char.id;
        card.innerHTML = `
          <div class="char-avatar-preview" style="background-color: ${char.themeColor}">
            <img src="${char.avatar}" alt="${char.name}" onerror="this.style.display='none'">
          </div>
          <div class="char-name">${char.name}</div>
          <div class="char-nick">"${char.nickname}"</div>
        `;

        card.addEventListener('click', () => {
          this.selectCharacter(char);
        });
        grid.appendChild(card);
      });
      this.updateCharacterPreview();
    }

    // Bind Mobile Virtual Touch Controls
    if (window.inputController) {
      window.inputController.bindTouchButton('btnLeft', 'left');
      window.inputController.bindTouchButton('btnRight', 'right');
      window.inputController.bindTouchButton('btnJump', 'up');
      window.inputController.bindTouchButton('btnCrouch', 'down');
      window.inputController.bindTouchButton('btnPunch', 'punch');
      window.inputController.bindTouchButton('btnKick', 'kick');
      window.inputController.bindTouchButton('btnBlock', 'block');
      window.inputController.bindTouchButton('btnSuper', 'super');
    }

    // Audio Mute Toggle Button
    const muteBtn = document.getElementById('btnMute');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const isMuted = window.soundEngine.toggleMute();
        muteBtn.textContent = isMuted ? '🔇 SOUND OFF' : '🔊 SOUND ON';
      });
    }
  }

  selectCharacter(char) {
    if (this.activeSelectSlot === 'p1') {
      this.p1Char = char;
      // Auto switch slot to p2 for convenience if different
      if (this.p2Char.id === char.id) {
        this.p2Char = window.CHARACTERS.find(c => c.id !== char.id) || char;
      }
      this.activeSelectSlot = 'p2';
    } else {
      this.p2Char = char;
      this.activeSelectSlot = 'p1';
    }
    this.updateCharacterPreview();
  }

  updateCharacterPreview() {
    const cards = document.querySelectorAll('.char-card');
    cards.forEach(card => {
      card.classList.remove('selected-p1', 'selected-p2');
      if (card.dataset.id === this.p1Char.id) card.classList.add('selected-p1');
      if (card.dataset.id === this.p2Char.id) card.classList.add('selected-p2');
    });

    const infoP1 = document.getElementById('infoP1');
    if (infoP1) {
      infoP1.innerHTML = `
        <div class="slot-side p1-side ${this.activeSelectSlot === 'p1' ? 'slot-active' : ''}" onclick="window.gameInstance.activeSelectSlot = 'p1'; window.gameInstance.updateCharacterPreview();">
          <div class="slot-badge">🔴 P1 (YOU)</div>
          <h3>${this.p1Char.name} <span>"${this.p1Char.nickname}"</span></h3>
          <div class="super-info">
            <strong>⚡ Super:</strong> ${this.p1Char.superMove.name}
          </div>
        </div>

        <div class="slot-vs">VS</div>

        <div class="slot-side p2-side ${this.activeSelectSlot === 'p2' ? 'slot-active' : ''}" onclick="window.gameInstance.activeSelectSlot = 'p2'; window.gameInstance.updateCharacterPreview();">
          <div class="slot-badge">🔵 P2 / CPU</div>
          <h3>${this.p2Char.name} <span>"${this.p2Char.nickname}"</span></h3>
          <div class="super-info" style="border-left-color: #3742fa; background: rgba(55, 66, 250, 0.15);">
            <strong>⚡ Super:</strong> ${this.p2Char.superMove.name}
          </div>
        </div>
      `;
    }
  }

  startFight() {
    // Hide UI overlays
    document.getElementById('screenTitle').classList.add('hidden');
    document.getElementById('screenSelect').classList.add('hidden');
    document.getElementById('screenVictory').classList.add('hidden');
    document.getElementById('mobileControls').classList.remove('hidden');

    this.renderer.currentStage = this.selectedStage;

    // Create Fighters
    this.p1 = new Fighter(this.p1Char, 250, this.renderer.groundY, true);
    this.p2 = new Fighter(this.p2Char, 850, this.renderer.groundY, false);

    // AI Opponent for P2 if in CPU mode
    if (this.gameMode === 'cpu') {
      this.ai = new FighterAI(this.p2, this.p1, this.aiDifficulty);
    } else {
      this.ai = null;
    }

    this.matchTime = 60;
    this.winner = null;
    this.loser = null;
    this.state = 'FIGHT';

    if (window.soundEngine) {
      window.soundEngine.playKOBell();
      window.soundEngine.startBGM();
    }
    if (window.particleSystem) {
      window.particleSystem.clear();
      window.particleSystem.spawnFloatingText(600, 250, 'ROUND 1... FIGHT!', '#ff4757', 48);
    }
  }

  triggerSuperCinematic(fighter) {
    this.superCinematic.active = true;
    this.superCinematic.fighter = fighter;
    this.superCinematic.timer = 50; // frames to freeze and show banner
  }

  onFighterKilled(loser) {
    this.state = 'KO';
    this.loser = loser;
    this.winner = loser === this.p1 ? this.p2 : this.p1;
    this.stateTimer = 120; // 2 seconds slow-mo KO

    if (window.particleSystem) {
      window.particleSystem.spawnFloatingText(600, 260, 'K. O . !', '#ff3838', 72);
      window.particleSystem.triggerScreenShake(30);
    }
  }

  showVictoryScreen() {
    this.state = 'VICTORY';
    if (window.soundEngine) window.soundEngine.stopBGM();

    const vicScreen = document.getElementById('screenVictory');
    const vicTitle = document.getElementById('vicWinnerTitle');
    const vicQuote = document.getElementById('vicQuote');
    const vicRoast = document.getElementById('vicRoast');

    vicTitle.textContent = `🏆 ${this.winner.name} WINS! 🏆`;
    vicQuote.textContent = `"${this.winner.config.quotes.win}"`;
    vicRoast.textContent = `Roast: "${this.winner.config.quotes.roast}"`;

    vicScreen.classList.remove('hidden');
    document.getElementById('mobileControls').classList.add('hidden');
  }

  // --- GAME UPDATE & LOOP ---

  update() {
    if (this.state === 'FIGHT') {
      // Super Cinematic Freeze
      if (this.superCinematic.active) {
        this.superCinematic.timer--;
        if (this.superCinematic.timer <= 0) {
          this.superCinematic.active = false;
        }
        return; // Pause regular updates during cinematic
      }

      // Decrement Timer
      this.matchTime -= 1 / 60;
      if (this.matchTime <= 0) {
        // Time over - check highest health
        this.matchTime = 0;
        if (this.p1.health > this.p2.health) this.onFighterKilled(this.p2);
        else this.onFighterKilled(this.p1);
        return;
      }

      // Input Handling Player 1
      const p1In = window.inputController.p1;
      if (p1In.left) this.p1.moveLeft();
      else if (p1In.right) this.p1.moveRight();
      else this.p1.stopMoving();

      if (p1In.up) this.p1.jump();
      this.p1.crouch(p1In.down);

      if (p1In.punch) { this.p1.punch(); p1In.punch = false; }
      if (p1In.kick) { this.p1.kick(); p1In.kick = false; }
      if (p1In.super) { this.p1.triggerSuper(); p1In.super = false; }
      this.p1.isBlocking = p1In.block || (this.p1.facing === 1 && p1In.left) || (this.p1.facing === -1 && p1In.right);

      // Input Handling Player 2 (Local 2P or CPU)
      if (this.gameMode === 'local2p') {
        const p2In = window.inputController.p2;
        if (p2In.left) this.p2.moveLeft();
        else if (p2In.right) this.p2.moveRight();
        else this.p2.stopMoving();

        if (p2In.up) this.p2.jump();
        this.p2.crouch(p2In.down);

        if (p2In.punch) { this.p2.punch(); p2In.punch = false; }
        if (p2In.kick) { this.p2.kick(); p2In.kick = false; }
        if (p2In.super) { this.p2.triggerSuper(); p2In.super = false; }
        this.p2.isBlocking = p2In.block;
      } else if (this.ai) {
        this.ai.update();
        if (this.p2.isMovingLeft) this.p2.moveLeft();
        else if (this.p2.isMovingRight) this.p2.moveRight();
        else this.p2.stopMoving();
      }

      // Update Fighters
      this.p1.update(this.p2, this.renderer.stageWidth);
      this.p2.update(this.p1, this.renderer.stageWidth);

      // Update Particles & Projectiles
      if (window.particleSystem) {
        window.particleSystem.update([this.p1, this.p2]);
      }
    } else if (this.state === 'KO') {
      this.stateTimer--;
      if (this.stateTimer <= 0) {
        this.showVictoryScreen();
      }
    }
  }

  render() {
    this.renderer.draw(
      this.state,
      this.p1,
      this.p2,
      this.matchTime,
      this.superCinematic
    );
  }

  initLoop() {
    const loop = () => {
      this.update();
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new GameApp();
});
