/**
 * ===================================================================
 *  PARTICLES, PROJECTILES & SCREEN SHAKE ENGINE
 * ===================================================================
 */

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.texts = [];
    this.projectiles = [];
    this.shakeIntensity = 0;
    this.shakeDecay = 0.9;
  }

  triggerScreenShake(intensity = 12) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  getShakeOffset() {
    if (this.shakeIntensity <= 0.5) {
      this.shakeIntensity = 0;
      return { x: 0, y: 0 };
    }
    const x = (Math.random() - 0.5) * this.shakeIntensity * 2;
    const y = (Math.random() - 0.5) * this.shakeIntensity * 2;
    this.shakeIntensity *= this.shakeDecay;
    return { x, y };
  }

  // Hit spark when punch/kick lands
  spawnHitSparks(x, y, color = "#ffdd59", count = 14) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        color: color,
        alpha: 1,
        decay: 0.05 + Math.random() * 0.04,
        type: 'spark'
      });
    }
  }

  // Blue defensive spark when attack is blocked
  spawnBlockSparks(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.random() - 0.5) * Math.PI;
      const speed = 3 + Math.random() * 4;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: '#00d2d3',
        alpha: 1,
        decay: 0.06,
        type: 'spark'
      });
    }
    this.spawnFloatingText(x, y - 20, "BLOCKED!", "#00d2d3", 18);
  }

  // Floating comic text ("POW!", "WHACK!", damage numbers)
  spawnFloatingText(x, y, text, color = "#ffffff", size = 20) {
    this.texts.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y,
      vy: -2.5,
      text: text,
      color: color,
      size: size,
      alpha: 1,
      decay: 0.03
    });
  }

  // Super move aura flames around fighter
  spawnAuraParticle(x, y, color) {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 60,
      vx: (Math.random() - 0.5) * 2,
      vy: -2 - Math.random() * 3,
      size: 4 + Math.random() * 6,
      color: color,
      alpha: 0.8,
      decay: 0.04,
      type: 'aura'
    });
  }

  // Unique Super Move Projectile
  spawnSuperProjectile(options) {
    this.projectiles.push({
      x: options.x,
      y: options.y,
      vx: options.vx,
      vy: options.vy || 0,
      icon: options.icon || "💥",
      radius: options.radius || 28,
      damage: options.damage || 35,
      owner: options.owner,
      color: options.color || "#ff4757",
      lifespan: options.lifespan || 180,
      scale: 1,
      spin: 0
    });
  }

  update(fighters) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.y += t.vy;
      t.alpha -= t.decay;
      if (t.alpha <= 0) {
        this.texts.splice(i, 1);
      }
    }

    // Update projectiles & check collisions with opposing fighter
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.x += proj.vx;
      proj.y += proj.vy;
      proj.spin += 0.2;
      proj.lifespan--;

      // Spawn trail particle
      this.particles.push({
        x: proj.x,
        y: proj.y,
        vx: (Math.random() - 0.5) * 1,
        vy: (Math.random() - 0.5) * 1,
        size: 5,
        color: proj.color,
        alpha: 0.7,
        decay: 0.05,
        type: 'spark'
      });

      // Collision with opponent
      fighters.forEach(target => {
        if (target !== proj.owner && !target.isDead) {
          const dx = proj.x - (target.x + target.width / 2);
          const dy = proj.y - (target.y + target.height / 2);
          const dist = Math.hypot(dx, dy);

          if (dist < proj.radius + target.width / 2) {
            // Hit!
            target.takeDamage(proj.damage, proj.owner, true);
            this.spawnHitSparks(proj.x, proj.y, proj.color, 24);
            this.triggerScreenShake(16);
            if (window.soundEngine) window.soundEngine.playSuperHit();
            proj.lifespan = 0; // Destroy projectile
          }
        }
      });

      if (proj.lifespan <= 0 || proj.x < -100 || proj.x > 2000) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    ctx.save();

    // Draw particles
    this.particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw projectiles (Custom emoji / icon with glow)
    this.projectiles.forEach(proj => {
      ctx.save();
      ctx.translate(proj.x, proj.y);
      ctx.rotate(proj.spin);
      
      // Glow
      ctx.shadowColor = proj.color;
      ctx.shadowBlur = 15;

      ctx.font = `${proj.radius * 1.5}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(proj.icon, 0, 0);

      ctx.restore();
    });

    // Draw floating comic damage texts
    this.texts.forEach(t => {
      ctx.globalAlpha = Math.max(0, t.alpha);
      ctx.font = `900 ${t.size}px Impact, sans-serif`;
      ctx.fillStyle = t.color;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillText(t.text, t.x, t.y);
    });

    ctx.restore();
  }

  clear() {
    this.particles = [];
    this.texts = [];
    this.projectiles = [];
    this.shakeIntensity = 0;
  }
}

window.particleSystem = new ParticleSystem();
