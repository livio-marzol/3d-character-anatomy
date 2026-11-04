import * as THREE from 'three/webgpu';

// Scale factor converting MakeHuman units (height ~16.7 units, minY = -8.168) to Studio meters (~1.72m, feet at y=0)
const MH_SCALE = 0.1025;
const MH_Y_OFFSET = 8.168;
const MH_Z_OFFSET = -0.35;

/**
 * High-Precision Pure Anatomical Character Engine (Body & Face)
 * Powered by a 13,378-Quad Studio Base Topology + Real Anatomical Morph Targets (Male & Female Separated)
 */
export class ProceduralCharacterBuilder {
  constructor(materialSuite) {
    this.materials = materialSuite.materials;
    this.root = new THREE.Group();
    this.quadWireGroup = new THREE.Group();
    this.quadWireGroup.visible = false;
    this.root.add(this.quadWireGroup);

    this.totalQuads = 13378;
    this.isLoaded = false;
  }

  /**
   * Asynchronously loads the studio quad base mesh and real anatomical morph targets
   */
  async loadAnatomicalAssets(initialState) {
    const [objRes, morphRes] = await Promise.all([
      fetch('/assets/anatomy/human_clean.obj'),
      fetch('/assets/anatomy/morph_deltas.json')
    ]);

    const objText = await objRes.text();
    this.morphDeltas = await morphRes.json();

    this.parseAndBuildMeshes(objText);

    this.isLoaded = true;
    this.applyCustomization(initialState);
  }

  /**
   * Parses `human_clean.obj` preserving exact quad topology and vertex mapping for morph targets
   */
  parseAndBuildMeshes(objText) {
    const lines = objText.split(/\r?\n/);
    const rawVerts = [];
    const rawUvs = [];
    const groups = {};
    let currentGroup = 'default';

    for (const line of lines) {
      if (line.startsWith('v ')) {
        const p = line.trim().split(/\s+/);
        rawVerts.push(parseFloat(p[1]), parseFloat(p[2]), parseFloat(p[3]));
      } else if (line.startsWith('vt ')) {
        const p = line.trim().split(/\s+/);
        rawUvs.push(parseFloat(p[1]), parseFloat(p[2]));
      } else if (line.startsWith('g ')) {
        currentGroup = line.slice(2).trim();
      } else if (line.startsWith('f ')) {
        if (!groups[currentGroup]) groups[currentGroup] = [];
        const parts = line.trim().split(/\s+/).slice(1);
        const quad = parts.map(token => {
          const [vi, ti] = token.split('/');
          return [parseInt(vi, 10) - 1, parseInt(ti, 10) - 1];
        });
        groups[currentGroup].push(quad);
      }
    }

    this.numObjVerts = rawVerts.length / 3;
    this.baseObjVerts = new Float32Array(rawVerts);
    this.deformedObjVerts = new Float32Array(rawVerts);
    this.rawUvs = new Float32Array(rawUvs);

    // 1. Primary Anatomical Body Mesh (13,378 Quads)
    this.bodyMeshData = this.buildSubMeshFromQuads(groups['body'], this.materials.skin, {
      buildQuadWire: true
    });
    this.root.add(this.bodyMeshData.mesh);

    // 2. Left & Right Eyeballs (Remap UVs so iris center is at [0.5, 0.5] for WGSL Iris Shader)
    const eyeQuads = [...(groups['helper-l-eye'] || []), ...(groups['helper-r-eye'] || [])];
    this.eyeMeshData = this.buildSubMeshFromQuads(eyeQuads, this.materials.eye, {
      remapEyeUVs: true
    });
    this.root.add(this.eyeMeshData.mesh);

    // 3. Eyelashes
    const lashQuads = [
      ...(groups['helper-l-eyelashes-1'] || []),
      ...(groups['helper-l-eyelashes-2'] || []),
      ...(groups['helper-r-eyelashes-1'] || []),
      ...(groups['helper-r-eyelashes-2'] || [])
    ];
    const lashMat = new THREE.MeshBasicMaterial({ color: 0x111116, side: THREE.DoubleSide });
    this.lashMeshData = this.buildSubMeshFromQuads(lashQuads, lashMat, {});
    this.root.add(this.lashMeshData.mesh);
  }

  /**
   * Converts a list of OBJ quads into a Three.js BufferGeometry while storing `objIndexMap`
   */
  buildSubMeshFromQuads(quads, material, options = {}) {
    const vertMap = new Map();
    const objIndexPerNewVert = [];
    const uvs = [];
    const triIndices = [];
    const quadLineIndices = [];

    const getOrAddVert = (vIdx, vtIdx) => {
      const key = `${vIdx}_${vtIdx}`;
      let newIdx = vertMap.get(key);
      if (newIdx === undefined) {
        newIdx = objIndexPerNewVert.length;
        vertMap.set(key, newIdx);
        objIndexPerNewVert.push(vIdx);
        const u = this.rawUvs[vtIdx * 2] || 0;
        const v = this.rawUvs[vtIdx * 2 + 1] || 0;
        uvs.push(u, v);
      }
      return newIdx;
    };

    for (const quad of quads) {
      if (quad.length < 3) continue;
      const i0 = getOrAddVert(quad[0][0], quad[0][1]);
      const i1 = getOrAddVert(quad[1][0], quad[1][1]);
      const i2 = getOrAddVert(quad[2][0], quad[2][1]);

      if (quad.length === 4) {
        const i3 = getOrAddVert(quad[3][0], quad[3][1]);
        triIndices.push(i0, i1, i3, i1, i2, i3);
        if (options.buildQuadWire) {
          quadLineIndices.push(i0, i1, i1, i2, i2, i3, i3, i0);
        }
      } else {
        triIndices.push(i0, i1, i2);
        if (options.buildQuadWire) {
          quadLineIndices.push(i0, i1, i1, i2, i2, i0);
        }
      }
    }

    if (options.remapEyeUVs) {
      for (let i = 0; i < uvs.length; i += 2) {
        const u = uvs[i];
        const v = uvs[i + 1];
        const isLeft = u < 0.7865;
        const minU = isLeft ? 0.7602 : 0.7882;
        const maxU = isLeft ? 0.7852 : 0.8132;
        uvs[i] = (u - minU) / (maxU - minU);
        uvs[i + 1] = (v - 0.9320) / (0.9570 - 0.9320);
      }
    }

    const numVerts = objIndexPerNewVert.length;
    const positions = new Float32Array(numVerts * 3);
    const normals = new Float32Array(numVerts * 3);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
    geo.setIndex(triIndices);

    const mesh = new THREE.Mesh(geo, material);

    let wireMesh = null;
    if (options.buildQuadWire) {
      const wireGeo = new THREE.BufferGeometry();
      wireGeo.setAttribute('position', geo.attributes.position);
      wireGeo.setIndex(quadLineIndices);
      wireMesh = new THREE.LineSegments(wireGeo, this.materials.wireOverlay);
      wireMesh.scale.setScalar(1.0012);
      this.quadWireGroup.add(wireMesh);
    }

    return {
      mesh,
      wireMesh,
      geo,
      objIndexMap: new Uint32Array(objIndexPerNewVert)
    };
  }

  /**
   * Accumulates a sparse morph target `[vIdx, dx, dy, dz, ...]` into `this.deformedObjVerts`
   */
  accumulateMorph(morphKey, weight) {
    if (!weight || Math.abs(weight) < 0.001) return;
    const arr = this.morphDeltas[morphKey];
    if (!arr) return;

    const out = this.deformedObjVerts;
    for (let i = 0; i < arr.length; i += 4) {
      const vIdx3 = arr[i] * 3;
      out[vIdx3] += arr[i + 1] * weight;
      out[vIdx3 + 1] += arr[i + 2] * weight;
      out[vIdx3 + 2] += arr[i + 3] * weight;
    }
  }

  /**
   * Transfers deformed OBJ vertices into a sub-mesh BufferGeometry and computes smooth normals
   */
  updateSubMeshGeometry(subMeshData) {
    const { geo, objIndexMap } = subMeshData;
    const posAttr = geo.attributes.position;
    const posArr = posAttr.array;
    const src = this.deformedObjVerts;
    const count = objIndexMap.length;

    for (let i = 0; i < count; i++) {
      const v3 = objIndexMap[i] * 3;
      const i3 = i * 3;
      posArr[i3] = src[v3] * MH_SCALE;
      posArr[i3 + 1] = (src[v3 + 1] + MH_Y_OFFSET) * MH_SCALE;
      posArr[i3 + 2] = (src[v3 + 2] + MH_Z_OFFSET) * MH_SCALE;
    }

    posAttr.needsUpdate = true;
    geo.computeVertexNormals();
  }

  /**
   * Real-time evaluation of all Male/Female anatomical morph targets and facial features
   */
  applyCustomization(state) {
    if (!this.isLoaded) return;

    // 1. Reset to neutral base vertices
    this.deformedObjVerts.set(this.baseObjVerts);

    const b = state.body;
    const f = state.face;
    const e = state.eyes;
    const n = state.nose;
    const m = state.mouth;
    const isMale = b.gender === 'male';

    // 2. Apply Separate Male or Female Base Anatomical Phenotype + Muscle + Body Mass
    if (isMale) {
      this.accumulateMorph('male_base', 1.0);
      this.accumulateMorph('male_muscle', b.muscleTone * 1.15);
      this.accumulateMorph('male_weight', (b.bodyMass - 0.45) * 0.85);
      this.accumulateMorph('chestVolume', ((b.chestVolume ?? 0.5) - 0.35) * 1.15);
    } else {
      this.accumulateMorph('female_base', 1.0);
      this.accumulateMorph('female_muscle', b.muscleTone * 0.95);
      this.accumulateMorph('female_weight', (b.bodyMass - 0.45) * 0.75);
      this.accumulateMorph('female_cup', ((b.chestVolume ?? 0.5) - 0.45) * 1.25);
    }

    // 3. Apply Facial & Cranial Sliders
    this.accumulateMorph('headShape', (f.headScale - 0.5) * 1.2);
    this.accumulateMorph('jawWidth', (f.jawWidth - 0.5) * 1.5);
    this.accumulateMorph('jawLine', (f.jawLine - 0.4) * 1.3);
    this.accumulateMorph('chinHeight', (f.chinHeight - 0.5) * 1.4);
    this.accumulateMorph('chinProjection', (f.chinProjection - 0.5) * 1.5);
    this.accumulateMorph('cheekbones', (f.cheekbones - 0.4) * 1.4);
    this.accumulateMorph('cheekFullness', (f.cheekFullness - 0.45) * 1.3);
    this.accumulateMorph('browRidge', (f.browRidge - 0.45) * 1.5);

    // 4. Apply Eye & Eyebrow Sliders
    this.accumulateMorph('eyeSize', (e.eyeSize - 0.5) * 1.4);
    this.accumulateMorph('eyeTilt', (e.eyeTilt - 0.5) * 1.5);
    this.accumulateMorph('eyeSpacing', (e.eyeSpacing - 0.5) * 1.4);
    this.accumulateMorph('eyeDepth', (e.eyeDepth - 0.5) * 1.3);
    this.accumulateMorph('eyelidOpen', (e.eyelidOpen - 0.5) * 1.2);
    this.accumulateMorph('eyebrowArch', (e.eyebrowArch - 0.5) * 1.5);

    // 5. Apply Nose Sliders
    this.accumulateMorph('noseLength', (n.noseLength - 0.5) * 1.4);
    this.accumulateMorph('noseProjection', (n.noseProjection - 0.5) * 1.4);
    this.accumulateMorph('bridgeWidth', (n.bridgeWidth - 0.5) * 1.4);
    this.accumulateMorph('bridgeCurve', (n.bridgeCurve - 0.5) * 1.4);
    this.accumulateMorph('nostrilWidth', (n.nostrilWidth - 0.5) * 1.4);
    this.accumulateMorph('tipTilt', (n.tipTilt - 0.5) * 1.4);

    // 6. Apply Mouth & Lip Sliders
    this.accumulateMorph('mouthWidth', (m.mouthWidth - 0.5) * 1.4);
    this.accumulateMorph('upperLipVolume', (m.upperLipVolume - 0.5) * 1.5);
    this.accumulateMorph('lowerLipVolume', (m.lowerLipVolume - 0.5) * 1.5);
    this.accumulateMorph('cupidsBow', (m.cupidsBow - 0.5) * 1.4);
    this.accumulateMorph('mouthCorners', (m.mouthCorners - 0.5) * 1.3);

    // 7. Anatomical Cranial & Occipital Correction (Fixes posterior skull protrusion on Male model)
    this.applyCranialProportionCorrection(isMale);

    // 8. Update Body, Eyes & Eyelashes BufferGeometries
    this.updateSubMeshGeometry(this.bodyMeshData);
    this.updateSubMeshGeometry(this.eyeMeshData);
    this.updateSubMeshGeometry(this.lashMeshData);
    this.lashMeshData.mesh.visible = e.eyelinerIntensity > 0.15;

    // 9. Overall Stature Scale
    this.root.scale.set(1.0, b.height, 1.0);
  }

  /**
   * Smoothly corrects the posterior cranium (occipital bone / inion / nape transition)
   * so the back of the head on the Male model does not bulge out excessively in -Z
   */
  applyCranialProportionCorrection(isMale) {
    const base = this.baseObjVerts;
    const out = this.deformedObjVerts;
    const numVerts = this.numObjVerts;

    // Smoothstep helper
    const sstep = (edge0, edge1, x) => {
      const t = Math.max(0.0, Math.min(1.0, (x - edge0) / (edge1 - edge0)));
      return t * t * (3.0 - 2.0 * t);
    };

    const strength = isMale ? 1.0 : 0.22;

    for (let i = 0; i < numVerts; i++) {
      const i3 = i * 3;
      const by = base[i3 + 1];
      const bz = base[i3 + 2];

      // Target posterior cranial vault & occipital bun (MakeHuman Y in [6.30, 8.25], Z < 0.32)
      if (by > 6.30 && by < 8.25 && bz < 0.32) {
        const bx = base[i3];
        const yMask = sstep(6.30, 6.82, by) * (1.0 - sstep(7.55, 8.20, by));
        const zMask = sstep(0.30, -0.22, bz);
        const xMask = 1.0 - sstep(0.32, 0.72, Math.abs(bx));
        const occMask = yMask * zMask * xMask * strength;

        if (occMask > 0.001) {
          // 1) Dampen any negative-Z morph displacement in the posterior skull
          const dz = out[i3 + 2] - bz;
          if (dz < 0.0) {
            out[i3 + 2] -= dz * 0.78 * occMask;
          }
          // 2) Tuck the occipital prominence forward (+Z) so the back of the head aligns naturally with the neck
          out[i3 + 2] += 0.095 * occMask;
        }
      }
    }
  }

  setWireframeVisible(visible) {
    this.quadWireGroup.visible = visible;
  }
}
