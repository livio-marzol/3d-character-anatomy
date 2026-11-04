import * as THREE from 'three/webgpu';
import {
  Fn,
  wgslFn,
  uniform,
  normalView,
  positionViewDirection,
  uv,
  vec3,
  mix,
  smoothstep,
  clamp,
  dot
} from 'three/tsl';

/**
 * Raw WGSL Shader Source Code for live inspection in the UI and WGSL node execution
 * Upgraded to PS5 / Next-Gen AAA Anatomical Realism:
 *  - Procedural 3D Micro-Skin Normal Perturbation (Pores & Anisotropic Micro-Geometry)
 *  - 3-Layer Pre-Integrated Subsurface Scattering (Epidermal, Dermal Hemoglobin, Deep Subdermal Back-Scattering)
 *  - Dual-Lobe Cook-Torrance GGX Microfacet Specular (Schlick Fresnel F0=0.028 + Primary Sebum + Secondary Epidermal Lobe)
 *  - Regional Anatomical Chromophore Mapping (Cheeks, Nose Tip, Ears, Orbital Cavities, Vermilion Lip Mucosa)
 *  - Anterior Chamber Cornea Parallax Refraction & Caustic Iris Fibers
 */
export const WGSL_SHADER_SOURCE_CODE = `// ============================================================================
// AETHER STUDIO // NEXT-GEN PS5 ANATOMICAL SKIN, CORNEA & ÉCORCHÉ WGSL SHADERS
// ============================================================================

// Helper: 2D Continuous Value Noise for Cellular Skin Micro-Pores
fn skinNoise2D(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let a = fract(sin(dot(i, vec2f(127.1, 311.7))) * 43758.5453123);
  let b = fract(sin(dot(i + vec2f(1.0, 0.0), vec2f(127.1, 311.7))) * 43758.5453123);
  let c = fract(sin(dot(i + vec2f(0.0, 1.0), vec2f(127.1, 311.7))) * 43758.5453123);
  let d = fract(sin(dot(i + vec2f(1.0, 1.0), vec2f(127.1, 311.7))) * 43758.5453123);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Helper: Cook-Torrance GGX Normal Distribution Function (Trowbridge-Reitz)
fn D_GGX_Skin(ndoth: f32, alpha: f32) -> f32 {
  let a2 = alpha * alpha;
  let d = (ndoth * ndoth) * (a2 - 1.0) + 1.0;
  return a2 / (3.14159265 * d * d + 0.0001);
}

// 1. PS5 Next-Gen Multi-Layer Dermal SSS + Dual-Lobe GGX + Micro-Pore Normal Shader
fn evaluateSkinSSS_WGSL(
  baseColor: vec3f,
  sssColor: vec3f,
  lipColor: vec3f,
  normal: vec3f,
  viewDir: vec3f,
  uvCoord: vec2f,
  blushAmount: f32,
  sssStrength: f32,
  freckleAmount: f32,
  roughnessVal: f32,
  lipGloss: f32
) -> vec3f {
  let nGeo = normalize(normal);
  let v = normalize(viewDir);

  // --- A. Procedural Micro-Skin Normal Perturbation (Pores & Micro-Scale Ridges) ---
  let uvPore = uvCoord * 520.0;
  let h0 = skinNoise2D(uvPore);
  let hx = skinNoise2D(uvPore + vec2f(0.45, 0.0)) - h0;
  let hy = skinNoise2D(uvPore + vec2f(0.0, 0.45)) - h0;
  let microFine = skinNoise2D(uvCoord * 1350.0) - 0.5;

  // Construct view-space tangent basis to perturb surface normal with pore relief
  let upRef = select(vec3f(0.0, 1.0, 0.0), vec3f(1.0, 0.0, 0.0), abs(nGeo.y) > 0.92);
  let tangent = normalize(cross(upRef, nGeo));
  let bitangent = cross(nGeo, tangent);
  let poreBumpAmp = mix(0.042, 0.095, roughnessVal);
  let nMicro = normalize(nGeo + (tangent * (hx + microFine * 0.35) + bitangent * (hy + microFine * 0.35)) * poreBumpAmp);
  // Blurred normal for deep dermal blood scattering (Dual-Normal SSS technique)
  let nDermal = normalize(mix(nGeo, nMicro, 0.25));

  // --- B. Regional Anatomical Chromophores (Hemoglobin, Orbital Vascularity, Vermilion Lips) ---
  // Lip vermilion zone in MakeHuman UV atlas: u in [0.884, 0.935], v in [0.461, 0.505]
  let lipDist = length((uvCoord - vec2f(0.9095, 0.4832)) * vec2f(38.0, 48.0));
  let lipMask = smoothstep(1.18, 0.42, lipDist) * smoothstep(0.35, 0.45, uvCoord.y);

  // Cheek & Nasal Bridge Hemoglobin Zone: u in [0.855, 0.898], v in [0.435, 0.530]
  let cheekDist = length((uvCoord - vec2f(0.876, 0.483)) * vec2f(22.0, 16.0));
  let facialVascularMask = smoothstep(1.35, 0.25, cheekDist) * (1.0 - lipMask * 0.85);

  // Periorbital (Eye Socket) Subtle Bluish-Violet Vascularity: u in [0.822, 0.860], v in [0.455, 0.512]
  let orbitDist = length((uvCoord - vec2f(0.841, 0.483)) * vec2f(34.0, 26.0));
  let orbitMask = smoothstep(1.15, 0.30, orbitDist);

  // Melanin / Freckle cluster modulation
  let freckleNoise = skinNoise2D(uvCoord * 165.0) * skinNoise2D(uvCoord * 310.0 + vec2f(17.3, 9.2));
  let freckleMask = smoothstep(0.38, 0.68, freckleNoise) * freckleAmount * 0.45 * (1.0 - lipMask);

  // Modulate Epidermal Albedo with Chromophores
  var epidermalAlbedo = baseColor;
  epidermalAlbedo = mix(epidermalAlbedo, mix(baseColor, sssColor * vec3f(1.06, 0.52, 0.52), 0.55), facialVascularMask * blushAmount * 0.62);
  epidermalAlbedo = mix(epidermalAlbedo, epidermalAlbedo * vec3f(0.82, 0.78, 0.88), orbitMask * 0.24);
  epidermalAlbedo = mix(epidermalAlbedo, epidermalAlbedo * vec3f(0.54, 0.38, 0.29), freckleMask);
  epidermalAlbedo = mix(epidermalAlbedo, lipColor, lipMask * 0.88);

  // --- C. Studio 4-Light Next-Gen Rig (Key + Sky Fill + Rim Backlight + Bounce) ---
  let keyDir  = normalize(vec3f(0.48, 0.56, 0.67));
  let fillDir = normalize(vec3f(-0.72, 0.24, 0.65));
  let rimDir  = normalize(vec3f(-0.15, 0.45, -0.88));
  let bounceDir = normalize(vec3f(0.0, -0.88, 0.46));

  let ndotlKeyGeo = dot(nDermal, keyDir);
  let ndotlKeyMicro = max(dot(nMicro, keyDir), 0.0);
  let ndotlFill = max(dot(nDermal, fillDir), 0.0);
  let ndotlBounce = max(dot(nDermal, bounceDir), 0.0);

  // --- D. 3-Layer Pre-Integrated Subsurface Scattering (Epidermis + Dermis + Subdermis) ---
  // Layer 1: Narrow Epidermal Wrap
  let wrapEpi = 0.22 * sssStrength;
  let diffEpi = clamp((ndotlKeyMicro + wrapEpi) / (1.0 + wrapEpi), 0.0, 1.0);

  // Layer 2: Mid-Dermal Hemoglobin Red-Shift at Shadow Terminator
  let wrapDerm = 0.55 * sssStrength;
  let diffDerm = clamp((ndotlKeyGeo + wrapDerm) / (1.0 + wrapDerm), 0.0, 1.0);
  let terminatorCore = smoothstep(-0.38, 0.18, ndotlKeyGeo) * smoothstep(0.68, 0.02, ndotlKeyGeo) * sssStrength;

  // Layer 3: Deep Subdermal Back-Scattering Transmission (Ears, Nostrils, Fingers, Grazing Silhouette)
  let backLightKey = max(dot(-nDermal, keyDir) + 0.35, 0.0) * pow(clamp(1.0 - max(dot(v, keyDir), 0.0), 0.0, 1.0), 1.6);
  let backLightRim = max(dot(-nDermal, rimDir) + 0.25, 0.0);
  let transmittance = (backLightKey * 0.45 + backLightRim * 0.55) * sssStrength * 0.38;

  // Combine Multi-Layer Diffuse & Subsurface Scattering
  let shadowBlood = mix(epidermalAlbedo * 0.16, sssColor * vec3f(0.45, 0.14, 0.12), 0.58 * sssStrength);
  let directLit = diffEpi * 0.68 + diffDerm * 0.32;
  let ambientFill = ndotlFill * vec3f(0.18, 0.21, 0.27) + ndotlBounce * vec3f(0.09, 0.08, 0.08) + vec3f(0.08, 0.075, 0.085);

  var skinDiffuse = mix(shadowBlood, epidermalAlbedo, clamp(directLit, 0.0, 1.0)) + epidermalAlbedo * ambientFill;
  // Inject warm hemoglobin glow across terminator and vascular zones
  let bloodScattering = sssColor * vec3f(1.18, 0.38, 0.28) * (terminatorCore * 0.52 + transmittance * 0.65);
  skinDiffuse = skinDiffuse + bloodScattering;

  // Micro-pore cavity occlusion & anatomical crease darkening
  let ndotv = clamp(dot(nMicro, v), 0.001, 1.0);
  let poreOcclusion = mix(0.89, 1.06, h0);
  let anatomicalAO = mix(0.70, 1.0, smoothstep(0.0, 0.52, dot(nGeo, v)));
  skinDiffuse = skinDiffuse * poreOcclusion * anatomicalAO;

  // --- E. Dual-Lobe Cook-Torrance GGX Microfacet Specular + Schlick Fresnel (F0 = 0.028) ---
  let surfaceRough = clamp(mix(roughnessVal, max(0.14, 0.42 - lipGloss * 0.32), lipMask), 0.12, 0.88);
  let f0 = mix(0.028, 0.044, lipMask);
  let fresnelViewing = f0 + (1.0 - f0) * pow(1.0 - ndotv, 5.0);

  // Key Light Specular (Lobe 1: Tight Sebum Moisture + Lobe 2: Broad Epidermal Sheen)
  let hKey = normalize(keyDir + v);
  let ndothKey = max(dot(nMicro, hKey), 0.0);
  let vdothKey = max(dot(v, hKey), 0.0);
  let fresnelKey = f0 + (1.0 - f0) * pow(1.0 - vdothKey, 5.0);

  let alphaPrimary = max(0.04, surfaceRough * surfaceRough * 0.55);
  let alphaSecondary = min(0.85, surfaceRough * surfaceRough * 1.85 + 0.16);
  let dPrimary = D_GGX_Skin(ndothKey, alphaPrimary);
  let dSecondary = D_GGX_Skin(ndothKey, alphaSecondary);

  // Visibility / Geometry Smith approximation
  let visKey = 1.0 / max(4.0 * (ndotv * 0.5 + 0.5) * (ndotlKeyMicro * 0.5 + 0.5), 0.15);
  let specKeyLobe = (dPrimary * 0.68 + dSecondary * 0.32) * fresnelKey * visKey * max(ndotlKeyMicro + 0.12, 0.0) * mix(1.0, 1.85, lipMask * lipGloss);

  // Fill Light Specular
  let hFill = normalize(fillDir + v);
  let ndothFill = max(dot(nMicro, hFill), 0.0);
  let specFillLobe = D_GGX_Skin(ndothFill, alphaPrimary * 1.25) * fresnelViewing * ndotlFill * 0.18;

  // Grazing Peach-Fuzz / Epidermal Rim Reflection (PS5 Horizon/MetaHuman style)
  let rimAlignment = max(dot(nGeo, rimDir), 0.0) * 0.7 + 0.3;
  let dualRim = fresnelViewing * rimAlignment * mix(0.55, 0.25, surfaceRough);
  let specColor = vec3f(1.0, 0.97, 0.94) * (specKeyLobe * 0.42) + vec3f(0.82, 0.90, 1.0) * (specFillLobe + dualRim * 0.52);

  return skinDiffuse + specColor;
}

// 2. WGSL ZBrush Écorché Clay MatCap Shader (High-Definition Sculpt Inspection)
fn evaluateZBrushClay_WGSL(normal: vec3f, viewDir: vec3f, uvCoord: vec2f) -> vec3f {
  let nGeo = normalize(normal);
  let v = normalize(viewDir);

  let keyDir  = normalize(vec3f(0.45, 0.60, 0.66));
  let fillDir = normalize(vec3f(-0.68, -0.12, 0.48));
  let rimDir  = normalize(vec3f(0.0, 0.50, -0.86));

  let diffKey  = clamp(dot(nGeo, keyDir), 0.0, 1.0);
  let diffFill = clamp(dot(nGeo, fillDir), 0.0, 1.0);
  let ndotv    = clamp(dot(nGeo, v), 0.0, 1.0);

  let cavity = smoothstep(0.0, 0.60, ndotv);
  let rim = pow(1.0 - ndotv, 3.2) * max(dot(nGeo, rimDir), 0.2);
  let halfVec = normalize(keyDir + v);
  let claySpec = pow(max(dot(nGeo, halfVec), 0.0), 34.0) * 0.26;

  let shadowClay = vec3f(0.10, 0.11, 0.13);
  let midClay    = vec3f(0.55, 0.56, 0.59);
  let highClay   = vec3f(0.86, 0.87, 0.89);

  var clay = mix(shadowClay, midClay, (diffKey * 0.84 + diffFill * 0.22) * cavity);
  clay = mix(clay, highClay, pow(diffKey, 2.1) * 0.56);
  return clay + vec3f(claySpec) + vec3f(0.28, 0.31, 0.36) * rim;
}
`;

// Native WGSL helper functions passed via wgslFn includes array
const wgslNoiseHelper = wgslFn(`
  fn skinNoise2D(p: vec2f) -> f32 {
    let i = floor(p);
    let f = fract(p);
    let u = f * f * (3.0 - 2.0 * f);
    let a = fract(sin(dot(i, vec2f(127.1, 311.7))) * 43758.5453123);
    let b = fract(sin(dot(i + vec2f(1.0, 0.0), vec2f(127.1, 311.7))) * 43758.5453123);
    let c = fract(sin(dot(i + vec2f(0.0, 1.0), vec2f(127.1, 311.7))) * 43758.5453123);
    let d = fract(sin(dot(i + vec2f(1.0, 1.0), vec2f(127.1, 311.7))) * 43758.5453123);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
`);

const wgslGGXHelper = wgslFn(`
  fn D_GGX_Skin(ndoth: f32, alpha: f32) -> f32 {
    let a2 = alpha * alpha;
    let d = (ndoth * ndoth) * (a2 - 1.0) + 1.0;
    return a2 / (3.14159265 * d * d + 0.0001);
  }
`);

// Native WGSL functions compiled through Three.js TSL wgslFn
const wgslSkinFn = wgslFn(`
  fn evaluateSkinSSS_WGSL(
    baseColor: vec3f,
    sssColor: vec3f,
    lipColor: vec3f,
    normal: vec3f,
    viewDir: vec3f,
    uvCoord: vec2f,
    blushAmount: f32,
    sssStrength: f32,
    freckleAmount: f32,
    roughnessVal: f32,
    lipGloss: f32
  ) -> vec3f {
    let nGeo = normalize(normal);
    let v = normalize(viewDir);

    let uvPore = uvCoord * 520.0;
    let h0 = skinNoise2D(uvPore);
    let hx = skinNoise2D(uvPore + vec2f(0.45, 0.0)) - h0;
    let hy = skinNoise2D(uvPore + vec2f(0.0, 0.45)) - h0;
    let microFine = skinNoise2D(uvCoord * 1350.0) - 0.5;

    let upRef = select(vec3f(0.0, 1.0, 0.0), vec3f(1.0, 0.0, 0.0), abs(nGeo.y) > 0.92);
    let tangent = normalize(cross(upRef, nGeo));
    let bitangent = cross(nGeo, tangent);
    let poreBumpAmp = mix(0.042, 0.095, roughnessVal);
    let nMicro = normalize(nGeo + (tangent * (hx + microFine * 0.35) + bitangent * (hy + microFine * 0.35)) * poreBumpAmp);
    let nDermal = normalize(mix(nGeo, nMicro, 0.25));

    let lipDist = length((uvCoord - vec2f(0.9095, 0.4832)) * vec2f(38.0, 48.0));
    let lipMask = smoothstep(1.18, 0.42, lipDist) * smoothstep(0.35, 0.45, uvCoord.y);

    let cheekDist = length((uvCoord - vec2f(0.876, 0.483)) * vec2f(22.0, 16.0));
    let facialVascularMask = smoothstep(1.35, 0.25, cheekDist) * (1.0 - lipMask * 0.85);

    let orbitDist = length((uvCoord - vec2f(0.841, 0.483)) * vec2f(34.0, 26.0));
    let orbitMask = smoothstep(1.15, 0.30, orbitDist);

    let freckleNoise = skinNoise2D(uvCoord * 165.0) * skinNoise2D(uvCoord * 310.0 + vec2f(17.3, 9.2));
    let freckleMask = smoothstep(0.38, 0.68, freckleNoise) * freckleAmount * 0.45 * (1.0 - lipMask);

    var epidermalAlbedo = baseColor;
    epidermalAlbedo = mix(epidermalAlbedo, mix(baseColor, sssColor * vec3f(1.06, 0.52, 0.52), 0.55), facialVascularMask * blushAmount * 0.62);
    epidermalAlbedo = mix(epidermalAlbedo, epidermalAlbedo * vec3f(0.82, 0.78, 0.88), orbitMask * 0.24);
    epidermalAlbedo = mix(epidermalAlbedo, epidermalAlbedo * vec3f(0.54, 0.38, 0.29), freckleMask);
    epidermalAlbedo = mix(epidermalAlbedo, lipColor, lipMask * 0.88);

    let keyDir  = normalize(vec3f(0.48, 0.56, 0.67));
    let fillDir = normalize(vec3f(-0.72, 0.24, 0.65));
    let rimDir  = normalize(vec3f(-0.15, 0.45, -0.88));
    let bounceDir = normalize(vec3f(0.0, -0.88, 0.46));

    let ndotlKeyGeo = dot(nDermal, keyDir);
    let ndotlKeyMicro = max(dot(nMicro, keyDir), 0.0);
    let ndotlFill = max(dot(nDermal, fillDir), 0.0);
    let ndotlBounce = max(dot(nDermal, bounceDir), 0.0);

    let wrapEpi = 0.22 * sssStrength;
    let diffEpi = clamp((ndotlKeyMicro + wrapEpi) / (1.0 + wrapEpi), 0.0, 1.0);

    let wrapDerm = 0.55 * sssStrength;
    let diffDerm = clamp((ndotlKeyGeo + wrapDerm) / (1.0 + wrapDerm), 0.0, 1.0);
    let terminatorCore = smoothstep(-0.38, 0.18, ndotlKeyGeo) * smoothstep(0.68, 0.02, ndotlKeyGeo) * sssStrength;

    let backLightKey = max(dot(-nDermal, keyDir) + 0.35, 0.0) * pow(clamp(1.0 - max(dot(v, keyDir), 0.0), 0.0, 1.0), 1.6);
    let backLightRim = max(dot(-nDermal, rimDir) + 0.25, 0.0);
    let transmittance = (backLightKey * 0.45 + backLightRim * 0.55) * sssStrength * 0.38;

    let shadowBlood = mix(epidermalAlbedo * 0.16, sssColor * vec3f(0.45, 0.14, 0.12), 0.58 * sssStrength);
    let directLit = diffEpi * 0.68 + diffDerm * 0.32;
    let ambientFill = ndotlFill * vec3f(0.18, 0.21, 0.27) + ndotlBounce * vec3f(0.09, 0.08, 0.08) + vec3f(0.08, 0.075, 0.085);

    var skinDiffuse = mix(shadowBlood, epidermalAlbedo, clamp(directLit, 0.0, 1.0)) + epidermalAlbedo * ambientFill;
    let bloodScattering = sssColor * vec3f(1.18, 0.38, 0.28) * (terminatorCore * 0.52 + transmittance * 0.65);
    skinDiffuse = skinDiffuse + bloodScattering;

    let ndotv = clamp(dot(nMicro, v), 0.001, 1.0);
    let poreOcclusion = mix(0.89, 1.06, h0);
    let anatomicalAO = mix(0.70, 1.0, smoothstep(0.0, 0.52, dot(nGeo, v)));
    skinDiffuse = skinDiffuse * poreOcclusion * anatomicalAO;

    let surfaceRough = clamp(mix(roughnessVal, max(0.14, 0.42 - lipGloss * 0.32), lipMask), 0.12, 0.88);
    let f0 = mix(0.028, 0.044, lipMask);
    let fresnelViewing = f0 + (1.0 - f0) * pow(1.0 - ndotv, 5.0);

    let hKey = normalize(keyDir + v);
    let ndothKey = max(dot(nMicro, hKey), 0.0);
    let vdothKey = max(dot(v, hKey), 0.0);
    let fresnelKey = f0 + (1.0 - f0) * pow(1.0 - vdothKey, 5.0);

    let alphaPrimary = max(0.04, surfaceRough * surfaceRough * 0.55);
    let alphaSecondary = min(0.85, surfaceRough * surfaceRough * 1.85 + 0.16);
    let dPrimary = D_GGX_Skin(ndothKey, alphaPrimary);
    let dSecondary = D_GGX_Skin(ndothKey, alphaSecondary);

    let visKey = 1.0 / max(4.0 * (ndotv * 0.5 + 0.5) * (ndotlKeyMicro * 0.5 + 0.5), 0.15);
    let specKeyLobe = (dPrimary * 0.68 + dSecondary * 0.32) * fresnelKey * visKey * max(ndotlKeyMicro + 0.12, 0.0) * mix(1.0, 1.85, lipMask * lipGloss);

    let hFill = normalize(fillDir + v);
    let ndothFill = max(dot(nMicro, hFill), 0.0);
    let specFillLobe = D_GGX_Skin(ndothFill, alphaPrimary * 1.25) * fresnelViewing * ndotlFill * 0.18;

    let rimAlignment = max(dot(nGeo, rimDir), 0.0) * 0.7 + 0.3;
    let dualRim = fresnelViewing * rimAlignment * mix(0.55, 0.25, surfaceRough);
    let specColor = vec3f(1.0, 0.97, 0.94) * (specKeyLobe * 0.42) + vec3f(0.82, 0.90, 1.0) * (specFillLobe + dualRim * 0.52);

    return skinDiffuse + specColor;
  }
`, [wgslNoiseHelper, wgslGGXHelper]);

const wgslClayFn = wgslFn(`
  fn evaluateZBrushClay_WGSL(normal: vec3f, viewDir: vec3f) -> vec3f {
    let n = normalize(normal);
    let v = normalize(viewDir);

    let keyDir  = normalize(vec3f(0.45, 0.60, 0.66));
    let fillDir = normalize(vec3f(-0.68, -0.12, 0.48));
    let rimDir  = normalize(vec3f(0.0, 0.50, -0.86));

    let diffKey  = clamp(dot(n, keyDir), 0.0, 1.0);
    let diffFill = clamp(dot(n, fillDir), 0.0, 1.0);
    let ndotv    = clamp(dot(n, v), 0.0, 1.0);

    let cavity = smoothstep(0.0, 0.60, ndotv);
    let rim = pow(1.0 - ndotv, 3.2) * max(dot(n, rimDir), 0.2);
    let halfVec = normalize(keyDir + v);
    let claySpec = pow(max(dot(n, halfVec), 0.0), 34.0) * 0.26;

    let shadowClay = vec3f(0.10, 0.11, 0.13);
    let midClay    = vec3f(0.55, 0.56, 0.59);
    let highClay   = vec3f(0.86, 0.87, 0.89);

    var clay = mix(shadowClay, midClay, (diffKey * 0.84 + diffFill * 0.22) * cavity);
    clay = mix(clay, highClay, pow(diffKey, 2.1) * 0.56);
    return clay + vec3f(claySpec) + vec3f(0.28, 0.31, 0.36) * rim;
  }
`);

const wgslEyeFn = wgslFn(`
  fn evaluateEyeIris_WGSL(
    uvCoord: vec2f,
    irisPrimary: vec3f,
    irisRim: vec3f,
    pupilRadius: f32,
    viewDir: vec3f,
    normal: vec3f
  ) -> vec3f {
    let n = normalize(normal);
    let v = normalize(viewDir);

    // Anterior Chamber Cornea Parallax Refraction Offset
    let refractOffset = v.xy * 0.045 * (1.0 - clamp(dot(n, v), 0.0, 1.0));
    let centered = (uvCoord - vec2f(0.5, 0.5) - refractOffset) * 2.0;
    let r = length(centered);
    let angle = atan2(centered.y, centered.x);

    // Dual Studio Catchlights (Key Softbox + Secondary Window Catchlight)
    let keyHalf = normalize(v + normalize(vec3f(0.36, 0.52, 0.72)));
    let fillHalf = normalize(v + normalize(vec3f(-0.55, 0.32, 0.68)));
    let corneaSpecKey = pow(max(dot(n, keyHalf), 0.0), 160.0) * 1.95;
    let corneaSpecFill = pow(max(dot(n, fillHalf), 0.0), 90.0) * 0.55;
    let wetFresnel = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 4.0) * 0.22;

    let irisRadius = 0.465;
    if (r > irisRadius) {
      // Realistic Sclera with Subsurface Vascularity & Tear-Film Occlusion
      let scleraLight = clamp(dot(n, normalize(vec3f(0.35, 0.55, 0.75))) * 0.45 + 0.62, 0.32, 1.0);
      let scleraEdge = smoothstep(1.0, 0.42, r);
      let veinPattern = sin(angle * 22.0 + sin(r * 18.0) * 2.2) * 0.5 + 0.5;
      let veinMask = smoothstep(0.62, 0.95, r) * smoothstep(0.82, 0.96, veinPattern) * 0.12;
      var scleraCol = mix(vec3f(0.76, 0.67, 0.69), vec3f(0.97, 0.96, 0.98), scleraEdge * scleraLight);
      scleraCol = mix(scleraCol, vec3f(0.78, 0.28, 0.30), veinMask);
      return scleraCol + vec3f(corneaSpecKey * 0.65 + corneaSpecFill * 0.45 + wetFresnel);
    }

    let nr = r / irisRadius;
    let pSize = clamp(pupilRadius * 0.52, 0.14, 0.46);

    // Multi-frequency Radial Stroma Fibers & Crypts of Fuchs
    let fiber1 = sin(angle * 46.0 + sin(nr * 14.0) * 1.6) * 0.5 + 0.5;
    let fiber2 = cos(angle * 82.0 - nr * 11.0) * 0.5 + 0.5;
    let crypts = sin(angle * 19.0 + nr * 8.0) * cos(angle * 31.0 - nr * 6.0) * 0.5 + 0.5;
    let collarette = smoothstep(pSize + 0.03, pSize + 0.15, nr) * smoothstep(0.82, 0.42, nr);

    // Opposite-side Iris Caustic Lighting (Light entering cornea illuminates opposite iris concavity)
    let causticGlow = clamp(dot(-centered, vec2f(0.45, 0.55)) * 0.75 + 0.55, 0.35, 1.45);

    var irisCol = mix(irisPrimary * 0.55, irisPrimary * 1.42, (fiber1 * 0.55 + fiber2 * 0.45) * crypts);
    irisCol = mix(irisCol, irisPrimary * 1.75 + vec3f(0.08, 0.05, 0.02), collarette * 0.62);
    irisCol = irisCol * causticGlow;

    // Deep Limbal Ring & Corneal Shadow Ring
    let limbal = smoothstep(0.66, 0.98, nr);
    irisCol = mix(irisCol, irisRim * 0.65, limbal);

    let pupilMask = smoothstep(pSize + 0.025, pSize - 0.01, nr);
    var eyeColor = mix(irisCol, vec3f(0.015, 0.015, 0.022), pupilMask);

    return eyeColor + vec3f(corneaSpecKey + corneaSpecFill + wetFresnel);
  }
`);

/**
 * Manages all WGSL / TSL NodeMaterials and live uniforms for Pure Anatomy & Facial Customization
 */
export class WGSLMaterialSuite {
  constructor(initialState, isWebGPU = true) {
    this.isWebGPU = isWebGPU;

    this.uniforms = {
      skinBaseColor: uniform(new THREE.Color(initialState.body.skinColor)),
      skinSSSColor: uniform(new THREE.Color(initialState.body.skinSubsurface)),
      skinBlush: uniform(initialState.body.skinBlush),
      skinRoughness: uniform(initialState.body.skinRoughness),
      skinSSSStrength: uniform(initialState.body.sssIntensity ?? 0.65),
      skinFreckles: uniform(initialState.body.freckles),

      lipColor: uniform(new THREE.Color(initialState.mouth.lipColor)),
      lipGloss: uniform(initialState.mouth.lipGloss),

      irisPrimary: uniform(new THREE.Color(initialState.eyes.irisColor)),
      irisRim: uniform(new THREE.Color(initialState.eyes.irisRimColor)),
      pupilSize: uniform(initialState.eyes.pupilSize),

      inspectionMode: uniform(0)
    };

    this.materials = this.buildMaterials();
  }

  buildMaterials() {
    const wrapInspectionMode = (pbrColorNode) => Fn(() => {
      const mode = this.uniforms.inspectionMode;
      const nView = normalView.normalize();
      const vDir = positionViewDirection.normalize();

      const clayColor = this.isWebGPU
        ? wgslClayFn({ normal: nView, viewDir: vDir })
        : mix(vec3(0.15), vec3(0.78), clamp(dot(nView, vec3(0.4, 0.6, 0.7)), 0.0, 1.0));

      const normalColor = nView.mul(0.5).add(0.5);

      const isClay = smoothstep(1.5, 2.1, mode).mul(smoothstep(2.9, 2.4, mode));
      const isNorm = smoothstep(2.5, 3.0, mode);

      const c1 = mix(pbrColorNode, clayColor, isClay);
      return mix(c1, normalColor, isNorm);
    })();

    // 1. Next-Gen PS5 Anatomical Skin NodeMaterial (3-Layer SSS + Dual-Lobe GGX + Micro-Pore Normal + Regional Chromophores)
    const skinMat = new THREE.MeshBasicNodeMaterial();
    const skinPBRNode = this.isWebGPU
      ? wgslSkinFn({
          baseColor: this.uniforms.skinBaseColor,
          sssColor: this.uniforms.skinSSSColor,
          lipColor: this.uniforms.lipColor,
          normal: normalView,
          viewDir: positionViewDirection,
          uvCoord: uv(),
          blushAmount: this.uniforms.skinBlush,
          sssStrength: this.uniforms.skinSSSStrength,
          freckleAmount: this.uniforms.skinFreckles,
          roughnessVal: this.uniforms.skinRoughness,
          lipGloss: this.uniforms.lipGloss
        })
      : Fn(() => {
          const ndotv = clamp(dot(normalView, positionViewDirection), 0.0, 1.0);
          return mix(this.uniforms.skinBaseColor.mul(0.35), this.uniforms.skinBaseColor, ndotv);
        })();
    skinMat.colorNode = wrapInspectionMode(skinPBRNode);

    // 2. Eye NodeMaterial (WGSL Cornea Parallax Refraction + Caustic Iris Fibers + Sclera Vascularity)
    const eyeMat = new THREE.MeshBasicNodeMaterial();
    const eyePBRNode = this.isWebGPU
      ? wgslEyeFn({
          uvCoord: uv(),
          irisPrimary: this.uniforms.irisPrimary,
          irisRim: this.uniforms.irisRim,
          pupilRadius: this.uniforms.pupilSize,
          viewDir: positionViewDirection,
          normal: normalView
        })
      : this.uniforms.irisPrimary;
    eyeMat.colorNode = wrapInspectionMode(eyePBRNode);

    // 3. Quad-Topology Wireframe Overlay Material
    const wireOverlayMat = new THREE.LineBasicMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.42,
      depthTest: true
    });

    return {
      skin: skinMat,
      eye: eyeMat,
      wireOverlay: wireOverlayMat
    };
  }

  updateFromState(state) {
    this.uniforms.skinBaseColor.value.set(state.body.skinColor);
    this.uniforms.skinSSSColor.value.set(state.body.skinSubsurface);
    this.uniforms.skinBlush.value = state.body.skinBlush;
    this.uniforms.skinRoughness.value = state.body.skinRoughness;
    this.uniforms.skinFreckles.value = state.body.freckles;
    this.uniforms.skinSSSStrength.value = state.body.sssIntensity ?? 0.65;

    this.uniforms.lipColor.value.set(state.mouth.lipColor);
    this.uniforms.lipGloss.value = state.mouth.lipGloss;

    this.uniforms.irisPrimary.value.set(state.eyes.irisColor);
    this.uniforms.irisRim.value.set(state.eyes.irisRimColor);
    this.uniforms.pupilSize.value = state.eyes.pupilSize;
  }

  setInspectionMode(modeName) {
    if (modeName === 'pbr' || modeName === 'wireframe') {
      this.uniforms.inspectionMode.value = 0;
    } else if (modeName === 'clay') {
      this.uniforms.inspectionMode.value = 2;
    } else if (modeName === 'normals') {
      this.uniforms.inspectionMode.value = 3;
    }
  }
}
