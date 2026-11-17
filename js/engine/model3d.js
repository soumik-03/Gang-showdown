/**
 * ===================================================================
 *  FIGHTKARO-STYLE 3D HUMANOID FIGHTER RIGGING & ANIMATIONS (Three.js)
 * ===================================================================
 *  Full articulated 3D human figures inspired by FightKaro:
 *    - Real human anatomy: head with expressive face texture, neck,
 *      torso/kurta/jacket, shoulders, arms, elbows, fists, pelvis,
 *      thighs, knees, calves, and shoes/sandals.
 *    - Modular face mapping: user and friends' photo textures can be
 *      applied directly onto the 3D head!
 *    - Authentic FightKaro fighting moves:
 *      * Martial arts horse stance with breathing bob & weave
 *      * Dynamic two-legged stepping strides and arm pumps
 *      * Snappy lead jabs with locking elbows
 *      * Full-torso power crosses
 *      * Ground-dip rising uppercuts
 *      * High roundhouse kicks & low floor sweeps
 *      * Crossed forearm boxing guard
 *      * Staggered hit reactions & airborne tumble knockouts
 *      * Victorious post-fight celebration dance ("Balle Balle" arms up!)
 * ===================================================================
 */

class HumanoidFighter3D {
  constructor(scene, config, isPlayer1 = true) {
    this.scene = scene;
    this.config = config || {};
    this.isPlayer1 = isPlayer1;
    this.charId = config.id || 'detective';

    // Root Group (anchored at fighter position in world space)
    this.root = new THREE.Group();
    this.scene.add(this.root);

    // Floor Contact Shadow (scales and fades with jumps and airborne tumbles)
    this.buildContactShadow();

    // Motion group (handles body translations and airborne trajectory)
    this.motionGroup = new THREE.Group();
    this.root.add(this.motionGroup);

    // Inner Model group (handles 3D facing angle)
    this.modelGroup = new THREE.Group();
    this.motionGroup.add(this.modelGroup);

    // Joints dictionary & mesh parts array (must be initialized before building body!)
    this.joints = {};
    this.meshParts = [];
    this.animTime = Math.random() * 10;
    this.currentFacing = isPlayer1 ? 1 : -1;
    this.hitFlashTimer = 0;

    // Build the 3D Humanoid Body
    this.buildHumanoidBody();

    // Aura lighting & Combat VFX
    this.buildAuraLight();
    this.buildCombatVFX();
  }

  // --- MATERIAL HELPER ---
  mat(color, roughness = 0.55, metalness = 0.15) {
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: roughness,
      metalness: metalness
    });
  }

  // --- DYNAMIC FLOOR CONTACT SHADOW ---
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
    const shadowGeo = new THREE.PlaneGeometry(2.6, 1.6);
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
    const sparkGeo = new THREE.RingGeometry(0.15, 0.7, 12);
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

    // 3. Super Aura: Spinning energy ring
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

  // ===================================================================
  // BUILD FULL 3D HUMANOID BODY & CLOTHING HIERARCHY
  // ===================================================================
  buildHumanoidBody() {
    const cfg = this.config.body || {};
    // Palette selection with rich, saturated tones
    let skinCol = 0xf5c6a5; // Realistic warm brawler skin tone
    let clothCol1 = 0xe67e22; // Kurta / Shirt primary
    let clothCol2 = 0xdcdde1; // Pajama / Pants secondary
    let shoeCol = 0x2c3e50;  // Leather shoes / sandals
    let hairCol = 0x2c3e50;  // Dark hair

    if (this.charId === 'detective') {
      clothCol1 = 0x1e3799; // Navy blue trench coat
      clothCol2 = 0x718093; // Charcoal tailored slacks
      shoeCol = 0x192a56;   // Polished Oxford shoes
      hairCol = 0x2f3640;   // Dark hair
    } else if (this.charId === 'wizard') {
      clothCol1 = 0x4834d4; // Arcane purple-blue velvet robe
      clothCol2 = 0xf5f6fa; // Pure white silk dhoti
      shoeCol = 0x30336b;
      hairCol = 0xffffff;   // White hair and beard
    } else if (this.charId === 'explorer') {
      clothCol1 = 0xd35400; // Deep safari ochre vest
      clothCol2 = 0x57606f; // Olive cargo pants
      shoeCol = 0x4a3424;   // Leather hiking boots
      hairCol = 0x3d2714;
    } else if (this.charId === 'golem') {
      clothCol1 = 0x2f3542; // Volcanic basalt plate
      clothCol2 = 0xeb4d4b; // Molten lava wraps
      shoeCol = 0x1e272e;
      hairCol = 0xff4757;   // Molten magma crest
    }

    const skinMat = this.mat(skinCol, 0.55, 0.05);
    const shirtMat = this.mat(clothCol1, 0.6, 0.05);
    const pantsMat = this.mat(clothCol2, 0.65, 0.05);
    const shoeMat = this.mat(shoeCol, 0.45, 0.2);
    const hairMat = this.mat(hairCol, 0.8, 0.05);

    // 1. Pelvis / Hips (Root of humanoid skeletal hierarchy at Y = 1.45)
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 1.45;
    this.modelGroup.add(this.pelvis);
    this.joints.pelvis = this.pelvis;

    // Pelvis cloth mesh (pants waist)
    const pelvisMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.44, 0.35, 12), pantsMat);
    pelvisMesh.castShadow = true;
    pelvisMesh.receiveShadow = true;
    this.pelvis.add(pelvisMesh);
    this.meshParts.push(pelvisMesh);

    // 2. Torso & Chest (Waist to neck)
    this.torso = new THREE.Group();
    this.torso.position.y = 0.2;
    this.pelvis.add(this.torso);
    this.joints.torso = this.torso;

    // Kurta / Coat Body
    const torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.48, 0.85, 12), shirtMat);
    torsoMesh.position.y = 0.42;
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    this.torso.add(torsoMesh);
    this.meshParts.push(torsoMesh);

    // Collar detail
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.12, 12), shirtMat);
    collar.position.y = 0.85;
    collar.castShadow = true;
    this.torso.add(collar);
    this.meshParts.push(collar);

    // 3. Neck & Head
    this.neck = new THREE.Group();
    this.neck.position.y = 0.88;
    this.torso.add(this.neck);
    this.joints.neck = this.neck;

    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.22, 10), skinMat);
    neckMesh.position.y = 0.11;
    neckMesh.castShadow = true;
    this.neck.add(neckMesh);
    this.meshParts.push(neckMesh);

    this.head = new THREE.Group();
    this.head.position.y = 0.25;
    this.neck.add(this.head);
    this.joints.head = this.head;

    // 3D Human Head Geometry
    const headSphere = new THREE.Mesh(new THREE.SphereGeometry(0.44, 18, 18), skinMat);
    headSphere.scale.set(1.0, 1.15, 1.05);
    headSphere.castShadow = true;
    this.head.add(headSphere);
    this.meshParts.push(headSphere);

    // Expressive Photo-Texture Face Disc (wraps cleanly over head without cutting in)
    if (this.config.avatar) {
      const texLoader = new THREE.TextureLoader();
      texLoader.load(this.config.avatar, (tex) => {
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        const faceMat = new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2
        });
        const faceDisc = new THREE.Mesh(new THREE.CircleGeometry(0.38, 32), faceMat);
        faceDisc.position.set(0, 0.05, 0.47);
        this.head.add(faceDisc);
      });
    }

    // Character-Specific 3D Hats, Hair & Accessories
    if (this.charId === 'detective') {
      // Fedora Hat
      const fedoraGroup = new THREE.Group();
      fedoraGroup.position.set(0, 0.38, 0);
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.04, 16), this.mat(0x2f3640, 0.8, 0.1));
      brim.rotation.x = 0.08;
      fedoraGroup.add(brim);
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.35, 14), this.mat(0x2f3640, 0.8, 0.1));
      crown.position.set(0, 0.18, 0);
      crown.scale.set(1.0, 1.0, 1.15);
      fedoraGroup.add(crown);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.08, 14), this.mat(0x00d2d3, 0.5, 0.2));
      band.position.set(0, 0.08, 0);
      fedoraGroup.add(band);
      this.head.add(fedoraGroup);
      this.meshParts.push(brim, crown, band);
    } else if (this.charId === 'wizard') {
      // Pointed Wizard Hat
      const hatGroup = new THREE.Group();
      hatGroup.position.set(0, 0.36, 0);
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.04, 16), this.mat(0x1e272e, 0.75, 0.1));
      hatGroup.add(brim);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.85, 14), this.mat(0x3742fa, 0.75, 0.1));
      cone.position.set(0, 0.42, -0.05);
      cone.rotation.x = -0.12;
      hatGroup.add(cone);
      this.head.add(hatGroup);
      this.meshParts.push(brim, cone);

      // Flowing 3D White Beard
      const beard = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.5, 10), this.mat(0xf1f2f6, 0.9, 0.05));
      beard.rotation.x = Math.PI - 0.2;
      beard.position.set(0, -0.32, 0.28);
      this.head.add(beard);
      this.meshParts.push(beard);
    } else if (this.charId === 'explorer') {
      // Safari Sun Hat
      const hatGroup = new THREE.Group();
      hatGroup.position.set(0, 0.36, 0);
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.04, 16), this.mat(0xf39c12, 0.75, 0.1));
      hatGroup.add(brim);
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.3, 14), this.mat(0xe67e22, 0.75, 0.1));
      crown.position.set(0, 0.16, 0);
      hatGroup.add(crown);
      this.head.add(hatGroup);
      this.meshParts.push(brim, crown);
    } else if (this.charId === 'golem') {
      // Magma Horn Crest
      const horn1 = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.42, 8), this.mat(0xeb2f06, 0.6, 0.2));
      horn1.position.set(0.28, 0.48, 0.1);
      horn1.rotation.z = -0.35;
      const horn2 = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.42, 8), this.mat(0xeb2f06, 0.6, 0.2));
      horn2.position.set(-0.28, 0.48, 0.1);
      horn2.rotation.z = 0.35;
      this.head.add(horn1, horn2);
      this.meshParts.push(horn1, horn2);
    } else {
      // Default Stylized Hair
      const hairMesh = new THREE.Mesh(new THREE.SphereGeometry(0.46, 14, 14), hairMat);
      hairMesh.position.set(0, 0.12, -0.05);
      hairMesh.scale.set(1.02, 0.8, 1.05);
      hairMesh.castShadow = true;
      this.head.add(hairMesh);
      this.meshParts.push(hairMesh);
    }

    // 4. Arms & Hands (Left & Right)
    this.buildArm(1, shirtMat, skinMat);  // Right Arm (X > 0)
    this.buildArm(-1, shirtMat, skinMat); // Left Arm (X < 0)

    // 5. Legs & Shoes (Left & Right)
    this.buildLeg(1, pantsMat, shoeMat);  // Right Leg (X > 0)
    this.buildLeg(-1, pantsMat, shoeMat); // Left Leg (X < 0)
  }

  // --- BUILD ARTICULATED 3D ARM ---
  buildArm(side, shirtMat, skinMat) {
    const isRight = side === 1;
    const prefix = isRight ? 'right' : 'left';

    // Shoulder Pivot
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.62, 0.72, 0);
    this.torso.add(shoulder);
    this.joints[`${prefix}Shoulder`] = shoulder;

    // Shoulder cloth sleeve
    const sleeve = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), shirtMat);
    sleeve.castShadow = true;
    shoulder.add(sleeve);
    this.meshParts.push(sleeve);

    // Upper Arm
    const upperArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.55, 10), shirtMat);
    upperArmMesh.position.y = -0.28;
    upperArmMesh.castShadow = true;
    shoulder.add(upperArmMesh);
    this.meshParts.push(upperArmMesh);

    // Elbow Pivot
    const elbow = new THREE.Group();
    elbow.position.y = -0.55;
    shoulder.add(elbow);
    this.joints[`${prefix}Elbow`] = elbow;

    // Forearm
    const forearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.5, 10), skinMat);
    forearmMesh.position.y = -0.25;
    forearmMesh.castShadow = true;
    elbow.add(forearmMesh);
    this.meshParts.push(forearmMesh);

    // 3D Fist / Hand
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.24, 0.22), skinMat);
    hand.position.set(0, -0.52, 0.02);
    hand.castShadow = true;
    elbow.add(hand);
    this.meshParts.push(hand);
  }

  // --- BUILD ARTICULATED 3D LEG ---
  buildLeg(side, pantsMat, shoeMat) {
    const isRight = side === 1;
    const prefix = isRight ? 'right' : 'left';

    // Hip Pivot
    const hip = new THREE.Group();
    hip.position.set(side * 0.32, -0.15, 0);
    this.pelvis.add(hip);
    this.joints[`${prefix}Hip`] = hip;

    // Thigh (Pants)
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.68, 10), pantsMat);
    thigh.position.y = -0.34;
    thigh.castShadow = true;
    hip.add(thigh);
    this.meshParts.push(thigh);

    // Knee Pivot
    const knee = new THREE.Group();
    knee.position.y = -0.68;
    hip.add(knee);
    this.joints[`${prefix}Knee`] = knee;

    // Calf / Lower Leg (Pants cuffs)
    const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.65, 10), pantsMat);
    calf.position.y = -0.32;
    calf.castShadow = true;
    knee.add(calf);
    this.meshParts.push(calf);

    // 3D Shoe / Sandal (Peshawari / leather brawler footwear)
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.55), shoeMat);
    shoe.position.set(0, -0.68, 0.12);
    shoe.castShadow = true;
    knee.add(shoe);
    this.meshParts.push(shoe);
  }

  // --- FLASH IMPACT MATERIAL ---
  flashHitMaterial() {
    this.hitFlashTimer = 0.12;
    this.meshParts.forEach((m) => {
      if (m.material && m.material.emissive) {
        m.material.emissive.setHex(0xff3333);
        m.material.emissiveIntensity = 1.0;
      }
    });
    if (this.auraLight) this.auraLight.intensity = 3.0;
  }

  restoreMaterials() {
    this.meshParts.forEach((m) => {
      if (m.material && m.material.emissive) {
        m.material.emissive.setHex(0x000000);
        m.material.emissiveIntensity = 0.0;
      }
    });
    if (this.auraLight) this.auraLight.intensity = 1.2;
  }

  // ===================================================================
  // FIGHTKARO-STYLE 3D COMBAT KINEMATICS & ANIMATION LOGIC
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

    // Dynamic ground contact shadow scaling with jumps and air tumbles
    if (this.contactShadow) {
      const height = Math.max(0, this.root.position.y);
      const scale = Math.max(0.3, 1.0 - (height * 0.18));
      this.contactShadow.scale.set(scale, scale, scale);
      this.contactShadow.material.opacity = Math.max(0.12, 0.85 - (height * 0.14));
    }

    if (this.blockShield) this.blockShield.visible = false;
    if (this.attackSpark) this.attackSpark.visible = false;
    if (this.superAura) this.superAura.visible = false;

    // Base facing orientation: 3/4 perspective angle towards camera and opponent (FightKaro style)
    const baseFacingY = facing === 1 ? (Math.PI * 0.28) : (-Math.PI * 0.28);
    this.modelGroup.rotation.y = baseFacingY;

    // Target transforms for joints
    const j = this.joints;
    let pelvisY = 1.45;
    let torsoRot = { x: 0, y: 0, z: 0 };
    let headRot = { x: 0, y: 0, z: 0 };

    // Default neutral limb angles
    let lShoulder = { x: -0.65, y: 0, z: 0.25 };
    let rShoulder = { x: -0.65, y: 0, z: -0.25 };
    let lElbow = { x: -1.35, y: 0, z: 0 };
    let rElbow = { x: -1.35, y: 0, z: 0 };

    let lHip = { x: 0, y: 0, z: 0 };
    let rHip = { x: 0, y: 0, z: 0 };
    let lKnee = { x: 0, y: 0, z: 0 };
    let rKnee = { x: 0, y: 0, z: 0 };

    let mPos = { x: 0, y: 0, z: 0 };
    let mRot = { x: 0, y: 0, z: 0 };
    let lerpSpeed = 0.35;

    const isFwdLeadL = (facing === 1);

    // -----------------------------------------------------------------
    // 1. IDLE (FightKaro Martial Arts Brawler Guard Stance)
    // -----------------------------------------------------------------
    if (state === 'idle') {
      const breath = Math.sin(this.animTime * 4.8);
      pelvisY = 1.45 + breath * 0.05;

      // Fighting stance torso angle & head angled towards screen
      torsoRot.y = isFwdLeadL ? 0.25 : -0.25;
      torsoRot.x = 0.05;
      headRot.y = isFwdLeadL ? -0.22 : 0.22;

      // Both fists up in tight boxing guard, elbows bent ~90°, rhythmic bobbing
      if (isFwdLeadL) {
        lShoulder.x = -0.75 + breath * 0.04;
        lElbow.x = -1.65; // Left guard up protecting chin
        rShoulder.x = -0.55 - breath * 0.04;
        rElbow.x = -1.75; // Right fist cocked near jaw
        lHip.x = -0.22;
        lKnee.x = 0.38; // Horse stance bent knees
        rHip.x = 0.22;
        rKnee.x = 0.28;
      } else {
        rShoulder.x = -0.75 + breath * 0.04;
        rElbow.x = -1.65;
        lShoulder.x = -0.55 - breath * 0.04;
        lElbow.x = -1.75;
        rHip.x = -0.22;
        rKnee.x = 0.38;
        lHip.x = 0.22;
        lKnee.x = 0.28;
      }
    }
    // -----------------------------------------------------------------
    // 2. WALK FORWARD (Dynamic Two-Legged Stepping Strides & Arm Pumps)
    // -----------------------------------------------------------------
    else if (state === 'walk_fwd') {
      const stride = Math.sin(this.animTime * 10);
      pelvisY = 1.45 + Math.abs(stride) * 0.08;
      mRot.z = -0.14 * facing; // Natural forward stride lean

      // Alternating leg swings & knee flexes
      lHip.x = stride * 0.75;
      rHip.x = -stride * 0.75;
      lKnee.x = Math.max(0, -stride * 0.85);
      rKnee.x = Math.max(0, stride * 0.85);

      // Alternating arm swings
      lShoulder.x = -0.65 - stride * 0.65;
      rShoulder.x = -0.65 + stride * 0.65;
      lElbow.x = -1.25;
      rElbow.x = -1.25;
      torsoRot.y = stride * 0.15;
    }
    // -----------------------------------------------------------------
    // 3. WALK BACKWARD (Defensive Back-Stepping Retreat)
    // -----------------------------------------------------------------
    else if (state === 'walk_back') {
      const stride = Math.sin(this.animTime * 8);
      pelvisY = 1.45 + Math.abs(stride) * 0.06;
      mRot.z = 0.12 * facing;

      lHip.x = -stride * 0.55;
      rHip.x = stride * 0.55;
      lKnee.x = Math.max(0, stride * 0.65);
      rKnee.x = Math.max(0, -stride * 0.65);

      lElbow.x = -1.75;
      rElbow.x = -1.75;
    }
    // -----------------------------------------------------------------
    // 4. JUMP (Airborne Tuck with Knees Raised)
    // -----------------------------------------------------------------
    else if (state === 'jump') {
      lHip.x = -0.95;
      lKnee.x = 1.45;
      rHip.x = -0.75;
      rKnee.x = 1.25;

      lShoulder.x = -1.25;
      rShoulder.x = -1.25;
      lElbow.x = -0.85;
      rElbow.x = -0.85;
    }
    // -----------------------------------------------------------------
    // 5. CROUCH (Low Ducking Guard)
    // -----------------------------------------------------------------
    else if (state === 'crouch') {
      pelvisY = 0.95;
      lHip.x = -1.45;
      lKnee.x = 2.15;
      rHip.x = -1.45;
      rKnee.x = 2.15;

      torsoRot.x = 0.35;
      lElbow.x = -1.95;
      rElbow.x = -1.95;
      lerpSpeed = 0.5;
    }
    // -----------------------------------------------------------------
    // 6. LIGHT JAB (Punch J - Lead Arm Snaps Straight Out!)
    // -----------------------------------------------------------------
    else if (state === 'punch_1' || state === 'jab') {
      mPos.x = 0.55 * facing;
      lerpSpeed = 0.7; // Fast snap

      if (isFwdLeadL) {
        lShoulder.x = -1.62; // Straight out horizontally!
        lElbow.x = -0.05;    // Elbow locks forward into punch!
        torsoRot.y = 0.45;   // Torso twist
        rShoulder.x = -0.55;
        rElbow.x = -1.85;    // Guard face
      } else {
        rShoulder.x = -1.62;
        rElbow.x = -0.05;
        torsoRot.y = -0.45;
        lShoulder.x = -0.55;
        lElbow.x = -1.85;
      }

      if (this.attackSpark) {
        this.attackSpark.visible = true;
        this.attackSpark.position.set(1.4 * facing, 1.8, 0.1);
        this.attackSpark.rotation.z += 0.3;
      }
    }
    // -----------------------------------------------------------------
    // 7. HEAVY CROSS (Punch J,J - Rear Power Punch Drives Forward!)
    // -----------------------------------------------------------------
    else if (state === 'punch_2' || state === 'cross') {
      mPos.x = 0.95 * facing;
      mPos.y = -0.08;
      lerpSpeed = 0.55;

      if (isFwdLeadL) {
        rShoulder.x = -1.68; // Rear arm full extension!
        rElbow.x = -0.05;
        torsoRot.y = -0.65;  // Deep reverse torso torque
        lShoulder.x = -0.25;
        lElbow.x = -1.65;
        rHip.x = 0.45;       // Back leg drives off floor
      } else {
        lShoulder.x = -1.68;
        lElbow.x = -0.05;
        torsoRot.y = 0.65;
        rShoulder.x = -0.25;
        rElbow.x = -1.65;
        lHip.x = 0.45;
      }

      if (this.attackSpark) {
        this.attackSpark.visible = true;
        this.attackSpark.position.set(1.8 * facing, 1.6, 0.1);
        this.attackSpark.scale.set(1.4, 1.4, 1.4);
      }
    }
    // -----------------------------------------------------------------
    // 8. RISING UPPERCUT (FightKaro Ground-Dip Uppercut!)
    // -----------------------------------------------------------------
    else if (state === 'uppercut') {
      mPos.x = 0.5 * facing;
      mPos.y = 0.85; // Launches off the arena floor!
      lerpSpeed = 0.55;

      if (isFwdLeadL) {
        rShoulder.x = -2.65; // Right arm shoots straight up to sky!
        rElbow.x = -0.25;
        torsoRot.x = -0.35;
        torsoRot.y = -0.4;
        headRot.x = -0.55;  // Head tracks rising punch
      } else {
        lShoulder.x = -2.65;
        lElbow.x = -0.25;
        torsoRot.x = -0.35;
        torsoRot.y = 0.4;
        headRot.x = -0.55;
      }

      lHip.x = -0.45;
      rHip.x = 0.35;

      if (this.attackSpark) {
        this.attackSpark.visible = true;
        this.attackSpark.position.set(0.9 * facing, 2.5, 0.1);
      }
    }
    // -----------------------------------------------------------------
    // 9. HIGH ROUNDHOUSE KICK (Leg Whips High in Overhead Arc!)
    // -----------------------------------------------------------------
    else if (state === 'kick_1' || state === 'roundhouse') {
      mPos.x = 0.75 * facing;
      mPos.y = 0.25;
      lerpSpeed = 0.5;

      if (isFwdLeadL) {
        rHip.x = -1.88; // Leg high at head height!
        rHip.z = -0.55;
        rKnee.x = 0.15; // Foot whips forward!
        lHip.x = 0.32;  // Standing leg bends to balance
        lKnee.x = 0.45;
        torsoRot.z = 0.55;
        torsoRot.y = -0.55;
      } else {
        lHip.x = -1.88;
        lHip.z = 0.55;
        lKnee.x = 0.15;
        rHip.x = 0.32;
        rKnee.x = 0.45;
        torsoRot.z = -0.55;
        torsoRot.y = 0.55;
      }

      lShoulder.x = -0.4;
      rShoulder.x = -0.4;

      if (this.attackSpark) {
        this.attackSpark.visible = true;
        this.attackSpark.position.set(1.6 * facing, 2.1, 0.1);
      }
    }
    // -----------------------------------------------------------------
    // 10. LOW SWEEP KICK (FightKaro Floor Sweep!)
    // -----------------------------------------------------------------
    else if (state === 'kick_2' || state === 'low_kick') {
      mPos.x = 0.75 * facing;
      mPos.y = -0.45;
      pelvisY = 0.85;
      lerpSpeed = 0.45;

      if (isFwdLeadL) {
        rHip.x = -1.65;
        rHip.z = 0.45;
        rKnee.x = 0.05; // Straight leg sweeps floor!
        lHip.x = -1.45; // Deep squat on other leg
        lKnee.x = 2.15;
      } else {
        lHip.x = -1.65;
        lHip.z = -0.45;
        lKnee.x = 0.05;
        rHip.x = -1.45;
        rKnee.x = 2.15;
      }

      torsoRot.x = 0.5;

      if (this.attackSpark) {
        this.attackSpark.visible = true;
        this.attackSpark.position.set(1.4 * facing, 0.35, 0.1);
      }
    }
    // -----------------------------------------------------------------
    // 11. GRAB & THROW (Both Arms Clutch Forward)
    // -----------------------------------------------------------------
    else if (state === 'grab') {
      mPos.x = 0.85 * facing;
      lShoulder.x = -1.45;
      lElbow.x = -0.65;
      rShoulder.x = -1.45;
      rElbow.x = -0.65;
      torsoRot.x = 0.3;
    }
    // -----------------------------------------------------------------
    // 12. BLOCK GUARD (Forearms Crossed Across Face)
    // -----------------------------------------------------------------
    else if (state === 'block') {
      mPos.x = -0.22 * facing;
      lShoulder.x = -1.25;
      lShoulder.z = 0.65;
      lElbow.x = -1.95; // Crossed forearm defense!

      rShoulder.x = -1.25;
      rShoulder.z = -0.65;
      rElbow.x = -1.95;

      headRot.x = 0.35; // Chin tucked

      if (this.blockShield) {
        this.blockShield.visible = true;
        this.blockShield.position.x = 0.85 * facing;
        this.blockShield.rotation.z += 0.08;
      }
    }
    // -----------------------------------------------------------------
    // 13. HIT REACTION (Head Snaps Back, Body Recoils)
    // -----------------------------------------------------------------
    else if (state === 'hit') {
      mPos.x = -0.55 * facing;
      mPos.y = 0.12;

      headRot.x = -0.75; // Head snaps backward!
      headRot.y = -0.25;
      torsoRot.x = -0.45;

      lShoulder.x = 0.45;
      rShoulder.x = 0.45;

      lerpSpeed = 0.7; // Fast recoil
      this.flashHitMaterial();
    }
    // -----------------------------------------------------------------
    // 14. KNOCKDOWN (Tumbles Airborne and Lands Flat on Back)
    // -----------------------------------------------------------------
    else if (state === 'knockdown') {
      mPos.x = -1.1 * facing;
      mPos.y = -1.35;
      mRot.z = facing * (Math.PI / 2.05);

      lShoulder.x = 0.35;
      lShoulder.z = -0.75;
      rShoulder.x = 0.35;
      rShoulder.z = 0.75;
      lHip.x = -0.35;
      lKnee.x = 0.55;
      rHip.x = -0.35;
      rKnee.x = 0.55;
    }
    // -----------------------------------------------------------------
    // 15. VICTORY CELEBRATION DANCE (FightKaro "Balle Balle" Dance!)
    // -----------------------------------------------------------------
    else if (state === 'victory_dance' || state === 'win') {
      const danceStep = Math.sin(this.animTime * 9);
      pelvisY = 1.45 + Math.abs(danceStep) * 0.12;

      // Both arms waving high in the air celebrating!
      lShoulder.x = -2.85 + Math.sin(this.animTime * 6) * 0.25;
      lShoulder.z = 0.45;
      lElbow.x = -0.65;

      rShoulder.x = -2.85 - Math.sin(this.animTime * 6) * 0.25;
      rShoulder.z = -0.45;
      rElbow.x = -0.65;

      // One knee bouncing high in celebration!
      lHip.x = Math.max(-1.1, danceStep * 1.1);
      lKnee.x = Math.max(0.2, danceStep * 1.5);
      rHip.x = -danceStep * 0.3;
      rKnee.x = 0.3;

      headRot.y = Math.sin(this.animTime * 5) * 0.35;
      headRot.x = -0.25; // Looking up joyfully
      torsoRot.z = Math.sin(this.animTime * 4.5) * 0.15;
    }
    // -----------------------------------------------------------------
    // 16. SUPER MOVE CHARGE (Power Levitation with Vibration)
    // -----------------------------------------------------------------
    else if (state === 'super_charge') {
      mPos.y = 0.45 + Math.sin(this.animTime * 16) * 0.08;
      mPos.x = (Math.random() - 0.5) * 0.12;

      lShoulder.x = 0.65;
      lShoulder.z = -0.65;
      lElbow.x = -1.85;

      rShoulder.x = 0.65;
      rShoulder.z = 0.65;
      rElbow.x = -1.85;

      torsoRot.x = -0.35;
      headRot.x = -0.45;

      if (this.superAura) {
        this.superAura.visible = true;
        this.superAura.rotation.z += 0.15;
      }
      if (this.auraLight) this.auraLight.intensity = 3.5;
    }

    // Apply Lerping to Motion Group
    this.motionGroup.position.x += (mPos.x - this.motionGroup.position.x) * lerpSpeed;
    this.motionGroup.position.y += (mPos.y - this.motionGroup.position.y) * lerpSpeed;
    this.motionGroup.position.z += (mPos.z - this.motionGroup.position.z) * lerpSpeed;

    this.motionGroup.rotation.x += (mRot.x - this.motionGroup.rotation.x) * lerpSpeed;
    this.motionGroup.rotation.y += (mRot.y - this.motionGroup.rotation.y) * lerpSpeed;
    this.motionGroup.rotation.z += (mRot.z - this.motionGroup.rotation.z) * lerpSpeed;

    // Apply Lerping to Every Joint
    if (this.pelvis) this.pelvis.position.y += (pelvisY - this.pelvis.position.y) * lerpSpeed;
    this.lerpRot(j.torso, torsoRot, lerpSpeed);
    this.lerpRot(j.neck, { x: 0, y: 0, z: 0 }, lerpSpeed);
    this.lerpRot(j.head, headRot, lerpSpeed);

    this.lerpRot(j.leftShoulder, lShoulder, lerpSpeed);
    this.lerpRot(j.leftElbow, lElbow, lerpSpeed);
    this.lerpRot(j.rightShoulder, rShoulder, lerpSpeed);
    this.lerpRot(j.rightElbow, rElbow, lerpSpeed);

    this.lerpRot(j.leftHip, lHip, lerpSpeed);
    this.lerpRot(j.leftKnee, lKnee, lerpSpeed);
    this.lerpRot(j.rightHip, rHip, lerpSpeed);
    this.lerpRot(j.rightKnee, rKnee, lerpSpeed);
  }

  lerpRot(obj, target, factor) {
    if (!obj || !target) return;
    obj.rotation.x += (target.x - obj.rotation.x) * factor;
    obj.rotation.y += (target.y - obj.rotation.y) * factor;
    obj.rotation.z += (target.z - obj.rotation.z) * factor;
  }

  destroy() {
    this.scene.remove(this.root);
  }
}

window.HumanoidFighter3D = HumanoidFighter3D;
