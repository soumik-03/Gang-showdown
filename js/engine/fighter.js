/**
 * ===================================================================
 *  3D FIGHTER CONTROLLER & FIGHTKARO COMBAT LOGIC
 * ===================================================================
 *  - Full 3D humanoid model animation control
 *  - Airborne flying uppercut knockback physics & tumbling
 *  - Comic speech bubble dialogue system
 *  - Combo counters & Brink-of-Health Critical Rage mechanic
 *  - Post-fight victory dance & celebratory shouts
 * ===================================================================
 */

class Fighter3D {
  constructor(scene3D, config, startX, isPlayer1 = true) {
    this.scene3D = scene3D;
    this.config = config || {};
    this.name = config.name || 'Brawler';
    this.isPlayer1 = isPlayer1;

    // 3D Coordinates
    this.pos = { x: startX, y: 0, z: 0 };
    this.vel = { x: 0, y: 0, z: 0 };

    // Movement & Physics
    this.speed = 5.2;
    this.jumpForce = 9.2;
    this.gravity = 24.0;
    this.isGrounded = true;
    this.facing = isPlayer1 ? 1 : -1;

    // Combat Stats
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

    // Comic Speech Bubble State
    this.bubbleText = '';
    this.bubbleTimer = 0;

    // 3D Humanoid Model Instance
    this.model = new HumanoidFighter3D(scene3D.scene, config, isPlayer1);
    this.updateModelTransform();
  }

  // --- COMIC SPEECH BUBBLE TRIGGER ---
  sayBubble(text, duration = 2.4) {
    this.bubbleText = text;
    this.bubbleTimer = duration;
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
      this.stateTimer = 0.35;
      if (Math.random() < 0.4) this.sayBubble("UPPERCUT! 💥", 1.8);
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
      this.stateTimer = 0.4;
      if (Math.random() < 0.4) this.sayBubble("SWEEP! 🌪️", 1.8);
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

    this.sayBubble(this.config.superMove.shout, 2.8);

    if (window.soundEngine) window.soundEngine.playSuperCharge();
    if (this.scene3D) this.scene3D.triggerShake(0.65);

    if (window.gameInstance) {
      window.gameInstance.triggerSuperCinematic(this);
    }
  }

  executeSuperAttack(opponent) {
    const s = this.config.superMove;
    const spawnX = this.pos.x + this.facing * 1.2;
    const spawnY = this.pos.y + 1.4;
    const damage = 85;

    // Launch heavy 3D projectile attack
    const projGeo = new THREE.SphereGeometry(0.55, 12, 12);
    const projMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(s.auraColor) });
    const projMesh = new THREE.Mesh(projGeo, projMat);
    projMesh.position.set(spawnX, spawnY, 0);
    this.scene3D.scene.add(projMesh);

    this.scene3D.projectiles3D.push({
      mesh: projMesh,
      vel: new THREE.Vector3(this.facing * s.speed, 0, 0),
      owner: this,
      damage: damage,
      life: 2.5
    });

    if (this.scene3D) {
      this.scene3D.spawn3DHitSparks(new THREE.Vector3(spawnX, spawnY, 0), 0xffa502, 25);
    }
  }

  canMove() {
    return !['punch_1', 'punch_2', 'uppercut', 'kick_1', 'kick_2', 'grab', 'hit', 'knockdown', 'super_charge', 'victory_dance'].includes(this.state) && !this.isDead;
  }

  canAttack() {
    return !['hit', 'knockdown', 'super_charge', 'victory_dance'].includes(this.state) && !this.isDead;
  }

  // --- AIRBORNE FLYING LAUNCH (FIGHTKARO UPPERCUT PHYSICS) ---
  launchAirborne(facingDir) {
    this.state = 'knockdown';
    this.stateTimer = 0.95;
    this.vel.y = 10.5; // High vertical launch
    this.vel.x = -facingDir * 6.5; // Flying backward across the arena
    this.isGrounded = false;
    if (this.scene3D) this.scene3D.triggerShake(0.65);
    if (Math.random() < 0.5) this.sayBubble("AAARGH! 💥", 1.8);
  }

  // --- DAMAGE & IMPACT ---
  takeDamage(amount, attacker, isSuper = false, isUppercut = false) {
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

    // Uppercuts launch opponent high into the air!
    if (isUppercut) {
      this.launchAirborne(attacker.facing);
    } else {
      this.state = amount > 25 ? 'knockdown' : 'hit';
      this.stateTimer = amount > 25 ? 0.65 : 0.28;
      this.vel.x = -this.facing * (amount > 25 ? 5.5 : 2.5);
    }

    // Super Meter Gain
    this.superMeter = Math.min(100, this.superMeter + 16);
    if (attacker) {
      attacker.superMeter = Math.min(100, attacker.superMeter + 14);
      attacker.comboHits++;
      attacker.comboTimer = 75;
    }

    // BRINK OF HEALTH / CRITICAL RAGE COMEBACK:
    if (!this.rageTriggered && this.health <= (this.maxHealth * 0.38) && this.health > 0) {
      this.rageTriggered = true;
      this.superMeter = 100;
      this.sayBubble("SHAKTI OVERLOAD!! ⚡⚡", 2.5);
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
    this.sayBubble("GHEE KHATAM... 😵", 3.0);
    if (window.soundEngine) window.soundEngine.playKOBell();
    if (this.scene3D) this.scene3D.triggerShake(0.85);
    if (window.gameInstance) window.gameInstance.onFighterKilled(this);
  }

  update(opponent, delta) {
    if (this.canMove()) {
      this.facing = opponent.pos.x > this.pos.x ? 1 : -1;
    }

    this.pos.x += this.vel.x * delta;
    this.pos.y += this.vel.y * delta;

    // Airborne Gravity & Ground Impact Bounce
    if (!this.isGrounded) {
      this.vel.y -= this.gravity * delta;
      if (this.pos.y <= 0) {
        this.pos.y = 0;
        if (this.state === 'knockdown') {
          // Ground impact bounce
          if (Math.abs(this.vel.y) > 4.5) {
            this.vel.y = -this.vel.y * 0.35; // Bounce off the floor
            if (this.scene3D) {
              this.scene3D.triggerShake(0.35);
              this.scene3D.spawn3DHitSparks(new THREE.Vector3(this.pos.x, 0.2, 0), 0xbdc3c7, 12);
            }
          } else {
            this.vel.y = 0;
            this.isGrounded = true;
          }
        } else {
          this.vel.y = 0;
          this.isGrounded = true;
          if (this.state === 'jump') this.state = 'idle';
        }
      }
    }

    // Platform Boundary Limits
    this.pos.x = Math.max(-9.5, Math.min(9.5, this.pos.x));

    if (this.isGrounded && !this.state.startsWith('walk')) {
      this.vel.x *= 0.78;
    }

    // Comic Speech Bubble Timer
    if (this.bubbleTimer > 0) {
      this.bubbleTimer -= delta;
      if (this.bubbleTimer <= 0) {
        this.bubbleText = '';
      }
    }

    // State Timer
    if (this.stateTimer > 0) {
      this.stateTimer -= delta;

      if (this.state === 'super_charge' && this.stateTimer <= 0) {
        this.executeSuperAttack(opponent);
        this.state = 'idle';
      }

      if (['punch_1', 'punch_2', 'uppercut', 'kick_1', 'kick_2', 'grab'].includes(this.state) && !this.hasHitOpponent) {
        this.checkAttackCollision(opponent);
      }

      if (this.stateTimer <= 0 && !this.isDead && this.state !== 'victory_dance') {
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
      let isUppercut = false;

      if (this.state === 'punch_2') damage = 16;
      if (this.state === 'uppercut') {
        damage = 24;
        isUppercut = true;
      }
      if (this.state === 'kick_1') damage = 18;
      if (this.state === 'kick_2') damage = 15;
      if (this.state === 'grab') damage = 25;

      opponent.takeDamage(damage, this, false, isUppercut);

      const hitPos = new THREE.Vector3((this.pos.x + opponent.pos.x) / 2, this.pos.y + 1.4, 0);
      if (this.scene3D) {
        this.scene3D.spawn3DHitSparks(hitPos, this.isPlayer1 ? 0xff4757 : 0x3742fa, 22);
        this.scene3D.triggerShake(isUppercut ? 0.55 : (isPunch ? 0.3 : 0.45));
      }

      if (window.soundEngine) {
        if (isPunch) {
          if (damage > 18) window.soundEngine.playPunchHeavy();
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
