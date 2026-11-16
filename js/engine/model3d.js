/**
 * ===================================================================
 *  CUSTOM 3D CHARACTER SYSTEM (Faithful to User's 4 3D Characters)
 * ===================================================================
 *  1. Detective Bot (Trench coat, fedora, magnifying glass, LED screen)
 *  2. Cyber Mage (Starry blue wizard hat & robe, white beard, data staff)
 *  3. Compass Scout (Safari hat, compass needle face, utility vest)
 *  4. Pyre Titan (Magma rock golem, glowing lava seams, key crest shield)
 */

class HumanoidFighter3D {
  constructor(scene, config, isPlayer1 = true) {
    this.scene = scene;
    this.config = config;
    this.isPlayer1 = isPlayer1;
    this.charId = config.id || 'detective';

    // Root Group
    this.root = new THREE.Group();
    this.scene.add(this.root);

    // Inner Model Pivot (for breathing, punches, kicks, lunges)
    this.bodyGroup = new THREE.Group();
    this.root.add(this.bodyGroup);

    // Build Character with 3D Depth, Contact Shadows & Accessories
    this.buildContactShadow();
    this.buildCharacterVisual();

    this.animTime = 0;
  }

  // --- 1. DYNAMIC CONTACT SHADOW ---
  buildContactShadow() {
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sctx = shadowCanvas.getContext('2d');
    const sGrad = sctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    sGrad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    sGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.45)');
    sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sctx.fillStyle = sGrad;
    sctx.fillRect(0, 0, 128, 128);

    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(2.8, 1.6);
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

  // --- 2. 3D CHARACTER VISUAL RIG ---
  buildCharacterVisual() {
    const loader = new THREE.TextureLoader();
    const imagePath = this.config.fullImage || this.config.avatar;

    // Dimensional 3D Sprite with double-layer depth & normal lighting
    loader.load(imagePath, (texture) => {
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      // Front Lit Layer
      const aspect = texture.image.width / texture.image.height;
      const height = 3.6;
      const width = height * aspect;

      const charGeo = new THREE.PlaneGeometry(width, height);
      const charMat = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.1,
        roughness: 0.4,
        metalness: 0.1,
        side: THREE.DoubleSide
      });

      this.charMesh = new THREE.Mesh(charGeo, charMat);
      this.charMesh.position.set(0, height / 2 + 0.15, 0);
      this.charMesh.castShadow = true;
      this.bodyGroup.add(this.charMesh);

      // Back depth silhouette layer for real 3D thickness
      const backMesh = new THREE.Mesh(charGeo, charMat);
      backMesh.position.set(0, height / 2 + 0.15, -0.08);
      backMesh.castShadow = true;
      this.bodyGroup.add(backMesh);

      // 3D Specific Character Glow Lights
      this.addCharacterSpecialFX();
    });
  }

  addCharacterSpecialFX() {
    if (this.charId === 'golem') {
      // Lava Core Pulsing Pointlight
      this.coreLight = new THREE.PointLight(0xff4757, 2.0, 6);
      this.coreLight.position.set(0, 2.0, 0.4);
      this.bodyGroup.add(this.coreLight);
    } else if (this.charId === 'wizard') {
      // Magic Staff Cyan Neon Glow
      this.staffLight = new THREE.PointLight(0x00f2fe, 2.2, 5);
      this.staffLight.position.set(0.9, 2.2, 0.5);
      this.bodyGroup.add(this.staffLight);
    } else if (this.charId === 'detective') {
      // LED Smiling Visor Green Glow
      this.eyeLight = new THREE.PointLight(0x10ac84, 1.5, 4);
      this.eyeLight.position.set(0, 2.5, 0.4);
      this.bodyGroup.add(this.eyeLight);
    } else if (this.charId === 'explorer') {
      // Compass Needle Neon Cyan Glow
      this.compassLight = new THREE.PointLight(0x00d2d3, 1.6, 4.5);
      this.compassLight.position.set(-0.5, 1.8, 0.4);
      this.bodyGroup.add(this.compassLight);
    }
  }

  // --- 3. ATHLETIC BRAWLER ANIMATION & COMBAT LEAN ---
  updateAnimation(state, facing, delta) {
    this.animTime += delta * 10;
    const b = this.bodyGroup;

    // Contact shadow dynamics
    if (this.contactShadow) {
      const height = Math.max(0, this.root.position.y);
      const scale = Math.max(0.35, 1.0 - (height * 0.18));
      this.contactShadow.scale.set(scale, scale, scale);
    }

    let targetRotZ = 0;
    let targetRotY = facing === 1 ? 0 : Math.PI; // Face opponent
    let targetRotX = 0;
    let targetY = 0;
    let targetScaleX = 1;

    // 1. Idle Bounce (Athletic Ready Stance)
    if (state === 'idle') {
      const bounce = Math.sin(this.animTime * 0.85) * 0.08;
      targetY = bounce;
      targetRotZ = Math.sin(this.animTime * 0.85) * 0.04;
      targetRotX = 0.05;
    }
    // 2. Walking Forward (Forward momentum step)
    else if (state === 'walk_fwd') {
      const step = Math.sin(this.animTime * 1.5);
      targetY = Math.abs(step) * 0.12;
      targetRotZ = step * 0.12;
      targetRotX = 0.18; // Lean forward into step
    }
    // 3. Walking Backward (Defensive retreat step)
    else if (state === 'walk_back') {
      const step = Math.sin(this.animTime * 1.3);
      targetY = Math.abs(step) * 0.08;
      targetRotZ = -step * 0.08;
      targetRotX = -0.12; // Lean back
    }
    // 4. Jump (Upward stretch)
    else if (state === 'jump') {
      targetRotX = -0.15;
      targetScaleX = 0.95;
    }
    // 5. Crouch (Duck low)
    else if (state === 'crouch') {
      targetY = -0.55;
      targetRotX = 0.28;
    }
    // 6. Light Jab (Punch J)
    else if (state === 'punch_1' || state === 'jab') {
      targetRotX = 0.25;
      targetRotZ = -facing * 0.22; // Snapping punch lean
      targetY = 0.06;
    }
    // 7. Heavy Cross (Punch J,J)
    else if (state === 'punch_2' || state === 'cross') {
      targetRotX = 0.38; // Deep lunging right cross
      targetRotZ = -facing * 0.35;
      targetY = 0.02;
    }
    // 8. Uppercut (Down + J)
    else if (state === 'uppercut') {
      targetRotX = -0.32; // Exploding upward punch
      targetY = 0.45;
      targetRotZ = facing * 0.15;
    }
    // 9. High Roundhouse Kick (Kick K)
    else if (state === 'kick_1' || state === 'roundhouse') {
      targetRotZ = facing * 0.45; // High rotating roundhouse kick tilt
      targetY = 0.25;
    }
    // 10. Low Sweep (Down + K)
    else if (state === 'kick_2' || state === 'low_kick') {
      targetY = -0.65;
      targetRotZ = facing * 0.4;
      targetRotX = 0.35;
    }
    // 11. Grab & Throw (I or J+K)
    else if (state === 'grab') {
      targetRotX = 0.42;
      targetY = -0.1;
    }
    // 12. Defensive Block (Guard)
    else if (state === 'block') {
      targetRotX = -0.18; // Leaning back in guard
      targetY = -0.12;
      targetScaleX = 0.88;
    }
    // 13. Hit Flinch
    else if (state === 'hit') {
      targetRotX = -0.45; // Head snapback
      targetRotZ = -facing * 0.25;
      targetY = 0.08;
    }
    // 14. Knockdown
    else if (state === 'knockdown') {
      targetRotZ = -facing * (Math.PI / 2.1);
      targetY = -1.2;
    }
    // 15. Super Move Charge
    else if (state === 'super_charge') {
      targetY = -0.3;
      targetRotX = 0.25;
      const jitter = (Math.random() - 0.5) * 0.08;
      targetRotZ = jitter;
    }

    // Smooth Lerping
    const lerp = 0.26;
    b.position.y += (targetY - b.position.y) * lerp;
    b.rotation.x += (targetRotX - b.rotation.x) * lerp;
    b.rotation.y += (targetRotY - b.rotation.y) * lerp;
    b.rotation.z += (targetRotZ - b.rotation.z) * lerp;
    b.scale.x += (targetScaleX - b.scale.x) * lerp;
  }

  destroy() {
    this.scene.remove(this.root);
  }
}

window.HumanoidFighter3D = HumanoidFighter3D;
