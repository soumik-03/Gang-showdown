/**
 * ===================================================================
 *  CPU OPPONENT ARTIFICIAL INTELLIGENCE
 * ===================================================================
 *  Simulates fighting game AI with difficulty levels (Easy, Medium, Hard)
 */

class FighterAI {
  constructor(fighter, opponent, difficulty = 'medium') {
    this.fighter = fighter;
    this.opponent = opponent;
    this.difficulty = difficulty;
    this.timer = 0;
    this.decisionInterval = difficulty === 'hard' ? 10 : (difficulty === 'medium' ? 18 : 28);
    this.currentAction = 'idle';
  }

  update() {
    if (this.fighter.isDead || this.opponent.isDead) return;

    this.timer++;
    const dist = Math.abs((this.fighter.x + this.fighter.width / 2) - (this.opponent.x + this.opponent.width / 2));
    const isFacingLeft = this.fighter.facing === -1;

    // Ready for a new decision
    if (this.timer >= this.decisionInterval) {
      this.timer = 0;
      this.makeDecision(dist, isFacingLeft);
    }
  }

  makeDecision(dist, isFacingLeft) {
    const f = this.fighter;
    const opp = this.opponent;

    // Reset controls
    f.isMovingLeft = false;
    f.isMovingRight = false;
    f.isCrouching = false;

    // 1. If Super is full, try to unleash it!
    if (f.superMeter >= 100 && Math.random() < (this.difficulty === 'hard' ? 0.8 : 0.45)) {
      f.triggerSuper();
      return;
    }

    // 2. Defensive block reaction if opponent is attacking in close range
    const isOppAttacking = opp.state.startsWith('punch') || opp.state.startsWith('kick');
    const blockChance = this.difficulty === 'hard' ? 0.7 : (this.difficulty === 'medium' ? 0.4 : 0.15);
    
    if (isOppAttacking && dist < 160 && Math.random() < blockChance) {
      f.isBlocking = true;
      if (Math.random() < 0.3) f.isCrouching = true;
      return;
    } else {
      f.isBlocking = false;
    }

    // 3. Close Range Combat (dist < 140px)
    if (dist < 140) {
      const roll = Math.random();
      if (roll < 0.4) {
        f.punch();
      } else if (roll < 0.75) {
        f.kick();
      } else if (roll < 0.9) {
        // Step back
        if (isFacingLeft) f.isMovingRight = true;
        else f.isMovingLeft = true;
      } else {
        // Jump attack
        f.jump();
        setTimeout(() => { if (!f.isDead) f.kick(); }, 200);
      }
      return;
    }

    // 4. Mid/Long Range Movement
    const approachChance = this.difficulty === 'hard' ? 0.85 : 0.65;
    if (Math.random() < approachChance) {
      // Walk towards opponent
      if (isFacingLeft) {
        f.isMovingLeft = true;
      } else {
        f.isMovingRight = true;
      }

      // Random jump in
      if (Math.random() < 0.15) {
        f.jump();
      }
    }
  }
}

window.FighterAI = FighterAI;
