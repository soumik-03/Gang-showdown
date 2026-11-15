/**
 * ===================================================================
 *  3D ARENA & CINEMATIC FIGHT STAGE (Three.js)
 * ===================================================================
 *  Clean, open fighting stage (NO boxing ring, NO ropes).
 *  Atmospheric lighting, polished floor, shadows, and dynamic camera.
 */

class GameScene3D {
  constructor(container) {
    this.container = container;

    // 1. Scene with atmospheric fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0c12);
    this.scene.fog = new THREE.FogExp2(0x0a0c12, 0.02);

    // 2. Camera (Wide dynamic 3D fighting game camera)
    this.camera = new THREE.PerspectiveCamera(
      42,
      window.innerWidth / window.innerHeight,
      0.1,
      120
    );
    this.camera.position.set(0, 3.2, 13.5);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    this.cameraShake = 0;

    // 4. Lighting & Stage
    this.setupLighting();
    this.buildOpenStage();

    // 5. Particles & 3D Projectiles
    this.particles = [];
    this.projectiles3D = [];

    window.addEventListener('resize', () => this.onResize());
  }

  setupLighting() {
    // Ambient Light
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    this.scene.add(ambient);

    // Key Overhead Light (Casts soft human shadows)
    this.mainLight = new THREE.DirectionalLight(0xfff6e6, 1.4);
    this.mainLight.position.set(3, 16, 9);
    this.mainLight.castShadow = true;
    this.mainLight.shadow.mapSize.width = 2048;
    this.mainLight.shadow.mapSize.height = 2048;
    this.mainLight.shadow.camera.near = 1;
    this.mainLight.shadow.camera.far = 35;
    this.mainLight.shadow.camera.left = -14;
    this.mainLight.shadow.camera.right = 14;
    this.mainLight.shadow.camera.top = 10;
    this.mainLight.shadow.camera.bottom = -4;
    this.mainLight.shadow.bias = -0.0004;
    this.scene.add(this.mainLight);

    // Rim / Backlight for dramatic character silhouettes
    const rimLight = new THREE.DirectionalLight(0x70a1ff, 0.8);
    rimLight.position.set(-5, 8, -8);
    this.scene.add(rimLight);

    // P1 Warm Red Accent Glow
    this.p1Glow = new THREE.PointLight(0xff4757, 1.2, 22);
    this.p1Glow.position.set(-10, 4, 3);
    this.scene.add(this.p1Glow);

    // P2 Electric Blue Accent Glow
    this.p2Glow = new THREE.PointLight(0x3742fa, 1.2, 22);
    this.p2Glow.position.set(10, 4, 3);
    this.scene.add(this.p2Glow);
  }

  // --- OPEN STAGE (NO RINGS, NO ROPES, CLEAN VIEW) ---
  buildOpenStage() {
    // 1. Polished Fighting Platform (Wide, sleek stone & asphalt slab)
    const stageWidth = 26;
    const stageDepth = 12;
    const stageThickness = 0.6;

    const platformGeo = new THREE.BoxGeometry(stageWidth, stageThickness, stageDepth);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x181d26,
      roughness: 0.55,
      metalness: 0.25
    });
    this.platform = new THREE.Mesh(platformGeo, platformMat);
    this.platform.position.y = -stageThickness / 2;
    this.platform.receiveShadow = true;
    this.scene.add(this.platform);

    // 2. Stage Edge Neon Accent Lines (Sleek sci-fi / street brawler styling)
    const edgeFrontGeo = new THREE.BoxGeometry(stageWidth, 0.06, 0.1);
    const edgeFrontMat = new THREE.MeshBasicMaterial({ color: 0xffa502 });
    const edgeFront = new THREE.Mesh(edgeFrontGeo, edgeFrontMat);
    edgeFront.position.set(0, 0.01, stageDepth / 2);
    this.scene.add(edgeFront);

    const edgeBack = new THREE.Mesh(edgeFrontGeo, new THREE.MeshBasicMaterial({ color: 0x00f2fe }));
    edgeBack.position.set(0, 0.01, -stageDepth / 2);
    this.scene.add(edgeBack);

    // 3. Ground Arena Floor Below Stage
    const groundGeo = new THREE.PlaneGeometry(120, 80);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x080a0f,
      roughness: 0.95
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -stageThickness - 0.05;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 4. Background City Skyline & Street Pillars
    this.buildAtmosphericBackground();
  }

  buildAtmosphericBackground() {
    // Distant City Silhouettes / Architecture
    const bldgMat = new THREE.MeshStandardMaterial({
      color: 0x0d121c,
      roughness: 0.9
    });

    const buildingDefs = [
      { x: -28, z: -25, w: 10, h: 28, d: 8 },
      { x: -16, z: -22, w: 8, h: 22, d: 8 },
      { x: -6, z: -28, w: 12, h: 35, d: 8 },
      { x: 8, z: -24, w: 9, h: 26, d: 8 },
      { x: 19, z: -26, w: 11, h: 30, d: 8 },
      { x: 30, z: -22, w: 8, h: 20, d: 8 }
    ];

    buildingDefs.forEach(b => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), bldgMat);
      mesh.position.set(b.x, b.h / 2 - 4, b.z);
      this.scene.add(mesh);

      // Random glowing windows
      if (Math.random() < 0.8) {
        const winGeo = new THREE.PlaneGeometry(b.w * 0.7, 0.4);
        const winMat = new THREE.MeshBasicMaterial({ color: 0xfffa65 });
        const win = new THREE.Mesh(winGeo, winMat);
        win.position.set(b.x, b.h * 0.6, b.z + b.d / 2 + 0.05);
        this.scene.add(win);
      }
    });

    // Street Lamps with warm amber lights
    [-11, 11].forEach(x => {
      const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 7.5, 8);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x3d4451 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(x, 3.75, -5.5);
      pole.castShadow = true;
      this.scene.add(pole);

      const lampLight = new THREE.PointLight(0xffc048, 1.2, 14);
      lampLight.position.set(x, 7.5, -5.2);
      this.scene.add(lampLight);

      const lampHead = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffd32a }));
      lampHead.position.set(x, 7.5, -5.2);
      this.scene.add(lampHead);
    });
  }

  // --- DYNAMIC 3D CAMERA TRACKING ---
  updateCamera(p1Pos, p2Pos, isCinematic = false) {
    const midX = (p1Pos.x + p2Pos.x) / 2;
    const midY = (p1Pos.y + p2Pos.y) / 2;
    const dist = Math.abs(p1Pos.x - p2Pos.x);

    let targetZ = 8.5 + dist * 0.55;
    let targetY = 2.8 + dist * 0.1;
    let targetX = midX * 0.75;

    if (isCinematic) {
      targetZ = 5.2;
      targetY = 2.0;
      targetX = p1Pos.x * 0.85;
    }

    this.camera.position.x += (targetX - this.camera.position.x) * 0.08;
    this.camera.position.y += (targetY - this.camera.position.y) * 0.08;
    this.camera.position.z += (targetZ - this.camera.position.z) * 0.08;

    if (this.cameraShake > 0.01) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake *= 0.88;
    } else {
      this.cameraShake = 0;
    }

    this.camera.lookAt(midX, midY + 1.25, 0);
  }

  triggerShake(intensity = 0.45) {
    this.cameraShake = Math.max(this.cameraShake, intensity);
  }

  // --- 3D PARTICLES ---
  spawn3DHitSparks(pos, color = 0xffdd59, count = 20) {
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.06 + Math.random() * 0.06, 6, 6);
      const mat = new THREE.MeshBasicMaterial({ color: color });
      const p = new THREE.Mesh(geo, mat);
      p.position.copy(pos);

      const angle = Math.random() * Math.PI * 2;
      const speed = 3.5 + Math.random() * 6.5;
      this.scene.add(p);

      this.particles.push({
        mesh: p,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 2.5,
        vz: (Math.random() - 0.5) * 4,
        life: 1.0,
        decay: 0.05 + Math.random() * 0.04
      });
    }
  }

  spawn3DSuperProjectile(options) {
    const group = new THREE.Group();
    group.position.set(options.x, options.y, options.z || 0);

    const coreGeo = new THREE.SphereGeometry(options.radius || 0.48, 14, 14);
    const coreMat = new THREE.MeshBasicMaterial({ color: options.color || 0xff4757 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    const light = new THREE.PointLight(options.color || 0xff4757, 2.5, 9);
    group.add(light);

    this.scene.add(group);

    this.projectiles3D.push({
      group: group,
      vx: options.vx,
      damage: options.damage,
      owner: options.owner,
      color: options.color,
      lifespan: 140,
      radius: options.radius || 0.48
    });
  }

  updateProjectiles(fighters) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.mesh.position.x += p.vx * 0.016;
      p.mesh.position.y += p.vy * 0.016;
      p.mesh.position.z += p.vz * 0.016;
      p.vy -= 9.8 * 0.016;
      p.life -= p.decay;

      p.mesh.scale.setScalar(Math.max(0.001, p.life));

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.projectiles3D.length - 1; i >= 0; i--) {
      const proj = this.projectiles3D[i];
      proj.group.position.x += proj.vx * 0.016;
      proj.lifespan--;

      if (Math.random() < 0.6) {
        this.spawn3DHitSparks(proj.group.position, proj.color, 2);
      }

      fighters.forEach(target => {
        if (target !== proj.owner && !target.isDead) {
          const dx = proj.group.position.x - target.pos.x;
          const dy = proj.group.position.y - (target.pos.y + 1.2);
          const dist = Math.hypot(dx, dy);

          if (dist < proj.radius + 0.65) {
            target.takeDamage(proj.damage, proj.owner, true);
            this.spawn3DHitSparks(proj.group.position, proj.color, 32);
            this.triggerShake(0.65);
            if (window.soundEngine) window.soundEngine.playSuperHit();
            proj.lifespan = 0;
          }
        }
      });

      if (proj.lifespan <= 0 || Math.abs(proj.group.position.x) > 16) {
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
