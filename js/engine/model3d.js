/**
 * ===================================================================
 *  3D HUMANOID FIGHTER MODEL (Three.js Hierarchical Brawler Skeleton)
 * ===================================================================
 *  Builds an articulated 3D human-like fighter with head, torso,
 *  shoulders, biceps, forearms, fists, hips, thighs, shins, and feet.
 *  Supports attaching a friend's cutout face photo to the 3D head!
 */

class HumanoidFighter3D {
  constructor(scene, config, isPlayer1 = true) {
    this.scene = scene;
    this.config = config;
    this.isPlayer1 = isPlayer1;

    // Body colors
    const bodyCfg = config.body || {};
    this.skinColor = bodyCfg.skin || (isPlayer1 ? 0xfbc531 : 0xf7b731);
    this.shirtColor = bodyCfg.shirt || (isPlayer1 ? 0xe84118 : 0x3742fa);
    this.pantsColor = bodyCfg.pants || (isPlayer1 ? 0x2f3640 : 0x1e272e);
    this.shoesColor = bodyCfg.shoes || 0xffffff;

    // Root Group
    this.root = new THREE.Group();
    this.scene.add(this.root);

    // Build Articulated Skeleton Hierarchy
    this.joints = {};
    this.buildSkeleton();

    // Head Avatar Texture (For friend's photo)
    this.setupFaceTexture();

    // Animation Pose State
    this.currentPose = 'idle';
    this.animTime = 0;
  }

  // --- MATERIAL HELPERS ---
  createMaterial(color, roughness = 0.5, metalness = 0.1) {
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: roughness,
      metalness: metalness
    });
  }

  // --- BUILD 3D HUMAN SKELETON ---
  buildSkeleton() {
    const skinMat = this.createMaterial(this.skinColor, 0.6, 0.05);
    const shirtMat = this.createMaterial(this.shirtColor, 0.5, 0.1);
    const pantsMat = this.createMaterial(this.pantsColor, 0.7, 0.05);
    const shoeMat = this.createMaterial(this.shoesColor, 0.4, 0.2);
    const gloveMat = this.createMaterial(this.config.themeColor || (this.isPlayer1 ? 0xff4757 : 0x3742fa), 0.3, 0.2);

    // 1. Pelvis / Hips (Root of body movements)
    const pelvisGeo = new THREE.CylinderGeometry(0.55, 0.45, 0.45, 12);
    this.pelvis = new THREE.Mesh(pelvisGeo, pantsMat);
    this.pelvis.position.y = 2.4;
    this.pelvis.castShadow = true;
    this.root.add(this.pelvis);
    this.joints.pelvis = this.pelvis;

    // 2. Spine & Torso / Chest
    this.torso = new THREE.Group();
    this.torso.position.y = 0.3;
    this.pelvis.add(this.torso);
    this.joints.torso = this.torso;

    // Lower Torso / Waist
    const waistGeo = new THREE.CylinderGeometry(0.58, 0.52, 0.5, 12);
    const waist = new THREE.Mesh(waistGeo, shirtMat);
    waist.position.y = 0.25;
    waist.castShadow = true;
    this.torso.add(waist);

    // Upper Chest / Pectorals
    const chestGeo = new THREE.BoxGeometry(1.25, 0.75, 0.75);
    const chest = new THREE.Mesh(chestGeo, shirtMat);
    chest.position.y = 0.75;
    chest.castShadow = true;
    this.torso.add(chest);

    // 3. Neck & Head
    this.neck = new THREE.Group();
    this.neck.position.y = 1.15;
    this.torso.add(this.neck);
    this.joints.neck = this.neck;

    // Neck Mesh
    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.3, 10), skinMat);
    neckMesh.position.y = 0.15;
    this.neck.add(neckMesh);

    // Head Group
    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 0.45;
    this.neck.add(this.headGroup);
    this.joints.head = this.headGroup;

    // 3D Head Base Sphere
    const headGeo = new THREE.SphereGeometry(0.48, 16, 16);
    this.headMesh = new THREE.Mesh(headGeo, skinMat);
    this.headMesh.castShadow = true;
    this.headGroup.add(this.headMesh);

    // Hair / Headgear
    const hairGeo = new THREE.SphereGeometry(0.51, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const hairMat = this.createMaterial(this.config.body?.hair || 0x2f3542, 0.9);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 0.05;
    this.headGroup.add(hair);

    // Front Face Billboard Plane (Where friend's photo or stylized face mounts)
    const faceGeo = new THREE.PlaneGeometry(0.9, 0.9);
    this.faceMat = new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false
    });
    this.faceMesh = new THREE.Mesh(faceGeo, this.faceMat);
    this.faceMesh.position.set(0, 0, 0.49);
    this.headGroup.add(this.faceMesh);

    // 4. Arms (Left & Right)
    this.buildArm('left', 1, skinMat, shirtMat, gloveMat);
    this.buildArm('right', -1, skinMat, shirtMat, gloveMat);

    // 5. Legs (Left & Right)
    this.buildLeg('left', 1, skinMat, pantsMat, shoeMat);
    this.buildLeg('right', -1, skinMat, pantsMat, shoeMat);
  }

  buildArm(side, dir, skinMat, shirtMat, gloveMat) {
    // Shoulder Joint
    const shoulder = new THREE.Group();
    shoulder.position.set(dir * 0.78, 0.9, 0);
    this.torso.add(shoulder);
    this.joints[side + 'Shoulder'] = shoulder;

    // Sleeve
    const sleeve = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), shirtMat);
    shoulder.add(sleeve);

    // Upper Arm / Bicep
    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.7, 10), skinMat);
    upperArm.position.y = -0.35;
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    // Elbow Joint
    const elbow = new THREE.Group();
    elbow.position.y = -0.7;
    shoulder.add(elbow);
    this.joints[side + 'Elbow'] = elbow;

    // Forearm
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.15, 0.65, 10), skinMat);
    forearm.position.y = -0.32;
    forearm.castShadow = true;
    elbow.add(forearm);

    // Hand / Boxing Glove (Fist)
    const fist = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.35), gloveMat);
    fist.position.y = -0.72;
    fist.castShadow = true;
    elbow.add(fist);
    this.joints[side + 'Hand'] = fist;
  }

  buildLeg(side, dir, skinMat, pantsMat, shoeMat) {
    // Hip Joint
    const hip = new THREE.Group();
    hip.position.set(dir * 0.32, -0.15, 0);
    this.pelvis.add(hip);
    this.joints[side + 'Hip'] = hip;

    // Thigh
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.95, 10), pantsMat);
    thigh.position.y = -0.48;
    thigh.castShadow = true;
    hip.add(thigh);

    // Knee Joint
    const knee = new THREE.Group();
    knee.position.y = -0.95;
    hip.add(knee);
    this.joints[side + 'Knee'] = knee;

    // Shin / Calf
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.16, 0.95, 10), pantsMat);
    shin.position.y = -0.48;
    shin.castShadow = true;
    knee.add(shin);

    // Ankle / Foot
    const foot = new THREE.Group();
    foot.position.y = -0.95;
    knee.add(foot);
    this.joints[side + 'Foot'] = foot;

    // Shoe Mesh
    const shoeGeo = new THREE.BoxGeometry(0.3, 0.25, 0.6);
    const shoe = new THREE.Mesh(shoeGeo, shoeMat);
    shoe.position.set(0, -0.1, 0.15);
    shoe.castShadow = true;
    foot.add(shoe);
  }

  // --- FACE TEXTURE (Cutout photo loading) ---
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
        () => {
          // Fallback to default
        }
      );
    }
  }

  // --- SKELETAL POSE INTERPOLATION (FIGHTKARO MOVES) ---
  updateAnimation(state, facing, delta) {
    this.animTime += delta * 10;
    const j = this.joints;

    // Default neutral joint targets
    let torsoRot = { x: 0, y: 0, z: 0 };
    let lShoulder = { x: 0, y: 0, z: 0.3 };
    let rShoulder = { x: 0, y: 0, z: -0.3 };
    let lElbow = { x: -0.8, y: 0, z: 0 };
    let rElbow = { x: -0.8, y: 0, z: 0 };
    let lHip = { x: 0, y: 0, z: 0.05 };
    let rHip = { x: 0, y: 0, z: -0.05 };
    let lKnee = { x: 0, y: 0, z: 0 };
    let rKnee = { x: 0, y: 0, z: 0 };
    let pelvisY = 2.4;

    // Smooth Breathing & Bounce (FightKaro Idle Stance)
    if (state === 'idle') {
      const bounce = Math.sin(this.animTime * 0.8) * 0.08;
      pelvisY += bounce;

      // Boxing guard stance
      torsoRot.y = 0.35; // Slight angle towards opponent
      lShoulder.x = -0.5 + bounce;
      lShoulder.z = 0.4;
      lElbow.x = -1.6; // Left hand guarding chin

      rShoulder.x = -0.4 - bounce;
      rShoulder.z = -0.3;
      rElbow.x = -1.8; // Right hand cocked back

      lHip.x = -0.15;
      rHip.x = 0.15;
      lKnee.x = 0.2;
      rKnee.x = 0.2;
    }
    // Walk Forward (Athletic boxing steps)
    else if (state === 'walk_fwd') {
      const step = Math.sin(this.animTime * 1.4);
      pelvisY += Math.abs(step) * 0.06;

      lHip.x = step * 0.5;
      rHip.x = -step * 0.5;
      lKnee.x = Math.max(0, -step * 0.45);
      rKnee.x = Math.max(0, step * 0.45);

      lShoulder.x = -0.5 - step * 0.3;
      rShoulder.x = -0.5 + step * 0.3;
      lElbow.x = -1.4;
      rElbow.x = -1.4;
    }
    // Walk Backward
    else if (state === 'walk_back') {
      const step = Math.sin(this.animTime * 1.2);
      lHip.x = -step * 0.4;
      rHip.x = step * 0.4;
      lElbow.x = -1.6;
      rElbow.x = -1.6;
    }
    // Jump (Knees tucked)
    else if (state === 'jump') {
      lHip.x = -0.7;
      rHip.x = -0.5;
      lKnee.x = 1.1;
      rKnee.x = 0.9;
      lShoulder.x = -1.1;
      rShoulder.x = -1.1;
    }
    // Crouch (Low guard)
    else if (state === 'crouch') {
      pelvisY = 1.6;
      lHip.x = -1.2;
      rHip.x = -1.2;
      lKnee.x = 1.8;
      rKnee.x = 1.8;
      lElbow.x = -2.1;
      rElbow.x = -2.1;
    }
    // Light Jab (Punch J)
    else if (state === 'punch_1' || state === 'jab') {
      torsoRot.y = 0.5;
      lShoulder.x = -1.55; // Straight arm punch extension
      lShoulder.y = 0.2;
      lElbow.x = -0.05;    // Fully extended elbow
      rShoulder.x = -0.3;
      rElbow.x = -1.9;    // Right hand tight guard
    }
    // Heavy Cross (Punch J,J / Heavy)
    else if (state === 'punch_2' || state === 'cross') {
      torsoRot.y = -0.65;  // Deep torso rotation driving the right straight
      rShoulder.x = -1.6;
      rShoulder.y = -0.3;
      rElbow.x = -0.08;
      lShoulder.x = -0.2;
      lElbow.x = -1.8;
      pelvisY -= 0.1;
    }
    // Uppercut (Down + Punch)
    else if (state === 'uppercut') {
      pelvisY -= 0.25;
      torsoRot.y = -0.4;
      torsoRot.x = -0.2;
      rShoulder.x = -0.8;
      rElbow.x = -2.3; // Loaded elbow exploding straight upward
    }
    // High Roundhouse Kick (Kick K)
    else if (state === 'kick_1' || state === 'roundhouse') {
      torsoRot.z = 0.35;
      torsoRot.y = -0.4;
      rHip.x = -1.75; // Leg high in the air
      rHip.z = -0.4;
      rKnee.x = 0.2;  // Snapped out kick
      lHip.x = 0.2;
      lKnee.x = 0.3;
      pelvisY += 0.1;
    }
    // Low Sweep Kick (Down + Kick)
    else if (state === 'kick_2' || state === 'low_kick') {
      pelvisY = 1.45;
      lHip.x = -1.3;
      lKnee.x = 1.9;
      rHip.x = -1.5; // Sweeping low across the mat
      rHip.y = 0.5;
      rKnee.x = 0.1;
    }
    // Grab & Throw (I or J+K)
    else if (state === 'grab') {
      torsoRot.x = 0.3;
      lShoulder.x = -1.4;
      rShoulder.x = -1.4;
      lElbow.x = -0.4;
      rElbow.x = -0.4;
    }
    // Defensive Block (Guard)
    else if (state === 'block') {
      lShoulder.x = -1.1;
      rShoulder.x = -1.1;
      lShoulder.z = 0.6;
      rShoulder.z = -0.6;
      lElbow.x = -2.3; // Forearms crossed in tight protective shield
      rElbow.x = -2.3;
      pelvisY -= 0.15;
    }
    // Taking Damage (Hit Flinch)
    else if (state === 'hit') {
      torsoRot.x = -0.45; // Chest snapping back
      j.head.rotation.x = -0.55;
      lShoulder.x = 0.3;
      rShoulder.x = 0.3;
    }
    // Knockdown (Falling to canvas)
    else if (state === 'knockdown') {
      this.root.rotation.z = facing * (Math.PI / 2.2);
      pelvisY = 0.5;
      lHip.x = -0.4;
      rHip.x = -0.4;
      lKnee.x = 0.6;
      rKnee.x = 0.6;
    }
    // Super Move Charge Aura
    else if (state === 'super_charge') {
      pelvisY = 1.7;
      torsoRot.x = 0.35;
      lShoulder.x = 0.5;
      rShoulder.x = 0.5;
      lElbow.x = -1.8;
      rElbow.x = -1.8;
      lHip.x = -0.9;
      rHip.x = -0.9;
      lKnee.x = 1.4;
      rKnee.x = 1.4;
    }

    // Smooth Lerp of Joint Rotations
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

    // Face Direction
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
