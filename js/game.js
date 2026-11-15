/**
 * ===================================================================
 *  MAIN 3D GAME APP & ORCHESTRATOR
 * ===================================================================
 */

class GameApp3D {
  constructor() {
    this.container = document.getElementById('gameContainer');
    this.clock = new THREE.Clock();

    // 1. Initialize 3D Scene
    this.scene3D = new GameScene3D(this.container);

    this.state = 'TITLE'; // TITLE, SELECT, FIGHT, KO, VICTORY

    // Selection Data
    this.activeSelectSlot = 'p1';
    this.p1Char = window.CHARACTERS[0];
    this.p2Char = window.CHARACTERS[1];
    this.gameMode = 'cpu';
    this.aiDifficulty = 'medium';

    // Active Fighters (Created immediately so they are visible right on the stage!)
    this.p1 = new Fighter3D(this.scene3D, this.p1Char, -2.8, true);
    this.p2 = new Fighter3D(this.scene3D, this.p2Char, 2.8, false);
    this.ai = null;

    this.matchTime = 60;
    this.winner = null;
    this.loser = null;
    this.stateTimer = 0;

    // Smooth Health Lag Bars (Calculated as % of maxHealth)
    this.p1LagHealth = 100;
    this.p2LagHealth = 100;

    // Super Cinematic State
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
      window.CHARACTERS.forEach((char) => {
        const card = document.createElement('div');
        card.className = 'char-card';
        card.dataset.id = char.id;
        card.innerHTML = `
          <div class="char-avatar-preview" style="background-color: ${char.themeColor}">
            <img src="${char.avatar}" alt="${char.name}" onerror="this.style.display='none'">
          </div>
          <div class="char-name">${char.name}</div>
          <div class="char-nick">"${char.nickname}"</div>
        `;
        card.addEventListener('click', () => this.selectCharacter(char));
        grid.appendChild(card);
      });
      this.updateCharacterPreview();
    }

    // Touch controls binding
    if (window.inputController) {
      window.inputController.bindTouchButton('btnLeft', 'left');
      window.inputController.bindTouchButton('btnRight', 'right');
      window.inputController.bindTouchButton('btnJump', 'up');
      window.inputController.bindTouchButton('btnCrouch', 'down');
      window.inputController.bindTouchButton('btnPunch', 'punch');
      window.inputController.bindTouchButton('btnKick', 'kick');
      window.inputController.bindTouchButton('btnGrab', 'grab');
      window.inputController.bindTouchButton('btnBlock', 'block');
      window.inputController.bindTouchButton('btnSuper', 'super');
    }

    // Audio Mute Toggle
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
      if (this.p2Char.id === char.id) {
        this.p2Char = window.CHARACTERS.find(c => c.id !== char.id) || char;
      }
      this.activeSelectSlot = 'p2';

      // Update P1 3D model immediately on stage!
      if (this.p1) this.p1.destroy();
      this.p1 = new Fighter3D(this.scene3D, this.p1Char, -2.8, true);
    } else {
      this.p2Char = char;
      this.activeSelectSlot = 'p1';

      // Update P2 3D model immediately on stage!
      if (this.p2) this.p2.destroy();
      this.p2 = new Fighter3D(this.scene3D, this.p2Char, 2.8, false);
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
    document.getElementById('screenTitle').classList.add('hidden');
    document.getElementById('screenSelect').classList.add('hidden');
    document.getElementById('screenVictory').classList.add('hidden');
    document.getElementById('mobileControls').classList.remove('hidden');
    document.getElementById('gameHUD').classList.remove('hidden');

    // Reset fighters to battle positions with full HP
    if (this.p1) this.p1.destroy();
    if (this.p2) this.p2.destroy();

    this.p1 = new Fighter3D(this.scene3D, this.p1Char, -3.5, true);
    this.p2 = new Fighter3D(this.scene3D, this.p2Char, 3.5, false);

    if (this.gameMode === 'cpu') {
      this.ai = new FighterAI(this.p2, this.p1, this.aiDifficulty);
    } else {
      this.ai = null;
    }

    this.matchTime = 60;
    this.winner = null;
    this.loser = null;
    this.state = 'FIGHT';

    // HUD Names
    document.getElementById('hudP1Name').textContent = `${this.p1.name} "${this.p1.config.nickname}"`;
    document.getElementById('hudP2Name').textContent = `"${this.p2.config.nickname}" ${this.p2.name}`;

    if (window.soundEngine) {
      window.soundEngine.playKOBell();
      window.soundEngine.startBGM();
    }
  }

  triggerSuperCinematic(fighter) {
    this.superCinematic.active = true;
    this.superCinematic.fighter = fighter;
    this.superCinematic.timer = 1.0;

    const banner = document.getElementById('superBanner');
    const moveTitle = document.getElementById('superMoveTitle');
    const moveShout = document.getElementById('superMoveShout');

    moveTitle.textContent = `⚡ ${fighter.config.superMove.name} ⚡`;
    moveShout.textContent = `"${fighter.config.superMove.shout}"`;
    banner.classList.remove('hidden');

    setTimeout(() => {
      banner.classList.add('hidden');
      this.superCinematic.active = false;
    }, 1000);
  }

  onFighterKilled(loser) {
    this.state = 'KO';
    this.loser = loser;
    this.winner = loser === this.p1 ? this.p2 : this.p1;
    this.stateTimer = 2.2;
  }

  showVictoryScreen() {
    this.state = 'VICTORY';
    if (window.soundEngine) window.soundEngine.stopBGM();

    document.getElementById('screenVictory').classList.remove('hidden');
    document.getElementById('mobileControls').classList.add('hidden');
    document.getElementById('gameHUD').classList.add('hidden');

    document.getElementById('vicWinnerTitle').textContent = `🏆 ${this.winner.name} WINS! 🏆`;
    document.getElementById('vicQuote').textContent = `"${this.winner.config.quotes.win}"`;
    document.getElementById('vicRoast').textContent = `Roast: "${this.winner.config.quotes.roast}"`;
  }

  // --- MAIN LOOP ---
  update() {
    const delta = Math.min(this.clock.getDelta(), 0.05);

    if (this.state === 'FIGHT') {
      if (!this.superCinematic.active) {
        this.matchTime -= delta;
        if (this.matchTime <= 0) {
          this.matchTime = 0;
          if (this.p1.health > this.p2.health) this.onFighterKilled(this.p2);
          else this.onFighterKilled(this.p1);
          return;
        }

        // P1 Controls
        const p1In = window.inputController.p1;
        if (p1In.left) this.p1.moveLeft();
        else if (p1In.right) this.p1.moveRight();
        else this.p1.stopMoving();

        if (p1In.up) this.p1.jump();
        this.p1.crouch(p1In.down);

        if (p1In.punch) { this.p1.punch(); p1In.punch = false; }
        if (p1In.kick) { this.p1.kick(); p1In.kick = false; }
        if (p1In.grab) { this.p1.grab(); p1In.grab = false; }
        if (p1In.super) { this.p1.triggerSuper(); p1In.super = false; }
        this.p1.isBlocking = p1In.block || (this.p1.facing === 1 && p1In.left) || (this.p1.facing === -1 && p1In.right);

        // P2 Controls / AI
        if (this.gameMode === 'local2p') {
          const p2In = window.inputController.p2;
          if (p2In.left) this.p2.moveLeft();
          else if (p2In.right) this.p2.moveRight();
          else this.p2.stopMoving();

          if (p2In.up) this.p2.jump();
          this.p2.crouch(p2In.down);

          if (p2In.punch) { this.p2.punch(); p2In.punch = false; }
          if (p2In.kick) { this.p2.kick(); p2In.kick = false; }
          if (p2In.grab) { this.p2.grab(); p2In.grab = false; }
          if (p2In.super) { this.p2.triggerSuper(); p2In.super = false; }
          this.p2.isBlocking = p2In.block;
        } else if (this.ai) {
          this.ai.update(delta);
        }

        this.p1.update(this.p2, delta);
        this.p2.update(this.p1, delta);

        this.scene3D.updateProjectiles([this.p1, this.p2]);
      }

      this.scene3D.updateCamera(this.p1.pos, this.p2.pos, this.superCinematic.active);
      this.updateHUD();
    } else if (this.state === 'KO') {
      this.stateTimer -= delta;
      if (this.p1 && this.p2) {
        this.p1.update(this.p2, delta * 0.4);
        this.p2.update(this.p1, delta * 0.4);
        this.scene3D.updateCamera(this.p1.pos, this.p2.pos, true);
      }
      if (this.stateTimer <= 0) {
        this.showVictoryScreen();
      }
    } else {
      // In TITLE or SELECT screens: keep fighters breathing & animated on stage!
      if (this.p1 && this.p2) {
        this.p1.update(this.p2, delta);
        this.p2.update(this.p1, delta);
        this.scene3D.updateCamera(this.p1.pos, this.p2.pos, false);
      }
    }

    this.scene3D.render();
  }

  updateHUD() {
    if (!this.p1 || !this.p2) return;

    // Calculate Health Percentages
    const p1Pct = Math.max(0, (this.p1.health / this.p1.maxHealth) * 100);
    const p2Pct = Math.max(0, (this.p2.health / this.p2.maxHealth) * 100);

    this.p1LagHealth += (p1Pct - this.p1LagHealth) * 0.08;
    this.p2LagHealth += (p2Pct - this.p2LagHealth) * 0.08;

    document.getElementById('hudP1Health').style.width = `${p1Pct}%`;
    document.getElementById('hudP1Lag').style.width = `${this.p1LagHealth}%`;

    document.getElementById('hudP2Health').style.width = `${p2Pct}%`;
    document.getElementById('hudP2Lag').style.width = `${this.p2LagHealth}%`;

    document.getElementById('hudP1Super').style.width = `${this.p1.superMeter}%`;
    document.getElementById('hudP2Super').style.width = `${this.p2.superMeter}%`;

    document.getElementById('hudTimer').textContent = Math.ceil(this.matchTime);

    // Super / Rage Status Indicator
    const p1SuperBadge = document.getElementById('hudP1SuperText');
    if (this.p1.rageTriggered && this.p1.superMeter >= 100) {
      p1SuperBadge.textContent = '🔥 CRITICAL RAGE! PRESS SPACE / L!';
      p1SuperBadge.classList.add('glow');
    } else if (this.p1.superMeter >= 100) {
      p1SuperBadge.textContent = '🔥 SUPER READY! (Space / L)';
      p1SuperBadge.classList.add('glow');
    } else {
      p1SuperBadge.textContent = `SUPER: ${Math.round(this.p1.superMeter)}%`;
      p1SuperBadge.classList.remove('glow');
    }
  }

  initLoop() {
    const animate = () => {
      this.update();
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new GameApp3D();
});
