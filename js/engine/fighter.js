/**
 * ===================================================================
 *  3D FIGHTER CONTROLLER & FIGHTKARO COMBAT LOGIC
 * ===================================================================
 */

class Fighter3D {
  constructor(scene3D, config, startX, isPlayer1 = true) {
    this.scene3D = scene3D;
    this.config = config;
    this.name = config.name;
    this.isPlayer1 = isPlayer1;

    // 3D Coordinates
    this.pos = { x: startX, y: 0, z: 0 };
    this.vel = { x: 0, y: 0, z: 0 };

    // Movement & Physics
    this.speed = 4.8;
    this.jumpForce = 8.5;
    this.gravity = 22.0;
    this.isGrounded = true;
    this.facing = isPlayer1 ? 1 : -1;

    // Combat Stats: Increased HP for epic extended brawls
    this.maxHealth = 220;
    this.health = 220;
    this.superMeter = 0; // 0 to 100%
    this.isDead = false;
    this.isBlocking = false;
    this.isCrouching = false;
    this.comboHits = 0;
    this.comboTimer = 0;

    // Comeback / Rage mechanic flag
    this.rageTriggered = false;

    // State & Animation
    this.state = 'idle';
    this.stateTimer = 0;
    this.hasHitOpponent = false;

    // 3D Humanoid Model Instance
    this.model = new HumanoidFighter3D(scene3D.scene, config, isPlayer1);
    this.updateModelTransform();
  }

  // --- CONTROLS ---

  moveLeft() {
    if (this.canMove()) {
      this.vel.x = -this.speed;
      if (this.isGrounded) {
        this.state = this.facing === -1 ? 'walk_fwd' : 'walk_back';
      }
    }
  }

  moveRight() {
    if (this.canMove()) {
      this.vel.x = this.speed;
      if (this.isGrounded) {
        this.state = this.facing === 1 ? 'walk_fwd' : 'walk_back';
      }
    }
  }

  stopMoving() {
    if (this.canMove() && this.isGrounded) {
      this.vel.x = 0;
      this.state = 'idle';
    }
  }

  jump() {
    if (this.isGrounded && this.canMove()) {
      this.vel.y = this.jumpForce;
      this.isGrounded = false;
      this.state = 'jump';
      if (window.soundEngine) window.soundEngine.playJump();
    }
  }

  crouch(isDown) {
    if (!this.isGrounded || this.isDead) return;
    this.isCrouching = isDown;
    if (isDown && this.canMove()) {
      this.state = 'crouch';
      this.vel.x = 0;
    } else if (!isDown && this.state === 'crouch') {
      this.state = 'idle';
    }
  }

  punch() {
    if (!this.canAttack()) return;

    if (this.isCrouching) {
      this.state = 'uppercut';
      this.stateTimer = 0.32;
    } else if (this.state === 'punch_1') {
      this.state = 'punch_2';
      this.stateTimer = 0.35;
    } else {
      this.state = 'punch_1';
      this.stateTimer = 0.28;
    }

    this.hasHitOpponent = false;
    if (window.soundEngine) window.soundEngine.playWhoosh();
  }

  kick() {
    if (!this.canAttack()) return;

    if (this.isCrouching) {
      this.state = 'kick_2';
      this.stateTimer = 0.38;
    } else {
      this.state = 'kick_1';
      this.stateTimer = 0.36;
    }

    this.hasHitOpponent = false;
    if (window.soundEngine) window.soundEngine.playWhoosh();
  }

  grab() {
    if (!this.canAttack()) return;
    this.state = 'grab';
    this.stateTimer = 0.42;
    this.hasHitOpponent = false;
    if (window.soundEngine) window.soundEngine.playWhoosh();
  }

  triggerSuper() {
    if (this.superMeter < 100 || !this.canAttack() || this.isDead) return;

    this.superMeter = 0;
    this.state = 'super_charge';
    this.stateTimer = 0.85;
    this.vel.x = 0;

    if (window.soundEngine) window.soundEngine.playSuperCharge();
    if (this.scene3D) this.scene3D.triggerShake(0.55);

    if (window.gameInstance) {
      window.gameInstance.triggerSuperCinematic(this);
    }
  }

  executeSuperAttack(opponent) {
    const s = this.config.superMove;
    const spawnX = this.pos.x + this.facing * 1.2;
    const spawnY = this.pos.y + 1.4;
    const damage = 85; // Massive Ultimate attack damage!

    if (s.type === 'projectile_swarm') {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          if (!this.isDead && this.scene3D) {
            this.scene3D.spawn3DSuperProjectile({
              x: spawnX,
              y: spawnY + (i - 1) * 0.3,
              vx: (s.speed || 12) * this.facing,
              damage: Math.round(damage / 3),
              owner: this,
              color: 0xff4757
            });
          }
        }, i * 150);
      }
    } else if (s.type === 'teleport_rush') {
      this.pos.x = opponent.pos.x + (opponent.facing === 1 ? -1.8 : 1.8);
      this.facing = opponent.pos.x > this.pos.x ? 1 : -1;
      this.updateModelTransform();

      opponent.takeDamage(damage, this, true);
      this.scene3D.spawn3DHitSparks(new THREE.Vector3(this.pos.x, this.pos.y + 1.4, 0), 0x70a1ff, 35);
      this.scene3D.triggerShake(0.75);
      if (window.soundEngine) window.soundEngine.playSuperHit();
    } else {
      this.scene3D.spawn3DSuperProjectile({
        x: spawnX,
        y: spawnY,
        vx: (s.speed || 11) * this.facing,
        damage: damage,
        owner: this,
        radius: 0.8,
        color: 0xffa502
      });
    }
  }

  canMove() {
    return !['punch_1', 'punch_2', 'uppercut', 'kick_1', 'kick_2', 'grab', 'hit', 'knockdown', 'super_charge'].includes(this.state) && !this.isDead;
  }

  canAttack() {
    return !['hit', 'knockdown', 'super_charge'].includes(this.state) && !this.isDead;
  }

  // --- DAMAGE & IMPACT ---
  takeDamage(amount, attacker, isSuper = false) {
    if (this.isDead) return;

    if (this.isBlocking && !isSuper) {
      this.health = Math.max(0, this.health - (amount * 0.25));
      this.superMeter = Math.min(100, this.superMeter + 8);
      if (this.scene3D) {
        this.scene3D.spawn3DHitSparks(new THREE.Vector3(this.pos.x, this.pos.y + 1.4, 0), 0x00d2d3, 10);
      }
      if (window.soundEngine) window.soundEngine.playBlock();
      return;
    }

    this.health = Math.max(0, this.health - amount);
    this.state = amount > 30 ? 'knockdown' : 'hit';
    this.stateTimer = amount > 30 ? 0.6 : 0.28;
    this.vel.x = -this.facing * (amount > 30 ? 5.5 : 2.5);

    // Super Meter Gain
    this.superMeter = Math.min(100, this.superMeter + 16);
    if (attacker) {
      attacker.superMeter = Math.min(100, attacker.superMeter + 14);
      attacker.comboHits++;
      attacker.comboTimer = 75;
    }

    // BRINK OF HEALTH / RAGE COMEBACK MECHANIC:
    // When HP drops below 35%, immediately fill Super meter to 100%!
    if (!this.rageTriggered && this.health <= (this.maxHealth * 0.38) && this.health > 0) {
      this.rageTriggered = true;
      this.superMeter = 100; // Instantly ready for the ultimate climax!
      if (this.scene3D) {
        this.scene3D.triggerShake(0.5);
        this.scene3D.spawn3DHitSparks(new THREE.Vector3(this.pos.x, this.pos.y + 1.2, 0), 0xff3838, 25);
      }
      if (window.soundEngine) window.soundEngine.playSuperCharge();
    }

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.health = 0;
    this.isDead = true;
    this.state = 'knockdown';
    this.stateTimer = 999;
    if (window.soundEngine) window.soundEngine.playKOBell();
    if (this.scene3D) this.scene3D.triggerShake(0.8);
    if (window.gameInstance) window.gameInstance.onFighterKilled(this);
  }

  update(opponent, delta) {
    if (this.canMove()) {
      this.facing = opponent.pos.x > this.pos.x ? 1 : -1;
    }

    this.pos.x += this.vel.x * delta;
    this.pos.y += this.vel.y * delta;

    if (!this.isGrounded) {
      this.vel.y -= this.gravity * delta;
      if (this.pos.y <= 0) {
        this.pos.y = 0;
        this.vel.y = 0;
        this.isGrounded = true;
        if (this.state === 'jump') this.state = 'idle';
      }
    }

    // Platform Boundary Limits
    this.pos.x = Math.max(-9.5, Math.min(9.5, this.pos.x));

    if (this.isGrounded && !this.state.startsWith('walk')) {
      this.vel.x *= 0.78;
    }

    if (this.stateTimer > 0) {
      this.stateTimer -= delta;

      if (this.state === 'super_charge' && this.stateTimer <= 0) {
        this.executeSuperAttack(opponent);
        this.state = 'idle';
      }

      if (['punch_1', 'punch_2', 'uppercut', 'kick_1', 'kick_2', 'grab'].includes(this.state) && !this.hasHitOpponent) {
        this.checkAttackCollision(opponent);
      }

      if (this.stateTimer <= 0 && !this.isDead) {
        this.state = 'idle';
      }
    }

    this.model.updateAnimation(this.state, this.facing, delta);
    this.updateModelTransform();

    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboTimer === 0) this.comboHits = 0;
    }
  }

  checkAttackCollision(opponent) {
    const dist = Math.abs(this.pos.x - opponent.pos.x);
    const heightDiff = Math.abs(this.pos.y - opponent.pos.y);

    const isPunch = this.state.startsWith('punch') || this.state === 'uppercut';
    const isGrab = this.state === 'grab';
    const range = isGrab ? 1.6 : (isPunch ? 1.85 : 2.2);

    const inFront = (this.facing === 1 && opponent.pos.x > this.pos.x) || (this.facing === -1 && opponent.pos.x < this.pos.x);

    if (inFront && dist < range && heightDiff < 1.4) {
      this.hasHitOpponent = true;
      let damage = 10;
      if (this.state === 'punch_2') damage = 16;
      if (this.state === 'uppercut') damage = 20;
      if (this.state === 'kick_1') damage = 18;
      if (this.state === 'kick_2') damage = 15;
      if (this.state === 'grab') damage = 24;

      opponent.takeDamage(damage, this, false);

      const hitPos = new THREE.Vector3((this.pos.x + opponent.pos.x) / 2, this.pos.y + 1.4, 0);
      if (this.scene3D) {
        this.scene3D.spawn3DHitSparks(hitPos, this.isPlayer1 ? 0xff4757 : 0x3742fa, 22);
        this.scene3D.triggerShake(isPunch ? 0.3 : 0.45);
      }

      if (window.soundEngine) {
        if (isPunch) {
          if (damage > 12) window.soundEngine.playPunchHeavy();
          else window.soundEngine.playPunchLight();
        } else {
          window.soundEngine.playKick();
        }
      }
    }
  }

  updateModelTransform() {
    this.model.root.position.set(this.pos.x, this.pos.y, this.pos.z);
  }

  destroy() {
    this.model.destroy();
  }
}

window.Fighter3D = Fighter3D;
