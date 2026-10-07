import * as THREE from 'three';

/*
 * Pátio 3D da landing page. Cena estilizada (low-poly) nas cores da marca:
 * armazém com docas, portaria com cancela, vagas que acendem como cotas e
 * caminhões. `setProgress(p)` (0–1) é dirigido pela rolagem; animações
 * ambientes (tráfego na rodovia, luzes) rodam no tempo.
 */

const C = {
  ground: '#E6DDCB',
  asphalt: '#3B3832',
  asphaltLight: '#4A4539',
  paint: '#F5F1E8',
  wall: '#EFE9DD',
  wallShade: '#D6CEBD',
  roof: '#214B38',
  pinho: '#2B5D45',
  pinhoLight: '#5E9072',
  ocre: '#DDA530',
  ocreLight: '#F2D68E',
  tijolo: '#BF4A35',
  dark: '#252320',
  trailer: '#FAF8F3',
  glass: '#2F414E',
  tree: '#3D7356',
  treeDark: '#2B5D45',
  trunk: '#724634',
};

const clamp = (v, a = 0, b = 1) => Math.min(Math.max(v, a), b);
const smooth = (t) => t * t * (3 - 2 * t);
/** Progresso local de um trecho [a, b] da rolagem, suavizado. */
const span = (p, a, b) => smooth(clamp((p - a) / (b - a)));
const lerp = (a, b, t) => a + (b - a) * t;

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...extra });
}

function box(w, h, d, material, { x = 0, y = 0, z = 0, cast = true, receive = true } = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  return mesh;
}

/** Caminhão com a frente apontando para +x. Comprimento total ≈ 9. */
function createTruck({ cab = C.pinho, trailer = C.trailer, stripe = C.ocre } = {}) {
  const truck = new THREE.Group();
  const wheelMat = mat(C.dark, { roughness: 0.6 });
  const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.4, 14);
  wheelGeo.rotateX(Math.PI / 2);

  const trailerBody = box(6.6, 2.6, 2.4, mat(trailer), { x: -1.2, y: 2.05 });
  const trailerStripe = box(6.62, 0.22, 2.42, mat(stripe), { x: -1.2, y: 1.05 });
  const chassis = box(8.4, 0.35, 1.9, mat(C.dark), { x: -0.2, y: 0.75 });
  const cabBody = box(1.9, 2.2, 2.3, mat(cab), { x: 3.25, y: 1.85 });
  const cabRoof = box(1.5, 0.45, 2.1, mat(cab), { x: 3.05, y: 3.15 });
  const windshield = box(0.08, 0.9, 2.0, mat(C.glass, { roughness: 0.2, metalness: 0.4 }), { x: 4.22, y: 2.3, cast: false });
  const bumper = box(0.2, 0.35, 2.3, mat(C.dark), { x: 4.25, y: 0.95 });

  truck.add(trailerBody, trailerStripe, chassis, cabBody, cabRoof, windshield, bumper);

  [-3.8, -2.6, 2.9, 0.4].forEach((x) => {
    [-1.0, 1.0].forEach((z) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(x, 0.55, z);
      wheel.castShadow = true;
      truck.add(wheel);
    });
  });

  return truck;
}

function createTree(scale = 1) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 1.4, 6), mat(C.trunk));
  trunk.position.y = 0.7;
  const crown = new THREE.Mesh(new THREE.ConeGeometry(1.3, 3.2, 7), mat(Math.random() > 0.5 ? C.tree : C.treeDark, { flatShading: true }));
  crown.position.y = 2.9;
  [trunk, crown].forEach((m) => { m.castShadow = true; m.receiveShadow = true; });
  tree.add(trunk, crown);
  tree.scale.setScalar(scale);
  return tree;
}

/** Converte um caminho para a orientação do caminhão (frente em +x). */
function headingFrom(dx, dz) {
  return Math.atan2(-dz, dx);
}

export default class YardScene {
  constructor(canvas, { reducedMotion = false } = {}) {
    this.canvas = canvas;
    this.reducedMotion = reducedMotion;
    this.progress = 0;
    this.targetProgress = 0;
    this.enter = 0; // 0 → 1 durante a animação de "Entrar"
    this.pointer = new THREE.Vector2();
    this.clock = new THREE.Clock();
    this.running = false;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog('#F1EBDF', 70, 170);

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.5, 400);
    this.lookTarget = new THREE.Vector3();

    this.buildLights();
    this.buildGround();
    this.buildWarehouse();
    this.buildGate();
    this.buildSpots();
    this.buildTrucks();
    this.buildScenery();

    this.resize = this.resize.bind(this);
    this.tick = this.tick.bind(this);
    window.addEventListener('resize', this.resize);
    this.resize();
    this.applyProgress(0, 0);
    this.renderer.render(this.scene, this.camera);
  }

  buildLights() {
    this.scene.add(new THREE.HemisphereLight('#FFF8EA', '#B9A98A', 1.15));
    const sun = new THREE.DirectionalLight('#FFE9C2', 2.1);
    sun.position.set(-40, 60, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -60;
    sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.bottom = -50;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 160;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.04;
    this.scene.add(sun);
  }

  buildGround() {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), mat(C.ground, { roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const yard = new THREE.Mesh(new THREE.PlaneGeometry(76, 38), mat(C.asphalt, { roughness: 0.95 }));
    yard.rotation.x = -Math.PI / 2;
    yard.position.set(0, 0.02, 4);
    yard.receiveShadow = true;
    this.scene.add(yard);

    // Acesso da rodovia até a portaria.
    const access = new THREE.Mesh(new THREE.PlaneGeometry(40, 7), mat(C.asphaltLight, { roughness: 0.95 }));
    access.rotation.x = -Math.PI / 2;
    access.position.set(56, 0.02, 18);
    access.receiveShadow = true;
    this.scene.add(access);

    // Rodovia ao fundo, com tráfego.
    const highway = new THREE.Mesh(new THREE.PlaneGeometry(400, 10), mat(C.asphaltLight, { roughness: 0.95 }));
    highway.rotation.x = -Math.PI / 2;
    highway.position.set(0, 0.015, 32);
    highway.receiveShadow = true;
    this.scene.add(highway);

    const paint = mat(C.paint, { roughness: 0.7 });
    for (let x = -190; x < 190; x += 7) {
      this.scene.add(box(3.2, 0.02, 0.22, paint, { x, y: 0.03, z: 32, cast: false }));
    }
    for (let x = 40; x < 76; x += 5) {
      this.scene.add(box(2.4, 0.02, 0.18, paint, { x, y: 0.03, z: 18, cast: false }));
    }
    // Faixa de circulação dentro do pátio.
    for (let x = -8; x < 34; x += 5) {
      this.scene.add(box(2.4, 0.02, 0.18, mat(C.ocreLight), { x, y: 0.035, z: 9, cast: false }));
    }

    // Cerca do perímetro (postes baixos).
    const postMat = mat(C.wallShade);
    for (let x = -38; x <= 38; x += 3) {
      if (x > 16 && x < 28) continue; // abertura da portaria
      this.scene.add(box(0.15, 1.6, 0.15, postMat, { x, y: 0.8, z: 23.2 }));
    }
    this.scene.add(box(54, 0.08, 0.08, postMat, { x: -11, y: 1.4, z: 23.2, cast: false }));
    this.scene.add(box(10, 0.08, 0.08, postMat, { x: 33, y: 1.4, z: 23.2, cast: false }));
  }

  buildWarehouse() {
    const wh = new THREE.Group();
    wh.add(box(56, 9, 12, mat(C.wall), { x: -6, y: 4.5, z: -18 }));
    wh.add(box(57, 0.8, 13, mat(C.roof), { x: -6, y: 9.4, z: -18 }));
    // Faixa ocre do batente das docas (identidade da marca).
    wh.add(box(56.2, 0.5, 0.2, mat(C.ocre), { x: -6, y: 0.9, z: -11.9, cast: false }));
    // Letreiro.
    wh.add(box(12, 1.6, 0.25, mat(C.roof), { x: -6, y: 7.4, z: -11.85 }));
    wh.add(box(10.6, 0.3, 0.27, mat(C.ocre), { x: -6, y: 6.85, z: -11.83, cast: false }));
    this.scene.add(wh);

    this.doors = [];
    this.dockLights = [];
    for (let k = 0; k < 7; k += 1) {
      const x = -24 + k * 6;
      wh.add(box(4.2, 4.6, 0.2, mat(C.dark), { x, y: 2.6, z: -11.95, cast: false }));
      const door = box(4, 4.4, 0.25, mat(C.wallShade), { x, y: 2.6, z: -11.8 });
      wh.add(door);
      this.doors.push(door);
      const light = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.35, 0.2),
        new THREE.MeshStandardMaterial({ color: C.tijolo, emissive: C.tijolo, emissiveIntensity: 0.8 }),
      );
      light.position.set(x + 2.6, 5.3, -11.8);
      wh.add(light);
      this.dockLights.push(light);
    }
    this.heroDoor = 4; // x = 0
  }

  buildGate() {
    const gate = new THREE.Group();
    gate.position.set(22, 0, 18);
    gate.add(box(3.6, 3, 3, mat(C.wall), { x: 0, y: 1.5, z: 4.8 }));
    gate.add(box(4.2, 0.4, 3.6, mat(C.roof), { x: 0, y: 3.2, z: 4.8 }));
    gate.add(box(3.62, 1, 0.1, mat(C.glass, { roughness: 0.2, metalness: 0.4 }), { x: 0, y: 2, z: 3.25, cast: false }));
    gate.add(box(0.5, 1.2, 0.5, mat(C.dark), { x: -1.2, y: 0.6, z: -3.6 }));

    this.barrier = new THREE.Group();
    this.barrier.position.set(-1.2, 1.15, -3.6);
    const stripes = new THREE.Group();
    for (let i = 0; i < 6; i += 1) {
      stripes.add(box(0.22, 0.22, 1.1, mat(i % 2 ? C.paint : C.tijolo), { x: 0, y: 0, z: 0.55 + i * 1.1, cast: true }));
    }
    this.barrier.add(stripes);
    gate.add(this.barrier);

    // Cobertura da portaria sobre a pista.
    gate.add(box(0.3, 5, 0.3, mat(C.wallShade), { x: -2.5, y: 2.5, z: -4.2 }));
    gate.add(box(0.3, 5, 0.3, mat(C.wallShade), { x: -2.5, y: 2.5, z: 3.2 }));
    gate.add(box(1.2, 0.35, 8, mat(C.roof), { x: -2.5, y: 5.1, z: -0.5 }));
    this.scene.add(gate);
  }

  buildSpots() {
    this.spots = [];
    const lineMat = mat(C.paint, { roughness: 0.6 });
    const rows = [1, 12];
    rows.forEach((z) => {
      for (let i = 0; i < 6; i += 1) {
        const x = -34 + i * 4.4;
        this.scene.add(box(0.15, 0.03, 9.4, lineMat, { x: x - 2.2, y: 0.04, z, cast: false }));
        const fill = new THREE.Mesh(
          new THREE.PlaneGeometry(3.9, 9),
          new THREE.MeshStandardMaterial({ color: C.ocre, emissive: C.ocre, emissiveIntensity: 0.6, transparent: true, opacity: 0, roughness: 0.6 }),
        );
        fill.rotation.x = -Math.PI / 2;
        fill.position.set(x, 0.05, z);
        this.scene.add(fill);
        this.spots.push({ fill, x, z, truck: null });
      }
      this.scene.add(box(0.15, 0.03, 9.4, lineMat, { x: -34 + 6 * 4.4 - 2.2, y: 0.04, z, cast: false }));
    });
  }

  buildTrucks() {
    const palettes = [
      { cab: C.pinho, stripe: C.ocre },
      { cab: C.ocre, stripe: C.pinho },
      { cab: '#3E5D72', stripe: C.ocre },
      { cab: C.tijolo, stripe: C.wallShade },
      { cab: C.pinhoLight, stripe: C.ocre },
    ];

    // Caminhões que ocupam as vagas conforme os clientes agendam.
    this.spots.forEach((spot, index) => {
      if (index % 3 === 2) return; // algumas vagas continuam livres
      const truck = createTruck(palettes[index % palettes.length]);
      truck.position.set(spot.x, 0, spot.z);
      truck.rotation.y = index < 6 ? Math.PI / 2 : -Math.PI / 2;
      truck.scale.setScalar(0.001);
      truck.visible = false;
      this.scene.add(truck);
      spot.truck = truck;
    });

    // Caminhão protagonista: rodovia → portaria → doca.
    this.hero = createTruck({ cab: C.pinho, stripe: C.ocre });
    this.scene.add(this.hero);
    const doorX = -24 + this.heroDoor * 6;
    // Rodovia → cancela da portaria.
    this.pathRoad = new THREE.CatmullRomCurve3([
      new THREE.Vector3(84, 0, 18),
      new THREE.Vector3(56, 0, 18),
      new THREE.Vector3(34, 0, 18),
      new THREE.Vector3(27, 0, 18),
    ]);
    // Portaria → frente das docas.
    this.pathYard = new THREE.CatmullRomCurve3([
      new THREE.Vector3(27, 0, 18),
      new THREE.Vector3(14, 0, 16.5),
      new THREE.Vector3(2, 0, 11),
      new THREE.Vector3(-6, 0, 5),
      new THREE.Vector3(-2, 0, 1.5),
      new THREE.Vector3(10, 0, 1),
    ]);
    // Manobra de ré até a doca (o caminhão olha para o lado oposto ao movimento).
    this.pathBack = new THREE.CatmullRomCurve3([
      new THREE.Vector3(10, 0, 1),
      new THREE.Vector3(5, 0, 0.5),
      new THREE.Vector3(doorX, 0, -3.5),
      new THREE.Vector3(doorX, 0, -6.6),
    ]);

    // Tráfego ambiente na rodovia.
    this.traffic = [
      { truck: createTruck({ cab: C.ocre, stripe: C.pinho }), lane: 30, speed: 9, offset: 0, dir: 1 },
      { truck: createTruck({ cab: '#3E5D72', stripe: C.ocre }), lane: 34, speed: 7, offset: 120, dir: -1 },
      { truck: createTruck({ cab: C.tijolo, stripe: C.paint }), lane: 30, speed: 8, offset: 210, dir: 1 },
    ];
    this.traffic.forEach(({ truck, dir }) => {
      truck.rotation.y = dir > 0 ? 0 : Math.PI;
      this.scene.add(truck);
    });
  }

  buildScenery() {
    const spots = [
      [-46, -8], [-48, 4], [-44, 16], [46, -6], [50, 6], [-30, -30], [-12, -32], [8, -30], [28, -28], [44, -22],
      [-52, -18], [60, -12], [-20, 27], [-4, 27.5], [8, 27], [40, 27], [-40, 27],
    ];
    spots.forEach(([x, z], i) => {
      const tree = createTree(0.8 + ((i * 37) % 10) / 20);
      tree.position.set(x, 0, z);
      this.scene.add(tree);
    });

    // Postes de luz do pátio.
    const poleMat = mat(C.wallShade);
    [[-20, 20], [0, 20], [-36, -6], [34, -4]].forEach(([x, z]) => {
      this.scene.add(box(0.25, 8, 0.25, poleMat, { x, y: 4, z }));
      this.scene.add(box(1.6, 0.25, 0.5, mat(C.dark), { x: x + 0.6, y: 8, z }));
    });
  }

  /* ---------------- animação ---------------- */

  setProgress(p) {
    this.targetProgress = clamp(p);
    if (!this.running) this.renderOnce();
  }

  setPointer(x, y) {
    this.pointer.set(x, y);
  }

  /** Animação de "Entrar": a cancela sobe e a câmera atravessa a portaria. */
  playEnter(onDone) {
    const duration = this.reducedMotion ? 150 : 1300;
    const start = performance.now();
    const step = (now) => {
      this.enter = clamp((now - start) / duration);
      if (!this.running) this.renderOnce();
      if (this.enter < 1) requestAnimationFrame(step);
      else onDone?.();
    };
    requestAnimationFrame(step);
  }

  cameraFor(p, time) {
    // Pontos de câmera por capítulo: [posição, alvo].
    const keys = [
      [0.0, [62, 46, 70], [0, 0, 0]], // visão geral
      [0.2, [-6, 20, 36], [-22, 0, 6]], // vagas (cotas publicadas)
      [0.4, [70, 16, 42], [52, 0, 18]], // caminhão na rodovia
      [0.6, [38, 9, 32], [24, 1, 17]], // portaria
      [0.8, [5, 11, 13], [0, 1, -8]], // doca
      [1.0, [74, 58, 86], [-2, 0, 0]], // tudo registrado
    ];
    let i = 0;
    while (i < keys.length - 2 && p > keys[i + 1][0]) i += 1;
    const [p0, pos0, look0] = keys[i];
    const [p1, pos1, look1] = keys[i + 1];
    const t = smooth(clamp((p - p0) / (p1 - p0)));
    const pos = new THREE.Vector3(...pos0.map((v, k) => lerp(v, pos1[k], t)));
    const look = new THREE.Vector3(...look0.map((v, k) => lerp(v, look1[k], t)));

    // Respiração lenta da câmera na abertura.
    if (!this.reducedMotion) {
      const orbit = (1 - span(p, 0, 0.12)) * 0.12;
      const angle = Math.sin(time * 0.15) * orbit;
      pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      pos.x += this.pointer.x * 2.5;
      pos.y += this.pointer.y * 1.5;
    }
    return { pos, look };
  }

  applyProgress(p, time) {
    // Capítulo 1 — cotas publicadas: as vagas acendem uma a uma.
    const publish = span(p, 0.08, 0.26);
    // Capítulo 2 — clientes agendam: caminhões ocupam as vagas.
    const booking = span(p, 0.24, 0.42);
    this.spots.forEach((spot, index) => {
      const order = index / this.spots.length;
      const lit = clamp((publish - order * 0.7) / 0.3);
      const filled = spot.truck ? clamp((booking - order * 0.7) / 0.3) : 0;
      spot.fill.material.opacity = lit * (0.55 - filled * 0.25);
      spot.fill.material.color.set(filled > 0.5 ? C.pinhoLight : C.ocre);
      spot.fill.material.emissive.set(filled > 0.5 ? C.pinhoLight : C.ocre);
      if (spot.truck) {
        const s = smooth(filled);
        spot.truck.visible = s > 0.01;
        spot.truck.scale.setScalar(Math.max(s, 0.001));
        spot.truck.position.y = (1 - s) * 2;
      }
    });

    // Capítulos 2–4 — o caminhão chega pela rodovia, para na cancela,
    // atravessa o pátio e encosta de ré na doca.
    const road = span(p, 0.34, 0.57);
    const yard = span(p, 0.62, 0.72);
    const back = span(p, 0.72, 0.8);
    const followPath = (curve, t, reverse = false) => {
      const tangent = curve.getTangentAt(Math.min(Math.max(t, 0.001), 0.999));
      return {
        position: curve.getPointAt(t),
        heading: reverse ? headingFrom(-tangent.x, -tangent.z) : headingFrom(tangent.x, tangent.z),
      };
    };
    const pose = back > 0
      ? followPath(this.pathBack, back, true)
      : yard > 0
        ? followPath(this.pathYard, yard)
        : followPath(this.pathRoad, road);
    this.hero.position.copy(pose.position);
    this.hero.rotation.y = pose.heading;

    // Cancela: sobe enquanto o caminhão está na portaria (ou ao clicar em Entrar).
    const atGate = span(p, 0.55, 0.6) * (1 - span(p, 0.7, 0.74));
    const lift = Math.max(atGate, smooth(this.enter));
    this.barrier.rotation.x = -lift * (Math.PI / 2.2);

    // Doca: porta abre e luz fica verde quando o caminhão encosta.
    const docked = span(p, 0.78, 0.86);
    this.doors.forEach((door, k) => {
      const open = k === this.heroDoor ? docked : (k === 1 || k === 5 ? 1 : 0);
      door.scale.y = 1 - open * 0.85;
      door.position.y = 2.6 + open * 1.9;
      const light = this.dockLights[k];
      const busy = open > 0.5;
      light.material.color.set(busy ? C.pinhoLight : C.tijolo);
      light.material.emissive.set(busy ? C.pinhoLight : C.tijolo);
      light.material.emissiveIntensity = busy ? 1.2 : 0.7 + Math.sin(time * 3 + k) * 0.2;
    });

    // Tráfego ambiente.
    this.traffic.forEach((car) => {
      const travel = this.reducedMotion ? car.offset : (car.offset + time * car.speed) % 260;
      car.truck.position.set(car.dir > 0 ? -130 + travel : 130 - travel, 0, car.lane);
    });

    const { pos, look } = this.cameraFor(p, time);
    if (this.enter > 0) {
      // Mergulho até a portaria.
      const e = smooth(this.enter);
      pos.lerp(new THREE.Vector3(34, 3.2, 18.5), e);
      look.lerp(new THREE.Vector3(10, 2.5, 17), e);
    }
    this.camera.position.copy(pos);
    this.lookTarget.copy(look);
    this.camera.lookAt(this.lookTarget);
  }

  renderOnce() {
    this.progress = this.targetProgress;
    this.applyProgress(this.progress, this.clock.elapsedTime);
    this.renderer.render(this.scene, this.camera);
  }

  tick() {
    if (!this.running) return;
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.elapsedTime;
    // Suaviza a rolagem (independente da taxa de quadros).
    const ease = this.reducedMotion ? 1 : 1 - Math.exp(-delta * 5);
    this.progress += (this.targetProgress - this.progress) * ease;
    this.applyProgress(this.progress, time);
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.tick);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.frame = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  resize() {
    const { clientWidth: w, clientHeight: h } = this.canvas.parentElement ?? this.canvas;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Em telas estreitas (celular) abre o campo de visão para caber o pátio.
    this.camera.fov = w / h < 0.8 ? 58 : 38;
    this.camera.updateProjectionMatrix();
    if (!this.running) this.renderOnce();
  }

  dispose() {
    this.stop();
    window.removeEventListener('resize', this.resize);
    this.scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.geometry.dispose();
        (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => m.dispose());
      }
    });
    this.renderer.dispose();
  }
}

export function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch {
    return false;
  }
}
