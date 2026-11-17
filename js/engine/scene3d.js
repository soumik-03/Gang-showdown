/**
 * ===================================================================
 *  FIGHTKARO-STYLE 3D FESTIVE ARENA & CINEMATIC STAGE (Three.js)
 * ===================================================================
 *  Authentic FightKaro arena environment:
 *    - Checkered sandstone tiled arena floor
 *    - Central vibrant floral Rangoli Mandala battle emblem
 *    - Warm glowing earthen lamps (diyas/candles) along the perimeter
 *    - Grand classical stone colonnade rotunda with pillars in the background
 *    - Colorful audience crowd holding rally & satirical signboards
 *    - Floating festive firework embers and celebratory sparks
 *    - Dynamic tracking camera with zoom framing and impact shake
 *    - 3D to 2D screen projection helper for comic speech bubbles!
 * ===================================================================
 */

class GameScene3D {
  constructor(container) {
    this.container = container;

    // 1. Scene with atmospheric evening twilight fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x130f26); // Deep royal purple twilight
    this.scene.fog = new THREE.FogExp2(0x130f26, 0.018);

    // 2. Camera (Wide dynamic tracking perspective)
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
    this.targetCameraPos = new THREE.Vector3(0, 3.2, 13.5);
    this.targetLookAt = new THREE.Vector3(0, 1.8, 0);

    // 4. Lighting & Stage
    this.setupLighting();
    this.buildFestiveArena();

    // 5. Particles & 3D Projectiles
    this.particles = [];
    this.projectiles3D = [];
    this.diyas = [];

    window.addEventListener('resize', () => this.onResize());
  }

  setupLighting() {
    // Ambient Light (Warm festive glow)
    const ambient = new THREE.AmbientLight(0xfff0e6, 0.65);
    this.scene.add(ambient);

    // Key Overhead Light (Casts soft directional human shadows)
    this.mainLight = new THREE.DirectionalLight(0xfffaed, 1.35);
    this.mainLight.position.set(4, 16, 9);
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

    // Atmospheric Backlight / Rim
    const rimLight = new THREE.DirectionalLight(0xf368e0, 0.7);
    rimLight.position.set(-6, 9, -9);
    this.scene.add(rimLight);
  }

  // ===================================================================
  // BUILD FESTIVE ARENA (RANGOLI FLOOR, DIYAS, COLONNADE, CROWD)
  // ===================================================================
  buildFestiveArena() {
    const stageWidth = 26;
    const stageDepth = 12;
    const stageThickness = 0.6;

    // 1. Checkered Sandstone Floor Texture
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const fctx = floorCanvas.getContext('2d');
    const tileSize = 64;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        fctx.fillStyle = (r + c) % 2 === 0 ? '#e0d5c1' : '#c7b299';
        fctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
        // Subtle tile seam border
        fctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
        fctx.lineWidth = 2;
        fctx.strokeRect(c * tileSize, r * tileSize, tileSize, tileSize);
      }
    }
    const floorTexture = new THREE.CanvasTexture(floorCanvas);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(6, 3);

    const platformMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.65,
      metalness: 0.1
    });

    this.platform = new THREE.Mesh(
      new THREE.BoxGeometry(stageWidth, stageThickness, stageDepth),
      platformMat
    );
    this.platform.position.y = -stageThickness / 2;
    this.platform.receiveShadow = true;
    this.scene.add(this.platform);

    // 2. Central Rangoli Mandala Battle Emblem
    this.buildRangoliMandala();

    // 3. Earthen Clay Lamps (Diyas) along the stage perimeter
    this.buildPerimeterDiyas(stageWidth, stageDepth);

    // 4. Grand Classical Colonnade Rotunda (Pillars & Lanterns)
    this.buildBackgroundColonnade();

    // 5. Crowd with Placards & Signboards
    this.buildSpectatorCrowd();

    // 6. Ground below stage
    const groundGeo = new THREE.PlaneGeometry(120, 80);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x0a0c14, roughness: 0.95 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -stageThickness - 0.05;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  // --- PROCEDURAL VIBRANT RANGOLI MANDALA EMBLEM ---
  buildRangoliMandala() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    const cx = 512;
    const cy = 512;

    // Draw concentric festive floral rings
    const drawFlowerRing = (radius, numPetals, petalLength, color, strokeColor) => {
      ctx.fillStyle = color;
      ctx.strokeStyle = strokeColor || '#ffffff';
      ctx.lineWidth = 4;
      for (let i = 0; i < numPetals; i++) {
        const angle = (i * 2 * Math.PI) / numPetals;
        const px = cx + Math.cos(angle) * radius;
        const py = cy + Math.sin(angle) * radius;
        ctx.beginPath();
        ctx.arc(px, py, petalLength, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    };

    // Outer decorative scallops (Golden Yellow)
    drawFlowerRing(380, 24, 75, '#f1c40f', '#f39c12');
    // Second ring (Vivid Royal Blue)
    drawFlowerRing(300, 20, 65, '#2980b9', '#1abc9c');
    // Third ring (Hot Magenta / Pink)
    drawFlowerRing(220, 16, 55, '#e84393', '#fd79a8');
    // Fourth ring (Bright Spring Green)
    drawFlowerRing(140, 12, 45, '#2ecc71', '#27ae60');

    // Central Sun / Lotus Disc
    ctx.beginPath();
    ctx.arc(cx, cy, 90, 0, Math.PI * 2);
    ctx.fillStyle = '#e67e22';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#f1c40f';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 45, 0, Math.PI * 2);
    ctx.fillStyle = '#f39c12';
    ctx.fill();

    const mandalaTex = new THREE.CanvasTexture(canvas);
    const mandalaGeo = new THREE.PlaneGeometry(9.5, 9.5);
    const mandalaMat = new THREE.MeshBasicMaterial({
      map: mandalaTex,
      transparent: true,
      opacity: 0.92,
      depthWrite: false
    });
    const mandalaMesh = new THREE.Mesh(mandalaGeo, mandalaMat);
    mandalaMesh.rotation.x = -Math.PI / 2;
    mandalaMesh.position.set(0, 0.02, 0);
    this.scene.add(mandalaMesh);
  }

  // --- EARTHEN DIYAS / CLAY LAMPS ALONG STAGE RIM ---
  buildPerimeterDiyas(stageW, stageD) {
    const numDiyas = 14;
    const clayMat = new THREE.MeshStandardMaterial({ color: 0x8c4627, roughness: 0.8 });
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffa502 });

    for (let i = 0; i < numDiyas; i++) {
      const x = -stageW * 0.44 + (i / (numDiyas - 1)) * stageW * 0.88;
      const z = stageD * 0.46;

      const diyaGroup = new THREE.Group();
      diyaGroup.position.set(x, 0.04, z);

      // Clay bowl
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.08, 0.08, 8), clayMat);
      bowl.castShadow = true;
      diyaGroup.add(bowl);

      // Flame sphere
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), flameMat);
      flame.scale.set(0.8, 1.4, 0.8);
      flame.position.y = 0.08;
      diyaGroup.add(flame);

      this.scene.add(diyaGroup);
      this.diyas.push(flame);
    }

    // Warm ambient perimeter point light
    const diyaLight = new THREE.PointLight(0xff9f1a, 1.2, 18);
    diyaLight.position.set(0, 1.2, stageD * 0.45);
    this.scene.add(diyaLight);
  }

  // --- BACKGROUND GRAND COLONNADE ROTUNDA ---
  buildBackgroundColonnade() {
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x8a6d4b, // Warm classical sandstone
      roughness: 0.75,
      metalness: 0.1
    });

    const numPillars = 14;
    const radius = 18;
    const pillarHeight = 14;

    for (let i = 0; i < numPillars; i++) {
      const angle = Math.PI * 0.15 + (i / (numPillars - 1)) * Math.PI * 0.7;
      const x = Math.cos(angle) * radius;
      const z = -Math.sin(angle) * radius * 0.75 - 6;

      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.65, pillarHeight, 14),
        pillarMat
      );
      col.position.set(x, pillarHeight / 2 - 1, z);
      col.castShadow = true;
      col.receiveShadow = true;
      this.scene.add(col);

      // Hanging celebratory lantern (Kandil) on alternate pillars
      if (i % 2 === 1) {
        const lanternMat = new THREE.MeshBasicMaterial({
          color: i % 4 === 1 ? 0xff4757 : 0x00d2d3
        });
        const lantern = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.45, 0),
          lanternMat
        );
        lantern.position.set(x, 7.5, z + 0.8);
        this.scene.add(lantern);
      }
    }

    // Upper Colonnade Arch Dome Header
    const archRoof = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 0.88, 0.65, 8, 24, Math.PI * 0.75),
      pillarMat
    );
    archRoof.rotation.x = Math.PI / 2;
    archRoof.rotation.z = Math.PI * 0.12;
    archRoof.position.set(0, pillarHeight - 1, -12);
    this.scene.add(archRoof);
  }

  // --- SPECTATOR CROWD & SATIRICAL PLACARDS ---
  buildSpectatorCrowd() {
    const crowdMatColors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c];
    const placardTexts = ['VOTE!', 'BADLAV', 'SUNO!', 'POWER!', 'JAI HIND', 'GANG!'];

    const spawnCrowdSide = (baseX, zMin, zMax) => {
      for (let i = 0; i < 18; i++) {
        const x = baseX + (Math.random() - 0.5) * 4;
        const z = zMin + Math.random() * (zMax - zMin);

        // Crowd silhouette capsule
        const color = crowdMatColors[i % crowdMatColors.length];
        const person = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.28, 1.6, 8),
          new THREE.MeshStandardMaterial({ color: color, roughness: 0.9 })
        );
        person.position.set(x, 0.8, z);
        person.castShadow = true;
        this.scene.add(person);

        // Head
        const head = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0x576574, roughness: 0.8 })
        );
        head.position.set(x, 1.8, z);
        this.scene.add(head);

        // Signboard Placard on some spectators
        if (i % 3 === 0) {
          const signCanvas = document.createElement('canvas');
          signCanvas.width = 256;
          signCanvas.height = 128;
          const sctx = signCanvas.getContext('2d');
          sctx.fillStyle = '#ffffff';
          sctx.fillRect(0, 0, 256, 128);
          sctx.strokeStyle = '#2c3e50';
          sctx.lineWidth = 8;
          sctx.strokeRect(4, 4, 248, 120);
          sctx.fillStyle = '#c0392b';
          sctx.font = 'bold 36px sans-serif';
          sctx.textAlign = 'center';
          sctx.textBaseline = 'middle';
          sctx.fillText(placardTexts[i % placardTexts.length], 128, 64);

          const signTex = new THREE.CanvasTexture(signCanvas);
          const sign = new THREE.Mesh(
            new THREE.PlaneGeometry(1.2, 0.6),
            new THREE.MeshBasicMaterial({ map: signTex })
          );
          sign.position.set(x, 2.6, z);
          sign.rotation.y = baseX < 0 ? 0.35 : -0.35;
          this.scene.add(sign);
        }
      }
    };

    spawnCrowdSide(-16, -2, 5); // Left audience
    spawnCrowdSide(16, -2, 5);  // Right audience
  }

  // --- 3D TO 2D SCREEN PROJECTION HELPER (FOR COMIC SPEECH BUBBLES) ---
  toScreenPosition(worldPos) {
    const vector = worldPos.clone().project(this.camera);
    return {
      x: (vector.x * 0.5 + 0.5) * window.innerWidth,
      y: (-vector.y * 0.5 + 0.5) * window.innerHeight
    };
  }

  // --- DYNAMIC CAMERA TRACKING & CINEMATIC FRAMING ---
  updateCamera(p1Pos, p2Pos, isCinematic = false) {
    // Center point between the two fighters
    const midX = (p1Pos.x + p2Pos.x) / 2;
    const midY = (p1Pos.y + p2Pos.y) / 2;
    const dist = Math.abs(p1Pos.x - p2Pos.x);

    // Camera zooms in when close, pulls back when far
    const targetZ = Math.max(10.5, Math.min(16.5, 9.5 + dist * 0.45));
    const targetY = Math.max(2.8, 2.5 + midY * 0.4);

    if (isCinematic) {
      this.targetCameraPos.set(midX, targetY - 0.2, targetZ - 3.5);
    } else {
      this.targetCameraPos.set(midX * 0.55, targetY, targetZ);
    }

    this.targetLookAt.set(midX, midY + 1.6, 0);

    // Smooth lerp
    this.camera.position.lerp(this.targetCameraPos, 0.08);
    this.camera.lookAt(this.targetLookAt);

    // Apply Camera Shake
    if (this.cameraShake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake *= 0.88;
      if (this.cameraShake < 0.01) this.cameraShake = 0;
    }

    // Subtle flicker on perimeter diya flames
    const time = Date.now() * 0.008;
    this.diyas.forEach((flame, idx) => {
      const flicker = 1.0 + Math.sin(time + idx * 1.5) * 0.15;
      flame.scale.set(0.8 * flicker, 1.4 * flicker, 0.8 * flicker);
    });
  }

  triggerShake(intensity = 0.5) {
    this.cameraShake = Math.max(this.cameraShake, intensity);
  }

  spawn3DHitSparks(pos, color = 0xffa502, count = 15) {
    const sparkGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.2) * 8,
          (Math.random() - 0.5) * 4
        )
      );
    }

    sparkGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: color,
      size: 0.25,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending
    });

    const pSystem = new THREE.Points(sparkGeo, sparkMat);
    this.scene.add(pSystem);
    this.particles.push({ system: pSystem, velocities: velocities, life: 0.35, maxLife: 0.35 });
  }

  updateProjectiles(fighters) {
    const delta = 0.016;

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;
      if (p.life <= 0) {
        this.scene.remove(p.system);
        this.particles.splice(i, 1);
        continue;
      }

      const pos = p.system.geometry.attributes.position;
      const decay = p.life / p.maxLife;
      p.system.material.opacity = decay;

      for (let j = 0; j < p.velocities.length; j++) {
        pos.setX(j, pos.getX(j) + p.velocities[j].x * delta);
        pos.setY(j, pos.getY(j) + p.velocities[j].y * delta);
        pos.setZ(j, pos.getZ(j) + p.velocities[j].z * delta);
        p.velocities[j].y -= 9.8 * delta;
      }
      pos.needsUpdate = true;
    }

    // Update 3D Projectiles
    for (let i = this.projectiles3D.length - 1; i >= 0; i--) {
      const proj = this.projectiles3D[i];
      proj.mesh.position.addScaledVector(proj.vel, delta);
      proj.life -= delta;

      // Hit checks
      const target = fighters.find(f => f !== proj.owner);
      if (target && !target.isDead) {
        const d = proj.mesh.position.distanceTo(new THREE.Vector3(target.pos.x, target.pos.y + 1.4, 0));
        if (d < 1.3) {
          target.takeDamage(proj.damage, proj.owner, true);
          this.spawn3DHitSparks(proj.mesh.position, 0xff3838, 30);
          this.triggerShake(0.65);
          this.scene.remove(proj.mesh);
          this.projectiles3D.splice(i, 1);
          continue;
        }
      }

      if (proj.life <= 0) {
        this.scene.remove(proj.mesh);
        this.projectiles3D.splice(i, 1);
      }
    }
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}

window.GameScene3D = GameScene3D;
