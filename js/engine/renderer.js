/**
 * ===================================================================
 *  ARENA RENDERER & ARCADE HEADS-UP DISPLAY (HUD)
 * ===================================================================
 */

class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stageWidth = 1200;
    this.stageHeight = 675; // 16:9 arcade aspect ratio
    this.groundY = 560;

    // Damage indicator lag bars (classic fighting game yellow bar)
    this.p1LagHealth = 100;
    this.p2LagHealth = 100;

    // Current arena selection
    this.currentStage = 'canteen'; // 'canteen', 'tapri', 'gaming'
  }

  draw(gameState, p1, p2, matchTime, superCinematic) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply Screen Shake if active
    const shake = window.particleSystem ? window.particleSystem.getShakeOffset() : { x: 0, y: 0 };
    ctx.save();
    ctx.translate(shake.x, shake.y);

    // 1. Draw Background Stage
    this.drawStage(ctx);

    // 2. Draw Particles & Projectiles behind fighters
    if (window.particleSystem) {
      window.particleSystem.draw(ctx);
    }

    // 3. Draw Fighters
    if (p1) p1.draw(ctx);
    if (p2) p2.draw(ctx);

    ctx.restore();

    // 4. Draw HUD (Health bars, Super meter, Timer) - not affected by shake
    this.drawHUD(ctx, p1, p2, matchTime);

    // 5. Draw Super Move Cinematic Cutscene if active
    if (superCinematic && superCinematic.active) {
      this.drawSuperCinematic(ctx, superCinematic);
    }
  }

  // --- STAGE BACKGROUNDS ---

  drawStage(ctx) {
    if (this.currentStage === 'canteen') {
      this.drawCanteenStage(ctx);
    } else if (this.currentStage === 'tapri') {
      this.drawTapriStage(ctx);
    } else {
      this.drawGamingStage(ctx);
    }

    // Ground Floor
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(0, this.groundY, this.stageWidth, this.stageHeight - this.groundY);

    // Floor edge highlight line
    ctx.strokeStyle = '#636e72';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, this.groundY);
    ctx.lineTo(this.stageWidth, this.groundY);
    ctx.stroke();

    // Checkerboard floor tiles
    ctx.fillStyle = '#353b48';
    for (let x = 0; x < this.stageWidth; x += 80) {
      ctx.fillRect(x, this.groundY + 15, 40, 20);
      ctx.fillRect(x + 40, this.groundY + 45, 40, 25);
    }
  }

  drawCanteenStage(ctx) {
    // Wall gradient (College Canteen warmth)
    const grad = ctx.createLinearGradient(0, 0, 0, this.groundY);
    grad.addColorStop(0, '#fdcb6e');
    grad.addColorStop(1, '#e17055');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.stageWidth, this.groundY);

    // Cafeteria Sign
    ctx.fillStyle = '#d63031';
    ctx.fillRect(this.stageWidth / 2 - 220, 70, 440, 65);
    ctx.strokeStyle = '#ffeaa7';
    ctx.lineWidth = 4;
    ctx.strokeRect(this.stageWidth / 2 - 220, 70, 440, 65);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 32px "Trebuchet MS", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('COLLEGE CANTEEN SHOWDOWN', this.stageWidth / 2, 114);

    // Rate Board on wall
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(80, 160, 190, 150);
    ctx.fillStyle = '#dfe6e9';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('MENU TODAY:', 95, 185);
    ctx.fillText('- Samosa: Rs 15', 95, 210);
    ctx.fillText('- Cutting: Rs 10', 95, 235);
    ctx.fillText('- Maggi: 20 Mins', 95, 260);
    ctx.fillText('- Udhaari: BAND!', 95, 285);

    // Canteen Counter
    ctx.fillStyle = '#b2bec3';
    ctx.fillRect(880, 360, 280, 200);
    ctx.fillStyle = '#636e72';
    ctx.fillRect(860, 345, 320, 20);
    ctx.fillStyle = '#2d3436';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('ORDER HERE 👉', 940, 410);
  }

  drawTapriStage(ctx) {
    // Night sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, this.groundY);
    grad.addColorStop(0, '#0f2027');
    grad.addColorStop(0.5, '#203a43');
    grad.addColorStop(1, '#2c5364');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.stageWidth, this.groundY);

    // Full Moon
    ctx.fillStyle = '#f5f6fa';
    ctx.beginPath();
    ctx.arc(1020, 120, 50, 0, Math.PI * 2);
    ctx.fill();

    // Tapri Banner
    ctx.fillStyle = '#d35400';
    ctx.fillRect(120, 180, 260, 50);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CHAI TAPRI CORNER', 250, 214);

    // Street Lamp Pole
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(850, this.groundY);
    ctx.lineTo(850, 140);
    ctx.lineTo(890, 120);
    ctx.stroke();

    // Yellow Lamp Glow
    ctx.fillStyle = 'rgba(241, 196, 15, 0.25)';
    ctx.beginPath();
    ctx.arc(890, 130, 90, 0, Math.PI * 2);
    ctx.fill();
  }

  drawGamingStage(ctx) {
    // Cyberpunk purple/cyan dark room
    const grad = ctx.createLinearGradient(0, 0, 0, this.groundY);
    grad.addColorStop(0, '#10002b');
    grad.addColorStop(0.5, '#240046');
    grad.addColorStop(1, '#3c096c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.stageWidth, this.groundY);

    // Neon Grid
    ctx.strokeStyle = 'rgba(224, 170, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let y = 100; y < this.groundY; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.stageWidth, y);
      ctx.stroke();
    }

    // Neon Sign
    ctx.fillStyle = '#00f2fe';
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 20;
    ctx.font = '900 36px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ 999 PING GAMING DEN ⚡', this.stageWidth / 2, 110);
    ctx.shadowBlur = 0;
  }

  // --- HEADS-UP DISPLAY (HUD) ---

  drawHUD(ctx, p1, p2, matchTime) {
    if (!p1 || !p2) return;

    // Smooth lag health bars
    this.p1LagHealth += (p1.health - this.p1LagHealth) * 0.08;
    this.p2LagHealth += (p2.health - this.p2LagHealth) * 0.08;

    const barWidth = 440;
    const barHeight = 28;
    const topMargin = 30;

    // --- PLAYER 1 HEALTH BAR (LEFT) ---
    // Background bar
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(40, topMargin, barWidth, barHeight);

    // Yellow trailing damage bar
    ctx.fillStyle = '#f1c40f';
    const p1LagW = (this.p1LagHealth / 100) * barWidth;
    ctx.fillRect(40 + barWidth - p1LagW, topMargin, p1LagW, barHeight);

    // Actual green/red health bar
    const p1W = (p1.health / 100) * barWidth;
    ctx.fillStyle = p1.health > 30 ? '#2ecc71' : '#e74c3c';
    ctx.fillRect(40 + barWidth - p1W, topMargin, p1W, barHeight);

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(40, topMargin, barWidth, barHeight);

    // P1 Name & Nickname
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${p1.name} "${p1.config.nickname}"`, 40, topMargin - 8);

    // P1 SUPER / SHAKTI METER
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(40, topMargin + barHeight + 8, 220, 14);
    const p1SuperW = (p1.superMeter / 100) * 220;
    ctx.fillStyle = p1.superMeter >= 100 ? '#e84118' : '#3498db';
    ctx.fillRect(40, topMargin + barHeight + 8, p1SuperW, 14);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(40, topMargin + barHeight + 8, 220, 14);

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(p1.superMeter >= 100 ? '🔥 SUPER READY! (L/Space)' : `SUPER: ${Math.round(p1.superMeter)}%`, 45, topMargin + barHeight + 20);

    // --- PLAYER 2 HEALTH BAR (RIGHT) ---
    // Background bar
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(this.stageWidth - 40 - barWidth, topMargin, barWidth, barHeight);

    // Yellow trailing damage bar
    ctx.fillStyle = '#f1c40f';
    const p2LagW = (this.p2LagHealth / 100) * barWidth;
    ctx.fillRect(this.stageWidth - 40 - barWidth, topMargin, p2LagW, barHeight);

    // Actual green/red health bar
    const p2W = (p2.health / 100) * barWidth;
    ctx.fillStyle = p2.health > 30 ? '#2ecc71' : '#e74c3c';
    ctx.fillRect(this.stageWidth - 40 - barWidth, topMargin, p2W, barHeight);

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(this.stageWidth - 40 - barWidth, topMargin, barWidth, barHeight);

    // P2 Name & Nickname
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`"${p2.config.nickname}" ${p2.name}`, this.stageWidth - 40, topMargin - 8);

    // P2 SUPER METER
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(this.stageWidth - 40 - 220, topMargin + barHeight + 8, 220, 14);
    const p2SuperW = (p2.superMeter / 100) * 220;
    ctx.fillStyle = p2.superMeter >= 100 ? '#e84118' : '#e67e22';
    ctx.fillRect(this.stageWidth - 40 - 220, topMargin + barHeight + 8, p2SuperW, 14);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(this.stageWidth - 40 - 220, topMargin + barHeight + 8, 220, 14);

    ctx.textAlign = 'right';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(p2.superMeter >= 100 ? '🔥 SUPER READY!' : `SUPER: ${Math.round(p2.superMeter)}%`, this.stageWidth - 45, topMargin + barHeight + 20);

    // --- ROUND TIMER (CENTER) ---
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(this.stageWidth / 2, topMargin + 25, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 32px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.max(0, Math.ceil(matchTime)), this.stageWidth / 2, topMargin + 26);

    // --- COMBO COUNTERS ---
    if (p1.comboHits >= 2) {
      ctx.font = '900 36px Impact, sans-serif';
      ctx.fillStyle = '#f1c40f';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.textAlign = 'left';
      ctx.strokeText(`${p1.comboHits} HITS!`, 60, 140);
      ctx.fillText(`${p1.comboHits} HITS!`, 60, 140);
    }
    if (p2.comboHits >= 2) {
      ctx.font = '900 36px Impact, sans-serif';
      ctx.fillStyle = '#f1c40f';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.textAlign = 'right';
      ctx.strokeText(`${p2.comboHits} HITS!`, this.stageWidth - 60, 140);
      ctx.fillText(`${p2.comboHits} HITS!`, this.stageWidth - 60, 140);
    }
  }

  // --- SUPER MOVE CINEMATIC BANNER ---

  drawSuperCinematic(ctx, cinematic) {
    const fighter = cinematic.fighter;
    const s = fighter.config.superMove;

    ctx.save();
    // Dark overlay with speed stripes
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, this.stageWidth, this.stageHeight);

    // Colored banner slice across the middle
    ctx.fillStyle = fighter.config.themeColor || '#e84118';
    ctx.beginPath();
    ctx.moveTo(0, 220);
    ctx.lineTo(this.stageWidth, 200);
    ctx.lineTo(this.stageWidth, 420);
    ctx.lineTo(0, 440);
    ctx.fill();

    // Border highlights
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 220);
    ctx.lineTo(this.stageWidth, 200);
    ctx.moveTo(0, 440);
    ctx.lineTo(this.stageWidth, 420);
    ctx.stroke();

    // Fighter Name & Super Move Shout
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 52px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`⚡ ${s.name} ⚡`, this.stageWidth / 2, 290);

    ctx.font = 'bold 26px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#ffeaa7';
    ctx.fillText(`"${s.shout}"`, this.stageWidth / 2, 345);

    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`— ${fighter.name} (${fighter.config.nickname})`, this.stageWidth / 2, 385);

    ctx.restore();
  }
}

window.GameRenderer = GameRenderer;
