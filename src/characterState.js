// Default Character State & Clean Male/Female Anatomical Base Models
export const DEFAULT_CHARACTER_STATE = {
  // 1. Body (Corpo) - Clean Male & Female Anatomical Base Models
  body: {
    gender: 'female',       // 'female' (♀ Feminino) | 'male' (♂ Masculino)
    height: 1.0,            // 0.90 to 1.10
    muscleTone: 0.48,       // 0.0 to 1.0 (Definição Muscular)
    bodyMass: 0.48,         // 0.0 (Esguio) to 1.0 (Forte)
    chestVolume: 0.50,      // 0.0 to 1.0 (Peitoral / Busto)
    skinColor: '#eab89e',
    skinSubsurface: '#e25241',
    skinBlush: 0.38,
    skinRoughness: 0.36,
    freckles: 0.10,
    sssIntensity: 0.65
  },

  // 2. Face / Head (Rosto)
  face: {
    headScale: 0.50,
    jawWidth: 0.42,
    jawLine: 0.52,
    chinHeight: 0.45,
    chinProjection: 0.50,
    cheekbones: 0.58,
    cheekFullness: 0.42,
    browRidge: 0.35
  },

  // 3. Eyes (Olhos & Sobrancelhas)
  eyes: {
    eyeSize: 0.54,
    eyeSpacing: 0.50,
    eyeTilt: 0.54,
    eyeDepth: 0.48,
    eyelidOpen: 0.54,
    irisColor: '#991b1b',
    irisRimColor: '#2a0808',
    pupilSize: 0.38,
    eyebrowArch: 0.52,
    eyebrowThickness: 0.48,
    eyelinerIntensity: 0.60
  },

  // 4. Nose (Nariz)
  nose: {
    noseLength: 0.48,
    noseProjection: 0.50,
    bridgeWidth: 0.42,
    bridgeCurve: 0.46,
    nostrilWidth: 0.44,
    tipTilt: 0.54
  },

  // 5. Mouth (Boca)
  mouth: {
    mouthWidth: 0.48,
    upperLipVolume: 0.54,
    lowerLipVolume: 0.58,
    cupidsBow: 0.55,
    mouthCorners: 0.52,
    lipColor: '#c96f73',
    lipGloss: 0.58
  }
};

export const ARCHETYPE_PRESETS = {
  // 1. Modelo Feminino Padrão
  female: {
    body: {
      gender: 'female', height: 1.0, muscleTone: 0.45, bodyMass: 0.46, chestVolume: 0.55,
      skinColor: '#eab89e', skinSubsurface: '#e25241', skinBlush: 0.42, skinRoughness: 0.35, freckles: 0.10, sssIntensity: 0.65
    },
    face: {
      headScale: 0.50, jawWidth: 0.38, jawLine: 0.52, chinHeight: 0.42,
      chinProjection: 0.48, cheekbones: 0.62, cheekFullness: 0.40, browRidge: 0.30
    },
    eyes: {
      eyeSize: 0.56, eyeSpacing: 0.50, eyeTilt: 0.56, eyeDepth: 0.46, eyelidOpen: 0.55,
      irisColor: '#991b1b', irisRimColor: '#1f0606', pupilSize: 0.36, eyebrowArch: 0.55, eyebrowThickness: 0.45, eyelinerIntensity: 0.65
    },
    nose: {
      noseLength: 0.46, noseProjection: 0.50, bridgeWidth: 0.38, bridgeCurve: 0.44, nostrilWidth: 0.40, tipTilt: 0.56
    },
    mouth: {
      mouthWidth: 0.46, upperLipVolume: 0.56, lowerLipVolume: 0.62, cupidsBow: 0.60, mouthCorners: 0.52, lipColor: '#cc7478', lipGloss: 0.62
    }
  },

  // 2. Modelo Masculino Padrão
  male: {
    body: {
      gender: 'male', height: 1.02, muscleTone: 0.80, bodyMass: 0.55, chestVolume: 0.65,
      skinColor: '#d9a487', skinSubsurface: '#c44229', skinBlush: 0.20, skinRoughness: 0.42, freckles: 0.05, sssIntensity: 0.58
    },
    face: {
      headScale: 0.50, jawWidth: 0.68, jawLine: 0.76, chinHeight: 0.56,
      chinProjection: 0.60, cheekbones: 0.65, cheekFullness: 0.35, browRidge: 0.72
    },
    eyes: {
      eyeSize: 0.48, eyeSpacing: 0.50, eyeTilt: 0.50, eyeDepth: 0.62, eyelidOpen: 0.50,
      irisColor: '#573b26', irisRimColor: '#1c1917', pupilSize: 0.38, eyebrowArch: 0.40, eyebrowThickness: 0.68, eyelinerIntensity: 0.15
    },
    nose: {
      noseLength: 0.54, noseProjection: 0.56, bridgeWidth: 0.54, bridgeCurve: 0.54, nostrilWidth: 0.54, tipTilt: 0.48
    },
    mouth: {
      mouthWidth: 0.54, upperLipVolume: 0.46, lowerLipVolume: 0.50, cupidsBow: 0.44, mouthCorners: 0.48, lipColor: '#9c5b56', lipGloss: 0.25
    }
  }
};

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}
