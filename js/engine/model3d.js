/**
 * ===================================================================
 *  SCULPTED 3D HUMANOID BRAWLER FIGURES (Human Anatomy & Character Styles)
 * ===================================================================
 *  Crafts distinct human-like 3D character models with real anatomical
 *  proportions (jawline, ears, nose, hair, pectorals, deltoids, biceps,
 *  knuckle fists, quads, calves, and sneakers).
 *  Each friend gets their own unique wardrobe & silhouette!
 */

class HumanoidFighter3D {
  constructor(scene, config, isPlayer1 = true) {
    this.scene = scene;
    this.config = config;
    this.isPlayer1 = isPlayer1;

    // Body colors from config
    const b = config.body || {};
    this.skinColor = b.skin || (isPlayer1 ? 0xf5cd79 : 0xf7b731);
    this.shirtColor = b.shirt || (isPlayer1 ? 0xe84118 : 0x3742fa);
    this.pantsColor = b.pants || (isPlayer1 ? 0x2f3640 : 0x1e272e);
    this.shoesColor = b.shoes || 0xffffff;
    this.hairColor = b.hair || 0x2f3542;

    // Root Group
    this.root = new THREE.Group();
    this.scene.add(this.root);

    // Character-specific anatomical scaling (e.g. Aman the Gym Bro is bulkier)
    this.charId = config.id || 'karan';
    this.setupCharacterArchetype();

    // Joints dictionary for keyframe animation
    this.joints = {};

    // Build the sculpted human body
    this.buildHumanBody();

    // Setup face photo texture slot
    this.setupFaceTexture();

    this.animTime = 0;
  }

  // Set distinct body archetype per friend
  setupCharacterArchetype() {
    this.isBuff = this.charId === 'aman';       // Aman Gym Bro: broader shoulders, bulkier arms
    this.isGamer = this.charId === 'rohan';     // Rohan Gamer: streetwear, headset around neck
    this.isHoodie = this.charId === 'karan';    // Karan: casual jacket/hoodie, jeans
    this.isStylish = this.charId === 'sneha';   // Sneha: fitted jacket, ponytail, sunglasses
  }

  createMat(color, roughness = 0.55, metalness = 0.08) {
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: roughness,
      metalness: metalness
    });
  }

  buildHumanBody() {
    const skinMat = this.createMat(this.skinColor, 0.62, 0.04);
    const shirtMat = this.createMat(this.shirtColor, 0.7, 0.05);
    const pantsMat = this.createMat(this.pantsColor, 0.75, 0.05);
    const shoeSoleMat = this.createMat(0xf5f6fa, 0.3, 0.1);
    const shoeUpperMat = this.createMat(this.shoesColor, 0.6, 0.1);
    const hairMat = this.createMat(this.hairColor, 0.85, 0.05);
    const gloveMat = this.createMat(this.config.themeColor || (this.isPlayer1 ? 0xff4757 : 0x3742fa), 0.35, 0.15);

    // Bulk multipliers
    const bulkX = this.isBuff ? 1.25 : 1.0;
    const bulkArm = this.isBuff ? 1.3 : 1.0;

    // =================================================================
    // 1. PELVIS / WAIST
    // =================================================================
    const pelvisGeo = new THREE.CylinderGeometry(0.52 * bulkX, 0.44 * bulkX, 0.45, 14);
    this.pelvis = new THREE.Mesh(pelvisGeo, pantsMat);
    this.pelvis.position.y = 2.45;
    this.pelvis.castShadow = true;
    this.root.add(this.pelvis);
    this.joints.pelvis = this.pelvis;

    // Belt / Waistband detail
    const beltGeo = new THREE.CylinderGeometry(0.54 * bulkX, 0.54 * bulkX, 0.1, 14);
    const beltMat = this.createMat(0x1e272e, 0.4, 0.2);
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.y = 0.18;
    this.pelvis.add(belt);

    // =================================================================
    // 2. SPINE & TORSO (Human V-Taper, Chest, Shoulders)
    // =================================================================
    this.torso = new THREE.Group();
    this.torso.position.y = 0.28;
    this.pelvis.add(this.torso);
    this.joints.torso = this.torso;

    // Abdomen / Lower Torso
    const absGeo = new THREE.CylinderGeometry(0.56 * bulkX, 0.48 * bulkX, 0.55, 14);
    const absMesh = new THREE.Mesh(absGeo, shirtMat);
    absMesh.position.y = 0.28;
    absMesh.castShadow = true;
    this.torso.add(absMesh);

    // Upper Chest (Pectorals / Ribcage V-Taper)
    const chestGeo = new THREE.BoxGeometry(1.28 * bulkX, 0.8, 0.75 * bulkX);
    const chestMesh = new THREE.Mesh(chestGeo, shirtMat);
    chestMesh.position.y = 0.82;
    chestMesh.castShadow = true;
    this.torso.add(chestMesh);

    // Collar detail (Hoodie collar for Karan, Headset for Rohan, Tank straps for Aman)
    if (this.isHoodie) {
      const collarGeo = new THREE.TorusGeometry(0.42, 0.1, 8, 16);
      const collarMat = this.createMat(this.shirtColor, 0.7);
      const collar = new THREE.Mesh(collarGeo, collarMat);
      collar.rotation.x = Math.PI / 2;
      collar.position.set(0, 1.2, 0);
      this.torso.add(collar);
    } else if (this.isGamer) {
      // 3D Gaming Headset resting around Rohan's neck!
      const headsetBandGeo = new THREE.TorusGeometry(0.44, 0.08, 8, 20, Math.PI * 1.6);
      const headsetMat = this.createMat(0x3742fa, 0.3, 0.3);
      const band = new THREE.Mesh(headsetBandGeo, headsetMat);
      band.rotation.x = Math.PI / 2;
      band.position.set(0, 1.15, 0.05);
      this.torso.add(band);

      // Headset earcups
      const earcupGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.14, 10);
      const cupL = new THREE.Mesh(earcupGeo, this.createMat(0x2f3542, 0.4));
      cupL.position.set(-0.46, 1.15, 0.15);
      this.torso.add(cupL);
      const cupR = cupL.clone();
      cupR.position.x = 0.46;
      this.torso.add(cupR);
    }

    // =================================================================
    // 3. NECK & SCULPTED HUMAN HEAD
    // =================================================================
    this.neck = new THREE.Group();
    this.neck.position.y = 1.25;
    this.torso.add(this.neck);
    this.joints.neck = this.neck;

    // Muscular Neck
    const neckGeo = new THREE.CylinderGeometry(0.22 * bulkX, 0.28 * bulkX, 0.35, 12);
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    neckMesh.position.y = 0.18;
    neckMesh.castShadow = true;
    this.neck.add(neckMesh);

    // Head Pivot Group
    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 0.48;
    this.neck.add(this.headGroup);
    this.joints.head = this.headGroup;

    // Sculpted Head Cranium & Jaw
    const headCraniumGeo = new THREE.SphereGeometry(0.44, 16, 16);
    this.headMesh = new THREE.Mesh(headCraniumGeo, skinMat);
    this.headMesh.position.y = 0.1;
    this.headMesh.castShadow = true;
    this.headGroup.add(this.headMesh);

    // Jaw / Chin contour
    const jawGeo = new THREE.ConeGeometry(0.36, 0.45, 12);
    const jaw = new THREE.Mesh(jawGeo, skinMat);
    jaw.rotation.x = Math.PI;
    jaw.position.set(0, -0.15, 0.1);
    this.headGroup.add(jaw);

    // 3D Ears
    const earGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const earL = new THREE.Mesh(earGeo, skinMat);
    earL.scale.set(0.6, 1.2, 0.8);
    earL.position.set(-0.45, 0.05, 0);
    this.headGroup.add(earL);

    const earR = earL.clone();
    earR.position.x = 0.45;
    this.headGroup.add(earR);

    // 3D Nose Bridge
    const noseGeo = new THREE.ConeGeometry(0.08, 0.22, 6);
    const nose = new THREE.Mesh(noseGeo, skinMat);
    nose.rotation.x = -Math.PI / 4;
    nose.position.set(0, 0.05, 0.45);
    this.headGroup.add(nose);

    // 3D Eyes & Pupils
    const eyeWhiteMat = this.createMat(0xffffff, 0.2);
    const pupilMat = this.createMat(0x000000, 0.2);
    [-0.14, 0.14].forEach(x => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), eyeWhiteMat);
      eye.position.set(x, 0.14, 0.4);
      this.headGroup.add(eye);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), pupilMat);
      pupil.position.set(x, 0.14, 0.46);
      this.headGroup.add(pupil);
    });

    // 3D Distinct Hairstyles
    this.buildHairstyle(hairMat);

    // Front Face Cutout Texture Plane (For friend's real photo)
    const faceGeo = new THREE.PlaneGeometry(0.85, 0.85);
    this.faceMat = new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false
    });
    this.faceMesh = new THREE.Mesh(faceGeo, this.faceMat);
    this.faceMesh.position.set(0, 0.08, 0.46);
    this.headGroup.add(this.faceMesh);

    // =================================================================
    // 4. ARMS & SCULPTED HANDS (Deltoids, Biceps, Knuckle Fists)
    // =================================================================
    this.buildArm('left', 1, skinMat, shirtMat, gloveMat, bulkArm, bulkX);
    this.buildArm('right', -1, skinMat, shirtMat, gloveMat, bulkArm, bulkX);

    // =================================================================
    // 5. LEGS & SNEAKERS (Thighs, Knees, Calves, Detailed Shoes)
    // =================================================================
    this.buildLeg('left', 1, skinMat, pantsMat, shoeSoleMat, shoeUpperMat, bulkX);
    this.buildLeg('right', -1, skinMat, pantsMat, shoeSoleMat, shoeUpperMat, bulkX);
  }

  // --- DISTINCT 3D HAIRSTYLES ---
  buildHairstyle(hairMat) {
    if (this.isBuff) {
      // Aman: Buzzcut + Red Headband
      const buzzGeo = new THREE.SphereGeometry(0.46, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
      const buzz = new THREE.Mesh(buzzGeo, hairMat);
      buzz.position.y = 0.14;
      this.headGroup.add(buzz);

      // Red Headband
      const bandGeo = new THREE.TorusGeometry(0.46, 0.08, 8, 20);
      const bandMat = this.createMat(0xff4757, 0.5);
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.position.set(0, 0.22, 0.05);
      this.headGroup.add(band);
    } else if (this.isStylish) {
      // Sneha: Sleek Ponytail + Sunglasses on Head
      const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.48, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6), hairMat);
      hairBase.position.y = 0.12;
      this.headGroup.add(hairBase);

      // Ponytail tail sticking out back
      const ponyGeo = new THREE.ConeGeometry(0.18, 0.65, 8);
      const pony = new THREE.Mesh(ponyGeo, hairMat);
      pony.rotation.x = -Math.PI / 3;
      pony.position.set(0, 0.2, -0.5);
      this.headGroup.add(pony);

      // Cool Sunglasses on head
      const glassMat = this.createMat(0x1e272e, 0.1, 0.8);
      const glassL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.08), glassMat);
      glassL.position.set(-0.16, 0.38, 0.35);
      this.headGroup.add(glassL);
      const glassR = glassL.clone();
      glassR.position.x = 0.16;
      this.headGroup.add(glassR);
    } else {
      // Karan / Rohan: Spiky or Messy Layered Anime / Modern Hair
      const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.48, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.58), hairMat);
      hairBase.position.y = 0.14;
      this.headGroup.add(hairBase);

      // 3D Hair Strands / Spikes
      const spikeGeo = new THREE.ConeGeometry(0.12, 0.35, 6);
      const spikeAngles = [-0.3, -0.15, 0, 0.15, 0.3];
      spikeAngles.forEach(ang => {
        const spike = new THREE.Mesh(spikeGeo, hairMat);
        spike.rotation.z = -ang;
        spike.position.set(ang * 1.2, 0.52, 0.2);
        this.headGroup.add(spike);
      });
    }
  }

  // --- ARMS WITH DELTOIDS, BICEPS & FISTS ---
  buildArm(side, dir, skinMat, shirtMat, gloveMat, bulkArm, bulkX) {
    // Shoulder Group (Pivot)
    const shoulder = new THREE.Group();
    shoulder.position.set(dir * (0.82 * bulkX), 0.95, 0);
    this.torso.add(shoulder);
    this.joints[side + 'Shoulder'] = shoulder;

    // Muscular Deltoid Cap
    const deltoidMat = (this.isBuff) ? skinMat : shirtMat; // Tank top shows bare muscular shoulders
    const deltoid = new THREE.Mesh(new THREE.SphereGeometry(0.25 * bulkArm, 12, 12), deltoidMat);
    shoulder.add(deltoid);

    // Upper Arm / Bicep
    const upperArmGeo = new THREE.CylinderGeometry(0.18 * bulkArm, 0.16 * bulkArm, 0.75, 12);
    const upperArm = new THREE.Mesh(upperArmGeo, skinMat);
    upperArm.position.y = -0.38;
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    // Elbow Pivot
    const elbow = new THREE.Group();
    elbow.position.y = -0.75;
    shoulder.add(elbow);
    this.joints[side + 'Elbow'] = elbow;

    // Forearm with athletic taper
    const forearmGeo = new THREE.CylinderGeometry(0.16 * bulkArm, 0.14 * bulkArm, 0.7, 12);
    const forearm = new THREE.Mesh(forearmGeo, skinMat);
    forearm.position.y = -0.35;
    forearm.castShadow = true;
    elbow.add(forearm);

    // Sculpted Boxing Fist with Knuckles & Thumb
    const fistGroup = new THREE.Group();
    fistGroup.position.y = -0.76;
    elbow.add(fistGroup);
    this.joints[side + 'Hand'] = fistGroup;

    // Glove Palm / Fist block
    const fistGeo = new THREE.BoxGeometry(0.28 * bulkArm, 0.32, 0.32);
    const fistMesh = new THREE.Mesh(fistGeo, gloveMat);
    fistMesh.castShadow = true;
    fistGroup.add(fistMesh);

    // Knuckle ridge
    const knuckleGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.28 * bulkArm, 8);
    const knuckle = new THREE.Mesh(knuckleGeo, gloveMat);
    knuckle.rotation.z = Math.PI / 2;
    knuckle.position.set(0, -0.14, 0.05);
    fistGroup.add(knuckle);

    // Thumb wrap
    const thumbGeo = new THREE.BoxGeometry(0.1, 0.16, 0.12);
    const thumb = new THREE.Mesh(thumbGeo, gloveMat);
    thumb.position.set(dir * 0.15, -0.05, 0.1);
    fistGroup.add(thumb);
  }

  // --- LEGS & REALISTIC SNEAKERS ---
  buildLeg(side, dir, skinMat, pantsMat, shoeSoleMat, shoeUpperMat, bulkX) {
    const hip = new THREE.Group();
    hip.position.set(dir * (0.32 * bulkX), -0.15, 0);
    this.pelvis.add(hip);
    this.joints[side + 'Hip'] = hip;

    // Thigh (Muscular quadriceps)
    const thighMat = (this.isBuff) ? skinMat : pantsMat; // Gym shorts show bare thighs
    const thighGeo = new THREE.CylinderGeometry(0.26 * bulkX, 0.2 * bulkX, 1.0, 12);
    const thigh = new THREE.Mesh(thighGeo, thighMat);
    thigh.position.y = -0.5;
    thigh.castShadow = true;
    hip.add(thigh);

    // Knee Pivot
    const knee = new THREE.Group();
    knee.position.y = -1.0;
    hip.add(knee);
    this.joints[side + 'Knee'] = knee;

    // Shin & Calf (Anatomical curve)
    const calfGeo = new THREE.CylinderGeometry(0.2 * bulkX, 0.15 * bulkX, 0.95, 12);
    const calf = new THREE.Mesh(calfGeo, pantsMat);
    calf.position.y = -0.48;
    calf.castShadow = true;
    knee.add(calf);

    // Foot / Ankle Pivot
    const foot = new THREE.Group();
    foot.position.y = -0.96;
    knee.add(foot);
    this.joints[side + 'Foot'] = foot;

    // Detailed 3D Sneaker
    // Sole
    const soleGeo = new THREE.BoxGeometry(0.34, 0.1, 0.72);
    const sole = new THREE.Mesh(soleGeo, shoeSoleMat);
    sole.position.set(0, -0.05, 0.16);
    sole.castShadow = true;
    foot.add(sole);

    // Upper Shoe / Sneaker Body
    const upperGeo = new THREE.BoxGeometry(0.32, 0.22, 0.68);
    const upper = new THREE.Mesh(upperGeo, shoeUpperMat);
    upper.position.set(0, 0.08, 0.14);
    upper.castShadow = true;
    foot.add(upper);

    // Shoe Toe Cap
    const toeGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.32, 8);
    const toe = new THREE.Mesh(toeGeo, shoeUpperMat);
    toe.rotation.z = Math.PI / 2;
    toe.position.set(0, 0.06, 0.44);
    foot.add(toe);
  }

  setupFaceTexture() {
    if (this.config.avatar) {
      const loader = new THREE.TextureLoader();
      loader.load(
        this.config.avatar,
        (texture) => {
          this.faceMat.map = texture;
          this.faceMat.needsUpdate = true;
        },
        undefined,
        () => {}
      );
    }
  }

  // --- SKELETAL ANIMATIONS (FightKaro Athletic Brawling) ---
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
    let pelvisY = 2.45;

    // Athletic Boxing Idle Stance & Breathing (FightKaro)
    if (state === 'idle') {
      const bounce = Math.sin(this.animTime * 0.85) * 0.07;
      pelvisY += bounce;

      torsoRot.y = 0.35; // Angled fighting stance
      lShoulder.x = -0.55 + bounce;
      lShoulder.z = 0.35;
      lElbow.x = -1.65; // High left chin guard

      rShoulder.x = -0.45 - bounce;
      rShoulder.z = -0.28;
      rElbow.x = -1.85; // Cocked right cross fist

      lHip.x = -0.16;
      rHip.x = 0.16;
      lKnee.x = 0.22;
      rKnee.x = 0.22;
    }
    // Walk Forward
    else if (state === 'walk_fwd') {
      const step = Math.sin(this.animTime * 1.4);
      pelvisY += Math.abs(step) * 0.05;

      lHip.x = step * 0.52;
      rHip.x = -step * 0.52;
      lKnee.x = Math.max(0, -step * 0.48);
      rKnee.x = Math.max(0, step * 0.48);

      lShoulder.x = -0.55 - step * 0.3;
      rShoulder.x = -0.55 + step * 0.3;
      lElbow.x = -1.45;
      rElbow.x = -1.45;
    }
    // Walk Backward
    else if (state === 'walk_back') {
      const step = Math.sin(this.animTime * 1.2);
      lHip.x = -step * 0.42;
      rHip.x = step * 0.42;
      lElbow.x = -1.65;
      rElbow.x = -1.65;
    }
    // Jump
    else if (state === 'jump') {
      lHip.x = -0.75;
      rHip.x = -0.55;
      lKnee.x = 1.15;
      rKnee.x = 0.95;
      lShoulder.x = -1.15;
      rShoulder.x = -1.15;
    }
    // Crouch
    else if (state === 'crouch') {
      pelvisY = 1.62;
      lHip.x = -1.25;
      rHip.x = -1.25;
      lKnee.x = 1.85;
      rKnee.x = 1.85;
      lElbow.x = -2.15;
      rElbow.x = -2.15;
    }
    // Light Jab (Punch J)
    else if (state === 'punch_1' || state === 'jab') {
      torsoRot.y = 0.52;
      lShoulder.x = -1.58;
      lShoulder.y = 0.18;
      lElbow.x = -0.05;
      rShoulder.x = -0.32;
      rElbow.x = -1.95;
    }
    // Heavy Cross (Punch J,J)
    else if (state === 'punch_2' || state === 'cross') {
      torsoRot.y = -0.68;
      rShoulder.x = -1.62;
      rShoulder.y = -0.28;
      rElbow.x = -0.08;
      lShoulder.x = -0.25;
      lElbow.x = -1.85;
      pelvisY -= 0.08;
    }
    // Uppercut (Down + J)
    else if (state === 'uppercut') {
      pelvisY -= 0.22;
      torsoRot.y = -0.42;
      torsoRot.x = -0.2;
      rShoulder.x = -0.85;
      rElbow.x = -2.35;
    }
    // High Roundhouse Kick (Kick K)
    else if (state === 'kick_1' || state === 'roundhouse') {
      torsoRot.z = 0.38;
      torsoRot.y = -0.42;
      rHip.x = -1.78;
      rHip.z = -0.42;
      rKnee.x = 0.18;
      lHip.x = 0.22;
      lKnee.x = 0.32;
      pelvisY += 0.1;
    }
    // Low Sweep Kick (Down + K)
    else if (state === 'kick_2' || state === 'low_kick') {
      pelvisY = 1.48;
      lHip.x = -1.35;
      lKnee.x = 1.95;
      rHip.x = -1.55;
      rHip.y = 0.52;
      rKnee.x = 0.1;
    }
    // Grab & Throw (I or J+K)
    else if (state === 'grab') {
      torsoRot.x = 0.32;
      lShoulder.x = -1.45;
      rShoulder.x = -1.45;
      lElbow.x = -0.42;
      rElbow.x = -0.42;
    }
    // Defensive Block Guard
    else if (state === 'block') {
      lShoulder.x = -1.15;
      rShoulder.x = -1.15;
      lShoulder.z = 0.65;
      rShoulder.z = -0.65;
      lElbow.x = -2.35;
      rElbow.x = -2.35;
      pelvisY -= 0.12;
    }
    // Hit Flinch
    else if (state === 'hit') {
      torsoRot.x = -0.48;
      j.head.rotation.x = -0.58;
      lShoulder.x = 0.32;
      rShoulder.x = 0.32;
    }
    // Knockdown
    else if (state === 'knockdown') {
      this.root.rotation.z = facing * (Math.PI / 2.2);
      pelvisY = 0.45;
      lHip.x = -0.42;
      rHip.x = -0.42;
      lKnee.x = 0.62;
      rKnee.x = 0.62;
    }
    // Super Move Charge
    else if (state === 'super_charge') {
      pelvisY = 1.68;
      torsoRot.x = 0.38;
      lShoulder.x = 0.52;
      rShoulder.x = 0.52;
      lElbow.x = -1.85;
      rElbow.x = -1.85;
      lHip.x = -0.92;
      rHip.x = -0.92;
      lKnee.x = 1.45;
      rKnee.x = 1.45;
    }

    const lerpSpeed = 0.28;
    this.pelvis.position.y += (pelvisY - this.pelvis.position.y) * lerpSpeed;
    this.lerpRotation(j.torso, torsoRot, lerpSpeed);
    this.lerpRotation(j.leftShoulder, lShoulder, lerpSpeed);
    this.lerpRotation(j.rightShoulder, rShoulder, lerpSpeed);
    this.lerpRotation(j.leftElbow, lElbow, lerpSpeed);
    this.lerpRotation(j.rightElbow, rElbow, lerpSpeed);
    this.lerpRotation(j.leftHip, lHip, lerpSpeed);
    this.lerpRotation(j.rightHip, rHip, lerpSpeed);
    this.lerpRotation(j.leftKnee, lKnee, lerpSpeed);
    this.lerpRotation(j.rightKnee, rKnee, lerpSpeed);

    if (state !== 'knockdown') {
      this.root.rotation.z = 0;
      this.root.rotation.y = facing === 1 ? Math.PI / 2 : -Math.PI / 2;
    }
  }

  lerpRotation(obj, target, factor) {
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
