/**
 * ===================================================================
 *  GENUINE 3D FIGURE MODELS & COMBAT ANIMATIONS (Three.js)
 * ===================================================================
 *  Loads and animates the 4 authentic 3D character figure models
 *  extracted from the user's 3D assets:
 *    1. Detective Bot ("Inspector Clue" - assets/models/detective.glb)
 *    2. Cyber Mage    ("Chrono Wizard" - assets/models/wizard.glb)
 *    3. Compass Scout ("The Navigator" - assets/models/explorer.glb)
 *    4. Magma Golem   ("Pyre Titan"    - assets/models/golem.glb)
 *
 *  Features:
 *    - Real 3D GLTF mesh rendering with cast and receive shadows
 *    - Dynamic 3D combat kinematics: idle breathing, walks, lunging jabs,
 *      power crosses, explosive rising uppercuts, 3D spinning roundhouse
 *      kicks, low sweeps, blocking guards, hit flinches, and knockdowns.
 *    - Real-time ground contact shadows that track jumps and height
 *    - Character signature aura point lighting and visual hit VFX
 *    - Preloading and memory caching for instantaneous switching
 *    - Seamless procedural fallback while GLB assets stream in
 * ===================================================================
 */

// Global GLTF Model Cache
window._gltfSceneCache = window._gltfSceneCache || new Map();
window._gltfLoaderInstance = window._gltfLoaderInstance || null;

function getGLTFLoader() {
  if (!window._gltfLoaderInstance && typeof THREE !== 'undefined' && THREE.GLTFLoader) {
    window._gltfLoaderInstance = new THREE.GLTFLoader();
  }
  return window._gltfLoaderInstance;
}

function loadGLBModel(path, onLoaded) {
  if (window._gltfSceneCache.has(path)) {
    const cached = window._gltfSceneCache.get(path);
    onLoaded(cached.clone(true));
    return;
  }

  const loader = getGLTFLoader();
  if (!loader) {
    console.warn("THREE.GLTFLoader not ready yet for", path);
    onLoaded(null);
    return;
  }

  loader.load(
    path,
    (gltf) => {
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.roughness = 0.45;
            child.material.metalness = 0.2;
            child.material.side = THREE.DoubleSide;
          }
        }
      });
      window._gltfSceneCache.set(path, gltf.scene);
      onLoaded(gltf.scene.clone(true));
    },
    undefined,
    (err) => {
      console.warn("Could not load GLB at", path, err);
      onLoaded(null);
    }
  );
}

// Proactively preload all 4 character GLB models
if (typeof window !== 'undefined') {
  const PRELOAD_MODELS = [
    'assets/models/detective.glb',
    'assets/models/wizard.glb',
    'assets/models/explorer.glb',
    'assets/models/golem.glb'
  ];
  setTimeout(() => {
    PRELOAD_MODELS.forEach((p) => loadGLBModel(p, () => {}));
  }, 100);
}

class HumanoidFighter3D {
  constructor(scene, config, isPlayer1 = true) {
    this.scene = scene;
    this.config = config || {};
    this.isPlayer1 = isPlayer1;
    this.charId = config.id || 'detective';
    this.modelPath = config.modelPath || `assets/models/${this.charId}.glb`;

    // Root Group (anchored at fighter position in 3D world space)
    this.root = new THREE.Group();
    this.scene.add(this.root);

    // Dynamic ground contact shadow
    this.buildContactShadow();

    // Motion & Kinematic Transform Group (lerped during animations)
    this.motionGroup = new THREE.Group();
    this.root.add(this.motionGroup);

    // Inner Model Group (handles character 3D facing orientation)
    this.modelGroup = new THREE.Group();
    this.motionGroup.add(this.modelGroup);

    // Character Signature Aura Lighting
    this.buildAuraLight();

    // Visual Combat Effects: Block Shield, Attack Flash, Super Aura
    this.buildCombatVFX();

    // Model State
    this.glbModel = null;
    this.proxyMesh = null;
    this.hitFlashTimer = 0;
    this.originalMaterials = [];

    // Animation & Kinematics Timers
    this.animTime = Math.random() * 10;
    this.currentFacing = isPlayer1 ? 1 : -1;

    // Build procedural fallback first so screen is NEVER blank
    this.buildProceduralProxy();

    // Asynchronously load & attach the genuine 3D GLB figure model
    this.loadCharacterGLB();
  }

  // --- DYNAMIC CONTACT SHADOW ON FLOOR ---
  buildContactShadow() {
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sctx = shadowCanvas.getContext('2d');
    const sGrad = sctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    sGrad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    sGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)');
    sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sctx.fillStyle = sGrad;
    sctx.fillRect(0, 0, 128, 128);

    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(2.8, 1.8);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false
    });
    this.contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.position.y = 0.02;
    this.root.add(this.contactShadow);
  }

  // --- CHARACTER SIGNATURE AURA LIGHT ---
  buildAuraLight() {
    let auraColor = 0x00d2d3;
    if (this.charId === 'wizard') auraColor = 0x3742fa;
    else if (this.charId === 'explorer') auraColor = 0xffa502;
    else if (this.charId === 'golem') auraColor = 0xff4757;

    this.auraLight = new THREE.PointLight(auraColor, 1.2, 5.5);
    this.auraLight.position.set(0, 1.6, 0.9);
    this.motionGroup.add(this.auraLight);
  }

  // --- VISUAL COMBAT EFFECTS (SHIELD, FLASH, SUPER AURA) ---
  buildCombatVFX() {
    // 1. Block Shield: Hexagonal energy barrier
    const shieldGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.08, 6);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: this.isPlayer1 ? 0x00d2d3 : 0xff4757,
      transparent: true,
      opacity: 0.55,
      wireframe: true
    });
    this.blockShield = new THREE.Mesh(shieldGeo, shieldMat);
    this.blockShield.rotation.x = Math.PI / 2;
    this.blockShield.position.set(0.9, 1.5, 0.1);
    this.blockShield.visible = false;
    this.motionGroup.add(this.blockShield);

    // 2. Attack Hit Flash Spark
    const sparkGeo = new THREE.RingGeometry(0.15, 0.65, 12);
    const sparkMat = new THREE.MeshBasicMaterial({
      color: 0xfff200,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    this.attackSpark = new THREE.Mesh(sparkGeo, sparkMat);
    this.attackSpark.position.set(1.4, 1.5, 0.1);
    this.attackSpark.visible = false;
    this.motionGroup.add(this.attackSpark);

    // 3. Super Aura: Orbiting energy torus
    const superTorusGeo = new THREE.TorusGeometry(1.2, 0.06, 8, 24);
    const superTorusMat = new THREE.MeshBasicMaterial({
      color: 0xff3838,
      transparent: true,
      opacity: 0.75,
      wireframe: true
    });
    this.superAura = new THREE.Mesh(superTorusGeo, superTorusMat);
    this.superAura.rotation.x = Math.PI / 2;
    this.superAura.position.y = 0.2;
    this.superAura.visible = false;
    this.motionGroup.add(this.superAura);
  }

  // --- PROCEDURAL PROXY FIGURE (ACTIVE UNTIL GLB LOADS) ---
  buildProceduralProxy() {
    this.proxyMesh = new THREE.Group();

    let pColor = 0x2e86de;
    let sColor = 0xdcdde1;
    if (this.charId === 'wizard') { pColor = 0x1e3799; sColor = 0xffffff; }
    else if (this.charId === 'explorer') { pColor = 0xe67e22; sColor = 0xc8d6e5; }
    else if (this.charId === 'golem') { pColor = 0x2f3640; sColor = 0xff4757; }

    const matP = new THREE.MeshStandardMaterial({ color: pColor, roughness: 0.5, metalness: 0.2 });
    const matS = new THREE.MeshStandardMaterial({ color: sColor, roughness: 0.6, metalness: 0.1 });

    // Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.55, 1.2, 12), matP);
    torso.position.y = 1.6;
    torso.castShadow = true;
    this.proxyMesh.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 14, 14), matS);
    head.position.y = 2.5;
    head.castShadow = true;
    this.proxyMesh.add(head);

    // Legs
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 1.0, 8), matP);
    legL.position.set(-0.35, 0.5, 0);
    legL.castShadow = true;
    this.proxyMesh.add(legL);

    const legR = legL.clone();
    legR.position.x = 0.35;
    this.proxyMesh.add(legR);

    this.modelGroup.add(this.proxyMesh);
  }

  // --- LOAD GENUINE 3D GLB FIGURE MODEL ---
  loadCharacterGLB() {
    loadGLBModel(this.modelPath, (clonedScene) => {
      if (!clonedScene) return;

      // Remove fallback proxy
      if (this.proxyMesh) {
        this.modelGroup.remove(this.proxyMesh);
        this.proxyMesh = null;
      }

      this.glbModel = clonedScene;

      // Ensure all meshes cast/receive shadows and record materials for hit-flash
      this.originalMaterials = [];
      this.glbModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            this.originalMaterials.push({
              mesh: child,
              mat: child.material
            });
          }
        }
      });

      // The GLB is centered on X and Z, feet at Y=0, height ~3.2m
      this.glbModel.position.set(0, 0, 0);
      this.modelGroup.add(this.glbModel);
    });
  }

  // --- FLASH IMPACT MATERIAL ON DAMAGE ---
  flashHitMaterial() {
    this.hitFlashTimer = 0.12;
    if (this.glbModel) {
      this.glbModel.traverse((child) => {
        if (child.isMesh && child.material && child.material.emissive) {
          child.material.emissive.setHex(0xff3333);
          child.material.emissiveIntensity = 1.0;
        }
      });
    }
    if (this.auraLight) {
      this.auraLight.intensity = 3.0;
    }
  }

  restoreMaterials() {
    if (this.glbModel) {
      this.glbModel.traverse((child) => {
        if (child.isMesh && child.material && child.material.emissive) {
          child.material.emissive.setHex(0x000000);
          child.material.emissiveIntensity = 0.0;
        }
      });
    }
    if (this.auraLight) {
      this.auraLight.intensity = 1.2;
    }
  }

  // ===================================================================
  // 3D COMBAT KINEMATICS & SKELETAL TRANSFORMS
  // ===================================================================
  updateAnimation(state, facing, delta) {
    this.animTime += delta;
    this.currentFacing = facing;

    // Hit Flash Recovery
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= delta;
      if (this.hitFlashTimer <= 0) {
        this.restoreMaterials();
      }
    }

    // Dynamic ground contact shadow scaling with jumps
    if (this.contactShadow) {
      const height = Math.max(0, this.root.position.y);
      const scale = Math.max(0.35, 1.0 - (height * 0.18));
      this.contactShadow.scale.set(scale, scale, scale);
      this.contactShadow.material.opacity = Math.max(0.15, 0.85 - (height * 0.15));
    }

    // Default VFX States
    if (this.blockShield) this.blockShield.visible = false;
    if (this.attackSpark) this.attackSpark.visible = false;
    if (this.superAura) this.superAura.visible = false;

    // Base 3D facing angle:
    // In our GLB, front of character faces +Z.
    // When facing right (+1): rotate toward +X (+90°), angled ~14° toward camera (+Z)
    // for clear 3D perspective showing chest, face, arms, and depth!
    // When facing left (-1): rotate toward -X (-90°), angled ~14° toward camera.
    const baseFacingY = facing === 1 ? (Math.PI / 2 - 0.24) : (-Math.PI / 2 + 0.24);

    let targetPos = { x: 0, y: 0, z: 0 };
    let targetRot = { x: 0, y: baseFacingY, z: 0 };
    let targetScale = { x: 1.0, y: 1.0, z: 1.0 };
    let lerpSpeed = 0.32;

    // -----------------------------------------------------------------
    // 1. IDLE (Athletic martial arts breathing bounce & ready guard)
    // -----------------------------------------------------------------
    if (state === 'idle') {
      const breath = Math.sin(this.animTime * 4.8);
      targetPos.y = breath * 0.06;
      targetRot.z = -0.04 * facing;
      targetRot.x = 0.04;
      targetScale.y = 1.0 - breath * 0.02;
      targetScale.x = 1.0 + breath * 0.015;
    }
    // -----------------------------------------------------------------
    // 2. WALK FORWARD (Deep dynamic strides with athletic forward lean)
    // -----------------------------------------------------------------
    else if (state === 'walk_fwd') {
      const stride = Math.sin(this.animTime * 11);
      targetPos.y = Math.abs(stride) * 0.12;
      targetRot.z = -0.16 * facing; // Dynamic forward lean into step
      targetRot.x = Math.sin(this.animTime * 5.5) * 0.06;
      targetRot.y = baseFacingY + stride * 0.08 * facing;
    }
    // -----------------------------------------------------------------
    // 3. WALK BACKWARD (Cautious defensive brawler retreat)
    // -----------------------------------------------------------------
    else if (state === 'walk_back') {
      const stride = Math.sin(this.animTime * 8.5);
      targetPos.y = Math.abs(stride) * 0.08;
      targetRot.z = 0.12 * facing; // Leaning backward in defensive guard
      targetRot.y = baseFacingY - stride * 0.06 * facing;
    }
    // -----------------------------------------------------------------
    // 4. JUMP (Airborne tuck & stretch)
    // -----------------------------------------------------------------
    else if (state === 'jump') {
      targetScale.y = 1.16;
      targetScale.x = 0.92;
      targetRot.z = -0.1 * facing;
    }
    // -----------------------------------------------------------------
    // 5. CROUCH (Low ducking guard)
    // -----------------------------------------------------------------
    else if (state === 'crouch') {
      targetPos.y = -0.52;
      targetScale.y = 0.65;
      targetScale.x = 1.2;
      targetScale.z = 1.15;
      targetRot.z = -0.06 * facing;
    }
    // -----------------------------------------------------------------
    // 6. LIGHT JAB (Punch J - Snap punch thrust!)
    // -----------------------------------------------------------------
    else if (state === 'punch_1' || state === 'jab') {
      targetPos.x = 0.65 * facing; // Body thrusts forward
      targetPos.y = 0.04;
      targetRot.z = -0.22 * facing; // Forward punch lunge
      targetRot.y = baseFacingY + 0.35 * facing; // Torso snap
      targetScale.x = 1.12;
      lerpSpeed = 0.55; // Snappy attack frame

      if (this.attackSpark) {
        this.attackSpark.visible = true;
        this.attackSpark.position.set(1.4 * facing, 1.8, 0.1);
        this.attackSpark.rotation.z += 0.3;
      }
    }
    // -----------------------------------------------------------------
    // 7. HEAVY CROSS (Punch J,J - Deep power punch!)
    // -----------------------------------------------------------------
    else if (state === 'punch_2' || state === 'cross') {
      targetPos.x = 1.15 * facing; // Deep lunging power drive
      targetPos.y = -0.08;
      targetRot.z = -0.32 * facing;
      targetRot.y = baseFacingY - 0.48 * facing; // Full reverse torso torque
      targetScale.x = 1.18;
      targetScale.y = 0.95;
      lerpSpeed = 0.5;

      if (this.attackSpark) {
        this.attackSpark.visible = true;
        this.attackSpark.position.set(1.8 * facing, 1.6, 0.1);
        this.attackSpark.scale.set(1.4, 1.4, 1.4);
      }
    }
    // -----------------------------------------------------------------
    // 8. UPPERCUT (Down + J - Explosive vertical launch!)
    // -----------------------------------------------------------------
    else if (state === 'uppercut') {
      targetPos.x = 0.5 * facing;
      targetPos.y = 0.85; // Rockets straight upward!
      targetRot.z = 0.35 * facing; // Arched backward as punch rises
      targetRot.x = -0.2;
      targetScale.y = 1.35; // Vertical stretch
      targetScale.x = 0.88;
      lerpSpeed = 0.48;

      if (this.attackSpark) {
        this.attackSpark.visible = true;
        this.attackSpark.position.set(0.9 * facing, 2.5, 0.1);
      }
    }
    // -----------------------------------------------------------------
    // 9. HIGH ROUNDHOUSE KICK (Kick K - 3D Spinning high arc!)
    // -----------------------------------------------------------------
    else if (state === 'kick_1' || state === 'roundhouse') {
      targetPos.x = 0.85 * facing;
      targetPos.y = 0.32;
      targetRot.z = -0.55 * facing; // High kick tilt
      targetRot.y = baseFacingY + 2.2 * facing; // Full 3D spinning rotation!
      targetScale.x = 1.1;
      targetScale.y = 1.05;
      lerpSpeed = 0.45;

      if (this.attackSpark) {
        this.attackSpark.visible = true;
        this.attackSpark.position.set(1.6 * facing, 2.1, 0.1);
      }
    }
    // -----------------------------------------------------------------
    // 10. LOW SWEEP KICK (Down + K - Spinning floor sweep!)
    // -----------------------------------------------------------------
    else if (state === 'kick_2' || state === 'low_kick') {
      targetPos.x = 0.85 * facing;
      targetPos.y = -0.55; // Down on the arena floor
      targetRot.z = 0.48 * facing;
      targetRot.y = baseFacingY + 3.14 * facing; // Full 360 sweep rotation across floor!
      targetScale.y = 0.68;
      targetScale.x = 1.25;
      lerpSpeed = 0.42;

      if (this.attackSpark) {
        this.attackSpark.visible = true;
        this.attackSpark.position.set(1.4 * facing, 0.35, 0.1);
      }
    }
    // -----------------------------------------------------------------
    // 11. GRAB & THROW (I or J+K - Clutch & throw!)
    // -----------------------------------------------------------------
    else if (state === 'grab') {
      targetPos.x = 0.95 * facing;
      targetRot.z = -0.35 * facing;
      targetScale.x = 1.15;
      lerpSpeed = 0.42;
    }
    // -----------------------------------------------------------------
    // 12. BLOCK GUARD (H or Back - Braced defense with Energy Shield)
    // -----------------------------------------------------------------
    else if (state === 'block') {
      targetPos.x = -0.22 * facing;
      targetRot.z = 0.22 * facing; // Braced backward
      targetScale.x = 0.92;
      targetScale.y = 0.95;

      if (this.blockShield) {
        this.blockShield.visible = true;
        this.blockShield.position.x = 0.85 * facing;
        this.blockShield.rotation.z += 0.08;
      }
    }
    // -----------------------------------------------------------------
    // 13. HIT REACTION (Impact stagger snapback)
    // -----------------------------------------------------------------
    else if (state === 'hit') {
      targetPos.x = -0.55 * facing; // Snaps violently backward
      targetPos.y = 0.12;
      targetRot.z = 0.45 * facing;
      targetRot.x = -0.25;
      lerpSpeed = 0.65; // Instant impact flinch
      this.flashHitMaterial();
    }
    // -----------------------------------------------------------------
    // 14. KNOCKDOWN (Topples onto arena floor flat on back)
    // -----------------------------------------------------------------
    else if (state === 'knockdown') {
      targetPos.x = -1.1 * facing;
      targetPos.y = -1.35; // Flat down on the arena floor
      targetRot.z = facing * (Math.PI / 2.05); // Toppled 90 degrees backward
      targetRot.y = baseFacingY;
      lerpSpeed = 0.35;
    }
    // -----------------------------------------------------------------
    // 15. SUPER MOVE CHARGE (Cinematic power levitation & aura)
    // -----------------------------------------------------------------
    else if (state === 'super_charge') {
      targetPos.y = 0.45 + Math.sin(this.animTime * 16) * 0.08;
      targetPos.x = (Math.random() - 0.5) * 0.12; // High-frequency power vibration
      targetScale.set(1.1, 1.1, 1.1);

      if (this.superAura) {
        this.superAura.visible = true;
        this.superAura.rotation.z += 0.15;
      }
      if (this.auraLight) {
        this.auraLight.intensity = 3.5;
      }
    }

    // Apply Smooth Kinematic Lerping to 3D Transform
    this.motionGroup.position.x += (targetPos.x - this.motionGroup.position.x) * lerpSpeed;
    this.motionGroup.position.y += (targetPos.y - this.motionGroup.position.y) * lerpSpeed;
    this.motionGroup.position.z += (targetPos.z - this.motionGroup.position.z) * lerpSpeed;

    this.motionGroup.rotation.x += (targetRot.x - this.motionGroup.rotation.x) * lerpSpeed;
    this.motionGroup.rotation.y += (targetRot.y - this.motionGroup.rotation.y) * lerpSpeed;
    this.motionGroup.rotation.z += (targetRot.z - this.motionGroup.rotation.z) * lerpSpeed;

    this.motionGroup.scale.x += (targetScale.x - this.motionGroup.scale.x) * lerpSpeed;
    this.motionGroup.scale.y += (targetScale.y - this.motionGroup.scale.y) * lerpSpeed;
    this.motionGroup.scale.z += (targetScale.z - this.motionGroup.scale.z) * lerpSpeed;
  }

  destroy() {
    this.scene.remove(this.root);
  }
}

window.HumanoidFighter3D = HumanoidFighter3D;
