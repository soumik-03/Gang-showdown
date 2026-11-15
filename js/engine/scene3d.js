/**
 * ===================================================================
 *  3D ARENA, LIGHTING & DYNAMIC CAMERA ENGINE (Three.js)
 * ===================================================================
 *  Renders the 3D fighting environment, dynamic shadows, tracking camera,
 *  and 3D particle visual effects.
 */

class GameScene3D {
  constructor(container) {
    this.container = container;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0c10);
    this.scene.fog = new THREE.FogExp2(0x0a0c10, 0.022);

    // 2. Camera (Dynamic 2.5D/3D tracking camera)
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 3.8, 12.5);

    // 3. WebGL Renderer with Shadows
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    // Camera Shake
    this.cameraShake = 0;

    // 4. Setup Lighting
    this.setupLighting();

    // 5. Build 3D Arena
    this.buildArena();

    // 6. 3D Particle System
    this.particles = [];
    this.projectiles3D = [];

    // Window Resize Handler
    window.addEventListener('resize', () => this.onResize());
  }

  setupLighting() {
    // Ambient Light
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);

    // Main Overhead Stadium Spotlight (Casts Shadows)
    this.mainLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    this.mainLight.position.set(2, 14, 8);
    this.mainLight.castShadow = true;
    this.mainLight.shadow.mapSize.width = 2048;
    this.mainLight.shadow.mapSize.height = 2048;
    this.mainLight.shadow.camera.near = 0.5;
    this.mainLight.shadow.camera.far = 30;
    this.mainLight.shadow.camera.left = -12;
    this.mainLight.shadow.camera.right = 12;
    this.mainLight.shadow.camera.top = 10;
    this.mainLight.shadow.camera.bottom = -5;
    this.mainLight.shadow.bias = -0.0005;
    this.scene.add(this.mainLight);

    // Red Corner Accent Light (Player 1 side)
    const redCorner = new THREE.PointLight(0xff4757, 1.4, 18);
    redCorner.position.set(-8, 5, 2);
    this.scene.add(redCorner);

    // Blue Corner Accent Light (Player 2 side)
    const blueCorner = new THREE.PointLight(0x3742fa, 1.4, 18);
    blueCorner.position.set(8, 5, 2);
    this.scene.add(blueCorner);
  }

  buildArena() {
    // 1. Circular Combat Floor Mat
    const matGeo = new THREE.CylinderGeometry(8.5, 8.8, 0.5, 36);
    const matMat = new THREE.MeshStandardMaterial({
      color: 0x1e272e,
      roughness: 0.65,
      metalness: 0.1
    });
    this.ringMat = new THREE.Mesh(matGeo, matMat);
    this.ringMat.position.y = -0.25;
    this.ringMat.receiveShadow = true;
    this.scene.add(this.ringMat);

    // Ring Boundary Line
    const ringLineGeo = new THREE.RingGeometry(7.6, 7.85, 36);
    const ringLineMat = new THREE.MeshBasicMaterial({
      color: 0xffa502,
      side: THREE.DoubleSide
    });
    const ringLine = new THREE.Mesh(ringLineGeo, ringLineMat);
    ringLine.rotation.x = -Math.PI / 2;
    ringLine.position.y = 0.01;
    this.scene.add(ringLine);

    // 2. Outer Stadium Floor
    const groundGeo = new THREE.PlaneGeometry(60, 40);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f141d,
      roughness: 0.9
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.3;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 3. Arena Posts & Corner Ropes
    this.buildRingPosts();

    // 4. Background Stadium Pillars & Neon Grid
    this.buildBackground();
  }

  buildRingPosts() {
    const postMat = new THREE.MeshStandardMaterial({ color: 0x2f3542, metalness: 0.8, roughness: 0.2 });
    const postCoords = [
      [-6.5, -4.5], [6.5, -4.5],
      [-6.5, 4.5], [6.5, 4.5]
    ];

    postCoords.forEach(([x, z], idx) => {
      // Corner post
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 3.2, 12), postMat);
      post.position.set(x, 1.35, z);
      post.castShadow = true;
      this.scene.add(post);

      // Post top cap
      const capMat = new THREE.MeshBasicMaterial({ color: idx % 2 === 0 ? 0xff4757 : 0x3742fa });
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), capMat);
      cap.position.set(x, 2.95, z);
      this.scene.add(cap);
    });

    // Ring Ropes (3 Horizontal levels)
    const ropeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [0.9, 1.7, 2.5].forEach((h) => {
      // Front & Back ropes
      const ropeGeo = new THREE.CylinderGeometry(0.04, 0.04, 13, 8);
      const ropeFront = new THREE.Mesh(ropeGeo, ropeMat);
      ropeFront.rotation.z = Math.PI / 2;
      ropeFront.position.set(0, h, 4.5);
      this.scene.add(ropeFront);

      const ropeBack = new THREE.Mesh(ropeGeo, ropeMat);
      ropeBack.rotation.z = Math.PI / 2;
      ropeBack.position.set(0, h, -4.5);
      this.scene.add(ropeBack);
    });
  }

  buildBackground() {
    // 3D Stadium Pillars
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x181e28, roughness: 0.8 });
    for (let x = -20; x <= 20; x += 8) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 16, 1.6), pillarMat);
      pillar.position.set(x, 6, -12);
      this.scene.add(pillar);
    }

    // Glowing Neon Top Header
    const neonGeo = new THREE.BoxGeometry(28, 0.4, 0.4);
    const neonMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
    const neon = new THREE.Mesh(neonGeo, neonMat);
    neon.position.set(0, 7.5, -11.5);
    this.scene.add(neon);
  }

  // --- DYNAMIC 3D CAMERA TRACKING ---
  updateCamera(p1Pos, p2Pos, isCinematic = false) {
    // Midpoint between fighters
    const midX = (p1Pos.x + p2Pos.x) / 2;
    const midY = (p1Pos.y + p2Pos.y) / 2;
    const dist = Math.abs(p1Pos.x - p2Pos.x);

    // Desired camera distance (zooms in when close, zooms out when far)
    let targetZ = 8.5 + dist * 0.55;
    let targetY = 2.8 + (dist * 0.12);
    let targetX = midX * 0.7;

    // Cinematic zoom on Super move
    if (isCinematic) {
      targetZ = 5.2;
      targetY = 2.2;
      targetX = p1Pos.x * 0.8;
    }

    // Smooth camera lag/lerp
    this.camera.position.x += (targetX - this.camera.position.x) * 0.08;
    this.camera.position.y += (targetY - this.camera.position.y) * 0.08;
    this.camera.position.z += (targetZ - this.camera.position.z) * 0.08;

    // Apply Camera Shake
    if (this.cameraShake > 0.01) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake *= 0.88;
    } else {
      this.cameraShake = 0;
    }

    // Look at midpoint
    this.camera.lookAt(midX, midY + 1.2, 0);
  }

  triggerShake(intensity = 0.45) {
    this.cameraShake = Math.max(this.cameraShake, intensity);
  }

  // --- 3D PARTICLES & HIT SPARKS ---
  spawn3DHitSparks(pos, color = 0xffdd59, count = 18) {
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.06 + Math.random() * 0.06, 6, 6);
      const mat = new THREE.MeshBasicMaterial({ color: color });
      const p = new THREE.Mesh(geo, mat);
      p.position.copy(pos);

      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 6;
      this.scene.add(p);

      this.particles.push({
        mesh: p,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 2,
        vz: (Math.random() - 0.5) * 4,
        life: 1.0,
        decay: 0.05 + Math.random() * 0.04
      });
    }
  }

  // --- 3D SUPER PROJECTILE ---
  spawn3DSuperProjectile(options) {
    // 3D Glowing Energy Sphere with Sprite Icon
    const group = new THREE.Group();
    group.position.set(options.x, options.y, options.z || 0);

    // Glowing Core Sphere
    const coreGeo = new THREE.SphereGeometry(options.radius || 0.45, 12, 12);
    const coreMat = new THREE.MeshBasicMaterial({ color: options.color || 0xff4757 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Point Light Glow
    const light = new THREE.PointLight(options.color || 0xff4757, 2, 8);
    group.add(light);

    this.scene.add(group);

    this.projectiles3D.push({
      group: group,
      vx: options.vx,
      damage: options.damage,
      owner: options.owner,
      color: options.color,
      lifespan: 140,
      radius: options.radius || 0.45
    });
  }

  updateProjectiles(fighters) {
    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.mesh.position.x += p.vx * 0.016;
      p.mesh.position.y += p.vy * 0.016;
      p.mesh.position.z += p.vz * 0.016;
      p.vy -= 9.8 * 0.016; // Gravity
      p.life -= p.decay;

      p.mesh.scale.setScalar(Math.max(0.001, p.life));

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
      }
    }

    // Update 3D Projectiles
    for (let i = this.projectiles3D.length - 1; i >= 0; i--) {
      const proj = this.projectiles3D[i];
      proj.group.position.x += proj.vx * 0.016;
      proj.lifespan--;

      // Spawn trailing particle
      if (Math.random() < 0.6) {
        this.spawn3DHitSparks(proj.group.position, proj.color, 2);
      }

      // Check collision with target fighter
      fighters.forEach(target => {
        if (target !== proj.owner && !target.isDead) {
          const dx = proj.group.position.x - target.pos.x;
          const dy = proj.group.position.y - (target.pos.y + 1.2);
          const dist = Math.hypot(dx, dy);

          if (dist < proj.radius + 0.65) {
            // Impact!
            target.takeDamage(proj.damage, proj.owner, true);
            this.spawn3DHitSparks(proj.group.position, proj.color, 30);
            this.triggerShake(0.6);
            if (window.soundEngine) window.soundEngine.playSuperHit();
            proj.lifespan = 0;
          }
        }
      });

      if (proj.lifespan <= 0 || Math.abs(proj.group.position.x) > 15) {
        this.scene.remove(proj.group);
        this.projectiles3D.splice(i, 1);
      }
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

window.GameScene3D = GameScene3D;
