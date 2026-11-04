# Aether Character Studio // WebGPU & WGSL 3D Anatomical Customizer

Estúdio interativo de customização anatômica 3D (Corpo e Rosto) desenvolvido com **Three.js (`WebGPURenderer`)** e shaders nativos em **WGSL (`three/tsl` `wgslFn`)**.

## Principais Recursos

- **Modelos Anatômicos Masculino (`♂`) e Feminino (`♀`) Separados:** Malha base com topologia limpa de `13.378` Quads (`26.756` Tris) e 32 *morph targets* anatômicos reais avaliados em tempo real.
- **Pipeline de Shaders WGSL Nível Next-Gen / PS5 ([`src/wgslShaders.js`](./src/wgslShaders.js)):**
  - **Subsurface Scattering (SSS) de 3 Camadas:** Dispersão epidérmica, avermelhamento dérmico por hemoglobina no *shadow terminator* e translucidez subdérmica traseira (*back-scattering*).
  - **Perturbação Procedural de Micro-Poros em 3D:** Relevo celular em espaço tangente (`skinNoise2D`) com técnica *Dual-Normal SSS*.
  - **Especular Duplo Lóbulo Cook-Torrance GGX (`D_GGX_Skin`):** Fresnel Schlick físico (`F0 = 0.028`) combinando oleosidade sebácea primária e brilho epidérmico secundário.
  - **Cromóforos Regionais & Mucosa Labial:** Vascularização facial, sombreamento periorbital e pigmentação/brilho úmido labial dinâmico.
  - **Shader Ocular com Paralaxe de Córnea:** Refração da câmara anterior da córnea, fibras radiais da íris com iluminação cáustica, anel limbal e esclera vascularizada.
- **Modos de Inspeção de Estúdio:** `PBR + WGSL`, `Quad Wire` (subdivision cage), `Clay Sculpt` (MatCap estilo ZBrush Écorché) e `Normal View`.
- **Exportação de DNA (`.json`):** Salve os parâmetros completos do personagem.

## Como Executar Localmente

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o servidor de desenvolvimento Vite:
   ```bash
   npm run dev
   ```
3. Abra `http://localhost:5173` em um navegador compatível com WebGPU (Chrome, Edge ou Brave).
