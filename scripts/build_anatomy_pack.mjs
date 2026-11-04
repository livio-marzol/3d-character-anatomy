import fs from 'fs';
import path from 'path';
import https from 'https';

const BASE_URL = 'https://raw.githubusercontent.com/makehumancommunity/makehuman/master/makehuman/data/targets';
const OUT_DIR = path.resolve('public/assets/anatomy');

// List of target files to fetch and merge into compact binary/JSON morph packs
const TARGETS_TO_FETCH = {
  // Macro base models
  male_base: 'macrodetails/caucasian-male-young.target',
  female_base: 'macrodetails/caucasian-female-young.target',
  male_muscle: 'macrodetails/universal-male-young-maxmuscle-averageweight.target',
  male_minmuscle: 'macrodetails/universal-male-young-minmuscle-averageweight.target',
  female_muscle: 'macrodetails/universal-female-young-maxmuscle-averageweight.target',
  female_minmuscle: 'macrodetails/universal-female-young-minmuscle-averageweight.target',
  male_weight: 'macrodetails/universal-male-young-averagemuscle-maxweight.target',
  female_weight: 'macrodetails/universal-female-young-averagemuscle-maxweight.target',
  female_cup: 'breast/female-young-averagemuscle-averageweight-maxcup-averagefirmness.target',
  female_mincup: 'breast/female-young-averagemuscle-averageweight-mincup-averagefirmness.target',

  // Body & Anatomy Sliders
  shoulder_incr: 'measure/measure-shoulder-dist-incr.target',
  shoulder_decr: 'measure/measure-shoulder-dist-decr.target',
  chest_incr: 'torso/torso-muscle-pectoral-incr.target',
  chest_decr: 'torso/torso-muscle-pectoral-decr.target',
  dorsi_incr: 'torso/torso-muscle-dorsi-incr.target',
  waist_incr: 'measure/measure-waist-circ-incr.target',
  waist_decr: 'measure/measure-waist-circ-decr.target',
  hips_incr: 'measure/measure-hips-circ-incr.target',
  hips_decr: 'measure/measure-hips-circ-decr.target',
  glutes_incr: 'buttocks/buttocks-volume-incr.target',
  glutes_decr: 'buttocks/buttocks-volume-decr.target',
  stomach_tone: 'stomach/stomach-tone-incr.target',
  upperarm_incr: 'measure/measure-upperarm-circ-incr.target',
  thigh_incr: 'measure/measure-thigh-circ-incr.target',
  calf_incr: 'measure/measure-calf-circ-incr.target',

  // Face / Head
  head_oval: 'head/head-oval.target',
  head_rect: 'head/head-rectangular.target',
  jaw_width_incr: 'chin/chin-width-incr.target',
  jaw_width_decr: 'chin/chin-width-decr.target',
  jaw_bones_incr: 'chin/chin-bones-incr.target',
  chin_height_incr: 'chin/chin-height-incr.target',
  chin_height_decr: 'chin/chin-height-decr.target',
  chin_prom_incr: 'chin/chin-prominent-incr.target',
  chin_prom_decr: 'chin/chin-prominent-decr.target',
  chin_cleft: 'chin/chin-cleft-incr.target',
  l_cheek_bones: 'cheek/l-cheek-bones-incr.target',
  r_cheek_bones: 'cheek/r-cheek-bones-incr.target',
  l_cheek_vol: 'cheek/l-cheek-volume-incr.target',
  r_cheek_vol: 'cheek/r-cheek-volume-incr.target',
  brow_ridge_incr: 'forehead/forehead-nubian-incr.target',
  brow_ridge_decr: 'forehead/forehead-nubian-decr.target',

  // Eyes & Eyebrows
  l_eye_scale_incr: 'eyes/l-eye-scale-incr.target',
  r_eye_scale_incr: 'eyes/r-eye-scale-incr.target',
  l_eye_scale_decr: 'eyes/l-eye-scale-decr.target',
  r_eye_scale_decr: 'eyes/r-eye-scale-decr.target',
  l_eye_corner_up: 'eyes/l-eye-corner2-up.target',
  r_eye_corner_up: 'eyes/r-eye-corner2-up.target',
  l_eye_corner_down: 'eyes/l-eye-corner2-down.target',
  r_eye_corner_down: 'eyes/r-eye-corner2-down.target',
  l_eye_out: 'eyes/l-eye-trans-out.target',
  r_eye_out: 'eyes/r-eye-trans-out.target',
  l_eye_in: 'eyes/l-eye-trans-in.target',
  r_eye_in: 'eyes/r-eye-trans-in.target',
  l_eye_depth_in: 'eyes/l-eye-push1-in.target',
  r_eye_depth_in: 'eyes/r-eye-push1-in.target',
  l_eye_open: 'eyes/l-eye-height2-incr.target',
  r_eye_open: 'eyes/r-eye-height2-incr.target',
  eyebrows_up: 'eyebrows/eyebrows-angle-up.target',
  eyebrows_down: 'eyebrows/eyebrows-angle-down.target',

  // Nose
  nose_len_incr: 'nose/nose-scale-vert-incr.target',
  nose_len_decr: 'nose/nose-scale-vert-decr.target',
  nose_proj_incr: 'nose/nose-scale-depth-incr.target',
  nose_proj_decr: 'nose/nose-scale-depth-decr.target',
  nose_bridge_incr: 'nose/nose-width1-incr.target',
  nose_bridge_decr: 'nose/nose-width1-decr.target',
  nose_hump_incr: 'nose/nose-hump-incr.target',
  nose_hump_decr: 'nose/nose-hump-decr.target',
  nose_nostril_incr: 'nose/nose-nostrils-width-incr.target',
  nose_nostril_decr: 'nose/nose-nostrils-width-decr.target',
  nose_tip_up: 'nose/nose-point-up.target',
  nose_tip_down: 'nose/nose-point-down.target',

  // Mouth
  mouth_width_incr: 'mouth/mouth-scale-horiz-incr.target',
  mouth_width_decr: 'mouth/mouth-scale-horiz-decr.target',
  upperlip_vol_incr: 'mouth/mouth-upperlip-volume-incr.target',
  upperlip_vol_decr: 'mouth/mouth-upperlip-volume-decr.target',
  lowerlip_vol_incr: 'mouth/mouth-lowerlip-volume-incr.target',
  lowerlip_vol_decr: 'mouth/mouth-lowerlip-volume-decr.target',
  cupidsbow_incr: 'mouth/mouth-cupidsbow-incr.target',
  cupidsbow_decr: 'mouth/mouth-cupidsbow-decr.target',
  mouth_smile: 'mouth/mouth-angles-up.target',
  mouth_frown: 'mouth/mouth-angles-down.target'
};

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  console.log('1. Parsing base.obj to extract only body, eyes, eyebrows, eyelashes & helper-tights...');
  const objText = fs.readFileSync(path.join(OUT_DIR, 'base.obj'), 'utf8');
  const lines = objText.split(/\r?\n/);

  const vertices = []; // [x, y, z]
  const uvs = [];      // [u, v]
  const groups = {};
  let currentGroup = 'default';

  const ALLOWED_GROUPS = new Set([
    'body',
    'helper-l-eye',
    'helper-r-eye',
    'helper-tights',
    'helper-hair',
    'helper-upper-teeth',
    'helper-lower-teeth',
    'helper-l-eyelashes-1',
    'helper-l-eyelashes-2',
    'helper-r-eyelashes-1',
    'helper-r-eyelashes-2'
  ]);

  let maxBodyVertIdx = 0;

  for (const line of lines) {
    if (line.startsWith('v ')) {
      const parts = line.trim().split(/\s+/);
      vertices.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
    } else if (line.startsWith('vt ')) {
      const parts = line.trim().split(/\s+/);
      uvs.push([parseFloat(parts[1]), parseFloat(parts[2])]);
    } else if (line.startsWith('g ')) {
      currentGroup = line.slice(2).trim();
    } else if (line.startsWith('f ')) {
      if (!ALLOWED_GROUPS.has(currentGroup)) continue;
      if (!groups[currentGroup]) groups[currentGroup] = [];
      const parts = line.trim().split(/\s+/).slice(1);
      const quad = parts.map(p => {
        const [vIdx, vtIdx] = p.split('/').map(n => parseInt(n, 10) - 1);
        if (currentGroup === 'body' && vIdx > maxBodyVertIdx) maxBodyVertIdx = vIdx;
        return [vIdx, vtIdx];
      });
      groups[currentGroup].push(quad);
    }
  }

  console.log(`Total OBJ vertices: ${vertices.length}, Max body vertex index: ${maxBodyVertIdx}`);
  for (const [g, faces] of Object.entries(groups)) {
    console.log(`Group "${g}": ${faces.length} quad faces`);
  }

  // Save a clean, stripped OBJ containing only the anatomical body + eyes + tights
  let cleanObj = '# Clean CC0 Anatomical Base Mesh (Body + Eyes + Tights)\n';
  for (const [x, y, z] of vertices) {
    cleanObj += `v ${x.toFixed(4)} ${y.toFixed(4)} ${z.toFixed(4)}\n`;
  }
  for (const [u, v] of uvs) {
    cleanObj += `vt ${u.toFixed(4)} ${v.toFixed(4)}\n`;
  }
  for (const [g, faces] of Object.entries(groups)) {
    cleanObj += `g ${g}\n`;
    for (const quad of faces) {
      cleanObj += 'f ' + quad.map(([vi, ti]) => `${vi + 1}/${ti + 1}`).join(' ') + '\n';
    }
  }
  fs.writeFileSync(path.join(OUT_DIR, 'human_clean.obj'), cleanObj, 'utf8');
  console.log('Saved human_clean.obj');

  // Download all morph targets in parallel batches
  console.log('2. Fetching morph targets from MakeHuman CC0 repository...');
  const rawTargets = {};
  const entries = Object.entries(TARGETS_TO_FETCH);

  for (let i = 0; i < entries.length; i += 8) {
    const batch = entries.slice(i, i + 8);
    await Promise.all(batch.map(async ([key, relPath]) => {
      const url = `${BASE_URL}/${relPath}`;
      const text = await fetchText(url);
      const map = new Map();
      for (const l of text.split(/\r?\n/)) {
        if (!l || l.startsWith('#')) continue;
        const p = l.trim().split(/\s+/);
        if (p.length >= 4) {
          const idx = parseInt(p[0], 10);
          if (idx < vertices.length) {
            map.set(idx, [parseFloat(p[1]), parseFloat(p[2]), parseFloat(p[3])]);
          }
        }
      }
      rawTargets[key] = map;
      process.stdout.write('.');
    }));
  }
  console.log('\nAll targets downloaded!');

  // Helper to combine two bidirectional or symmetric targets into a single bipolar delta map
  const combineMaps = (list) => {
    const out = new Map();
    for (const [map, weight] of list) {
      if (!map) continue;
      for (const [idx, [dx, dy, dz]] of map.entries()) {
        const prev = out.get(idx) || [0, 0, 0];
        out.set(idx, [prev[0] + dx * weight, prev[1] + dy * weight, prev[2] + dz * weight]);
      }
    }
    // Convert to flat array [idx, dx, dy, dz, ...] quantized to 4 decimals
    const arr = [];
    for (const [idx, [dx, dy, dz]] of out.entries()) {
      if (Math.abs(dx) > 0.0002 || Math.abs(dy) > 0.0002 || Math.abs(dz) > 0.0002) {
        arr.push(idx, +dx.toFixed(4), +dy.toFixed(4), +dz.toFixed(4));
      }
    }
    return arr;
  };

  const packedMorphs = {
    // Separate Base Gender Phenotypes
    male_base: combineMaps([[rawTargets.male_base, 1.0]]),
    female_base: combineMaps([[rawTargets.female_base, 1.0]]),

    // Gender-specific Ecorche Muscle & Body Mass
    male_muscle: combineMaps([[rawTargets.male_muscle, 1.0], [rawTargets.dorsi_incr, 0.35], [rawTargets.stomach_tone, 0.45]]),
    female_muscle: combineMaps([[rawTargets.female_muscle, 1.0], [rawTargets.stomach_tone, 0.40]]),
    male_weight: combineMaps([[rawTargets.male_weight, 1.0]]),
    female_weight: combineMaps([[rawTargets.female_weight, 1.0]]),
    female_cup: combineMaps([[rawTargets.female_cup, 1.0]]),

    // Bidirectional Body Proportions
    shoulderWidth: combineMaps([[rawTargets.shoulder_incr, 1.0], [rawTargets.shoulder_decr, -1.0]]),
    chestVolume: combineMaps([[rawTargets.chest_incr, 1.0], [rawTargets.chest_decr, -0.6]]),
    waistWidth: combineMaps([[rawTargets.waist_incr, 1.0], [rawTargets.waist_decr, -1.0]]),
    hipWidth: combineMaps([[rawTargets.hips_incr, 1.0], [rawTargets.hips_decr, -1.0]]),
    gluteVolume: combineMaps([[rawTargets.glutes_incr, 1.0], [rawTargets.glutes_decr, -1.0]]),
    limbThickness: combineMaps([[rawTargets.upperarm_incr, 1.0], [rawTargets.thigh_incr, 1.0], [rawTargets.calf_incr, 1.0]]),

    // Face & Cranium
    headShape: combineMaps([[rawTargets.head_rect, 1.0], [rawTargets.head_oval, -1.0]]),
    jawWidth: combineMaps([[rawTargets.jaw_width_incr, 1.0], [rawTargets.jaw_width_decr, -1.0]]),
    jawLine: combineMaps([[rawTargets.jaw_bones_incr, 1.0], [rawTargets.chin_cleft, 0.35]]),
    chinHeight: combineMaps([[rawTargets.chin_height_incr, 1.0], [rawTargets.chin_height_decr, -1.0]]),
    chinProjection: combineMaps([[rawTargets.chin_prom_incr, 1.0], [rawTargets.chin_prom_decr, -1.0]]),
    cheekbones: combineMaps([[rawTargets.l_cheek_bones, 1.0], [rawTargets.r_cheek_bones, 1.0]]),
    cheekFullness: combineMaps([[rawTargets.l_cheek_vol, 1.0], [rawTargets.r_cheek_vol, 1.0]]),
    browRidge: combineMaps([[rawTargets.brow_ridge_incr, 1.0], [rawTargets.brow_ridge_decr, -1.0]]),

    // Eyes & Eyebrows
    eyeSize: combineMaps([[rawTargets.l_eye_scale_incr, 1.0], [rawTargets.r_eye_scale_incr, 1.0], [rawTargets.l_eye_scale_decr, -1.0], [rawTargets.r_eye_scale_decr, -1.0]]),
    eyeTilt: combineMaps([[rawTargets.l_eye_corner_up, 1.0], [rawTargets.r_eye_corner_up, 1.0], [rawTargets.l_eye_corner_down, -1.0], [rawTargets.r_eye_corner_down, -1.0]]),
    eyeSpacing: combineMaps([[rawTargets.l_eye_out, 1.0], [rawTargets.r_eye_out, 1.0], [rawTargets.l_eye_in, -1.0], [rawTargets.r_eye_in, -1.0]]),
    eyeDepth: combineMaps([[rawTargets.l_eye_depth_in, 1.0], [rawTargets.r_eye_depth_in, 1.0]]),
    eyelidOpen: combineMaps([[rawTargets.l_eye_open, 1.0], [rawTargets.r_eye_open, 1.0]]),
    eyebrowArch: combineMaps([[rawTargets.eyebrows_up, 1.0], [rawTargets.eyebrows_down, -1.0]]),

    // Nose
    noseLength: combineMaps([[rawTargets.nose_len_incr, 1.0], [rawTargets.nose_len_decr, -1.0]]),
    noseProjection: combineMaps([[rawTargets.nose_proj_incr, 1.0], [rawTargets.nose_proj_decr, -1.0]]),
    bridgeWidth: combineMaps([[rawTargets.nose_bridge_incr, 1.0], [rawTargets.nose_bridge_decr, -1.0]]),
    bridgeCurve: combineMaps([[rawTargets.nose_hump_incr, 1.0], [rawTargets.nose_hump_decr, -1.0]]),
    nostrilWidth: combineMaps([[rawTargets.nose_nostril_incr, 1.0], [rawTargets.nose_nostril_decr, -1.0]]),
    tipTilt: combineMaps([[rawTargets.nose_tip_up, 1.0], [rawTargets.nose_tip_down, -1.0]]),

    // Mouth & Lips
    mouthWidth: combineMaps([[rawTargets.mouth_width_incr, 1.0], [rawTargets.mouth_width_decr, -1.0]]),
    upperLipVolume: combineMaps([[rawTargets.upperlip_vol_incr, 1.0], [rawTargets.upperlip_vol_decr, -1.0]]),
    lowerLipVolume: combineMaps([[rawTargets.lowerlip_vol_incr, 1.0], [rawTargets.lowerlip_vol_decr, -1.0]]),
    cupidsBow: combineMaps([[rawTargets.cupidsbow_incr, 1.0], [rawTargets.cupidsbow_decr, -1.0]]),
    mouthCorners: combineMaps([[rawTargets.mouth_smile, 1.0], [rawTargets.mouth_frown, -1.0]])
  };

  const jsonPath = path.join(OUT_DIR, 'morph_deltas.json');
  fs.writeFileSync(jsonPath, JSON.stringify(packedMorphs));
  console.log(`Saved packed morphs to ${jsonPath} (${(fs.statSync(jsonPath).size / 1024).toFixed(1)} KB)`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
