// ==========================================================================
// Graphics Engine Module (Single Responsibility: WebGL Scene Graph & Meshes)
// ==========================================================================

class TacticalSceneManager {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.cameraTarget = new THREE.Vector3(
      CONFIG.cameraStations[0].lookAt.x,
      CONFIG.cameraStations[0].lookAt.y,
      CONFIG.cameraStations[0].lookAt.z
    );

    this.mannequinGroup = null;
    this.mannequinJoints = {};
    
    this.customModelGroup = null;
    this.customModelBones = {};

    this.characterContainer = null;

    this.animatedMeshes = {
      station0Group: null,
      station0RadarA: null,
      station0RadarB: null,
      station1Group: null,
      station1Monoliths: [],
      station1Wiring: null,
      station2Group: null,
      station2Platform: null,
      station2HoloCyl: null,
      station2ScannerParticles: null,
      station2ParticleSpeeds: [],
      station3Group: null,
      station3Core: null,
      station3RingX: null,
      station3RingY: null,
      station3RingZ: null
    };

    this._setup();
  }

  _setup() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(CONFIG.colors.fog, 0.015);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(
      CONFIG.cameraStations[0].pos.x,
      CONFIG.cameraStations[0].pos.y,
      CONFIG.cameraStations[0].pos.z
    );
    this.camera.lookAt(this.cameraTarget);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this._setupLighting();
    this._setupEnvironments();
    
    // Build procedural stations
    this._buildStation0();
    this._buildStation1();
    this._buildStation2();
    this._buildStation3();

    this.characterContainer = new THREE.Group();
    this.scene.add(this.characterContainer);

    // Default: build procedural model in Lobby
    this.updateLobbyCharacter("#cba052");

    window.addEventListener('resize', () => this.handleResize());
  }

  _setupLighting() {
    const ambient = new THREE.AmbientLight(0x222222);
    this.scene.add(ambient);

    const s0Light = new THREE.PointLight(CONFIG.colors.accent, 1.8, 20);
    s0Light.position.set(0, 2, 0);

    const s1Light = new THREE.PointLight(CONFIG.colors.blue, 1.8, 20);
    s1Light.position.set(-15, 2, -5);

    const s2Light = new THREE.PointLight(CONFIG.colors.green, 1.8, 20);
    s2Light.position.set(15, 2, -5);

    const s3Light = new THREE.PointLight(CONFIG.colors.purple, 1.8, 20);
    s3Light.position.set(0, -8, -5);

    this.scene.add(s0Light, s1Light, s2Light, s3Light);
  }

  _setupEnvironments() {
    // Floor Grid
    const grid = new THREE.GridHelper(120, 60, 0x333333, 0x111111);
    grid.position.y = -3.5;
    this.scene.add(grid);

    // Stars particle field
    const starsCount = 800;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 80;
      positions[i + 1] = (Math.random() - 0.5) * 40;
      positions[i + 2] = (Math.random() - 0.5) * 50;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, transparent: true, opacity: 0.4 });
    const points = new THREE.Points(geom, mat);
    this.scene.add(points);
  }

  _buildStation0() {
    const group = new THREE.Group();
    group.position.set(0, 0, 0);
    this.scene.add(group);

    // Lobby Pedestal base
    const pedGeom = new THREE.CylinderGeometry(2, 2.2, 0.3, 32);
    const pedMat = new THREE.MeshBasicMaterial({ color: CONFIG.colors.accent, wireframe: true, transparent: true, opacity: 0.3 });
    const pedestal = new THREE.Mesh(pedGeom, pedMat);
    pedestal.position.y = -1.25;
    group.add(pedestal);

    // Radar scanning rings
    const ringGeom = new THREE.RingGeometry(2.2, 2.25, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: CONFIG.colors.accent, side: THREE.DoubleSide, transparent: true, opacity: 0.15 });
    const radarA = new THREE.Mesh(ringGeom, ringMat);
    const radarB = new THREE.Mesh(ringGeom, ringMat);
    radarA.rotation.x = Math.PI / 2;
    radarB.rotation.x = Math.PI / 2;
    group.add(radarA, radarB);

    this.animatedMeshes.station0Group = group;
    this.animatedMeshes.station0RadarA = radarA;
    this.animatedMeshes.station0RadarB = radarB;
    this.s0Group = group;
  }

  _buildStation1() {
    const group = new THREE.Group();
    group.position.set(-15, 0, -5);
    this.scene.add(group);

    const monoMat = new THREE.MeshBasicMaterial({ color: CONFIG.colors.blue, wireframe: true, transparent: true, opacity: 0.55 });
    const monoliths = [];
    const configurations = [
      { geom: new THREE.BoxGeometry(1.2, 4, 1.2), pos: [0, 1.5, 0] },
      { geom: new THREE.BoxGeometry(0.8, 3, 0.8), pos: [-2.2, 1.0, -1.5] },
      { geom: new THREE.BoxGeometry(1.0, 2.5, 1.0), pos: [2.2, 0.75, -1.0] }
    ];

    configurations.forEach(cfg => {
      const mesh = new THREE.Mesh(cfg.geom, monoMat);
      mesh.position.set(...cfg.pos);
      group.add(mesh);
      monoliths.push(mesh);
    });

    const linesGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 3.5, 0),
      new THREE.Vector3(-2.2, 2.5, -1.5),
      new THREE.Vector3(2.2, 2.0, -1.0),
      new THREE.Vector3(0, 3.5, 0)
    ]);
    const linesMat = new THREE.LineBasicMaterial({ color: CONFIG.colors.blue, transparent: true, opacity: 0.3 });
    const wiring = new THREE.Line(linesGeom, linesMat);
    group.add(wiring);

    this.animatedMeshes.station1Group = group;
    this.animatedMeshes.station1Monoliths = monoliths;
    this.animatedMeshes.station1Wiring = wiring;
  }

  _buildStation2() {
    const group = new THREE.Group();
    group.position.set(15, -1.2, -5);
    this.scene.add(group);

    const platGeom = new THREE.CylinderGeometry(2, 2.3, 0.4, 32);
    const platMat = new THREE.MeshBasicMaterial({ color: CONFIG.colors.green, wireframe: true, transparent: true, opacity: 0.7 });
    const platform = new THREE.Mesh(platGeom, platMat);
    group.add(platform);

    const holoGeom = new THREE.CylinderGeometry(1.7, 1.7, 4, 32, 1, true);
    const holoMat = new THREE.MeshBasicMaterial({ color: CONFIG.colors.green, wireframe: true, transparent: true, opacity: 0.1, side: THREE.DoubleSide });
    const holoCyl = new THREE.Mesh(holoGeom, holoMat);
    holoCyl.position.y = 2.0;
    group.add(holoCyl);

    const pCount = 50;
    const pGeom = new THREE.BufferGeometry();
    const pPositions = new Float32Array(pCount * 3);
    const speeds = [];

    for (let i = 0; i < pCount; i++) {
      const radius = Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      pPositions[i * 3] = radius * Math.cos(theta);
      pPositions[i * 3 + 1] = Math.random() * 4;
      pPositions[i * 3 + 2] = radius * Math.sin(theta);
      speeds.push(0.01 + Math.random() * 0.02);
    }
    pGeom.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({ color: CONFIG.colors.green, size: 0.05, transparent: true, opacity: 0.7 });
    const scannerParticles = new THREE.Points(pGeom, pMat);
    group.add(scannerParticles);

    this.animatedMeshes.station2Group = group;
    this.animatedMeshes.station2Platform = platform;
    this.animatedMeshes.station2HoloCyl = holoCyl;
    this.animatedMeshes.station2ScannerParticles = scannerParticles;
    this.animatedMeshes.station2ParticleSpeeds = speeds;
  }

  _buildStation3() {
    const group = new THREE.Group();
    group.position.set(0, -9.5, -5);
    this.scene.add(group);

    const coreGeom = new THREE.DodecahedronGeometry(1.0, 1);
    const coreMat = new THREE.MeshBasicMaterial({ color: CONFIG.colors.purple, wireframe: true, transparent: true, opacity: 0.7 });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    group.add(coreMesh);

    const ringMat = new THREE.MeshBasicMaterial({ color: CONFIG.colors.purple, side: THREE.DoubleSide, transparent: true, opacity: 0.45 });
    const rx = new THREE.Mesh(new THREE.RingGeometry(2.3, 2.36, 64), ringMat);
    const ry = new THREE.Mesh(new THREE.RingGeometry(1.9, 1.95, 64), ringMat);
    const rz = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.54, 64), ringMat);
    group.add(rx, ry, rz);

    this.animatedMeshes.station3Group = group;
    this.animatedMeshes.station3Core = coreMesh;
    this.animatedMeshes.station3RingX = rx;
    this.animatedMeshes.station3RingY = ry;
    this.animatedMeshes.station3RingZ = rz;
  }

  // --------------------------------------------------
  // PROCEDURAL HUMAN SKELETON BUILDER (YAGNI & Clean Code)
  // --------------------------------------------------
  _buildProceduralMannequin(colorHex) {
    this._cleanupLobbyCharacters();

    const group = new THREE.Group();
    group.position.set(0, -1.1, 0);

    const mat = new THREE.MeshBasicMaterial({ color: colorHex, wireframe: true, transparent: true, opacity: 0.85 });

    // 1. Quadril / Raiz
    const hipsGeom = new THREE.BoxGeometry(0.7, 0.35, 0.4);
    const hips = new THREE.Mesh(hipsGeom, mat);
    group.add(hips);

    // 2. Torso
    const torsoGeom = new THREE.BoxGeometry(0.85, 0.9, 0.45);
    const torso = new THREE.Mesh(torsoGeom, mat);
    torso.position.y = 0.65;
    hips.add(torso);

    // 3. Cabeça
    const headGeom = new THREE.SphereGeometry(0.28, 8, 8);
    const head = new THREE.Mesh(headGeom, mat);
    head.position.y = 0.75;
    torso.add(head);

    // 4. Ombros e Braços
    const shoulderLeft = new THREE.Group();
    shoulderLeft.position.set(-0.55, 0.35, 0);
    torso.add(shoulderLeft);
    const armLeftGeom = new THREE.CylinderGeometry(0.1, 0.08, 0.55, 6);
    const armLeft = new THREE.Mesh(armLeftGeom, mat);
    armLeft.position.y = -0.28;
    shoulderLeft.add(armLeft);

    const shoulderRight = new THREE.Group();
    shoulderRight.position.set(0.55, 0.35, 0);
    torso.add(shoulderRight);
    const armRightGeom = new THREE.CylinderGeometry(0.1, 0.08, 0.55, 6);
    const armRight = new THREE.Mesh(armRightGeom, mat);
    armRight.position.y = -0.28;
    shoulderRight.add(armRight);

    // 5. Quadris e Pernas
    const hipLeft = new THREE.Group();
    hipLeft.position.set(-0.25, -0.15, 0);
    hips.add(hipLeft);
    const legLeftGeom = new THREE.CylinderGeometry(0.12, 0.09, 0.6, 6);
    const legLeft = new THREE.Mesh(legLeftGeom, mat);
    legLeft.position.y = -0.3;
    hipLeft.add(legLeft);

    const hipRight = new THREE.Group();
    hipRight.position.set(0.25, -0.15, 0);
    hips.add(hipRight);
    const legRightGeom = new THREE.CylinderGeometry(0.12, 0.09, 0.6, 6);
    const legRight = new THREE.Mesh(legRightGeom, mat);
    legRight.position.y = -0.3;
    hipRight.add(legRight);

    // Retain references for animations
    this.mannequinJoints = {
      hips: hips,
      torso: torso,
      head: head,
      shoulderLeft: shoulderLeft,
      shoulderRight: shoulderRight,
      hipLeft: hipLeft,
      hipRight: hipRight
    };

    this.mannequinGroup = group;
    this.characterContainer.add(group);
  }

  _cleanupLobbyCharacters() {
    if (this.mannequinGroup) {
      this.characterContainer.remove(this.mannequinGroup);
      this.mannequinGroup = null;
    }
    if (this.customModelGroup) {
      this.characterContainer.remove(this.customModelGroup);
      this.customModelGroup = null;
    }
    this.customModelBones = {};
  }

  // --------------------------------------------------
  // 3D FILE UPLOADER & PARSER (GLTFLoader API Integration)
  // --------------------------------------------------
  loadCustomModel(arrayBuffer, successCallback, errorCallback) {
    const loader = new THREE.GLTFLoader();
    
    loader.parse(arrayBuffer, '', (gltf) => {
      this._cleanupLobbyCharacters();

      const model = gltf.scene;
      
      // Auto center and scale model
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetScale = 2.2 / maxDim; // Fit inside pedestal height boundaries
      
      model.scale.set(targetScale, targetScale, targetScale);
      
      // Position model centered on floor pedestal
      const center = box.getCenter(new THREE.Vector3());
      model.position.set(-center.x * targetScale, (-box.min.y * targetScale) - 1.1, -center.z * targetScale);

      // Force wireframe look on custom model for sci-fi HUD theme consistency
      model.traverse(node => {
        if (node.isMesh) {
          node.material = new THREE.MeshBasicMaterial({
            color: 0xcba052,
            wireframe: true,
            transparent: true,
            opacity: 0.75
          });
        }
      });

      this.customModelGroup = model;
      this.characterContainer.add(model);

      // Recursively gather model bones
      const boneList = this._scanModelBones(model);
      
      successCallback(boneList);
    }, (err) => {
      console.error(err);
      if (errorCallback) errorCallback(err);
    });
  }

  _scanModelBones(model) {
    this.customModelBones = {};
    const bones = [];
    
    model.traverse(node => {
      if (node.isBone) {
        this.customModelBones[node.name] = node;
        bones.push(node.name);
      }
    });

    // Fallback: If no bones detected (static mesh), parse mesh child nodes
    if (bones.length === 0) {
      model.traverse(node => {
        if (node.isMesh && node.name) {
          this.customModelBones[node.name] = node;
          bones.push(node.name);
        }
      });
    }

    return bones;
  }

  // --------------------------------------------------
  // SKELETAL RIGGING CONTROLS (TEST ANIMATION ROTATIONS)
  // --------------------------------------------------
  rotateModelBone(boneName, rotationValue) {
    // 1. Check custom uploaded model bones
    if (this.customModelBones && this.customModelBones[boneName]) {
      const bone = this.customModelBones[boneName];
      gsap.to(bone.rotation, {
        z: rotationValue,
        y: rotationValue * 0.5,
        duration: 0.4,
        ease: "power1.out"
      });
      return;
    }

    // 2. Fallback to procedural mannequin joints mapping
    const proceduralMappings = {
      "head": this.mannequinJoints.head,
      "torso": this.mannequinJoints.torso,
      "shoulderLeft": this.mannequinJoints.shoulderLeft,
      "shoulderRight": this.mannequinJoints.shoulderRight,
      "hipLeft": this.mannequinJoints.hipLeft,
      "hipRight": this.mannequinJoints.hipRight
    };

    if (proceduralMappings[boneName]) {
      gsap.to(proceduralMappings[boneName].rotation, {
        z: rotationValue,
        duration: 0.4,
        ease: "power1.out"
      });
    }
  }

  updateLobbyCharacter(colorHex) {
    this._buildProceduralMannequin(colorHex);
  }

  // --------------------------------------------------
  // GENERAL UPDATES & RENDER TICK
  // --------------------------------------------------
  update(elapsedTime) {
    const anim = this.animatedMeshes;

    // Pedestal Radar effects
    if (anim.station0Group) {
      anim.station0RadarA.rotation.z = elapsedTime * 0.15;
      anim.station0RadarA.scale.setScalar(1.0 + Math.sin(elapsedTime * 2) * 0.05);
      anim.station0RadarB.rotation.z = -elapsedTime * 0.22;
      anim.station0RadarB.scale.setScalar(1.0 - Math.sin(elapsedTime * 2) * 0.05);
    }

    // Lobby Procedural Mannequin Idle Breathing Cycle
    if (this.mannequinGroup && this.mannequinJoints.torso) {
      const breathing = Math.sin(elapsedTime * 2.0);
      
      // Gentle spine sway
      this.mannequinJoints.torso.rotation.z = breathing * 0.015;
      this.mannequinJoints.head.rotation.y = Math.cos(elapsedTime * 0.8) * 0.05;
      
      // Shoulders/arms slight lift
      this.mannequinJoints.shoulderLeft.rotation.z = (breathing * 0.02) - 0.1;
      this.mannequinJoints.shoulderRight.rotation.z = (-breathing * 0.02) + 0.1;
    }

    // Station 1 (Campaigns) floating
    if (anim.station1Group) {
      anim.station1Monoliths.forEach((m, idx) => {
        const baseHeight = idx === 0 ? 1.5 : idx === 1 ? 1.0 : 0.75;
        m.position.y = baseHeight + Math.sin(elapsedTime * 1.2 + idx) * 0.2;
        m.rotation.y = elapsedTime * (0.05 + idx * 0.05);
      });
      anim.station1Wiring.rotation.y = -elapsedTime * 0.08;
    }

    // Station 2 (Characters) rising particles
    if (anim.station2Group) {
      anim.station2Platform.rotation.y = -elapsedTime * 0.2;
      anim.station2HoloCyl.rotation.y = elapsedTime * 0.1;

      const pArr = anim.station2ScannerParticles.geometry.attributes.position.array;
      const len = pArr.length / 3;
      for (let i = 0; i < len; i++) {
        pArr[i * 3 + 1] += anim.station2ParticleSpeeds[i];
        if (pArr[i * 3 + 1] > 4.0) {
          pArr[i * 3 + 1] = 0;
        }
      }
      anim.station2ScannerParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Station 3 (Compendium) orbit speeds
    if (anim.station3Group) {
      anim.station3Core.rotation.x = elapsedTime * 0.3;
      anim.station3Core.rotation.y = elapsedTime * 0.15;
      anim.station3RingX.rotation.x = elapsedTime * 0.45;
      anim.station3RingX.rotation.y = elapsedTime * 0.2;
      anim.station3RingY.rotation.y = -elapsedTime * 0.3;
      anim.station3RingY.rotation.z = elapsedTime * 0.1;
      anim.station3RingZ.rotation.z = elapsedTime * 0.5;
    }

    // Track targets and render frame
    this.camera.lookAt(this.cameraTarget);
    this.renderer.render(this.scene, this.camera);
  }

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
