/**
 * ===================================================================
 *  GENUINE 3D FIGURE MODELS & SKELETAL RIGGING (Three.js)
 * ===================================================================
 *  Full 3D geometric models for each of the 4 characters:
 *    1. Detective Bot (Trench coat, fedora, robot limbs, magnifying glass)
 *    2. Cyber Mage (Pointed wizard hat, starry robe, white beard, cyber visor, neon staff)
 *    3. Compass Scout (Safari hat, brass compass head & needle, utility vest, boots)
 *    4. Magma Golem (Volcanic rock plates, molten lava seams, key crest shield)
 *  
 *  Full articulated joint animation: arms punch, legs step, knees bend,
 *  heads turn, and weapons swing in real 3D space!
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

    // Dynamic contact shadow under feet
    this.buildContactShadow();

    // Joints dictionary for keyframe animation
    this.joints = {};

    // Build the specific 3D character figure model
    this.buildCharacterModel();

    this.animTime = 0;
  }

  // --- HELPER: PBR MATERIALS ---
  mat(color, roughness = 0.5, metalness = 0.1, emissive = 0x000000, emissiveInt = 0) {
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: roughness,
      metalness: metalness,
      emissive: emissive,
      emissiveIntensity: emissiveInt
    });
  }

  // --- DYNAMIC CONTACT SHADOW ---
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

  // --- DISPATCH BUILDER ---
  buildCharacterModel() {
    if (this.charId === 'detective') {
      this.buildDetectiveBot();
    } else if (this.charId === 'wizard') {
      this.buildCyberWizard();
    } else if (this.charId === 'explorer') {
      this.buildCompassExplorer();
    } else {
      this.buildMagmaGolem();
    }
  }

  // ===================================================================
  // 1. DETECTIVE BOT (Inspector Clue)
  // ===================================================================
  buildDetectiveBot() {
    const tealMat = this.mat(0x388e8e, 0.35, 0.6);        // Robot metal
    const coatMat = this.mat(0xd7ccc8, 0.8, 0.05);        // Trench coat
    const fedoraMat = this.mat(0x8d6e63, 0.85, 0.05);     // Brown fedora
    const bandMat = this.mat(0x3e2723, 0.5, 0.1);         // Hat band
    const screenMat = this.mat(0x0a1014, 0.2, 0.8, 0x1dd1a1, 1.2); // Glowing LED visor
    const darkMetal = this.mat(0x2f3640, 0.4, 0.5);

    // Pelvis
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 1.9;
    this.root.add(this.pelvis);
    this.joints.pelvis = this.pelvis;

    const lowerPelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.5, 0.4, 14), darkMetal);
    lowerPelvis.castShadow = true;
    this.pelvis.add(lowerPelvis);

    // Torso (Trench Coat + Robot Core)
    this.torso = new THREE.Group();
    this.torso.position.y = 0.25;
    this.pelvis.add(this.torso);
    this.joints.torso = this.torso;

    // Trench coat body
    const coatMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.65, 0.95, 14), coatMat);
    coatMesh.position.y = 0.45;
    coatMesh.castShadow = true;
    this.torso.add(coatMesh);

    // Trench coat collar lapels
    const lapelL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.55, 0.15), coatMat);
    lapelL.position.set(-0.35, 0.7, 0.4);
    lapelL.rotation.z = -0.3;
    this.torso.add(lapelL);

    const lapelR = lapelL.clone();
    lapelR.position.x = 0.35;
    lapelR.rotation.z = 0.3;
    this.torso.add(lapelR);

    // Belt
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.74, 0.12, 14), bandMat);
    belt.position.y = 0.15;
    this.torso.add(belt);

    // Neck & Head
    this.neck = new THREE.Group();
    this.neck.position.y = 0.95;
    this.torso.add(this.neck);
    this.joints.neck = this.neck;

    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 0.42;
    this.neck.add(this.headGroup);
    this.joints.head = this.headGroup;

    // Teal Round Robot Head
    const headSphere = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), tealMat);
    headSphere.castShadow = true;
    this.headGroup.add(headSphere);

    // Glowing Curved LED Screen Visor (Smiling eyes)
    const visorGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.38, 14, 1, false, -Math.PI / 3, (2 * Math.PI) / 3);
    const visor = new THREE.Mesh(visorGeo, screenMat);
    visor.position.set(0, 0.05, 0.15);
    visor.rotation.y = Math.PI / 2;
    this.headGroup.add(visor);

    // Fedora Hat
    const fedoraBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.06, 18), fedoraMat);
    fedoraBrim.position.set(0, 0.48, 0.05);
    fedoraBrim.rotation.x = -0.08;
    this.headGroup.add(fedoraBrim);

    const fedoraCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.54, 0.38, 16), fedoraMat);
    fedoraCrown.position.set(0, 0.68, 0.05);
    fedoraCrown.rotation.x = -0.08;
    this.headGroup.add(fedoraCrown);

    const fedoraBand = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 16), bandMat);
    fedoraBand.position.set(0, 0.54, 0.05);
    fedoraBand.rotation.x = -0.08;
    this.headGroup.add(fedoraBand);

    // Arms & Magnifying Glass
    this.setupStandardArms(coatMat, tealMat, darkMetal, 'detective');

    // Legs & Tread Boots
    this.setupStandardLegs(darkMetal, darkMetal, darkMetal, 0.55);
  }

  // ===================================================================
  // 2. CYBER MAGE (Chrono Wizard)
  // ===================================================================
  buildCyberWizard() {
    const robeMat = this.mat(0x1e3799, 0.6, 0.1);          // Royal blue velvet robe
    const hatMat = this.mat(0x0c2461, 0.55, 0.1);         // Deep blue hat
    const beardMat = this.mat(0xf5f6fa, 0.8, 0.0);        // Fluffy white beard
    const goldMat = this.mat(0xfbc531, 0.3, 0.8);          // Gold stars / buckles
    const neonCyan = this.mat(0x00d2d3, 0.2, 0.5, 0x00f2fe, 1.4); // Neon data staff glow

    // Pelvis
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 1.85;
    this.root.add(this.pelvis);
    this.joints.pelvis = this.pelvis;

    // Torso (Wizard Robe)
    this.torso = new THREE.Group();
    this.torso.position.y = 0.25;
    this.pelvis.add(this.torso);
    this.joints.torso = this.torso;

    // Robe Bell Shape
    const robeGeo = new THREE.CylinderGeometry(0.58, 0.85, 1.15, 16);
    const robeMesh = new THREE.Mesh(robeGeo, robeMat);
    robeMesh.position.y = 0.45;
    robeMesh.castShadow = true;
    this.torso.add(robeMesh);

    // Golden Stars on robe
    for (let i = 0; i < 6; i++) {
      const star = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), goldMat);
      const angle = (i / 6) * Math.PI * 1.5 - 0.75;
      star.position.set(Math.sin(angle) * 0.72, 0.2 + (i % 3) * 0.3, Math.cos(angle) * 0.72);
      this.torso.add(star);
    }

    // Neck & Head
    this.neck = new THREE.Group();
    this.neck.position.y = 1.05;
    this.torso.add(this.neck);
    this.joints.neck = this.neck;

    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 0.38;
    this.neck.add(this.headGroup);
    this.joints.head = this.headGroup;

    // Head base
    const headSphere = new THREE.Mesh(new THREE.SphereGeometry(0.48, 14, 14), this.mat(0xf5cd79, 0.7, 0.05));
    this.headGroup.add(headSphere);

    // Glowing Cyber Visor
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.24, 0.28), neonCyan);
    visor.position.set(0, 0.12, 0.38);
    this.headGroup.add(visor);

    // 3D Flowing White Beard
    const beardGroup = new THREE.Group();
    beardGroup.position.set(0, -0.1, 0.3);
    this.headGroup.add(beardGroup);

    // Beard layers (layered soft puffs)
    const beardMain = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.9, 12), beardMat);
    beardMain.rotation.x = 0.25;
    beardMain.position.set(0, -0.35, 0.12);
    beardGroup.add(beardMain);

    const mustacheL = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), beardMat);
    mustacheL.scale.set(1.4, 0.8, 0.8);
    mustacheL.position.set(-0.18, 0.02, 0.18);
    beardGroup.add(mustacheL);

    const mustacheR = mustacheL.clone();
    mustacheR.position.x = 0.18;
    beardGroup.add(mustacheR);

    // Conical Wizard Hat with Kinked Tip
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.06, 18), hatMat);
    hatBrim.position.set(0, 0.42, 0);
    this.headGroup.add(hatBrim);

    const hatCone = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.25, 14), hatMat);
    hatCone.position.set(0, 1.0, -0.1);
    hatCone.rotation.x = -0.25;
    this.headGroup.add(hatCone);

    // Star on hat
    const hatStar = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), goldMat);
    hatStar.position.set(0, 0.7, 0.4);
    this.headGroup.add(hatStar);

    // Arms & Magic Staff
    this.setupStandardArms(robeMat, this.mat(0xf5cd79, 0.7), robeMat, 'wizard');

    // Legs under robe
    this.setupStandardLegs(robeMat, this.mat(0x3e2723, 0.6), this.mat(0x3e2723, 0.6), 0.5);
  }

  // ===================================================================
  // 3. COMPASS SCOUT (The Navigator)
  // ===================================================================
  buildCompassExplorer() {
    const vestMat = this.mat(0xc7a760, 0.75, 0.05);        // Khaki safari vest
    const hatMat = this.mat(0xd7ccc8, 0.8, 0.05);         // Safari sun hat
    const brassMat = this.mat(0xd4af37, 0.35, 0.6);       // Brass compass casing
    const dialMat = this.mat(0xffffff, 0.2, 0.1);          // White compass dial
    const needleCyan = this.mat(0x00d2d3, 0.2, 0.5, 0x00f2fe, 1.2); // Glowing needle
    const skinMat = this.mat(0xf5cd79, 0.65, 0.05);
    const bootMat = this.mat(0x5d4037, 0.6, 0.1);

    // Pelvis
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 1.9;
    this.root.add(this.pelvis);
    this.joints.pelvis = this.pelvis;

    const shorts = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.5, 0.45, 14), vestMat);
    shorts.castShadow = true;
    this.pelvis.add(shorts);

    // Torso (Utility Vest + Canteen + Binoculars)
    this.torso = new THREE.Group();
    this.torso.position.y = 0.25;
    this.pelvis.add(this.torso);
    this.joints.torso = this.torso;

    const vestMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.62, 0.85, 14), vestMat);
    vestMesh.position.y = 0.42;
    vestMesh.castShadow = true;
    this.torso.add(vestMesh);

    // Pockets on vest
    const pocketL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.25, 0.12), this.mat(0xa1887f, 0.8));
    pocketL.position.set(-0.28, 0.35, 0.36);
    this.torso.add(pocketL);

    const pocketR = pocketL.clone();
    pocketR.position.x = 0.28;
    this.torso.add(pocketR);

    // Green Canteen on belt
    const canteen = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), this.mat(0x2e7d32, 0.5, 0.2));
    canteen.position.set(0.65, 0.1, 0);
    canteen.scale.set(0.7, 1.2, 1);
    this.torso.add(canteen);

    // Neck & Head (Giant Brass Compass)
    this.neck = new THREE.Group();
    this.neck.position.y = 0.88;
    this.torso.add(this.neck);
    this.joints.neck = this.neck;

    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 0.45;
    this.neck.add(this.headGroup);
    this.joints.head = this.headGroup;

    // Brass Compass Head Ring
    const compassCase = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.38, 18), brassMat);
    compassCase.rotation.x = Math.PI / 2;
    compassCase.castShadow = true;
    this.headGroup.add(compassCase);

    // Dial Face
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.05, 18), dialMat);
    dial.rotation.x = Math.PI / 2;
    dial.position.z = 0.18;
    this.headGroup.add(dial);

    // 3D Glowing Compass Needle
    const needle = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.75, 4), needleCyan);
    needle.position.set(0, 0, 0.22);
    needle.rotation.z = -0.5; // Angled needle
    this.headGroup.add(needle);

    // Cartoon Eyes on compass dial
    const eyeWhiteMat = this.mat(0xffffff, 0.2);
    const pupilMat = this.mat(0x1e272e, 0.2);
    [-0.18, 0.18].forEach(x => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), eyeWhiteMat);
      eye.position.set(x, 0.14, 0.22);
      this.headGroup.add(eye);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), pupilMat);
      pupil.position.set(x, 0.14, 0.3);
      this.headGroup.add(pupil);
    });

    // Safari Sun Hat
    const safariBrim = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.06, 20), hatMat);
    safariBrim.position.set(0, 0.46, 0);
    this.headGroup.add(safariBrim);

    const safariDome = new THREE.Mesh(new THREE.SphereGeometry(0.58, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), hatMat);
    safariDome.position.set(0, 0.48, 0);
    this.headGroup.add(safariDome);

    // Arms & Handheld Compass
    this.setupStandardArms(vestMat, skinMat, this.mat(0x8d6e63, 0.6), 'explorer');

    // Legs & Hiking Boots
    this.setupStandardLegs(skinMat, bootMat, bootMat, 0.58);
  }

  // ===================================================================
  // 4. MAGMA GOLEM (Pyre Titan)
  // ===================================================================
  buildMagmaGolem() {
    const rockMat = this.mat(0x263238, 0.75, 0.2);          // Obsidian volcanic stone
    const lavaMat = this.mat(0xff4757, 0.2, 0.3, 0xff6b81, 1.8); // Glowing hot magma
    const shieldMat = this.mat(0xd63031, 0.4, 0.4);        // Red armored shield
    const goldMat = this.mat(0xffa502, 0.3, 0.8, 0xffa502, 0.8); // Golden key emblem

    // Pelvis (Chunky rock block)
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 1.95;
    this.root.add(this.pelvis);
    this.joints.pelvis = this.pelvis;

    const rockPelvis = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.55, 0.8), rockMat);
    rockPelvis.castShadow = true;
    this.pelvis.add(rockPelvis);

    // Glowing magma joint under hips
    const magmaHips = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 0.6), lavaMat);
    magmaHips.position.y = -0.32;
    this.pelvis.add(magmaHips);

    // Torso (Volcanic Rock Chest + Molten Core)
    this.torso = new THREE.Group();
    this.torso.position.y = 0.32;
    this.pelvis.add(this.torso);
    this.joints.torso = this.torso;

    // Glowing Lava Core Interior
    const lavaCore = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.7), lavaMat);
    lavaCore.position.y = 0.45;
    this.torso.add(lavaCore);

    // Heavy Rock Chest Slabs (Fragmented over lava)
    const chestPlateL = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.85, 0.3), rockMat);
    chestPlateL.position.set(-0.35, 0.48, 0.35);
    chestPlateL.rotation.y = 0.15;
    chestPlateL.castShadow = true;
    this.torso.add(chestPlateL);

    const chestPlateR = chestPlateL.clone();
    chestPlateR.position.x = 0.35;
    chestPlateR.rotation.y = -0.15;
    this.torso.add(chestPlateR);

    // Chest Shield with Key Crest
    const shieldGeo = new THREE.BoxGeometry(0.65, 0.85, 0.12);
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.set(0, 0.45, 0.52);
    this.torso.add(shield);

    const keyCrest = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.45, 8), goldMat);
    keyCrest.position.set(0, 0.45, 0.6);
    this.torso.add(keyCrest);

    // Neck & Head (Faceted Rock Golem Helmet)
    this.neck = new THREE.Group();
    this.neck.position.y = 0.95;
    this.torso.add(this.neck);
    this.joints.neck = this.neck;

    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 0.42;
    this.neck.add(this.headGroup);
    this.joints.head = this.headGroup;

    // Rock Golem Head
    const headBlock = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.82, 0.8), rockMat);
    headBlock.castShadow = true;
    this.headGroup.add(headBlock);

    // Glowing Magma Eye Visor Slit
    const eyeSlit = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 0.25), this.mat(0x00f2fe, 0.1, 0.5, 0x00f2fe, 1.8));
    eyeSlit.position.set(0, 0.05, 0.38);
    this.headGroup.add(eyeSlit);

    // Magma Horns
    const hornL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.32, 0.18), lavaMat);
    hornL.position.set(-0.42, 0.48, 0.1);
    this.headGroup.add(hornL);

    const hornR = hornL.clone();
    hornR.position.x = 0.42;
    this.headGroup.add(hornR);

    // Arms & Boulder Fists
    this.setupStandardArms(rockMat, lavaMat, rockMat, 'golem');

    // Legs & Stomper Blocks
    this.setupStandardLegs(rockMat, lavaMat, rockMat, 0.65);
  }

  // ===================================================================
  // UNIVERSAL ARTICULATED 3D LIMBS & WEAPONS
  // ===================================================================
  setupStandardArms(shoulderMat, armMat, gloveMat, charType) {
    // Left Arm
    const leftArm = this.buildArm(1, shoulderMat, armMat, gloveMat, charType);
    this.torso.add(leftArm.shoulder);
    this.joints.leftShoulder = leftArm.shoulder;
    this.joints.leftElbow = leftArm.elbow;
    this.joints.leftHand = leftArm.hand;

    // Right Arm (Holds primary weapon)
    const rightArm = this.buildArm(-1, shoulderMat, armMat, gloveMat, charType);
    this.torso.add(rightArm.shoulder);
    this.joints.rightShoulder = rightArm.shoulder;
    this.joints.rightElbow = rightArm.elbow;
    this.joints.rightHand = rightArm.hand;

    // Attach Character Signature Weapons to Hands!
    if (charType === 'detective') {
      // 3D Magnifying Glass in right hand
      const magHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), this.mat(0x5d4037, 0.7));
      magHandle.position.set(0, -0.35, 0.25);
      magHandle.rotation.x = Math.PI / 3;
      rightArm.hand.add(magHandle);

      const magRim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 8, 16), this.mat(0xd4af37, 0.3, 0.8));
      magRim.position.set(0, -0.15, 0.48);
      rightArm.hand.add(magRim);
    } else if (charType === 'wizard') {
      // 3D Glowing Cyber Staff in right hand
      const staffRod = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8), this.mat(0x00d2d3, 0.2, 0.5, 0x00f2fe, 1.2));
      staffRod.position.set(0, 0.4, 0.2);
      rightArm.hand.add(staffRod);

      const staffRing = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.05, 8, 16), this.mat(0x00f2fe, 0.1, 0.9, 0x00f2fe, 1.8));
      staffRing.position.set(0, 1.6, 0.2);
      staffRing.rotation.y = Math.PI / 2;
      rightArm.hand.add(staffRing);
    } else if (charType === 'explorer') {
      // Handheld glowing compass in left hand
      const compGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.08, 14);
      const compMesh = new THREE.Mesh(compGeo, this.mat(0xd4af37, 0.3, 0.7, 0x00d2d3, 0.6));
      compMesh.rotation.x = Math.PI / 3;
      compMesh.position.set(0, -0.2, 0.2);
      leftArm.hand.add(compMesh);
    }
  }

  buildArm(dir, shoulderMat, armMat, gloveMat, charType) {
    const isGolem = charType === 'golem';

    // Shoulder Pivot
    const shoulder = new THREE.Group();
    shoulder.position.set(dir * 0.9, 0.72, 0);

    const shoulderMesh = new THREE.Mesh(
      isGolem ? new THREE.BoxGeometry(0.48, 0.48, 0.48) : new THREE.SphereGeometry(0.28, 10, 10),
      shoulderMat
    );
    shoulderMesh.castShadow = true;
    shoulder.add(shoulderMesh);

    // Upper Arm
    const upperArm = new THREE.Mesh(
      isGolem ? new THREE.BoxGeometry(0.32, 0.6, 0.32) : new THREE.CylinderGeometry(0.18, 0.16, 0.65, 10),
      armMat
    );
    upperArm.position.y = -0.35;
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    // Elbow Pivot
    const elbow = new THREE.Group();
    elbow.position.y = -0.65;
    shoulder.add(elbow);

    // Forearm
    const forearm = new THREE.Mesh(
      isGolem ? new THREE.BoxGeometry(0.36, 0.6, 0.36) : new THREE.CylinderGeometry(0.17, 0.15, 0.65, 10),
      armMat
    );
    forearm.position.y = -0.32;
    forearm.castShadow = true;
    elbow.add(forearm);

    // Fist / Hand
    const hand = new THREE.Group();
    hand.position.y = -0.65;
    elbow.add(hand);

    const fistMesh = new THREE.Mesh(
      isGolem ? new THREE.BoxGeometry(0.44, 0.44, 0.44) : new THREE.BoxGeometry(0.3, 0.32, 0.32),
      gloveMat
    );
    fistMesh.castShadow = true;
    hand.add(fistMesh);

    return { shoulder, elbow, hand };
  }

  setupStandardLegs(thighMat, shinMat, shoeMat, legRadius = 0.5) {
    // Left Leg
    const leftLeg = this.buildLeg(1, thighMat, shinMat, shoeMat, legRadius);
    this.pelvis.add(leftLeg.hip);
    this.joints.leftHip = leftLeg.hip;
    this.joints.leftKnee = leftLeg.knee;
    this.joints.leftFoot = leftLeg.foot;

    // Right Leg
    const rightLeg = this.buildLeg(-1, thighMat, shinMat, shoeMat, legRadius);
    this.pelvis.add(rightLeg.hip);
    this.joints.rightHip = rightLeg.hip;
    this.joints.rightKnee = rightLeg.knee;
    this.joints.rightFoot = rightLeg.foot;
  }

  buildLeg(dir, thighMat, shinMat, shoeMat, radius) {
    const isGolem = this.charId === 'golem';

    // Hip Pivot
    const hip = new THREE.Group();
    hip.position.set(dir * 0.38, -0.15, 0);

    // Thigh
    const thigh = new THREE.Mesh(
      isGolem ? new THREE.BoxGeometry(0.38, 0.85, 0.38) : new THREE.CylinderGeometry(0.24, 0.2, 0.85, 10),
      thighMat
    );
    thigh.position.y = -0.42;
    thigh.castShadow = true;
    hip.add(thigh);

    // Knee Pivot
    const knee = new THREE.Group();
    knee.position.y = -0.85;
    hip.add(knee);

    // Shin / Calf
    const shin = new THREE.Mesh(
      isGolem ? new THREE.BoxGeometry(0.36, 0.85, 0.36) : new THREE.CylinderGeometry(0.2, 0.17, 0.85, 10),
      shinMat
    );
    shin.position.y = -0.42;
    shin.castShadow = true;
    knee.add(shin);

    // Foot / Shoe Pivot
    const foot = new THREE.Group();
    foot.position.y = -0.85;
    knee.add(foot);

    // 3D Shoe / Stomper Boot
    const shoe = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.26, 0.65),
      shoeMat
    );
    shoe.position.set(0, 0.05, 0.14);
    shoe.castShadow = true;
    foot.add(shoe);

    return { hip, knee, foot };
  }

  // ===================================================================
  // ARTICULATED 3D SKELETAL COMBAT ANIMATIONS
  // ===================================================================
  updateAnimation(state, facing, delta) {
    this.animTime += delta * 10;
    const j = this.joints;

    let torsoRot = { x: 0, y: 0, z: 0 };
    let lShoulder = { x: 0, y: 0, z: 0.3 };
    let rShoulder = { x: 0, y: 0, z: -0.3 };
    let lElbow = { x: -0.8, y: 0, z: 0 };
    let rElbow = { x: -0.8, y: 0, z: 0 };
    let lHip = { x: 0, y: 0, z: 0.05 };
    let rHip = { x: 0, y: 0, z: -0.05 };
    let lKnee = { x: 0, y: 0, z: 0 };
    let rKnee = { x: 0, y: 0, z: 0 };
    let pelvisY = 1.95;

    // Contact shadow scaling with jumps
    if (this.contactShadow) {
      const height = Math.max(0, this.root.position.y);
      const scale = Math.max(0.35, 1.0 - (height * 0.18));
      this.contactShadow.scale.set(scale, scale, scale);
    }

    // 1. Idle Ready Brawler Stance (Athletic breathing bounce & chin guard)
    if (state === 'idle') {
      const bounce = Math.sin(this.animTime * 0.85) * 0.08;
      pelvisY += bounce;

      torsoRot.y = 0.38; // Angled fighting stance
      lShoulder.x = -0.65 + bounce;
      lShoulder.z = 0.38;
      lElbow.x = -1.75; // Left guard up protecting chin

      rShoulder.x = -0.55 - bounce;
      rShoulder.z = -0.32;
      rElbow.x = -1.85; // Cocked right fist/staff

      lHip.x = -0.18;
      rHip.x = 0.18;
      lKnee.x = 0.25;
      rKnee.x = 0.25;
    }
    // 2. Walk Forward (True alternating 3D leg stride & arm pump)
    else if (state === 'walk_fwd') {
      const step = Math.sin(this.animTime * 1.5);
      pelvisY += Math.abs(step) * 0.06;

      lHip.x = step * 0.65;
      rHip.x = -step * 0.65;
      lKnee.x = Math.max(0, -step * 0.55);
      rKnee.x = Math.max(0, step * 0.55);

      lShoulder.x = -0.6 - step * 0.45;
      rShoulder.x = -0.6 + step * 0.45;
      lElbow.x = -1.35;
      rElbow.x = -1.35;
    }
    // 3. Walk Backward
    else if (state === 'walk_back') {
      const step = Math.sin(this.animTime * 1.3);
      lHip.x = -step * 0.5;
      rHip.x = step * 0.5;
      lElbow.x = -1.75;
      rElbow.x = -1.75;
    }
    // 4. Jump (Knees tucked up, arms raised)
    else if (state === 'jump') {
      lHip.x = -0.85;
      rHip.x = -0.65;
      lKnee.x = 1.35;
      rKnee.x = 1.15;
      lShoulder.x = -1.25;
      rShoulder.x = -1.25;
    }
    // 5. Crouch (Low defensive duck)
    else if (state === 'crouch') {
      pelvisY = 1.25;
      lHip.x = -1.35;
      rHip.x = -1.35;
      lKnee.x = 1.95;
      rKnee.x = 1.95;
      lElbow.x = -2.25;
      rElbow.x = -2.25;
    }
    // 6. Light Jab (Punch J) - Arm snaps straight out forward!
    else if (state === 'punch_1' || state === 'jab') {
      torsoRot.y = 0.55;
      lShoulder.x = -1.65; // Extended punch
      lShoulder.y = 0.18;
      lElbow.x = -0.05;    // Elbow snaps straight!
      rShoulder.x = -0.35;
      rElbow.x = -1.95;
    }
    // 7. Heavy Cross (Punch J,J) - Deep lunging right power punch!
    else if (state === 'punch_2' || state === 'cross') {
      torsoRot.y = -0.75;
      rShoulder.x = -1.72; // Full right punch extension!
      rShoulder.y = -0.32;
      rElbow.x = -0.05;
      lShoulder.x = -0.28;
      lElbow.x = -1.85;
      pelvisY -= 0.1;
    }
    // 8. Uppercut (Down + J) - Dips low and explodes upward!
    else if (state === 'uppercut') {
      pelvisY -= 0.28;
      torsoRot.y = -0.45;
      torsoRot.x = -0.25;
      rShoulder.x = -0.95;
      rElbow.x = -2.45; // Arm explodes straight upward!
    }
    // 9. High Roundhouse Kick (Kick K) - 3D Leg swings high in arc!
    else if (state === 'kick_1' || state === 'roundhouse') {
      torsoRot.z = 0.45;
      torsoRot.y = -0.48;
      rHip.x = -1.88; // Leg high in air!
      rHip.z = -0.45;
      rKnee.x = 0.15;
      lHip.x = 0.28;
      lKnee.x = 0.38;
      pelvisY += 0.15;
    }
    // 10. Low Sweep Kick (Down + K) - Low spinning sweep!
    else if (state === 'kick_2' || state === 'low_kick') {
      pelvisY = 1.15;
      lHip.x = -1.45;
      lKnee.x = 2.05;
      rHip.x = -1.65; // Sweeps low across floor!
      rHip.y = 0.55;
      rKnee.x = 0.1;
    }
    // 11. Grab & Throw (I or J+K) - Both arms clutch forward!
    else if (state === 'grab') {
      torsoRot.x = 0.35;
      lShoulder.x = -1.55;
      rShoulder.x = -1.55;
      lElbow.x = -0.45;
      rElbow.x = -0.45;
    }
    // 12. Defensive Block Guard - Arms crossed tight!
    else if (state === 'block') {
      lShoulder.x = -1.25;
      rShoulder.x = -1.25;
      lShoulder.z = 0.75;
      rShoulder.z = -0.75;
      lElbow.x = -2.45;
      rElbow.x = -2.45;
      pelvisY -= 0.15;
    }
    // 13. Hit Flinch - Head and chest snap back!
    else if (state === 'hit') {
      torsoRot.x = -0.55;
      if (j.head) j.head.rotation.x = -0.65;
      lShoulder.x = 0.35;
      rShoulder.x = 0.35;
    }
    // 14. Knockdown - Whole 3D figure falls backwards to floor!
    else if (state === 'knockdown') {
      this.root.rotation.z = facing * (Math.PI / 2.15);
      pelvisY = 0.35;
      lHip.x = -0.45;
      rHip.x = -0.45;
      lKnee.x = 0.65;
      rKnee.x = 0.65;
    }
    // 15. Super Move Charge - Dramatic charging aura!
    else if (state === 'super_charge') {
      pelvisY = 1.45;
      torsoRot.x = 0.42;
      lShoulder.x = 0.55;
      rShoulder.x = 0.55;
      lElbow.x = -1.95;
      rElbow.x = -1.95;
      lHip.x = -0.98;
      rHip.x = -0.98;
      lKnee.x = 1.55;
      rKnee.x = 1.55;
    }

    // Apply Smooth Lerp to all 3D Joints
    const lerp = 0.32;
    if (this.pelvis) this.pelvis.position.y += (pelvisY - this.pelvis.position.y) * lerp;
    this.lerpRot(j.torso, torsoRot, lerp);
    this.lerpRot(j.leftShoulder, lShoulder, lerp);
    this.lerpRot(j.rightShoulder, rShoulder, lerp);
    this.lerpRot(j.leftElbow, lElbow, lerp);
    this.lerpRot(j.rightElbow, rElbow, lerp);
    this.lerpRot(j.leftHip, lHip, lerp);
    this.lerpRot(j.rightHip, rHip, lerp);
    this.lerpRot(j.leftKnee, lKnee, lerp);
    this.lerpRot(j.rightKnee, rKnee, lerp);

    if (state !== 'knockdown') {
      this.root.rotation.z = 0;
      this.root.rotation.y = facing === 1 ? Math.PI / 2 : -Math.PI / 2;
    }
  }

  lerpRot(obj, target, factor) {
    if (!obj) return;
    obj.rotation.x += (target.x - obj.rotation.x) * factor;
    obj.rotation.y += (target.y - obj.rotation.y) * factor;
    obj.rotation.z += (target.z - obj.rotation.z) * factor;
  }

  destroy() {
    this.scene.remove(this.root);
  }
}

window.HumanoidFighter3D = HumanoidFighter3D;
