import { WGSL_SHADER_SOURCE_CODE } from './wgslShaders.js';

export const CATEGORY_DEFINITIONS = {
  body: {
    tag: 'ANATOMIA HUMANA & PELE WGSL',
    title: 'Corpo & Pele',
    cameraPreset: 'full',
    sections: [
      {
        title: 'Modelo Base Anatômico',
        controls: [
          {
            type: 'options',
            key: 'gender',
            label: 'Modelo Anatômico Base',
            options: [
              { value: 'female', label: '♀ Modelo Feminino' },
              { value: 'male', label: '♂ Modelo Masculino' }
            ]
          },
          { type: 'slider', key: 'height', label: 'Estatura Corporal', min: 0.90, max: 1.10, step: 0.01 },
          { type: 'slider', key: 'muscleTone', label: 'Definição Muscular', min: 0, max: 1, step: 0.01 },
          { type: 'slider', key: 'bodyMass', label: 'Porte Físico', min: 0, max: 1, step: 0.01 }
        ]
      },
      {
        title: 'Pele & Subsurface Scattering (WGSL)',
        controls: [
          {
            type: 'color',
            key: 'skinColor',
            label: 'Tom Base da Pele',
            swatches: ['#f9dcd0', '#f1c6b0', '#eab89e', '#d19979', '#a66e4e', '#6f422b', '#b8bdc4']
          },
          {
            type: 'color',
            key: 'skinSubsurface',
            label: 'Dispersão Subsuperficial (SSS)',
            swatches: ['#e85d56', '#e25241', '#c44229', '#992b1e', '#64748b']
          },
          { type: 'slider', key: 'sssIntensity', label: 'Intensidade Global SSS (WGSL)', min: 0, max: 1, step: 0.01 },
          { type: 'slider', key: 'skinBlush', label: 'Rubor Facial Vascular (Blush)', min: 0, max: 1, step: 0.01 },
          { type: 'slider', key: 'freckles', label: 'Micro-Poros & Sardas (WGSL)', min: 0, max: 1, step: 0.01 },
          { type: 'slider', key: 'skinRoughness', label: 'Suavidade / Brilho Dérmico', min: 0.15, max: 0.75, step: 0.01 }
        ]
      }
    ]
  },

  face: {
    tag: 'TOPOLOGIA CRANIANA',
    title: 'Rosto & Mandíbula',
    cameraPreset: 'head',
    sections: [
      {
        title: 'Estrutura Óssea Facial',
        controls: [
          { type: 'slider', key: 'headScale', label: 'Proporção Craniana', min: 0, max: 1, step: 0.01 },
          { type: 'slider', key: 'jawWidth', label: 'Largura da Mandíbula', min: 0, max: 1, step: 0.01 },
          { type: 'slider', key: 'jawLine', label: 'Definição do Maxilar', min: 0, max: 1, step: 0.01 },
          { type: 'slider', key: 'chinHeight', label: 'Altura do Queixo', min: 0, max: 1, step: 0.01 },
          { type: 'slider', key: 'chinProjection', label: 'Projeção do Queixo', min: 0, max: 1, step: 0.01 }
        ]
      },
      {
        title: 'Maçãs do Rosto & Fronte',
        controls: [
          { type: 'slider', key: 'cheekbones', label: 'Proeminência Zigomática (Maçãs)', min: 0, max: 1, step: 0.01 },
          { type: 'slider', key: 'cheekFullness', label: 'Volume das Bochechas', min: 0, max: 1, step: 0.01 },
          { type: 'slider', key: 'browRidge', label: 'Arco Superciliar (Fronte)', min: 0, max: 1, step: 0.01 }
        ]
      }
    ]
  },

  eyes: {
    tag: 'WGSL PROCEDURAL IRIS',
    title: 'Olhos & Olhar',
    cameraPreset: 'head',
    sections: [
      {
        title: 'Geometria Orbital & Pálpebras',
        controls: [
          { type: 'slider', key: 'eyeSize', label: 'Tamanho dos Olhos', min: 0, max: 1, step: 0.01 },
          { type: 'slider', key: 'eyeTilt', label: 'Inclinação Cantal (Tilt)', min: 0, max: 1, step: 0.01 },
          { type: 'slider', key: 'eyeSpacing', label: 'Distância Interocular', min: 0, max: 1, step: 0.01 },
          { type: 'slider', key: 'eyeDepth', label: 'Profundidade da Órbita', min: 0, max: 1, step: 0.01 },
          { type: 'slider', key: 'eyelidOpen', label: 'Abertura das Pálpebras', min: 0, max: 1, step: 0.01 },
          { type: 'slider', key: 'eyelinerIntensity', label: 'Cílios Superiores', min: 0, max: 1, step: 0.01 }
        ]
      },
      {
        title: 'Fibras da Íris & Pupila (WGSL)',
        controls: [
          {
            type: 'color',
            key: 'irisColor',
            label: 'Cor das Fibras da Íris',
            swatches: ['#dc2626', '#991b1b', '#d97706', '#10b981', '#38bdf8', '#6366f1', '#573b26']
          },
          {
            type: 'color',
            key: 'irisRimColor',
            label: 'Anel Limbal Externo',
            swatches: ['#2d0606', '#1f0606', '#0c4a6e', '#111827', '#1c1917']
          },
          { type: 'slider', key: 'pupilSize', label: 'Dilatação da Pupila', min: 0.18, max: 0.72, step: 0.01 }
        ]
      },
      {
        title: 'Sobrancelhas',
        controls: [
          { type: 'slider', key: 'eyebrowArch', label: 'Arqueamento das Sobrancelhas', min: 0, max: 1, step: 0.01 }
        ]
      }
    ]
  },

  nose: {
    tag: 'ESCULTURA NASAL',
    title: 'Nariz & Perfil',
    cameraPreset: 'head',
    sections: [
      {
        title: 'Ponte, Dorso & Ponta Nasal',
        controls: [
          { type: 'slider', key: 'noseLength', label: 'Comprimento Vertical', min: 0, max: 1, step: 0.01 },
          { type: 'slider', key: 'noseProjection', label: 'Projeção Frontal', min: 0, max: 1, step: 0.01 },
          { type: 'slider', key: 'bridgeWidth', label: 'Largura da Ponte Nasal', min: 0, max: 1, step: 0.01 },
          { type: 'slider', key: 'bridgeCurve', label: 'Curvatura do Dorso (Perfil)', min: 0, max: 1, step: 0.01 },
          { type: 'slider', key: 'nostrilWidth', label: 'Abertura das Narinas (Asas)', min: 0, max: 1, step: 0.01 },
          { type: 'slider', key: 'tipTilt', label: 'Inclinação da Ponta Nasal', min: 0, max: 1, step: 0.01 }
        ]
      }
    ]
  },

  mouth: {
    tag: 'MORFOLOGIA LABIAL',
    title: 'Boca & Expressão',
    cameraPreset: 'head',
    sections: [
      {
        title: 'Contorno & Volume dos Lábios',
        controls: [
          { type: 'slider', key: 'mouthWidth', label: 'Largura da Boca', min: 0, max: 1, step: 0.01 },
          { type: 'slider', key: 'upperLipVolume', label: 'Volume do Lábio Superior', min: 0, max: 1, step: 0.01 },
          { type: 'slider', key: 'lowerLipVolume', label: 'Volume do Lábio Inferior', min: 0, max: 1, step: 0.01 },
          { type: 'slider', key: 'cupidsBow', label: 'Definição do Arco do Cupido', min: 0, max: 1, step: 0.01 },
          { type: 'slider', key: 'mouthCorners', label: 'Expressão dos Cantos', min: 0, max: 1, step: 0.01 }
        ]
      }
    ]
  }
};

export class UIController {
  constructor(state, callbacks) {
    this.state = state;
    this.callbacks = callbacks;
    this.activeCategory = 'body';

    this.container = document.getElementById('controls-container');
    this.catTagEl = document.getElementById('active-cat-tag');
    this.catTitleEl = document.getElementById('active-cat-title');

    this.initNavigation();
    this.initHeaderActions();
    this.initWGSLCodeInspector();
    this.renderCategory('body', false);
  }

  initNavigation() {
    const tabs = document.querySelectorAll('.cat-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const cat = tab.dataset.category;
        this.renderCategory(cat, true);
      });
    });

    const camBtns = document.querySelectorAll('.cam-btn');
    camBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        camBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.callbacks.onCameraFocus(btn.dataset.cam);
      });
    });

    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.callbacks.onInspectionMode(btn.dataset.mode);
      });
    });

    const presetPills = document.querySelectorAll('.preset-pill');
    presetPills.forEach(pill => {
      pill.addEventListener('click', () => {
        presetPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.callbacks.onSelectArchetype(pill.dataset.preset);
      });
    });
  }

  initHeaderActions() {
    document.getElementById('btn-randomize').addEventListener('click', () => {
      this.callbacks.onRandomize();
      this.renderCategory(this.activeCategory, false);
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
      this.callbacks.onResetAll();
      this.renderCategory(this.activeCategory, false);
    });

    document.getElementById('btn-reset-category').addEventListener('click', () => {
      this.callbacks.onResetCategory(this.activeCategory);
      this.renderCategory(this.activeCategory, false);
    });

    const modal = document.getElementById('dna-modal');
    const textarea = document.getElementById('dna-textarea');
    document.getElementById('btn-export').addEventListener('click', () => {
      textarea.value = JSON.stringify(this.state, null, 2);
      modal.classList.remove('hidden');
    });

    document.getElementById('close-modal').addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    document.getElementById('copy-dna-btn').addEventListener('click', (e) => {
      navigator.clipboard.writeText(textarea.value);
      e.target.textContent = 'Copiado!';
      setTimeout(() => { e.target.textContent = 'Copiar JSON'; }, 1500);
    });
  }

  initWGSLCodeInspector() {
    const codeBox = document.getElementById('wgsl-code-preview');
    codeBox.textContent = WGSL_SHADER_SOURCE_CODE.trim();
    document.getElementById('toggle-wgsl-code').addEventListener('click', () => {
      codeBox.classList.toggle('hidden');
    });
  }

  renderCategory(categoryKey, autoFocusCamera = true) {
    this.activeCategory = categoryKey;
    const def = CATEGORY_DEFINITIONS[categoryKey];
    if (!def) return;

    this.catTagEl.textContent = def.tag;
    this.catTitleEl.textContent = def.title;

    if (autoFocusCamera && def.cameraPreset) {
      this.callbacks.onCameraFocus(def.cameraPreset);
      document.querySelectorAll('.cam-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.cam === def.cameraPreset);
      });
    }

    this.container.innerHTML = '';
    const catState = this.state[categoryKey];

    def.sections.forEach(section => {
      const secEl = document.createElement('div');
      secEl.className = 'control-section';

      const titleEl = document.createElement('div');
      titleEl.className = 'section-title';
      titleEl.textContent = section.title;
      secEl.appendChild(titleEl);

      section.controls.forEach(ctrl => {
        if (ctrl.type === 'slider') {
          const row = document.createElement('div');
          row.className = 'slider-row';

          const currentVal = catState[ctrl.key];
          const pct = Math.round(((currentVal - ctrl.min) / (ctrl.max - ctrl.min)) * 100);

          row.innerHTML = `
            <div class="slider-header">
              <span class="slider-label">${ctrl.label}</span>
              <span class="slider-val">${pct}%</span>
            </div>
            <input type="range" min="${ctrl.min}" max="${ctrl.max}" step="${ctrl.step}" value="${currentVal}" />
          `;

          const input = row.querySelector('input');
          const valSpan = row.querySelector('.slider-val');
          input.addEventListener('input', (e) => {
            const num = parseFloat(e.target.value);
            catState[ctrl.key] = num;
            const newPct = Math.round(((num - ctrl.min) / (ctrl.max - ctrl.min)) * 100);
            valSpan.textContent = `${newPct}%`;
            this.callbacks.onChange(categoryKey, ctrl.key, num);
          });

          secEl.appendChild(row);
        } else if (ctrl.type === 'color') {
          const row = document.createElement('div');
          row.className = 'slider-row';

          const currentVal = catState[ctrl.key];
          const header = document.createElement('div');
          header.className = 'slider-header';
          header.innerHTML = `<span class="slider-label">${ctrl.label}</span>`;
          row.appendChild(header);

          const colorRow = document.createElement('div');
          colorRow.className = 'color-row';

          const swatchGroup = document.createElement('div');
          swatchGroup.className = 'swatch-group';

          const colorInput = document.createElement('input');
          colorInput.type = 'color';
          colorInput.value = currentVal;

          (ctrl.swatches || []).forEach(hex => {
            const sw = document.createElement('button');
            sw.className = `color-swatch ${hex.toLowerCase() === currentVal.toLowerCase() ? 'active' : ''}`;
            sw.style.backgroundColor = hex;
            sw.addEventListener('click', () => {
              catState[ctrl.key] = hex;
              colorInput.value = hex;
              swatchGroup.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
              sw.classList.add('active');
              this.callbacks.onChange(categoryKey, ctrl.key, hex);
            });
            swatchGroup.appendChild(sw);
          });

          colorInput.addEventListener('input', (e) => {
            const hex = e.target.value;
            catState[ctrl.key] = hex;
            swatchGroup.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            this.callbacks.onChange(categoryKey, ctrl.key, hex);
          });

          colorRow.appendChild(swatchGroup);
          colorRow.appendChild(colorInput);
          row.appendChild(colorRow);
          secEl.appendChild(row);
        } else if (ctrl.type === 'options') {
          const grid = document.createElement('div');
          grid.className = 'option-grid';

          ctrl.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = `option-card ${catState[ctrl.key] === opt.value ? 'active' : ''}`;
            btn.innerHTML = `<span>${opt.label}</span>`;
            btn.addEventListener('click', () => {
              catState[ctrl.key] = opt.value;
              grid.querySelectorAll('.option-card').forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
              this.callbacks.onChange(categoryKey, ctrl.key, opt.value);
            });
            grid.appendChild(btn);
          });

          secEl.appendChild(grid);
        }
      });

      this.container.appendChild(secEl);
    });
  }
}
