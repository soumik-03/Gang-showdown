/**
 * ===================================================================
 *  GENUINE 3D FIGURE SKELETAL RIGGING & ARTICULATION (Three.js)
 * ===================================================================
 *  Each of the 4 characters is an authentic, bone-rigged 3D SkinnedMesh:
 *    - Inspector Clue  (detective.glb)
 *    - Chrono Wizard   (wizard.glb)
 *    - The Navigator   (explorer.glb)
 *    - Pyre Titan      (golem.glb)
 *
 *  Full 16-Bone Anatomical Articulation:
 *    - Arms punch, jab, power cross, uppercut, and block!
 *    - Forearms bend at the elbow to guard and snap forward!
 *    - Legs step, walk in alternating strides, kick high, and sweep low!
 *    - Knees bend dynamically during strides, crouches, and kicks!
 *    - Head snaps back on hit impacts and ducks into guard!
 *    - Torso & spine twist with punch momentum and martial arts stances!
 * ===================================================================
 */

// Global Model Buffer Cache (for instant instantiations of fresh SkinnedMeshes)
window._modelBufferCache = window._modelBufferCache || new Map();
window._gltfLoaderInstance = window._gltfLoaderInstance || null;

function getGLTFLoader() {
  if (!window._gltfLoaderInstance && typeof THREE !== 'undefined' && THREE.GLTFLoader) {
    window._gltfLoaderInstance = new THREE.GLTFLoader();
  }
  return window._gltfLoaderInstance;
}

function fetchModelBuffer(path, callback) {
  if (window._modelBufferCache.has(path)) {
    callback(window._modelBufferCache.get(path));
    return;
  }
  const xhr = new XMLHttpRequest();
  xhr.open('GET', path, true);
  xhr.responseType = 'arraybuffer';
  xhr.onload = function() {
    if (xhr.status === 200 || xhr.status === 0) {
      window._modelBufferCache.set(path, xhr.response);
      callback(xhr.response);
    } else {
      console.warn('Failed to load', path, xhr.status);
      callback(null);
    }
  };
  xhr.onerror = function() {
    console.warn('Network error loading', path);
    callback(null);
  };
  xhr.send();
}

function instantiateRiggedModel(path, onLoaded) {
  fetchModelBuffer(path, (buffer) => {
    if (!buffer) {
      onLoaded(null);
      return;
    }
    const loader = getGLTFLoader();
    if (!loader) {
      onLoaded(null);
      return;
    }
    // Fresh slice of ArrayBuffer ensures independent SkinnedMesh and Skeleton
    loader.parse(
      buffer.slice(0),
      '',
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
        onLoaded(gltf.scene);
      },
      (err) => {
        console.warn('Error parsing rigged gltf:', err);
        onLoaded(null);
      }
    );
  });
}

// Proactive background preloading of all 4 character buffers
if (typeof window !== 'undefined') {
  const PRELOAD_PATHS = [
    'assets/models/detective.glb',
    'assets/models/wizard.glb',
    'assets/models/explorer.glb',
    'assets/models/golem.glb'
  ];
  setTimeout(() => {
    PRELOAD_PATHS.forEach((p) => fetchModelBuffer(p, () => {}));
  }, 50);
}

class HumanoidFighter3D {
  constructor(scene, config, isPlayer1 = true) {
    this.scene = scene;
    this.config = config || {};
    this.isPlayer1 = isPlayer1;
    this.charId = config.id || 'detective';
    this.modelPath = config.modelPath || `assets/models/${this.charId}.glb`;

    // Root Group in world space
    this.root = new THREE.Group();
    this.scene.add(this.root);

    // Floor contact shadow
    this.buildContactShadow();

    // Motion group (handles body translations and global lunge/knockdown)
    this.motionGroup = new THREE.Group();
    this.root.add(this.motionGroup);

    // Inner Model group (handles 3D facing orientation towards opponent)
    this.modelGroup = new THREE.Group();
    this.motionGroup.add(this.modelGroup);

    // Aura lighting & Combat VFX
    this.buildAuraLight();
    this.buildCombatVFX();

    // Skeletal bones map (populated once SkinnedMesh is ready)
    this.bones = {};
    this.hasSkeleton = false;
    this.skinnedMesh = null;
    this.glbModel = null;
    this.proxyMesh = null;
    this.hitFlashTimer = 0;

    // Timers & State
    this.animTime = Math.random() * 10;
    this.currentFacing = isPlayer1 ? 1 : -1;

    // Build immediate procedural proxy so screen is never blank
    this.buildProceduralProxy();

    // Load and attach genuine rigged 3D character model
    this.loadRiggedGLB();
  }

  // --- FLOOR CONTACT SHADOW ---
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

  // --- SIGNATURE AURA POINT LIGHT ---
  buildAuraLight() {
    let auraColor = 0x00d2d3;
    if (this.charId === 'wizard') auraColor = 0x3742fa;
    else if (this.charId === 'explorer') auraColor = 0xffa502;
    else if (this.charId === 'golem') auraColor = 0xff4757;

    this.auraLight = new THREE.PointLight(auraColor, 1.2, 5.5);
    this.auraLight.position.set(0, 1.6, 0.9);
    this.motionGroup.add(this.auraLight);
  }

  // --- COMBAT VFX ---
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

    // 3. Super Aura
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

  // --- IMMEDIATE PROCEDURAL PROXY ---
  buildProceduralProxy() {
    this.proxyMesh = new THREE.Group();
    let pColor = 0x2e86de;
    let sColor = 0xdcdde1;
    if (this.charId === 'wizard') { pColor = 0x1e3799; sColor = 0xffffff; }
    else if (this.charId === 'explorer') { pColor = 0xe67e22; sColor = 0xc8d6e5; }
    else if (this.charId === 'golem') { pColor = 0x2f3640; sColor = 0xff4757; }

    const matP = new THREE.MeshStandardMaterial({ color: pColor, roughness: 0.5, metalness: 0.2 });
    const matS = new THREE.MeshStandardMaterial({ color: sColor, roughness: 0.6, metalness: 0.1 });

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.55, 1.2, 12), matP);
    torso.position.y = 1.6;
    torso.castShadow = true;
    this.proxyMesh.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 14, 14), matS);
    head.position.y = 2.5;
    head.castShadow = true;
    this.proxyMesh.add(head);

    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 1.0, 8), matP);
    legL.position.set(-0.35, 0.5, 0);
    legL.castShadow = true;
    this.proxyMesh.add(legL);

    const legR = legL.clone();
    legR.position.x = 0.35;
    this.proxyMesh.add(legR);

    this.modelGroup.add(this.proxyMesh);
  }

  // --- LOAD AND ATTACH RIGGED 3D CHARACTER MODEL ---
  loadRiggedGLB() {
    instantiateRiggedModel(this.modelPath, (scene) => {
      if (!scene) return;

      if (this.proxyMesh) {
        this.modelGroup.remove(this.proxyMesh);
        this.proxyMesh = null;
      }

      this.glbModel = scene;
      this.bones = {};

      this.glbModel.traverse((child) => {
        if (child.isSkinnedMesh) {
          this.skinnedMesh = child;
          child.castShadow = true;
          child.receiveShadow = true;
        }
        if (child.isBone) {
          this.bones[child.name] = child;
        }
      });

      this.hasSkeleton = Object.keys(this.bones).length >= 10;
      this.modelGroup.add(this.glbModel);
    });
  }

  // --- FLASH IMPACT MATERIAL ---
  flashHitMaterial() {
    this.hitFlashTimer = 0.12;
    if (this.skinnedMesh && this.skinnedMesh.material && this.skinnedMesh.material.emissive) {
      this.skinnedMesh.material.emissive.setHex(0xff3333);
      this.skinnedMesh.material.emissiveIntensity = 1.0;
    }
    if (this.auraLight) this.auraLight.intensity = 3.0;
  }

  restoreMaterials() {
    if (this.skinnedMesh && this.skinnedMesh.material && this.skinnedMesh.material.emissive) {
      this.skinnedMesh.material.emissive.setHex(0x000000);
      this.skinnedMesh.material.emissiveIntensity = 0.0;
    }
    if (this.auraLight) this.auraLight.intensity = 1.2;
  }

  // ===================================================================
  // 3D COMBAT ARTICULATION & SKELETAL SPLAY
  // ===================================================================
  updateAnimation(state, facing, delta) {
    this.animTime += delta;
    this.currentFacing = facing;

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= delta;
      if (this.hitFlashTimer <= 0) {
        this.restoreMaterials();
      }
    }

    // Dynamic ground contact shadow scaling
    if (this.contactShadow) {
      const height = Math.max(0, this.root.position.y);
      const scale = Math.max(0.35, 1.0 - (height * 0.18));
      this.contactShadow.scale.set(scale, scale, scale);
      this.contactShadow.material.opacity = Math.max(0.15, 0.85 - (height * 0.15));
    }

    if (this.blockShield) this.blockShield.visible = false;
    if (this.attackSpark) this.attackSpark.visible = false;
    if (this.superAura) this.superAura.visible = false;

    // Base facing orientation:
    // Front faces +Z. Angled slightly towards camera so face, chest, and arms are visible.
    const baseFacingY = facing === 1 ? (Math.PI / 2 - 0.24) : (-Math.PI / 2 + 0.24);
    this.modelGroup.rotation.y = baseFacingY;

    // Motion group target transforms
    let mPos = { x: 0, y: 0, z: 0 };
    let mRot = { x: 0, y: 0, z: 0 };
    let mLerp = 0.32;

    // Bone target angles (in radians)
    // Front arm (lead): arm_l when facing 1, arm_r when facing -1
    // Rear arm (power): arm_r when facing 1, arm_l when facing -1
    let b = {
      pelvisY: 1.45,
      spine: { x: 0, y: 0, z: 0 },
      chest: { x: 0, y: 0, z: 0 },
      head: { x: 0, y: 0, z: 0 },
      // Lead arm / rear arm placeholders (assigned based on facing)
      arm_l: { x: -0.65, y: 0, z: -0.25 },
      forearm_l: { x: -1.35, y: 0, z: 0 },
      arm_r: { x: -0.55, y: 0, z: 0.25 },
      forearm_r: { x: -1.45, y: 0, z: 0 },
      thigh_l: { x: -0.15, y: 0, z: 0 },
      calf_l: { x: 0.25, y: 0, z: 0 },
      foot_l: { x: 0, y: 0, z: 0 },
      thigh_r: { x: 0.15, y: 0, z: 0 },
      calf_r: { x: 0.25, y: 0, z: 0 },
      foot_r: { x: 0, y: 0, z: 0 }
    };

    const isFwdLeadL = (facing === 1);
    let boneLerp = 0.35;

    // -----------------------------------------------------------------
    // 1. IDLE (Athletic martial arts breathing bounce & ready guard)
    // -----------------------------------------------------------------
    if (state === 'idle') {
      const breath = Math.sin(this.animTime * 4.8);
      b.pelvisY = 1.45 + breath * 0.05;
      mPos.y = breath * 0.03;

      // Fighting stance torso twist
      b.spine.y = isFwdLeadL ? 0.32 : -0.32;
      b.chest.y = isFwdLeadL ? 0.12 : -0.12;
      b.spine.x = 0.04;

      // Both fists guarding chin with rhythmic bobbing
      if (isFwdLeadL) {
        b.arm_l.x = -0.75 + breath * 0.04;
        b.forearm_l.x = -1.55;
        b.arm_r.x = -0.55 - breath * 0.04;
        b.forearm_r.x = -1.65;
        b.thigh_l.x = -0.2;
        b.calf_l.x = 0.35;
        b.thigh_r.x = 0.2;
        b.calf_r.x = 0.25;
      } else {
        b.arm_r.x = -0.75 + breath * 0.04;
        b.forearm_r.x = -1.55;
        b.arm_l.x = -0.55 - breath * 0.04;
        b.forearm_l.x = -1.65;
        b.thigh_r.x = -0.2;
        b.calf_r.x = 0.35;
        b.thigh_l.x = 0.2;
        b.calf_l.x = 0.25;
      }
    }
    // -----------------------------------------------------------------
    // 2. WALK FORWARD (Real alternating two-legged stride & arm pump!)
    // -----------------------------------------------------------------
    else if (state === 'walk_fwd') {
      const stride = Math.sin(this.animTime * 10);
      b.pelvisY = 1.45 + Math.abs(stride) * 0.08;
      mRot.z = -0.12 * facing; // Dynamic forward lean

      // Alternating leg swings and knee flexes
      b.thigh_l.x = stride * 0.75;
      b.thigh_r.x = -stride * 0.75;
      b.calf_l.x = Math.max(0, -stride * 0.85);
      b.calf_r.x = Math.max(0, stride * 0.85);

      // Alternating arm pumps
      b.arm_l.x = -0.65 - stride * 0.65;
      b.forearm_l.x = -1.2;
      b.arm_r.x = -0.65 + stride * 0.65;
      b.forearm_r.x = -1.2;

      b.spine.y = stride * 0.15;
    }
    // -----------------------------------------------------------------
    // 3. WALK BACKWARD (Defensive retreat steps & high chin guard)
    // -----------------------------------------------------------------
    else if (state === 'walk_back') {
      const stride = Math.sin(this.animTime * 8);
      b.pelvisY = 1.45 + Math.abs(stride) * 0.06;
      mRot.z = 0.1 * facing;

      b.thigh_l.x = -stride * 0.55;
      b.thigh_r.x = stride * 0.55;
      b.calf_l.x = Math.max(0, stride * 0.65);
      b.calf_r.x = Math.max(0, -stride * 0.65);

      b.forearm_l.x = -1.75;
      b.forearm_r.x = -1.75;
    }
    // -----------------------------------------------------------------
    // 4. JUMP (Airborne knee tuck & arms extended for balance)
    // -----------------------------------------------------------------
    else if (state === 'jump') {
      b.thigh_l.x = -0.95;
      b.calf_l.x = 1.45;
      b.thigh_r.x = -0.75;
      b.calf_r.x = 1.25;

      b.arm_l.x = -1.25;
      b.arm_r.x = -1.25;
      b.forearm_l.x = -0.85;
      b.forearm_r.x = -0.85;
    }
    // -----------------------------------------------------------------
    // 5. CROUCH (Low ducking squat & tight guard)
    // -----------------------------------------------------------------
    else if (state === 'crouch') {
      b.pelvisY = 0.95;
      b.thigh_l.x = -1.45;
      b.calf_l.x = 2.1;
      b.thigh_r.x = -1.45;
      b.calf_r.x = 2.1;

      b.spine.x = 0.35;
      b.forearm_l.x = -1.95;
      b.forearm_r.x = -1.95;
      boneLerp = 0.45;
    }
    // -----------------------------------------------------------------
    // 6. LIGHT JAB (Punch J - Lead arm explodes straight out forward!)
    // -----------------------------------------------------------------
    else if (state === 'punch_1' || state === 'jab') {
      mPos.x = 0.55 * facing;
      boneLerp = 0.65; // Ultra-snappy punch frame

      if (isFwdLeadL) {
        // Left arm extends full punch!
        b.arm_l.x = -1.6;
        b.arm_l.z = -0.05;
        b.forearm_l.x = -0.05; // Elbow snaps straight!
        b.spine.y = 0.45;

        // Right hand guards face
        b.arm_r.x = -0.55;
        b.forearm_r.x = -1.85;
      } else {
        // Right arm extends full punch!
        b.arm_r.x = -1.6;
        b.arm_r.z = 0.05;
        b.forearm_r.x = -0.05;
        b.spine.y = -0.45;

        b.arm_l.x = -0.55;
        b.forearm_l.x = -1.85;
      }

      if (this.attackSpark) {
        this.attackSpark.visible = true;
        this.attackSpark.position.set(1.4 * facing, 1.8, 0.1);
        this.attackSpark.rotation.z += 0.3;
      }
    }
    // -----------------------------------------------------------------
    // 7. HEAVY CROSS (Punch J,J - Rear arm lunges with full torso drive!)
    // -----------------------------------------------------------------
    else if (state === 'punch_2' || state === 'cross') {
      mPos.x = 0.95 * facing;
      mPos.y = -0.08;
      boneLerp = 0.55;

      if (isFwdLeadL) {
        // Rear arm (right) explodes with full torso torque!
        b.arm_r.x = -1.65;
        b.arm_r.z = 0.05;
        b.forearm_r.x = -0.05;
        b.spine.y = -0.65;
        b.chest.y = -0.35;

        b.arm_l.x = -0.25;
        b.forearm_l.x = -1.65;
        b.thigh_r.x = 0.45; // Back leg drives off floor
      } else {
        // Rear arm (left) explodes!
        b.arm_l.x = -1.65;
        b.arm_l.z = -0.05;
        b.forearm_l.x = -0.05;
        b.spine.y = 0.65;
        b.chest.y = 0.35;

        b.arm_r.x = -0.25;
        b.forearm_r.x = -1.65;
        b.thigh_l.x = 0.45;
      }

      if (this.attackSpark) {
        this.attackSpark.visible = true;
        this.attackSpark.position.set(1.8 * facing, 1.6, 0.1);
        this.attackSpark.scale.set(1.4, 1.4, 1.4);
      }
    }
    // -----------------------------------------------------------------
    // 8. RISING UPPERCUT (Down + J - Arm rockets straight upward!)
    // -----------------------------------------------------------------
    else if (state === 'uppercut') {
      mPos.x = 0.45 * facing;
      mPos.y = 0.75; // Launches off the ground!
      boneLerp = 0.52;

      // Rear arm shoots straight up to the ceiling
      if (isFwdLeadL) {
        b.arm_r.x = -2.65; // Points straight up
        b.forearm_r.x = -0.25;
        b.spine.x = -0.35;
        b.spine.y = -0.4;
        b.head.x = -0.55; // Head looks up
      } else {
        b.arm_l.x = -2.65;
        b.forearm_l.x = -0.25;
        b.spine.x = -0.35;
        b.spine.y = 0.4;
        b.head.x = -0.55;
      }

      b.thigh_l.x = -0.45;
      b.thigh_r.x = 0.35;

      if (this.attackSpark) {
        this.attackSpark.visible = true;
        this.attackSpark.position.set(0.9 * facing, 2.5, 0.1);
      }
    }
    // -----------------------------------------------------------------
    // 9. HIGH ROUNDHOUSE KICK (Kick K - Leg whips high in air!)
    // -----------------------------------------------------------------
    else if (state === 'kick_1' || state === 'roundhouse') {
      mPos.x = 0.75 * facing;
      mPos.y = 0.25;
      boneLerp = 0.48;

      // Rear leg swings high in arc!
      if (isFwdLeadL) {
        b.thigh_r.x = -1.88; // Leg high in air!
        b.thigh_r.z = -0.55;
        b.calf_r.x = 0.15; // Foot extended!

        b.thigh_l.x = 0.32;
        b.calf_l.x = 0.45;
        b.spine.z = 0.55;
        b.spine.y = -0.55;
      } else {
        b.thigh_l.x = -1.88;
        b.thigh_l.z = 0.55;
        b.calf_l.x = 0.15;

        b.thigh_r.x = 0.32;
        b.calf_r.x = 0.45;
        b.spine.z = -0.55;
        b.spine.y = 0.55;
      }

      b.arm_l.x = -0.4;
      b.arm_r.x = -0.4;

      if (this.attackSpark) {
        this.attackSpark.visible = true;
        this.attackSpark.position.set(1.6 * facing, 2.1, 0.1);
      }
    }
    // -----------------------------------------------------------------
    // 10. LOW SWEEP KICK (Down + K - Leg sweeps across arena floor!)
    // -----------------------------------------------------------------
    else if (state === 'kick_2' || state === 'low_kick') {
      mPos.x = 0.75 * facing;
      mPos.y = -0.45;
      b.pelvisY = 0.85;
      boneLerp = 0.45;

      // Low sweep
      if (isFwdLeadL) {
        b.thigh_r.x = -1.65;
        b.thigh_r.z = 0.45;
        b.calf_r.x = 0.05; // Straight leg sweep!

        b.thigh_l.x = -1.45;
        b.calf_l.x = 2.15;
      } else {
        b.thigh_l.x = -1.65;
        b.thigh_l.z = -0.45;
        b.calf_l.x = 0.05;

        b.thigh_r.x = -1.45;
        b.calf_r.x = 2.15;
      }

      b.spine.x = 0.5;

      if (this.attackSpark) {
        this.attackSpark.visible = true;
        this.attackSpark.position.set(1.4 * facing, 0.35, 0.1);
      }
    }
    // -----------------------------------------------------------------
    // 11. GRAB & THROW (I or J+K - Both arms clutch forward!)
    // -----------------------------------------------------------------
    else if (state === 'grab') {
      mPos.x = 0.85 * facing;
      b.arm_l.x = -1.45;
      b.arm_l.z = 0.25;
      b.forearm_l.x = -0.65;

      b.arm_r.x = -1.45;
      b.arm_r.z = -0.25;
      b.forearm_r.x = -0.65;

      b.spine.x = 0.3;
    }
    // -----------------------------------------------------------------
    // 12. BLOCK GUARD (H or Back - Forearms crossed tight!)
    // -----------------------------------------------------------------
    else if (state === 'block') {
      mPos.x = -0.22 * facing;

      // Both forearms crossed in front of face
      b.arm_l.x = -1.25;
      b.arm_l.z = 0.65;
      b.forearm_l.x = -1.95;

      b.arm_r.x = -1.25;
      b.arm_r.z = -0.65;
      b.forearm_r.x = -1.95;

      b.head.x = 0.35; // Head tucked

      if (this.blockShield) {
        this.blockShield.visible = true;
        this.blockShield.position.x = 0.85 * facing;
        this.blockShield.rotation.z += 0.08;
      }
    }
    // -----------------------------------------------------------------
    // 13. HIT REACTION (Head snaps back violently, body recoils!)
    // -----------------------------------------------------------------
    else if (state === 'hit') {
      mPos.x = -0.55 * facing;
      mPos.y = 0.12;

      b.head.x = -0.75; // Head snaps back!
      b.head.y = -0.25;
      b.chest.x = -0.45;
      b.spine.x = -0.35;

      b.arm_l.x = 0.45;
      b.arm_r.x = 0.45;

      boneLerp = 0.7; // Instant impact reaction
      this.flashHitMaterial();
    }
    // -----------------------------------------------------------------
    // 14. KNOCKDOWN (Falls completely onto arena floor)
    // -----------------------------------------------------------------
    else if (state === 'knockdown') {
      mPos.x = -1.1 * facing;
      mPos.y = -1.35;
      mRot.z = facing * (Math.PI / 2.05);

      b.arm_l.x = 0.35;
      b.arm_l.z = -0.75;
      b.arm_r.x = 0.35;
      b.arm_r.z = 0.75;
      b.thigh_l.x = -0.35;
      b.calf_l.x = 0.55;
      b.thigh_r.x = -0.35;
      b.calf_r.x = 0.55;
    }
    // -----------------------------------------------------------------
    // 15. SUPER MOVE CHARGE (Power levitation, arms flare back!)
    // -----------------------------------------------------------------
    else if (state === 'super_charge') {
      mPos.y = 0.45 + Math.sin(this.animTime * 16) * 0.08;
      mPos.x = (Math.random() - 0.5) * 0.12;

      b.arm_l.x = 0.65;
      b.arm_l.z = -0.65;
      b.forearm_l.x = -1.85;

      b.arm_r.x = 0.65;
      b.arm_r.z = 0.65;
      b.forearm_r.x = -1.85;

      b.chest.x = -0.35;
      b.head.x = -0.45;

      if (this.superAura) {
        this.superAura.visible = true;
        this.superAura.rotation.z += 0.15;
      }
      if (this.auraLight) this.auraLight.intensity = 3.5;
    }

    // Apply Lerping to Motion Group
    this.motionGroup.position.x += (mPos.x - this.motionGroup.position.x) * mLerp;
    this.motionGroup.position.y += (mPos.y - this.motionGroup.position.y) * mLerp;
    this.motionGroup.position.z += (mPos.z - this.motionGroup.position.z) * mLerp;

    this.motionGroup.rotation.x += (mRot.x - this.motionGroup.rotation.x) * mLerp;
    this.motionGroup.rotation.y += (mRot.y - this.motionGroup.rotation.y) * mLerp;
    this.motionGroup.rotation.z += (mRot.z - this.motionGroup.rotation.z) * mLerp;

    // Apply Lerping to Every Skeletal Bone
    if (this.hasSkeleton) {
      const bn = this.bones;
      if (bn.pelvis) {
        bn.pelvis.position.y += (b.pelvisY - bn.pelvis.position.y) * boneLerp;
      }
      this.lerpBone(bn.spine, b.spine, boneLerp);
      this.lerpBone(bn.chest, b.chest, boneLerp);
      this.lerpBone(bn.head, b.head, boneLerp);
      this.lerpBone(bn.arm_l, b.arm_l, boneLerp);
      this.lerpBone(bn.forearm_l, b.forearm_l, boneLerp);
      this.lerpBone(bn.arm_r, b.arm_r, boneLerp);
      this.lerpBone(bn.forearm_r, b.forearm_r, boneLerp);
      this.lerpBone(bn.thigh_l, b.thigh_l, boneLerp);
      this.lerpBone(bn.calf_l, b.calf_l, boneLerp);
      this.lerpBone(bn.foot_l, b.foot_l, boneLerp);
      this.lerpBone(bn.thigh_r, b.thigh_r, boneLerp);
      this.lerpBone(bn.calf_r, b.calf_r, boneLerp);
      this.lerpBone(bn.foot_r, b.foot_r, boneLerp);
    }
  }

  lerpBone(bone, targetRot, factor) {
    if (!bone || !targetRot) return;
    bone.rotation.x += (targetRot.x - bone.rotation.x) * factor;
    bone.rotation.y += (targetRot.y - bone.rotation.y) * factor;
    bone.rotation.z += (targetRot.z - bone.rotation.z) * factor;
  }

  destroy() {
    this.scene.remove(this.root);
  }
}

window.HumanoidFighter3D = HumanoidFighter3D;
