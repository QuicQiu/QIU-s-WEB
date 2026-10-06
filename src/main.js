import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

const app = document.querySelector('#app');
const loadingEl = document.querySelector('#loading');
const barEl = document.querySelector('#bar');
const errorEl = document.querySelector('#error');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f1ea);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
renderer.setSize(window.innerWidth, window.innerHeight);

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

app.appendChild(renderer.domElement);


// --------------------------------------------------
// CAMERA
// --------------------------------------------------

const camera = new THREE.PerspectiveCamera(
  34,
  window.innerWidth / window.innerHeight,
  0.001,
  5000
);


// --------------------------------------------------
// LIGHTING
// --------------------------------------------------

const hemi = new THREE.HemisphereLight(
  0xffffff,
  0xb8b2a6,
  1.65
);
scene.add(hemi);

const ambient = new THREE.AmbientLight(
  0xffffff,
  0.7
);
scene.add(ambient);

const sun = new THREE.DirectionalLight(
  0xfff8ec,
  2.7
);

sun.position.set(-12, 24, 18);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.00015;

scene.add(sun);

const fill = new THREE.DirectionalLight(
  0xdce7ff,
  0.7
);

fill.position.set(18, 10, 10);
scene.add(fill);


// --------------------------------------------------
// GLOBAL VARIABLES
// --------------------------------------------------

let model;

let box = new THREE.Box3();
let size = new THREE.Vector3();
let center = new THREE.Vector3();

let scrollX = 0;
let targetX = 0;

let minX = 0;
let maxX = 0;

let eyeY = 0;
let frontZ = 0;
let lookZ = 0;

let dragging = false;
let lastPointerX = 0;

let dragScale = 0.02;


// --------------------------------------------------
// MOUSE SWAY
// --------------------------------------------------

let mouseNX = 0;
let mouseNY = 0;

let swayX = 0;
let swayY = 0;

let targetSwayX = 0;
let targetSwayY = 0;


// --------------------------------------------------
// HOMEPAGE INTERACTION / HOTSPOTS
// --------------------------------------------------

const sceneAnchors = [];
const projectXs = [];
let profileX = null;
let skillsX = null;
let projectsEntryX = null;
let introEntryX = null;
const projectedPoint = new THREE.Vector3();

// Everything below is created from JS, so you do not need to edit index.html.
const uiStyle = document.createElement('style');
uiStyle.textContent = `
  .scene-hotspots{position:fixed;inset:0;z-index:30;pointer-events:none}
  .scene-hotspot{position:absolute;transform:translate(-50%,-50%);border:0;background:transparent;padding:0;opacity:0;pointer-events:none;transition:opacity .22s ease;z-index:32}
  .scene-hotspot.visible{opacity:1;pointer-events:auto}
  .scene-hotspot .dot{display:block;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.08),0 0 16px rgba(255,255,255,.9);margin:0 auto;animation:scenePulse 1.6s ease-in-out infinite}
  .scene-hotspot:hover .dot{animation-duration:.65s;transform:scale(1.18)}
  .scene-hotspot .tag{display:block;margin-top:10px;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.84);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);font:600 14px/1 Arial,Helvetica,sans-serif;letter-spacing:.02em;color:#111;white-space:nowrap;box-shadow:0 5px 18px rgba(0,0,0,.07)}
  @keyframes scenePulse{0%,100%{opacity:.55;box-shadow:0 0 0 1px rgba(0,0,0,.08),0 0 7px rgba(255,255,255,.5)}50%{opacity:1;box-shadow:0 0 0 1px rgba(0,0,0,.08),0 0 24px rgba(255,255,255,1)}}
  .scene-jump{position:fixed;top:50%;z-index:31;display:flex;align-items:center;gap:10px;border:0;background:transparent;color:#8b806f;opacity:0;pointer-events:none;transition:opacity .25s ease;font:600 16px/1.45 Arial,Helvetica,sans-serif;text-align:left}
  .scene-jump.show{opacity:.9;pointer-events:auto}
  .scene-jump:hover{opacity:1;color:#111}
  .scene-jump.left{left:22px;transform:translateY(-50%)}
  .scene-jump.right{right:22px;transform:translateY(-50%);text-align:right}
  .scene-jump .arrow{font-size:54px;line-height:.7;color:#111}
  .scene-jump .copy{display:flex;flex-direction:column;gap:2px}
`;
document.head.appendChild(uiStyle);

const sceneHotspotsEl = document.createElement('div');
sceneHotspotsEl.className = 'scene-hotspots';
document.body.appendChild(sceneHotspotsEl);

const leftJumpEl = document.createElement('button');
leftJumpEl.className = 'scene-jump left';
leftJumpEl.innerHTML = `<span class="arrow">◀</span><span class="copy"><span>01 PROFILE</span><span>02 SKILLS</span></span>`;
document.body.appendChild(leftJumpEl);

const rightJumpEl = document.createElement('button');
rightJumpEl.className = 'scene-jump right';
rightJumpEl.innerHTML = `<span class="copy"><span>03 PROJECTS</span></span><span class="arrow">▶</span>`;
document.body.appendChild(rightJumpEl);

function objectSearchText(obj) {
  const pieces = [];
  let current = obj;
  let depthCount = 0;

  while (current && depthCount < 8) {
    pieces.push(current.name || '');

    if (current.material) {
      const mats = Array.isArray(current.material)
        ? current.material
        : [current.material];

      pieces.push(...mats.map(m => m?.name || ''));
    }

    current = current.parent;
    depthCount++;
  }

  return pieces.join(' ').toLowerCase();
}

function worldBoxInfo(obj) {
  const objectBox = new THREE.Box3().setFromObject(obj);
  const objectCenter = new THREE.Vector3();
  const objectSize = new THREE.Vector3();
  objectBox.getCenter(objectCenter);
  objectBox.getSize(objectSize);

  return {
    box: objectBox,
    center: objectCenter,
    size: objectSize,
    area: Math.max(objectSize.x * objectSize.y, 0)
  };
}

function findSceneObject(fragment) {
  const needle = String(fragment).toLowerCase();
  const matches = [];

  model?.traverse(child => {
    if (!child.isMesh) return;
    const text = objectSearchText(child);
    if (!text.includes(needle)) return;
    matches.push({ child, ...worldBoxInfo(child) });
  });

  if (!matches.length) return null;
  matches.sort((a, b) => b.area - a.area);
  return matches[0].child;
}

function findProjectBoardByYear(year) {
  const target = String(year).toLowerCase();
  const matches = [];

  model?.traverse(child => {
    if (!child.isMesh) return;

    const text = objectSearchText(child);
    if (!text.includes(target)) return;

    const info = worldBoxInfo(child);
    if (info.size.x <= 0 || info.size.y <= 0) return;

    // Score exact year-token matches above accidental text matches,
    // then prefer the largest broad surface inside that Rhino layer.
    const tokens = text.split(/[^a-z0-9]+/).filter(Boolean);
    const exact = tokens.includes(target) ? 1 : 0;
    const boardLike = info.size.x > info.size.z && info.size.y > info.size.z ? 1 : 0;

    matches.push({
      child,
      ...info,
      exact,
      boardLike
    });
  });

  if (!matches.length) {
    console.warn(`No FBX mesh found for Rhino layer/object ${year}`);
    return null;
  }

  matches.sort((a, b) => {
    if (a.exact !== b.exact) return b.exact - a.exact;
    if (a.boardLike !== b.boardLike) return b.boardLike - a.boardLike;
    return b.area - a.area;
  });

  return matches[0];
}

function addSceneAnchor({ key, label, url, object, point }) {
  const button = document.createElement('button');
  button.className = 'scene-hotspot';
  button.type = 'button';
  button.innerHTML = `<span class="dot"></span><span class="tag">${label}</span>`;
  sceneHotspotsEl.appendChild(button);

  const anchor = {
    key,
    label,
    url,
    object: object || null,
    point: point.clone(),
    element: button,
    world: new THREE.Vector3()
  };

  sceneAnchors.push(anchor);

  button.addEventListener('click', e => {
    e.stopPropagation();
    if (url) window.location.href = url;
  });

  return anchor;
}

function buildSceneHotspots() {
  sceneHotspotsEl.innerHTML = '';
  sceneAnchors.length = 0;
  projectXs.length = 0;

  // Existing Profile / Skills image planes.
  const frame = findSceneObject('frame');
  const photo = findSceneObject('photo');

  if (frame) {
    const info = worldBoxInfo(frame);
    profileX = info.center.x;
    const pt = info.center.clone();
    pt.y -= info.size.y * 0.08;

    addSceneAnchor({
      key: 'profile',
      label: '01 PROFILE',
      url: '/profile/profile.html',
      object: frame,
      point: pt
    });
  }

  if (photo) {
    const info = worldBoxInfo(photo);
    skillsX = info.center.x;

    addSceneAnchor({
      key: 'skills',
      label: '02 SKILLS',
      url: '/skills/skills.html',
      object: photo,
      point: info.center
    });
  }

  // IMPORTANT: Project hotspots now use your Rhino layer/object names directly.
  // No timber/wood auto-detection is used anymore.
  const projectDefs = [
    { year: '2024', url: '/projects/2024.html' },
    { year: '2025', url: '/projects/2025.html' },
    { year: '2026', url: '/projects/2026.html' }
  ];

  projectDefs.forEach(def => {
    const item = findProjectBoardByYear(def.year);
    if (!item) return;

    // Exact centre of the named 2024 / 2025 / 2026 board.
    const pt = item.center.clone();
    projectXs.push(pt.x);

    addSceneAnchor({
      key: `project-${def.year}`,
      label: `03 PROJECT ${def.year}`,
      url: def.url,
      object: item.child,
      point: pt
    });
  });

  projectXs.sort((a, b) => a - b);

  projectsEntryX = projectXs.length
    ? projectXs[0]
    : minX + size.x * 0.62;

  introEntryX = profileX != null && skillsX != null
    ? (profileX + skillsX) / 2
    : (profileX ?? skillsX ?? minX + size.x * 0.20);
}

function updateSceneHotspots() {
  if (!model) return;

  for (const anchor of sceneAnchors) {
    anchor.world.copy(anchor.point);

    const p = projectedPoint.copy(anchor.world).project(camera);
    const inFront = p.z > -1 && p.z < 1;
    const x = (p.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-p.y * 0.5 + 0.5) * window.innerHeight;

    const visible =
      inFront &&
      x > -100 &&
      x < window.innerWidth + 100 &&
      y > -100 &&
      y < window.innerHeight + 100;

    anchor.element.classList.toggle('visible', visible);

    if (visible) {
      anchor.element.style.left = `${x}px`;
      anchor.element.style.top = `${y}px`;
    }
  }

  if (projectsEntryX != null) {
    const split = skillsX != null
      ? (skillsX + projectsEntryX) * 0.5
      : minX + size.x * 0.5;

    const inProjectZone = scrollX > split;
    leftJumpEl.classList.toggle('show', inProjectZone);
    rightJumpEl.classList.toggle('show', !inProjectZone);
  }
}

function jumpCameraTo(x) {
  if (x == null) return;
  targetX = THREE.MathUtils.clamp(x, minX, maxX);
}

leftJumpEl.addEventListener('click', () => jumpCameraTo(introEntryX));
rightJumpEl.addEventListener('click', () => jumpCameraTo(projectsEntryX));


// --------------------------------------------------
// MATERIAL FIX
// --------------------------------------------------

function tuneMaterial(mat) {

  if (!mat) return;

  const mats = Array.isArray(mat)
    ? mat
    : [mat];

  for (const m of mats) {

    if (!m) continue;

    if (m.map) {

      m.map.colorSpace = THREE.SRGBColorSpace;

      m.map.anisotropy = Math.min(
        8,
        renderer.capabilities.getMaxAnisotropy()
      );

      m.map.needsUpdate = true;
    }

    if (m.emissiveMap) {
      m.emissiveMap.colorSpace = THREE.SRGBColorSpace;
    }

    if (
      m.transparent ||
      (m.opacity !== undefined && m.opacity < 0.999) ||
      m.alphaMap
    ) {

      m.transparent = true;

      m.alphaTest = Math.max(
        m.alphaTest || 0,
        0.12
      );

      m.depthWrite = true;
    }

    m.side = THREE.DoubleSide;

    m.needsUpdate = true;
  }
}


// --------------------------------------------------
// GLASS
// --------------------------------------------------

function isGlassObject(child) {

  const haystack = [

    child.name || '',

    ...(Array.isArray(child.material)
      ? child.material.map(
          m => m?.name || ''
        )
      : [
          child.material?.name || ''
        ])

  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes('glass');
}


function makeGlassMaterial(child) {

  if (!isGlassObject(child)) return;

  const mats = Array.isArray(child.material)
    ? child.material
    : [child.material];

  for (const m of mats) {

    if (!m) continue;

    m.transparent = true;

    m.opacity = 0.28;

    m.depthWrite = false;

    m.side = THREE.DoubleSide;

    if ('roughness' in m) {
      m.roughness = 0.1;
    }

    if ('metalness' in m) {
      m.metalness = 0.0;
    }

    if ('transmission' in m) {
      m.transmission = 0.72;
    }

    if ('thickness' in m) {
      m.thickness = 0.02;
    }

    if ('ior' in m) {
      m.ior = 1.2;
    }

    if ('envMapIntensity' in m) {
      m.envMapIntensity = 0.6;
    }

    if (m.color) {
      m.color.setRGB(
        0.92,
        0.96,
        0.98
      );
    }

    m.needsUpdate = true;
  }

  child.renderOrder = 1;
}


// --------------------------------------------------
// TEXTURE PATH FIX
// --------------------------------------------------

const manager = new THREE.LoadingManager();

manager.setURLModifier((url) => {

  const clean = decodeURIComponent(url)
    .replace(/\\/g, '/');

  const filename = clean
    .split('/')
    .pop();

  if (
    /\.(png|jpe?g|webp|tif|tiff|bmp)$/i
      .test(filename || '')
  ) {

    return `/elements/${encodeURIComponent(filename)}`;
  }

  return url;
});


// --------------------------------------------------
// FORCE IMAGE PLANE TEXTURES
// --------------------------------------------------

const textureLoader = new THREE.TextureLoader();

const planeTextures = {

  'tree 12':
    textureLoader.load(
      '/elements/tree%2012.png'
    ),

  'tree 3':
    textureLoader.load(
      '/elements/tree%203.png'
    ),

  'tree 1':
    textureLoader.load(
      '/elements/tree%201.png'
    ),

  'person':
    textureLoader.load(
      '/elements/person.png'
    ),

  'plant 1':
    textureLoader.load(
      '/elements/plant%201.png'
    ),

  'frame':
    textureLoader.load(
      '/elements/frame.png'
    ),

  'photo':
    textureLoader.load(
      '/elements/photo.png'
    ),
};


for (const tex of Object.values(planeTextures)) {

  tex.colorSpace = THREE.SRGBColorSpace;

  tex.anisotropy = Math.min(
    8,
    renderer.capabilities.getMaxAnisotropy()
  );

  tex.needsUpdate = true;
}


function textureForObject(child) {

  const haystack = [

    child.name || '',

    ...(Array.isArray(child.material)
      ? child.material.map(
          m => m?.name || ''
        )
      : [
          child.material?.name || ''
        ])

  ]
    .join(' ')
    .toLowerCase();


  for (
    const key of [
      'tree 12',
      'tree 3',
      'tree 1',
      'person',
      'plant 1',
      'frame',
      'photo',
    ]
  ) {

    if (haystack.includes(key)) {

      return planeTextures[key];
    }
  }

  return null;
}


function forceImagePlaneTexture(child) {

  const tex = textureForObject(child);

  if (!tex) return;


  const mats = Array.isArray(child.material)
    ? child.material
    : [child.material];


  for (const m of mats) {

    if (!m) continue;

    m.map = tex;

    m.alphaMap = null;

    if (m.color) {
      m.color.set(0xffffff);
    }

    m.transparent = true;

    m.opacity = 1;

    m.alphaTest = 0.02;

    m.depthWrite = false;

    m.side = THREE.DoubleSide;

    m.needsUpdate = true;
  }

  child.renderOrder = 2;
}


// --------------------------------------------------
// CAMERA SETUP
// --------------------------------------------------

function setupCameraFromModel() {

  box.setFromObject(model);

  box.getSize(size);

  box.getCenter(center);


  // 横向移动范围

  minX = box.min.x;

  maxX = box.max.x;


  // 人眼高度

  eyeY =
    box.min.y +
    size.y * 0.15;


  const depth =
    Math.max(
      size.z,
      1
    );


  // ------------------------------------------------
  // CAMERA PUSH-IN
  // ------------------------------------------------
  //
  // 这里现在不是放在模型外面，
  // 而是直接推进模型内部。
  //
  // 如果还想更近：
  //
  // 0.4 -> 0.5 -> 0.6 -> 0.7
  //
  // 数字越大，越往里面。
  //

  frontZ =
    box.max.z -
    depth * 0.16;


  // 视线方向也一起推进

  lookZ =
    center.z -
    depth * 0.18;


  // 横向稍微留一点边缘

  const margin =
    size.x * 0.02;

  minX += margin;

  maxX -= margin;


  if (minX > maxX) {

    minX = center.x;

    maxX = center.x;
  }


const startX = minX + size.x * 0.20;

targetX = startX;
scrollX = startX;


  dragScale =

    Math.max(

      size.x /
        Math.max(
          window.innerWidth,
          1
        ),

      0.005

    ) * 1.25;


  camera.position.set(
    scrollX,
    eyeY,
    frontZ
  );


  camera.lookAt(
    scrollX,
    eyeY,
    lookZ
  );


  // shadow range

  const shadowExtent =

    Math.max(
      size.x,
      size.y,
      size.z
    ) * 0.7;


  sun.shadow.camera.left =
    -shadowExtent;

  sun.shadow.camera.right =
    shadowExtent;

  sun.shadow.camera.top =
    shadowExtent;

  sun.shadow.camera.bottom =
    -shadowExtent;

  sun.shadow.camera.near =
    0.1;

  sun.shadow.camera.far =
    shadowExtent * 5;
}


// --------------------------------------------------
// LOAD FBX
// --------------------------------------------------

const loader =
  new FBXLoader(manager);


loader.load(

  '/models/homepage.fbx',

  (obj) => {

    model = obj;


    model.traverse((child) => {

      if (!child.isMesh) return;


      child.castShadow = true;

      child.receiveShadow = true;


      tuneMaterial(
        child.material
      );


      makeGlassMaterial(
        child
      );


      forceImagePlaneTexture(
        child
      );

    });


    scene.add(model);


    setupCameraFromModel();
    buildSceneHotspots();


    if (loadingEl) {
      loadingEl.style.display =
        'none';
    }

  },


  (xhr) => {

    if (
      xhr.total &&
      barEl
    ) {

      barEl.style.width =

        `${Math.min(
          100,
          (
            xhr.loaded /
            xhr.total
          ) * 100
        )}%`;
    }

  },


  (err) => {

    console.error(err);


    if (loadingEl) {
      loadingEl.style.display =
        'none';
    }


    if (errorEl) {

      errorEl.style.display =
        'block';

      errorEl.textContent =

        'FBX failed to load. Open browser console with F12 and send me the error.';
    }

  }

);


// --------------------------------------------------
// CLAMP
// --------------------------------------------------

function clampTarget() {

  targetX =
    THREE.MathUtils.clamp(
      targetX,
      minX,
      maxX
    );
}


// --------------------------------------------------
// WHEEL
// --------------------------------------------------

window.addEventListener(

  'wheel',

  (e) => {

    if (!model) return;


    e.preventDefault();


    const delta =

      Math.abs(e.deltaY) >
      Math.abs(e.deltaX)

        ? e.deltaY
        : e.deltaX;


    targetX +=

      delta *
      dragScale *
      0.8;


    clampTarget();

  },

  {
    passive: false
  }

);


// --------------------------------------------------
// POINTER DRAG
// --------------------------------------------------

renderer.domElement.addEventListener(

  'pointerdown',

  (e) => {

    dragging = true;

    lastPointerX =
      e.clientX;


    renderer.domElement
      .setPointerCapture(
        e.pointerId
      );


    renderer.domElement.style.cursor =
      'grabbing';
  }

);


renderer.domElement.addEventListener(

  'pointermove',

  (e) => {

    mouseNX =

      (
        e.clientX /
        window.innerWidth
      ) * 2 - 1;


    mouseNY =

      -(
        (
          e.clientY /
          window.innerHeight
        ) * 2 - 1
      );


    if (!dragging) {

      targetSwayX =
        mouseNX;

      targetSwayY =
        mouseNY;
    }


    if (
      !dragging ||
      !model
    ) {

      return;
    }


    const dx =

      e.clientX -
      lastPointerX;


    lastPointerX =
      e.clientX;


    targetX -=

      dx *
      dragScale;


    clampTarget();
  }

);


renderer.domElement.addEventListener(

  'pointerleave',

  () => {

    if (!dragging) {

      targetSwayX = 0;

      targetSwayY = 0;
    }
  }

);


function endDrag(e) {

  dragging = false;


  renderer.domElement.style.cursor =
    'grab';


  try {

    renderer.domElement
      .releasePointerCapture(
        e.pointerId
      );

  } catch {}
}


renderer.domElement.addEventListener(
  'pointerup',
  endDrag
);


renderer.domElement.addEventListener(
  'pointercancel',
  endDrag
);


renderer.domElement.style.cursor =
  'grab';


// --------------------------------------------------
// RESIZE
// --------------------------------------------------

window.addEventListener(

  'resize',

  () => {

    camera.aspect =

      window.innerWidth /
      window.innerHeight;


    camera.updateProjectionMatrix();


    renderer.setSize(

      window.innerWidth,
      window.innerHeight

    );


    renderer.setPixelRatio(

      Math.min(
        window.devicePixelRatio,
        1.6
      )

    );


    if (model) {

      setupCameraFromModel();

    }

  }

);


// --------------------------------------------------
// ANIMATION
// --------------------------------------------------

function animate() {

  requestAnimationFrame(
    animate
  );


  if (model) {

    scrollX =

      THREE.MathUtils.lerp(
        scrollX,
        targetX,
        0.085
      );


    swayX =

      THREE.MathUtils.lerp(
        swayX,
        targetSwayX,
        0.045
      );


    swayY =

      THREE.MathUtils.lerp(
        swayY,
        targetSwayY,
        0.045
      );


    const horizontalDrift =

      Math.max(
        size.x * 0.0022,
        0.015
      );


    const verticalDrift =

      Math.max(
        size.y * 0.0025,
        0.01
      );


    const lookHorizontal =

      Math.max(
        size.x * 0.0035,
        0.02
      );


    const lookVertical =

      Math.max(
        size.y * 0.0035,
        0.015
      );


    const camX =

      scrollX +

      swayX *
      horizontalDrift;


    const camY =

      eyeY +

      swayY *
      verticalDrift;


    const targetLookX =

      scrollX +

      swayX *
      lookHorizontal;


    const targetLookY =

      eyeY +

      swayY *
      lookVertical;


    camera.position.set(

      camX,
      camY,
      frontZ

    );


    camera.lookAt(

      targetLookX,
      targetLookY,
      lookZ

    );

  }


  updateSceneHotspots();


  renderer.render(
    scene,
    camera
  );
}


animate();