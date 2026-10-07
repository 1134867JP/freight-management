import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/*
 * Pátio 3D futurista da landing: cena noturna com luzes de neon nas cores
 * da marca (pinho e ocre), vagas holográficas, rastros de luz na rodovia e
 * um caminhão aerodinâmico que atravessa a história guiada pela rolagem.
 * `setProgress(p)` (0–1) dirige a narrativa; luzes e tráfego rodam no tempo.
 */

const C = {
  night: '#06110C',
  ground: '#0A1912',
  pad: '#10231A',
  padEdge: '#3D7356',
  grid: '#1C3A2B',
  neonGreen: '#5EE0A0',
  neonPinho: '#8DB39A',
  ocre: '#F2B640',
  ocreSoft: '#F2D68E',
  red: '#FF5A45',
  white: '#F4F1EA',
  pearl: '#E9ECE6',
  metal: '#9AA59F',
  dark: '#0E1512',
  glass: '#0B2018',
  building: '#13261D',
};

const clamp = (v, a = 0, b = 1) => Math.min(Math.max(v, a), b);
const smooth = (t) => t * t * (3 - 2 * t);
const span = (p, a, b) => smooth(clamp((p - a) / (b - a)));
const lerp = (a, b, t) => a + (b - a) * t;

const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.25, ...extra });
const neon = (color, intensity = 2.2, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.4, metalness: 0, ...extra });

function mesh(geometry, material, { x = 0, y = 0, z = 0, cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

function rbox(w, h, d, r, material, pos = {}) {
  return mesh(new RoundedBoxGeometry(w, h, d, 4, r), material, pos);
}

/** Contorno luminoso de um retângulo no chão (marcação holográfica). */
function groundOutline(w, d, color, opacity = 1) {
  const shape = new THREE.Shape();
  const r = Math.min(w, d) * 0.12;
  const hw = w / 2;
  const hd = d / 2;
  shape.moveTo(-hw + r, -hd);
  shape.lineTo(hw - r, -hd);
  shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
  shape.lineTo(hw, hd - r);
  shape.quadraticCurveTo(hw, hd, hw - r, hd);
  shape.lineTo(-hw + r, hd);
  shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
  shape.lineTo(-hw, -hd + r);
  shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
  const points = shape.getPoints(40).map((p) => new THREE.Vector3(p.x, 0, p.y));
  const line = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  );
  return line;
}

/*
 * Caminhão com a frente em +x (comprimento ≈ 9,4). Cabine extrudada a
 * partir do perfil lateral, com bisel — nada de caixas retas.
 */
function createTruck({ body = C.pearl, accent = C.neonGreen, trailer = C.pearl, underglow = C.ocre } = {}) {
  const truck = new THREE.Group();
  const bodyMat = std(body, { roughness: 0.28, metalness: 0.55 });

  // Perfil lateral da cabine (x para a frente, y para cima).
  const profile = new THREE.Shape();
  profile.moveTo(0, 0.55);
  profile.lineTo(2.25, 0.55);
  profile.quadraticCurveTo(2.62, 0.55, 2.62, 0.95);
  profile.lineTo(2.6, 1.55);
  profile.quadraticCurveTo(2.55, 1.8, 2.35, 2.05);
  profile.lineTo(1.75, 3.0);
  profile.quadraticCurveTo(1.6, 3.2, 1.3, 3.22);
  profile.lineTo(0.2, 3.22);
  profile.quadraticCurveTo(0, 3.2, 0, 2.95);
  profile.lineTo(0, 0.55);
  const cabGeo = new THREE.ExtrudeGeometry(profile, {
    depth: 2.1,
    bevelEnabled: true,
    bevelThickness: 0.14,
    bevelSize: 0.14,
    bevelSegments: 5,
    curveSegments: 18,
  });
  cabGeo.translate(0, 0, -1.05);
  const cab = mesh(cabGeo, bodyMat, { x: 1.55 });
  truck.add(cab);

  // Para-brisa escuro acompanhando a inclinação.
  const shieldShape = new THREE.Shape();
  shieldShape.moveTo(2.28, 2.12);
  shieldShape.lineTo(1.74, 2.95);
  shieldShape.lineTo(1.5, 2.95);
  shieldShape.lineTo(2.02, 2.12);
  const shieldGeo = new THREE.ExtrudeGeometry(shieldShape, { depth: 2.18, bevelEnabled: false });
  shieldGeo.translate(0.12, 0, -1.09);
  truck.add(mesh(shieldGeo, std(C.glass, { roughness: 0.08, metalness: 0.9 }), { x: 1.55, cast: false }));

  // Faixa de luz frontal (faróis) e acento lateral.
  truck.add(mesh(new RoundedBoxGeometry(0.08, 0.16, 2.0, 2, 0.04), neon(C.white, 3), { x: 4.3, y: 1.35, cast: false }));
  [-1.2, 1.2].forEach((z) => {
    truck.add(mesh(new RoundedBoxGeometry(2.3, 0.07, 0.04, 2, 0.02), neon(accent, 2.4), { x: 2.75, y: 1.0, z, cast: false }));
  });

  // Baú arredondado com filete de luz e lanternas.
  const trailerMat = std(trailer, { roughness: 0.32, metalness: 0.45 });
  truck.add(rbox(6.4, 2.75, 2.45, 0.22, trailerMat, { x: -2.15, y: 2.15 }));
  [-1.24, 1.24].forEach((z) => {
    truck.add(mesh(new RoundedBoxGeometry(6.0, 0.08, 0.04, 2, 0.02), neon(accent, 2), { x: -2.15, y: 0.98, z, cast: false }));
  });
  [-0.85, 0.85].forEach((z) => {
    truck.add(mesh(new RoundedBoxGeometry(0.06, 0.5, 0.18, 2, 0.03), neon(C.red, 3), { x: -5.38, y: 1.35, z, cast: false }));
  });

  // Chassi e rodas com aro.
  truck.add(rbox(8.8, 0.32, 1.7, 0.1, std(C.dark, { metalness: 0.6 }), { x: -0.5, y: 0.72 }));
  const tireGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.42, 28);
  tireGeo.rotateX(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.44, 24);
  rimGeo.rotateX(Math.PI / 2);
  const tireMat = std('#111614', { roughness: 0.85, metalness: 0.1 });
  const rimMat = std(C.metal, { roughness: 0.25, metalness: 0.9 });
  [-4.1, -3.0, 0.2, 3.1].forEach((x) => {
    [-1.02, 1.02].forEach((z) => {
      truck.add(mesh(tireGeo, tireMat, { x, y: 0.52, z }));
      truck.add(mesh(rimGeo, rimMat, { x, y: 0.52, z: z * 1.01, cast: false }));
    });
  });

  // Luz ambiente sob o caminhão (efeito "hover" futurista).
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(9.5, 3.2),
    new THREE.MeshBasicMaterial({ color: underglow, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.set(-0.4, 0.04, 0);
  truck.add(glow);
  truck.userData.glow = glow;

  return truck;
}

function headingFrom(dx, dz) {
  return Math.atan2(-dz, dx);
}

export default class YardScene {
  constructor(canvas, { reducedMotion = false } = {}) {
    this.canvas = canvas;
    this.reducedMotion = reducedMotion;
    this.progress = 0;
    this.targetProgress = 0;
    this.enter = 0;
    this.pointer = new THREE.Vector2();
    this.clock = new THREE.Clock();
    this.running = false;
    this.lowPower = window.matchMedia?.('(max-width: 768px)').matches ?? false;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.lowPower ? 1.5 : 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(C.night);
    this.scene.fog = new THREE.FogExp2(C.night, 0.0095);

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.5, 500);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.85, 0.55, 0.62);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.buildLights();
    this.buildGround();
    this.buildWarehouse();
    this.buildGate();
    this.buildSpots();
    this.buildTrucks();
    this.buildTraffic();
    this.buildParticles();

    this.resize = this.resize.bind(this);
    this.tick = this.tick.bind(this);
    window.addEventListener('resize', this.resize);
    this.resize();
    this.renderOnce();
  }

  buildLights() {
    this.scene.add(new THREE.HemisphereLight('#7FA6A0', '#0A1712', 0.8));
    const moon = new THREE.DirectionalLight('#BFD6FF', 1.1);
    moon.position.set(-40, 70, 40);
    moon.castShadow = true;
    moon.shadow.mapSize.set(this.lowPower ? 1024 : 2048, this.lowPower ? 1024 : 2048);
    Object.assign(moon.shadow.camera, { left: -60, right: 60, top: 50, bottom: -50, near: 10, far: 180 });
    moon.shadow.bias = -0.0006;
    moon.shadow.normalBias = 0.04;
    this.scene.add(moon);

    // Luz quente vinda das docas.
    const dockGlow = new THREE.PointLight(C.ocre, 120, 60, 1.8);
    dockGlow.position.set(-6, 6, -6);
    this.scene.add(dockGlow);
    const gateGlow = new THREE.PointLight(C.neonGreen, 60, 30, 1.8);
    gateGlow.position.set(22, 6, 18);
    this.scene.add(gateGlow);
  }

  buildGround() {
    const ground = mesh(new THREE.PlaneGeometry(600, 600), std(C.ground, { roughness: 0.95, metalness: 0 }), { cast: false });
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    const grid = new THREE.GridHelper(400, 160, C.grid, C.grid);
    grid.material.transparent = true;
    grid.material.opacity = 0.45;
    grid.position.y = 0.01;
    this.scene.add(grid);

    // Plataforma do pátio com borda luminosa.
    const pad = rbox(78, 0.3, 40, 1.4, std(C.pad, { roughness: 0.7, metalness: 0.2 }), { x: 0, y: 0.05, z: 4, cast: false });
    this.scene.add(pad);
    const padEdge = groundOutline(78.4, 40.4, C.neonPinho, 0.9);
    padEdge.position.set(0, 0.24, 4);
    this.scene.add(padEdge);

    // Via de acesso e rodovia.
    const roadMat = std('#0D1C15', { roughness: 0.9, metalness: 0.1 });
    const access = mesh(new THREE.PlaneGeometry(44, 7), roadMat, { x: 60, y: 0.03, z: 18, cast: false });
    access.rotation.x = -Math.PI / 2;
    this.scene.add(access);
    const highway = mesh(new THREE.PlaneGeometry(500, 12), roadMat, { x: 0, y: 0.02, z: 33, cast: false });
    highway.rotation.x = -Math.PI / 2;
    this.scene.add(highway);

    // Faixas luminosas.
    const laneMat = neon(C.ocreSoft, 1.3);
    for (let x = -240; x < 240; x += 8) this.scene.add(mesh(new THREE.BoxGeometry(3.6, 0.02, 0.16), laneMat, { x, y: 0.04, z: 33, cast: false }));
    [27.2, 38.8].forEach((z) => this.scene.add(mesh(new THREE.BoxGeometry(500, 0.02, 0.1), neon(C.neonPinho, 0.9), { y: 0.04, z, cast: false })));
    const flow = neon(C.neonGreen, 1.6);
    for (let x = -4; x < 36; x += 4.5) this.scene.add(mesh(new THREE.BoxGeometry(2.2, 0.02, 0.14), flow, { x, y: 0.22, z: 9, cast: false }));
    for (let x = 40; x < 82; x += 5) this.scene.add(mesh(new THREE.BoxGeometry(2.4, 0.02, 0.14), laneMat, { x, y: 0.04, z: 18, cast: false }));
  }

  buildWarehouse() {
    const wh = new THREE.Group();
    wh.add(rbox(58, 10, 13, 1.2, std(C.building, { roughness: 0.35, metalness: 0.6 }), { x: -6, y: 5.2, z: -18.5 }));
    // Coroa luminosa e faixa de vidro.
    const crown = groundOutline(58.6, 13.6, C.neonPinho, 0.95);
    crown.position.set(-6, 10.25, -18.5);
    wh.add(crown);
    wh.add(mesh(new RoundedBoxGeometry(46, 1.6, 0.2, 2, 0.1), std(C.glass, { roughness: 0.05, metalness: 0.9, emissive: '#123A2A', emissiveIntensity: 0.6 }), { x: -6, y: 7.6, z: -11.95, cast: false }));
    wh.add(mesh(new RoundedBoxGeometry(14, 0.18, 0.2, 2, 0.08), neon(C.ocre, 2.4), { x: -6, y: 8.75, z: -11.9, cast: false }));
    this.scene.add(wh);

    this.doors = [];
    this.dockLights = [];
    for (let k = 0; k < 7; k += 1) {
      const x = -24 + k * 6;
      const frame = groundOutline(4.6, 5, C.neonPinho, 0.85);
      frame.rotation.x = Math.PI / 2;
      frame.position.set(x, 2.8, -11.85);
      this.scene.add(frame);
      const door = rbox(4.2, 4.6, 0.2, 0.08, std('#1B3328', { roughness: 0.5, metalness: 0.5 }), { x, y: 2.8, z: -11.9, cast: false });
      this.scene.add(door);
      this.doors.push(door);
      const light = mesh(new RoundedBoxGeometry(3.8, 0.12, 0.12, 2, 0.05), neon(C.red, 2.4), { x, y: 0.55, z: -11.6, cast: false });
      this.scene.add(light);
      this.dockLights.push(light);
    }
    this.heroDoor = 4; // x = 0
  }

  buildGate() {
    const gate = new THREE.Group();
    gate.position.set(22, 0, 18);
    const pillarMat = std(C.building, { roughness: 0.3, metalness: 0.7 });
    [-4.3, 4.3].forEach((z) => gate.add(rbox(0.7, 6.2, 0.7, 0.3, pillarMat, { x: -1.8, y: 3.1, z })));
    // Arco luminoso.
    const arch = new THREE.Mesh(new THREE.TorusGeometry(4.3, 0.12, 12, 64, Math.PI), neon(C.neonGreen, 2.4));
    arch.position.set(-1.8, 6.1, 0);
    arch.rotation.y = Math.PI / 2;
    gate.add(arch);
    // Cabine arredondada.
    gate.add(rbox(3.4, 3, 3, 0.35, std(C.pearl, { roughness: 0.3, metalness: 0.4 }), { x: 0, y: 1.5, z: 6.6 }));
    gate.add(mesh(new RoundedBoxGeometry(3.42, 0.9, 3.02, 3, 0.2), std(C.glass, { roughness: 0.05, metalness: 0.9, emissive: '#1F5A43', emissiveIntensity: 0.8 }), { x: 0, y: 2.1, z: 6.6, cast: false }));

    // Cancela: barra de luz que sobe.
    this.barrier = new THREE.Group();
    this.barrier.position.set(-1.8, 1.2, -4.0);
    this.barrierBar = mesh(new RoundedBoxGeometry(0.22, 0.22, 7.6, 3, 0.1), neon(C.ocre, 2.6), { x: 0, y: 0, z: 3.8, cast: false });
    this.barrier.add(this.barrierBar);
    gate.add(this.barrier);

    // Plano de varredura (scanner) da portaria.
    this.scanner = new THREE.Mesh(
      new THREE.PlaneGeometry(8.4, 5.6),
      new THREE.MeshBasicMaterial({ color: C.neonGreen, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    this.scanner.rotation.y = Math.PI / 2;
    this.scanner.position.set(-1.8, 3, 0);
    gate.add(this.scanner);
    this.scene.add(gate);
  }

  buildSpots() {
    this.spots = [];
    [1, 12].forEach((z, row) => {
      for (let i = 0; i < 6; i += 1) {
        const x = -34 + i * 4.4;
        const outline = groundOutline(3.6, 8.8, C.ocre, 0);
        outline.position.set(x, 0.24, z);
        this.scene.add(outline);
        const fill = new THREE.Mesh(
          new THREE.PlaneGeometry(3.4, 8.6),
          new THREE.MeshBasicMaterial({ color: C.ocre, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
        );
        fill.rotation.x = -Math.PI / 2;
        fill.position.set(x, 0.22, z);
        this.scene.add(fill);
        const beam = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.6, 9, 16, 1, true),
          new THREE.MeshBasicMaterial({ color: C.ocre, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
        );
        beam.position.set(x, 4.6, z);
        this.scene.add(beam);
        this.spots.push({ outline, fill, beam, x, z, row, truck: null });
      }
    });
  }

  buildTrucks() {
    const palettes = [
      { body: C.pearl, accent: C.neonGreen },
      { body: '#2B5D45', accent: C.ocre, trailer: C.pearl },
      { body: C.pearl, accent: C.ocre },
      { body: '#3E5D72', accent: C.neonGreen, trailer: '#DCE3E6' },
    ];
    this.spots.forEach((spot, index) => {
      if (index % 3 === 2) return;
      const truck = createTruck(palettes[index % palettes.length]);
      truck.position.set(spot.x, 0.2, spot.z);
      truck.rotation.y = spot.row === 0 ? Math.PI / 2 : -Math.PI / 2;
      truck.scale.setScalar(0.001);
      truck.visible = false;
      this.scene.add(truck);
      spot.truck = truck;
    });

    this.hero = createTruck({ body: '#2B5D45', accent: C.ocre, trailer: C.pearl, underglow: C.neonGreen });
    this.scene.add(this.hero);
    const doorX = -24 + this.heroDoor * 6;
    this.pathRoad = new THREE.CatmullRomCurve3([
      new THREE.Vector3(90, 0, 18),
      new THREE.Vector3(58, 0, 18),
      new THREE.Vector3(36, 0, 18),
      new THREE.Vector3(27, 0.2, 18),
    ]);
    this.pathYard = new THREE.CatmullRomCurve3([
      new THREE.Vector3(27, 0.2, 18),
      new THREE.Vector3(14, 0.2, 16.5),
      new THREE.Vector3(2, 0.2, 11),
      new THREE.Vector3(-6, 0.2, 5),
      new THREE.Vector3(-2, 0.2, 1.5),
      new THREE.Vector3(10, 0.2, 1),
    ]);
    this.pathBack = new THREE.CatmullRomCurve3([
      new THREE.Vector3(10, 0.2, 1),
      new THREE.Vector3(5, 0.2, 0.5),
      new THREE.Vector3(doorX, 0.2, -3.5),
      new THREE.Vector3(doorX, 0.2, -6.4),
    ]);

    // Rastro luminoso do trajeto do caminhão.
    const trail = [...this.pathRoad.getSpacedPoints(60), ...this.pathYard.getSpacedPoints(60)].map((p) => new THREE.Vector3(p.x, 0.26, p.z));
    this.trail = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(trail),
      new THREE.LineDashedMaterial({ color: C.neonGreen, dashSize: 1.2, gapSize: 0.8, transparent: true, opacity: 0 }),
    );
    this.trail.computeLineDistances();
    this.scene.add(this.trail);
  }

  buildTraffic() {
    // Rastros de luz (faróis brancos indo, lanternas vermelhas voltando).
    this.streaks = [];
    const geo = new RoundedBoxGeometry(5, 0.12, 0.22, 2, 0.06);
    for (let i = 0; i < 18; i += 1) {
      const outbound = i % 2 === 0;
      const streak = mesh(geo, neon(outbound ? C.white : C.red, outbound ? 2.6 : 2.2), { cast: false });
      streak.position.set(0, 0.35, outbound ? 30.5 : 35.5);
      streak.userData = { dir: outbound ? 1 : -1, speed: 26 + (i % 5) * 6, offset: i * 37 };
      this.scene.add(streak);
      this.streaks.push(streak);
    }

    this.traffic = [
      { truck: createTruck({ body: C.pearl, accent: C.ocre }), lane: 30.5, speed: 11, offset: 40, dir: 1 },
      { truck: createTruck({ body: '#3E5D72', accent: C.neonGreen }), lane: 35.5, speed: 9, offset: 190, dir: -1 },
    ];
    this.traffic.forEach(({ truck, dir }) => {
      truck.rotation.y = dir > 0 ? 0 : Math.PI;
      this.scene.add(truck);
    });
  }

  buildParticles() {
    const count = this.lowPower ? 240 : 520;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 160;
      positions[i * 3 + 1] = Math.random() * 26 + 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particles = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({ color: C.ocreSoft, size: 0.35, map: this.dotTexture(), alphaTest: 0.01, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    this.scene.add(this.particles);
  }

  /** Ponto redondo e suave para as partículas (em vez de quadrados). */
  dotTexture() {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.35, 'rgba(255,255,255,0.6)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /* ---------------- animação ---------------- */

  setProgress(p) {
    this.targetProgress = clamp(p);
    if (!this.running) this.renderOnce();
  }

  setPointer(x, y) {
    this.pointer.set(x, y);
  }

  playEnter(onDone) {
    const duration = this.reducedMotion ? 150 : 1400;
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
    const keys = [
      [0.0, [64, 40, 70], [0, 0, 2]],
      [0.2, [-4, 22, 38], [-22, 0, 6]],
      [0.4, [84, 8, 31], [68, 2, 18]],
      [0.6, [40, 8, 33], [24, 2, 17]],
      [0.8, [6, 10, 14], [0, 2, -8]],
      [1.0, [78, 56, 90], [-2, 0, 0]],
    ];
    let i = 0;
    while (i < keys.length - 2 && p > keys[i + 1][0]) i += 1;
    const [p0, pos0, look0] = keys[i];
    const [p1, pos1, look1] = keys[i + 1];
    const t = smooth(clamp((p - p0) / (p1 - p0)));
    const pos = new THREE.Vector3(...pos0.map((v, k) => lerp(v, pos1[k], t)));
    const look = new THREE.Vector3(...look0.map((v, k) => lerp(v, look1[k], t)));

    if (!this.reducedMotion) {
      const orbit = (1 - span(p, 0, 0.12)) * 0.16;
      pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.sin(time * 0.12) * orbit);
      pos.x += this.pointer.x * 2.5;
      pos.y += this.pointer.y * 1.5;
    }
    return { pos, look };
  }

  applyProgress(p, time) {
    // Cotas publicadas: as vagas acendem como hologramas.
    const publish = span(p, 0.08, 0.26);
    const booking = span(p, 0.24, 0.42);
    this.spots.forEach((spot, index) => {
      const order = index / this.spots.length;
      const lit = clamp((publish - order * 0.7) / 0.3);
      const filled = spot.truck ? clamp((booking - order * 0.7) / 0.3) : 0;
      const color = filled > 0.5 ? C.neonGreen : C.ocre;
      const pulse = this.reducedMotion ? 1 : 0.8 + Math.sin(time * 2.4 + index) * 0.2;
      spot.outline.material.opacity = lit;
      spot.outline.material.color.set(color);
      spot.fill.material.opacity = lit * 0.16 * pulse;
      spot.fill.material.color.set(color);
      spot.beam.material.opacity = lit * (1 - filled) * 0.22 * pulse;
      spot.beam.material.color.set(color);
      if (spot.truck) {
        const s = smooth(filled);
        spot.truck.visible = s > 0.01;
        spot.truck.scale.setScalar(Math.max(s, 0.001));
        spot.truck.position.y = 0.2 + (1 - s) * 3;
      }
    });

    // O caminhão: rodovia → portaria → pátio → ré até a doca.
    const road = span(p, 0.3, 0.57);
    const yard = span(p, 0.62, 0.72);
    const back = span(p, 0.72, 0.8);
    const follow = (curve, t, reverse = false) => {
      const tangent = curve.getTangentAt(clamp(t, 0.001, 0.999));
      return {
        position: curve.getPointAt(t),
        heading: reverse ? headingFrom(-tangent.x, -tangent.z) : headingFrom(tangent.x, tangent.z),
      };
    };
    const pose = back > 0 ? follow(this.pathBack, back, true) : yard > 0 ? follow(this.pathYard, yard) : follow(this.pathRoad, road);
    this.hero.position.copy(pose.position);
    this.hero.rotation.y = pose.heading;
    this.hero.userData.glow.material.opacity = 0.18 + (this.reducedMotion ? 0 : Math.sin(time * 3) * 0.06);

    this.trail.material.opacity = span(p, 0.3, 0.38) * (1 - span(p, 0.74, 0.8)) * 0.9;
    this.trail.material.dashOffset = this.reducedMotion ? 0 : -time * 2;

    // Portaria: varredura e cancela.
    const atGate = span(p, 0.53, 0.58) * (1 - span(p, 0.7, 0.74));
    const scan = span(p, 0.5, 0.56) * (1 - span(p, 0.6, 0.63));
    this.scanner.material.opacity = scan * (0.18 + (this.reducedMotion ? 0 : Math.sin(time * 9) * 0.06));
    this.scanner.position.x = -1.8 + Math.sin(time * 2.2) * 0.6;
    const lift = Math.max(atGate, smooth(this.enter));
    this.barrier.rotation.x = -lift * (Math.PI / 2.2);

    // Doca: porta abre e a luz fica verde.
    const docked = span(p, 0.78, 0.86);
    this.doors.forEach((door, k) => {
      const open = k === this.heroDoor ? docked : (k === 1 || k === 5 ? 1 : 0);
      door.scale.y = 1 - open * 0.85;
      door.position.y = 2.8 + open * 2;
      const light = this.dockLights[k];
      const busy = open > 0.5;
      const color = busy ? C.neonGreen : C.red;
      light.material.color.set(color);
      light.material.emissive.set(color);
      light.material.emissiveIntensity = busy ? 2.6 : 1.6 + (this.reducedMotion ? 0 : Math.sin(time * 3 + k) * 0.5);
    });

    // Tráfego e rastros de luz.
    this.streaks.forEach((s) => {
      const { dir, speed, offset } = s.userData;
      const travel = this.reducedMotion ? offset : (offset + time * speed) % 300;
      s.position.x = dir > 0 ? -150 + travel : 150 - travel;
    });
    this.traffic.forEach((car) => {
      const travel = this.reducedMotion ? car.offset : (car.offset + time * car.speed) % 280;
      car.truck.position.set(car.dir > 0 ? -140 + travel : 140 - travel, 0.2, car.lane);
    });

    if (this.particles && !this.reducedMotion) {
      this.particles.rotation.y = time * 0.01;
      this.particles.position.y = Math.sin(time * 0.3) * 0.6;
    }

    const { pos, look } = this.cameraFor(p, time);
    if (this.enter > 0) {
      const e = smooth(this.enter);
      pos.lerp(new THREE.Vector3(34, 3.4, 18.2), e);
      look.lerp(new THREE.Vector3(8, 3, 17.5), e);
      this.bloom.strength = 0.85 + e * 1.4;
    }
    this.camera.position.copy(pos);
    this.camera.lookAt(look);
  }

  render() {
    this.composer.render();
  }

  renderOnce() {
    this.progress = this.targetProgress;
    this.applyProgress(this.progress, this.clock.elapsedTime);
    this.render();
  }

  tick() {
    if (!this.running) return;
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.elapsedTime;
    const ease = this.reducedMotion ? 1 : 1 - Math.exp(-delta * 5);
    this.progress += (this.targetProgress - this.progress) * ease;
    this.applyProgress(this.progress, time);
    this.render();
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
    this.composer.setSize(w, h);
    this.bloom.resolution.set(w / 2, h / 2);
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 0.8 ? 58 : 38;
    this.camera.updateProjectionMatrix();
    if (!this.running) this.renderOnce();
  }

  dispose() {
    this.stop();
    window.removeEventListener('resize', this.resize);
    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => m.dispose());
    });
    this.composer.dispose?.();
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
