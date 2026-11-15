/**
 * ===================================================================
 *  FIGHTER CLASS & SKELETAL ANIMATION ENGINE
 * ===================================================================
 *  Handles physics, hitbox collisions, state machine, combo counters,
 *  custom head avatar rendering, and unique Super Moves.
 */

class Fighter {
  constructor(config, x, groundY, isPlayer1 = true) {
    this.config = config;
    this.name = config.name;
    this.isPlayer1 = isPlayer1;

    // Dimensions & Coordinates
    this.width = 70;
    this.height = 140;
    this.x = x;
    this.groundY = groundY;
    this.y = groundY - this.height;
    this.vx = 0;
    this.vy = 0;

    // Movement & Physics
    this.speed = 5.5;
    this.jumpForce = -15.5;
    this.gravity = 0.85;
    this.isGrounded = true;
    this.facing = isPlayer1 ? 1 : -1; // 1 = facing right, -1 = facing left

    // Combat Stats
    this.maxHealth = 100;
    this.health = 100;
    this.superMeter = 0; // 0 to 100%
    this.isDead = false;
    this.isBlocking = false;
    this.isCrouching = false;
    this.comboHits = 0;
    this.comboTimer = 0;

    // State & Animation
    this.state = 'idle'; // idle, walk, jump, crouch, punch_1, punch_2, kick_1, kick_2, hit, knockdown, super
    this.animFrame = 0;
    this.stateTimer = 0;
    this.attackHitbox = null;
    this.hasHitOpponent = false;

    // Avatar image loading (for custom friend photos)
    this.avatarImg = new Image();
    this.avatarLoaded = false;
    this.avatarImg.onload = () => { this.avatarLoaded = true; };
    this.avatarImg.onerror = () => { this.avatarLoaded = false; };
    if (this.config.avatar) {
      this.avatarImg.src = this.config.avatar;
    }
  }

  // --- CONTROLS ---

  moveLeft() {
    if (this.canMove()) {
      this.vx = -this.speed;
      if (this.isGrounded) this.state = 'walk';
    }
  }

  moveRight() {
    if (this.canMove()) {
      this.vx = this.speed;
      if (this.isGrounded) this.state = 'walk';
    }
  }

  stopMoving() {
    if (this.canMove() && this.isGrounded) {
      this.vx = 0;
      this.state = 'idle';
    }
  }

  jump() {
    if (this.isGrounded && this.canMove()) {
      this.vy = this.jumpForce;
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
      this.vx = 0;
    } else if (!isDown && this.state === 'crouch') {
      this.state = 'idle';
    }
  }

  punch() {
    if (!this.canAttack()) return;
    this.state = this.state === 'punch_1' ? 'punch_2' : 'punch_1';
    this.stateTimer = 16;
    this.hasHitOpponent = false;
    if (window.soundEngine) window.soundEngine.playWhoosh();
  }

  kick() {
    if (!this.canAttack()) return;
    this.state = this.state === 'kick_1' ? 'kick_2' : 'kick_1';
    this.stateTimer = 18;
    this.hasHitOpponent = false;
    if (window.soundEngine) window.soundEngine.playWhoosh();
  }

  triggerSuper() {
    if (this.superMeter < 100 || !this.canAttack() || this.isDead) return;
    
    // Spend meter
    this.superMeter = 0;
    this.state = 'super_charge';
    this.stateTimer = 45;
    this.vx = 0;

    if (window.soundEngine) window.soundEngine.playSuperCharge();
    if (window.particleSystem) window.particleSystem.triggerScreenShake(20);

    // Trigger visual cinematic announcement
    if (window.gameInstance) {
      window.gameInstance.triggerSuperCinematic(this);
    }
  }

  executeSuperAttack(opponent) {
    const s = this.config.superMove;
    const isRight = this.facing === 1;
    const spawnX = this.x + (isRight ? this.width + 10 : -30);
    const spawnY = this.y + 40;

    if (s.type === 'projectile_swarm') {
      // Swarm of 3 rapid alarm clocks / excuses
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          if (!this.isDead && window.particleSystem) {
            window.particleSystem.spawnSuperProjectile({
              x: spawnX,
              y: spawnY + (i - 1) * 25,
              vx: (s.speed || 14) * this.facing,
              icon: s.projectileIcon || '⏰',
              damage: Math.round(s.damage / 3),
              owner: this,
              color: s.auraColor
            });
          }
        }, i * 140);
      }
    } else if (s.type === 'ground_slam') {
      // Massive ground shockwave that rushes across the floor
      if (window.particleSystem) {
        window.particleSystem.spawnSuperProjectile({
          x: spawnX,
          y: this.groundY - 30,
          vx: (s.speed || 16) * this.facing,
          icon: s.projectileIcon || '🥤',
          radius: 38,
          damage: s.damage,
          owner: this,
          color: s.auraColor
        });
      }
    } else if (s.type === 'teleport_rush') {
      // Teleports directly behind opponent with a glitch strike!
      const targetX = opponent.x + (opponent.facing === 1 ? -90 : 90);
      this.x = Math.max(50, Math.min(1150, targetX));
      this.facing = opponent.x > this.x ? 1 : -1;
      
      // Immediate devastating hit
      opponent.takeDamage(s.damage, this, true);
      if (window.particleSystem) {
        window.particleSystem.spawnHitSparks(this.x + 30, this.y + 50, s.auraColor, 35);
        window.particleSystem.triggerScreenShake(24);
      }
      if (window.soundEngine) window.soundEngine.playSuperHit();
    } else {
      // Energy beam / tsunami wave (e.g. Chai blast)
      if (window.particleSystem) {
        window.particleSystem.spawnSuperProjectile({
          x: spawnX,
          y: spawnY,
          vx: (s.speed || 16) * this.facing,
          icon: s.projectileIcon || '☕',
          radius: 40,
          damage: s.damage,
          owner: this,
          color: s.auraColor
        });
      }
    }
  }

  canMove() {
    return !['punch_1', 'punch_2', 'kick_1', 'kick_2', 'hit', 'knockdown', 'super_charge'].includes(this.state) && !this.isDead;
  }

  canAttack() {
    return !['hit', 'knockdown', 'super_charge'].includes(this.state) && !this.isDead;
  }

  // --- DAMAGE & COMBAT ---

  takeDamage(amount, attacker, isSuper = false) {
    if (this.isDead) return;

    if (this.isBlocking && !isSuper) {
      // Reduced chip damage when blocking
      this.health = Math.max(0, this.health - (amount * 0.2));
      this.superMeter = Math.min(100, this.superMeter + 4);
      if (window.particleSystem) {
        window.particleSystem.spawnBlockSparks(this.x + this.width / 2, this.y + 40);
      }
      if (window.soundEngine) window.soundEngine.playBlock();
      return;
    }

    // Normal hit
    this.health = Math.max(0, this.health - amount);
    this.state = amount > 25 ? 'knockdown' : 'hit';
    this.stateTimer = amount > 25 ? 32 : 16;
    this.vx = -this.facing * (amount > 25 ? 9 : 4);

    // Charge super meters for both
    this.superMeter = Math.min(100, this.superMeter + 10);
    if (attacker) {
      attacker.superMeter = Math.min(100, attacker.superMeter + 14);
      attacker.comboHits++;
      attacker.comboTimer = 75; // frames until combo resets
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
    if (window.particleSystem) window.particleSystem.triggerScreenShake(25);
    if (window.gameInstance) window.gameInstance.onFighterKilled(this);
  }

  // --- UPDATE LOOP ---

  update(opponent, stageWidth) {
    // Dynamically face opponent unless mid-attack
    if (this.canMove()) {
      this.facing = opponent.x > this.x ? 1 : -1;
    }

    // Apply physics
    this.x += this.vx;
    this.y += this.vy;

    // Gravity
    if (!this.isGrounded) {
      this.vy += this.gravity;
      if (this.y + this.height >= this.groundY) {
        this.y = this.groundY - this.height;
        this.vy = 0;
        this.isGrounded = true;
        if (this.state === 'jump') this.state = 'idle';
      }
    }

    // Stage screen boundaries
    this.x = Math.max(30, Math.min(stageWidth - this.width - 30, this.x));

    // Friction when grounded
    if (this.isGrounded && this.state !== 'walk') {
      this.vx *= 0.75;
    }

    // State timers
    if (this.stateTimer > 0) {
      this.stateTimer--;

      // Super charge transition to execute
      if (this.state === 'super_charge' && this.stateTimer === 0) {
        this.executeSuperAttack(opponent);
        this.state = 'idle';
      }

      // Attack hitbox active frames
      if (['punch_1', 'punch_2', 'kick_1', 'kick_2'].includes(this.state) && !this.hasHitOpponent) {
        this.checkAttackCollision(opponent);
      }

      // Return to idle
      if (this.stateTimer === 0 && !this.isDead) {
        this.state = 'idle';
        this.attackHitbox = null;
      }
    }

    // Aura particles when Super is full
    if (this.superMeter >= 100 && Math.random() < 0.4 && window.particleSystem) {
      window.particleSystem.spawnAuraParticle(
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.config.themeColor || '#ff4757'
      );
    }

    // Combo timer
    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboTimer === 0) {
        this.comboHits = 0;
      }
    }

    this.animFrame++;
  }

  checkAttackCollision(opponent) {
    // Generate attack hitbox based on current move
    const isPunch = this.state.startsWith('punch');
    const range = isPunch ? 75 : 95;
    const damage = isPunch ? (this.state === 'punch_2' ? 14 : 9) : (this.state === 'kick_2' ? 18 : 12);
    
    const attackX = this.facing === 1 ? this.x + this.width : this.x - range;
    const attackY = this.y + (isPunch ? 35 : 60);

    // AABB Collision check with opponent
    const oppX = opponent.x;
    const oppY = opponent.y;
    const oppW = opponent.width;
    const oppH = opponent.height;

    if (
      attackX < oppX + oppW &&
      attackX + range > oppX &&
      attackY < oppY + oppH &&
      attackY + 40 > oppY
    ) {
      // Hit connected!
      this.hasHitOpponent = true;
      opponent.takeDamage(damage, this, false);

      const impactX = this.facing === 1 ? oppX + 15 : oppX + oppW - 15;
      const impactY = attackY + 15;

      if (window.particleSystem) {
        window.particleSystem.spawnHitSparks(impactX, impactY, this.config.themeColor);
        window.particleSystem.spawnFloatingText(
          impactX,
          impactY - 15,
          isPunch ? 'WHAM!' : 'KICK!',
          this.config.themeColor,
          22
        );
        window.particleSystem.triggerScreenShake(isPunch ? 6 : 9);
      }

      if (window.soundEngine) {
        if (isPunch) {
          if (damage > 10) window.soundEngine.playPunchHeavy();
          else window.soundEngine.playPunchLight();
        } else {
          window.soundEngine.playKick();
        }
      }
    }
  }

  // --- DRAWING & SKELETAL RENDERING ---

  draw(ctx) {
    ctx.save();

    // Flip context horizontally if facing left
    ctx.translate(this.x + this.width / 2, this.y);
    if (this.facing === -1) {
      ctx.scale(-1, 1);
    }

    // Shadow on ground
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, this.height, 35, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Super aura glow if full
    if (this.superMeter >= 100) {
      ctx.shadowColor = this.config.themeColor || '#ff4757';
      ctx.shadowBlur = 18;
    }

    const body = this.config.body || {};
    const shirtColor = body.shirt || '#e84118';
    const pantsColor = body.pants || '#2f3640';
    const skinTone = body.skin || '#fbc531';
    const shoeColor = body.shoes || '#f5f6fa';

    // Animation offsets based on state
    let bob = Math.sin(this.animFrame * 0.15) * 3;
    let punchExt = 0;
    let kickExt = 0;
    let legAngle = 0;

    if (this.state === 'walk') {
      legAngle = Math.sin(this.animFrame * 0.25) * 0.45;
      bob = Math.abs(Math.sin(this.animFrame * 0.25)) * 6;
    } else if (this.state.startsWith('punch')) {
      punchExt = 35;
    } else if (this.state.startsWith('kick')) {
      kickExt = 45;
    } else if (this.state === 'crouch') {
      bob = 28;
    } else if (this.state === 'knockdown') {
      ctx.rotate((this.facing * -Math.PI) / 3);
    }

    const torsoY = 48 + bob;

    // --- LEGS ---
    ctx.strokeStyle = pantsColor;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';

    // Back leg
    ctx.beginPath();
    ctx.moveTo(-10, torsoY + 40);
    ctx.lineTo(-12 - legAngle * 30, this.height - 10 + (this.state === 'crouch' ? -20 : 0));
    ctx.stroke();

    // Front leg / Kick
    ctx.beginPath();
    ctx.moveTo(10, torsoY + 40);
    if (kickExt > 0) {
      ctx.lineTo(25 + kickExt, torsoY + 45); // Extended high kick
    } else {
      ctx.lineTo(12 + legAngle * 30, this.height - 10 + (this.state === 'crouch' ? -20 : 0));
    }
    ctx.stroke();

    // Shoes
    ctx.fillStyle = shoeColor;
    ctx.fillRect(kickExt > 0 ? 25 + kickExt : 8 + legAngle * 30, kickExt > 0 ? torsoY + 38 : this.height - 14, 18, 12);

    // --- TORSO ---
    ctx.fillStyle = shirtColor;
    ctx.beginPath();
    ctx.roundRect(-22, torsoY, 44, 46, 8);
    ctx.fill();

    // --- ARMS ---
    ctx.strokeStyle = skinTone;
    ctx.lineWidth = 12;

    // Back arm
    ctx.beginPath();
    ctx.moveTo(-14, torsoY + 8);
    ctx.lineTo(-24, torsoY + 28);
    ctx.stroke();

    // Front arm (Jab / Hook / Guard)
    ctx.beginPath();
    ctx.moveTo(14, torsoY + 8);
    if (punchExt > 0) {
      ctx.lineTo(14 + punchExt, torsoY + 12); // Punch extension
    } else if (this.isBlocking) {
      ctx.lineTo(22, torsoY - 8); // Guard up
    } else {
      ctx.lineTo(22, torsoY + 24); // Idle fist
    }
    ctx.stroke();

    // Glove / Fist
    ctx.fillStyle = skinTone;
    ctx.beginPath();
    ctx.arc(punchExt > 0 ? 14 + punchExt : 22, punchExt > 0 ? torsoY + 12 : (this.isBlocking ? torsoY - 8 : torsoY + 24), 8, 0, Math.PI * 2);
    ctx.fill();

    // --- HEAD (Custom Photo Cutout OR Procedural Stylized Caricature) ---
    const headX = -26;
    const headY = bob - 2;
    const headSize = 52;

    if (this.avatarLoaded && this.avatarImg.complete) {
      // Draw friend's cutout photo
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, headY + headSize / 2, headSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(this.avatarImg, headX, headY, headSize, headSize);
      ctx.restore();

      // Border outline for cutout pop
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, headY + headSize / 2, headSize / 2, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Stylized Procedural Caricature
      this.drawCartoonHead(ctx, headX, headY, headSize, skinTone, body);
    }

    ctx.restore();
  }

  // Fallback high-quality cartoon caricature if no photo image provided
  drawCartoonHead(ctx, x, y, size, skinTone, body) {
    const cx = x + size / 2;
    const cy = y + size / 2;

    // Face Circle
    ctx.fillStyle = skinTone;
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2f3640';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Hair
    ctx.fillStyle = body.hair || '#2f3640';
    ctx.beginPath();
    if (body.hairStyle === 'spiky') {
      ctx.moveTo(x - 2, y + 16);
      ctx.lineTo(x + 10, y - 8);
      ctx.lineTo(cx, y - 12);
      ctx.lineTo(x + size - 10, y - 8);
      ctx.lineTo(x + size + 2, y + 16);
      ctx.lineTo(cx, y + 10);
    } else if (body.hairStyle === 'ponytail') {
      ctx.arc(cx, cy - 6, size / 2 + 2, Math.PI, 0);
      ctx.lineTo(x - 12, y - 2); // ponytail sticking out
    } else {
      // Classic haircut
      ctx.arc(cx, cy - 4, size / 2 + 2, Math.PI, 0);
    }
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx + 6, cy - 2, 5, 0, Math.PI * 2);
    ctx.arc(cx + 18, cy - 2, 5, 0, Math.PI * 2);
    ctx.fill();

    // Pupils (looking forward)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cx + 8, cy - 2, 2.5, 0, Math.PI * 2);
    ctx.arc(cx + 20, cy - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Determined Eyebrows
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx + 3, cy - 8);
    ctx.lineTo(cx + 11, cy - 6);
    ctx.moveTo(cx + 15, cy - 6);
    ctx.lineTo(cx + 23, cy - 8);
    ctx.stroke();

    // Smirking Mouth
    ctx.beginPath();
    ctx.arc(cx + 12, cy + 12, 6, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  }
}

window.Fighter = Fighter;
