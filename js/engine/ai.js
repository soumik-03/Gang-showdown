/**
 * ===================================================================
 *  CPU OPPONENT AI (3D BRAWLER FIGHTKARO COMBAT LOGIC)
 * ===================================================================
 */

class FighterAI {
  constructor(fighter, opponent, difficulty = 'medium') {
    this.fighter = fighter;
    this.opponent = opponent;
    this.difficulty = difficulty;
    this.timer = 0;
    this.decisionInterval = difficulty === 'hard' ? 8 : (difficulty === 'medium' ? 14 : 22);
  }

  update(delta) {
    if (this.fighter.isDead || this.opponent.isDead) return;

    this.timer++;
    const dist = Math.abs(this.fighter.pos.x - this.opponent.pos.x);
    const isFacingLeft = this.fighter.facing === -1;

    if (this.timer >= this.decisionInterval) {
      this.timer = 0;
      this.makeDecision(dist, isFacingLeft);
    }
  }

  makeDecision(dist, isFacingLeft) {
    const f = this.fighter;
    const opp = this.opponent;

    // Reset movement
    f.stopMoving();
    f.crouch(false);

    // 1. Unleash Super when ready
    if (f.superMeter >= 100 && Math.random() < (this.difficulty === 'hard' ? 0.85 : 0.5)) {
      f.triggerSuper();
      return;
    }

    // 2. Defensive Block
    const isOppAttacking = opp.state.startsWith('punch') || opp.state.startsWith('kick') || opp.state === 'grab';
    const blockChance = this.difficulty === 'hard' ? 0.75 : (this.difficulty === 'medium' ? 0.45 : 0.2);

    if (isOppAttacking && dist < 2.4 && Math.random() < blockChance) {
      f.isBlocking = true;
      if (Math.random() < 0.3) f.crouch(true);
      return;
    } else {
      f.isBlocking = false;
    }

    // 3. Close Range Combat (dist < 2.2)
    if (dist < 2.2) {
      const roll = Math.random();
      if (roll < 0.35) {
        // Quick Jab or combo
        f.punch();
      } else if (roll < 0.65) {
        // Kick
        f.kick();
      } else if (roll < 0.8) {
        // Grab!
        f.grab();
      } else if (roll < 0.92) {
        // Duck & Uppercut
        f.crouch(true);
        setTimeout(() => { if (!f.isDead) f.punch(); }, 120);
      } else {
        // Jump attack
        f.jump();
        setTimeout(() => { if (!f.isDead) f.kick(); }, 180);
      }
      return;
    }

    // 4. Approach Opponent
    const approachSpeed = this.difficulty === 'hard' ? 0.85 : 0.65;
    if (Math.random() < approachSpeed) {
      if (isFacingLeft) {
        f.moveLeft();
      } else {
        f.moveRight();
      }

      if (Math.random() < 0.12) {
        f.jump();
      }
    }
  }
}

window.FighterAI = FighterAI;
