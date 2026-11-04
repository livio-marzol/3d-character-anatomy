import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DEFAULT_CHARACTER_STATE, ARCHETYPE_PRESETS, cloneState } from './characterState.js';
import { WGSLMaterialSuite } from './wgslShaders.js';
import { ProceduralCharacterBuilder } from './proceduralCharacter.js';
import { UIController } from './uiController.js';

class CharacterStudioApp {
  constructor() {
    this.canvas = document.getElementById('three-canvas');
    this.statusEl = document.getElementById('renderer-status');
    this.polyCounterEl = document.getElementById('poly-counter');
    this.shaderNameEl = document.getElementById('shader-pipeline-name');

    this.state = cloneState(DEFAULT_CHARACTER_STATE);
    this.clock = new THREE.Clock();

    // Camera smooth transition target state
    this.cameraTargetPos = new THREE.Vector3(0, 1.02, 2.38);
    this.controlsTarget = new THREE.Vector3(0, 0.92, 0);
    this.isTransitioningCamera = false;

    this.init();
  }

  async init() {
    // 1. Scene & Camera Setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      36,
      this.canvas.clientWidth / this.canvas.clientHeight,
      0.05,
      50
    );
    this.camera.position.copy(this.cameraTargetPos);

    // 2. Initialize Three.js WebGPURenderer (with WGSL support)
    let isWebGPUNative = Boolean(navigator.gpu);
    this.renderer = new THREE.WebGPURenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });

    try {
      await this.renderer.init();
      const backendName = this.renderer.backend?.isWebGPUBackend ? 'WebGPU + WGSL Nativo' : 'WebGL2 TSL Fallback';
      isWebGPUNative = Boolean(this.renderer.backend?.isWebGPUBackend);
      this.statusEl.textContent = `● ${backendName} Ativo`;
    } catch (err) {
      console.warn('WebGPU init warning:', err);
      isWebGPUNative = false;
      this.statusEl.textContent = '● TSL Shader Pipeline Ativo';
    }

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    // 3. OrbitControls with smooth damping
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.065;
    this.controls.minDistance = 0.32;
    this.controls.maxDistance = 4.5;
    this.controls.maxPolarAngle = Math.PI * 0.56;
    this.controls.target.copy(this.controlsTarget);

    this.canvas.addEventListener('pointerdown', () => {
      this.isTransitioningCamera = false;
    });

    // 4. Studio 3-Point Lighting + Sculpted Stone Pedestal (Matches Reference 2)
    this.setupStudioLighting();
    this.setupStudioPedestal();

    // 5. Build WGSL Materials & Load Real Anatomical Quad-Topology Character
    this.materialSuite = new WGSLMaterialSuite(this.state, isWebGPUNative);
    this.character = new ProceduralCharacterBuilder(this.materialSuite, this.state);
    this.scene.add(this.character.root);

    this.statusEl.textContent = 'Carregando Malha Anatômica Quad-Flow...';
    await this.character.loadAnatomicalAssets(this.state);
    this.statusEl.textContent = `● ${isWebGPUNative ? 'WebGPU + WGSL Nativo' : 'TSL Shader Pipeline'} Ativo`;

    // Update Telemetry HUD
    const quads = this.character.totalQuads;
    const tris = quads * 2;
    this.polyCounterEl.textContent = `${quads.toLocaleString('pt-BR')} Quads / ${tris.toLocaleString('pt-BR')} Tris`;

    // 6. Initialize Lateral UI Customizer
    this.ui = new UIController(this.state, {
      onChange: (cat, key, val) => this.handleParameterChange(cat, key, val),
      onCameraFocus: (preset) => this.focusCamera(preset),
      onInspectionMode: (mode) => this.setInspectionMode(mode),
      onSelectArchetype: (presetKey) => this.applyArchetypePreset(presetKey),
      onRandomize: () => this.randomizeCharacter(),
      onResetAll: () => this.resetAll(),
      onResetCategory: (cat) => this.resetCategory(cat)
    });

    window.addEventListener('resize', () => this.onResize());

    this.renderer.setAnimationLoop(() => this.animate());
  }

  setupStudioLighting() {
    this.ambientLight = new THREE.HemisphereLight(0xdbeafe, 0x1e1b4b, 0.72);
    this.scene.add(this.ambientLight);

    this.keyLight = new THREE.DirectionalLight(0xfff4ea, 2.2);
    this.keyLight.position.set(1.8, 2.4, 2.2);
    this.scene.add(this.keyLight);

    this.fillLight = new THREE.DirectionalLight(0x93c5fd, 1.0);
    this.fillLight.position.set(-2.2, 1.6, 1.4);
    this.scene.add(this.fillLight);

    this.rimLight = new THREE.SpotLight(0xe0e7ff, 3.0);
    this.rimLight.position.set(0.0, 2.35, -2.1);
    this.rimLight.angle = Math.PI * 0.45;
    this.rimLight.penumbra = 0.8;
    this.scene.add(this.rimLight);
  }

  setupStudioPedestal() {
    const pedestalGroup = new THREE.Group();

    // Clean dark matte sculptor turntable base (Inspired by Reference 2 stone pedestal, zero UV artifacts)
    const baseGeo = new THREE.CylinderGeometry(0.46, 0.50, 0.06, 64);
    const baseMat = new THREE.MeshBasicMaterial({ color: 0x171a24 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.03;
    pedestalGroup.add(baseMesh);

    const topDiscGeo = new THREE.CircleGeometry(0.455, 64);
    topDiscGeo.rotateX(-Math.PI / 2);
    const topDiscMat = new THREE.MeshBasicMaterial({ color: 0x1e2330 });
    const topDisc = new THREE.Mesh(topDiscGeo, topDiscMat);
    topDisc.position.y = 0.0005;
    pedestalGroup.add(topDisc);

    const ringGeo = new THREE.RingGeometry(0.445, 0.458, 64);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.48
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 0.001;
    pedestalGroup.add(ringMesh);

    this.scene.add(pedestalGroup);
  }

  handleParameterChange(category, key, value) {
    // When user switches between Male ('male') and Female ('female') base models,
    // sync the bottom pill indicator and apply clean gender defaults
    if (category === 'body' && key === 'gender') {
      document.querySelectorAll('.preset-pill').forEach(p => {
        p.classList.toggle('active', p.dataset.preset === value);
      });
      this.applyArchetypePreset(value);
      return;
    }

    this.materialSuite.updateFromState(this.state);
    this.character.applyCustomization(this.state);
  }

  focusCamera(preset) {
    const hScale = this.state.body.height;
    this.isTransitioningCamera = true;

    if (preset === 'head') {
      this.controlsTarget.set(0, 1.56 * hScale, 0.08);
      this.cameraTargetPos.set(0.0, 1.58 * hScale, 0.56);
    } else if (preset === 'upper') {
      this.controlsTarget.set(0, 1.28 * hScale, 0.05);
      this.cameraTargetPos.set(0.10, 1.34 * hScale, 1.15);
    } else if (preset === 'profile') {
      this.controlsTarget.set(0, 0.94 * hScale, 0.05);
      this.cameraTargetPos.set(2.15, 1.05 * hScale, 0.12);
    } else {
      this.controlsTarget.set(0, 0.90 * hScale, 0.04);
      this.cameraTargetPos.set(0.0, 1.02 * hScale, 2.38);
    }
  }

  setInspectionMode(mode) {
    this.materialSuite.setInspectionMode(mode);
    this.character.setWireframeVisible(mode === 'wireframe');

    const modeLabels = {
      pbr: 'WGSL Subsurface + Anisotropic',
      wireframe: 'Quad-Flow Subdivision Cage',
      clay: 'ZBrush Studio Clay MatCap',
      normals: 'World/View Space Normal Map'
    };
    this.shaderNameEl.textContent = modeLabels[mode] || modeLabels.pbr;
  }

  applyArchetypePreset(presetKey) {
    const preset = ARCHETYPE_PRESETS[presetKey];
    if (!preset) return;

    this.state = cloneState(preset);
    this.ui.state = this.state;
    this.materialSuite.updateFromState(this.state);
    this.character.applyCustomization(this.state);
    this.ui.renderCategory(this.ui.activeCategory, false);

    document.querySelectorAll('.preset-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.preset === presetKey);
    });
  }

  randomizeCharacter() {
    const rand = (min, max) => +(min + Math.random() * (max - min)).toFixed(2);
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const skinPalette = [
      ['#f9dcd0', '#e85d56'],
      ['#f1c6b0', '#e35546'],
      ['#eab89e', '#e25241'],
      ['#d19979', '#c44229'],
      ['#a66e4e', '#992b1e'],
      ['#73462d', '#6e2219']
    ];
    const [skinCol, sssCol] = pick(skinPalette);

    const isMale = this.state.body.gender === 'male';
    this.state.body.height = rand(0.95, 1.05);
    this.state.body.muscleTone = rand(0.35, 0.85);
    this.state.body.bodyMass = rand(0.40, 0.62);
    this.state.body.chestVolume = rand(0.40, 0.65);
    this.state.body.skinColor = skinCol;
    this.state.body.skinSubsurface = sssCol;
    this.state.body.skinBlush = rand(0.15, 0.50);
    this.state.body.freckles = rand(0.0, 0.30);

    this.state.face.jawWidth = rand(0.30, 0.75);
    this.state.face.jawLine = rand(0.40, 0.85);
    this.state.face.chinHeight = rand(0.35, 0.68);
    this.state.face.chinProjection = rand(0.38, 0.70);
    this.state.face.cheekbones = rand(0.45, 0.82);
    this.state.face.browRidge = rand(0.25, 0.78);

    this.state.eyes.eyeSize = rand(0.44, 0.68);
    this.state.eyes.eyeTilt = rand(0.40, 0.68);
    this.state.eyes.eyeSpacing = rand(0.40, 0.62);
    this.state.eyes.irisColor = pick(['#dc2626', '#991b1b', '#d97706', '#10b981', '#38bdf8', '#6366f1', '#7c2d12']);
    this.state.eyes.eyebrowArch = rand(0.32, 0.72);
    this.state.eyes.eyebrowThickness = rand(0.38, 0.75);

    this.state.nose.noseLength = rand(0.38, 0.65);
    this.state.nose.noseProjection = rand(0.40, 0.68);
    this.state.nose.bridgeWidth = rand(0.30, 0.65);
    this.state.nose.bridgeCurve = rand(0.32, 0.68);
    this.state.nose.nostrilWidth = rand(0.32, 0.65);
    this.state.nose.tipTilt = rand(0.38, 0.68);

    this.state.mouth.mouthWidth = rand(0.40, 0.64);
    this.state.mouth.upperLipVolume = rand(0.40, 0.72);
    this.state.mouth.lowerLipVolume = rand(0.42, 0.75);
    this.state.mouth.cupidsBow = rand(0.38, 0.75);
    this.state.mouth.mouthCorners = rand(0.40, 0.62);

    this.materialSuite.updateFromState(this.state);
    this.character.applyCustomization(this.state);
  }

  resetAll() {
    this.state = cloneState(DEFAULT_CHARACTER_STATE);
    this.ui.state = this.state;
    this.materialSuite.updateFromState(this.state);
    this.character.applyCustomization(this.state);
  }

  resetCategory(catKey) {
    this.state[catKey] = cloneState(DEFAULT_CHARACTER_STATE[catKey]);
    this.materialSuite.updateFromState(this.state);
    this.character.applyCustomization(this.state);
  }

  onResize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  animate() {
    const elapsed = this.clock.getElapsedTime();

    if (this.isTransitioningCamera) {
      this.camera.position.lerp(this.cameraTargetPos, 0.08);
      this.controls.target.lerp(this.controlsTarget, 0.08);
      if (this.camera.position.distanceTo(this.cameraTargetPos) < 0.005) {
        this.isTransitioningCamera = false;
      }
    }

    const turntableOn = document.getElementById('toggle-turntable')?.checked;
    if (turntableOn && this.character) {
      this.character.root.rotation.y += 0.005;
    }

    const breathingOn = document.getElementById('toggle-breathing')?.checked;
    if (breathingOn && this.character) {
      const breath = Math.sin(elapsed * 1.9) * 0.0025;
      this.character.root.position.y = breath;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new CharacterStudioApp();
});
