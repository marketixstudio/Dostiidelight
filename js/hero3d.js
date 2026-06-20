/* =========================================================
   DOSTII DELIGHT — Three.js 3D hero
   - Loads /assets/models/product.glb if a real 3D model exists.
   - Otherwise builds a 3D "tilt card": the real product photo
     mounted on a card with thickness, lit and rotated in 3D
     space. Keeps packaging text perfectly sharp.
   - Reacts to scroll (GSAP ScrollTrigger) + pointer parallax.
   Loaded as an ES module (see importmap in index.html).
   ========================================================= */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const canvas = document.getElementById('hero-canvas');
if (canvas) initHero(canvas);

function initHero(canvas) {
  const heroEl = canvas.closest('.hero') || canvas.parentElement;
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 6);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth <= 992 ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // ---- lighting (warm, namkeen-friendly) ----
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(4, 6, 5);
  scene.add(key);
  const warm = new THREE.PointLight(0xf0a500, 1.2, 30);
  warm.position.set(-4, -2, 3);
  scene.add(warm);
  const rim = new THREE.PointLight(0x9e1b1b, 1.0, 30);
  rim.position.set(0, 3, -4);
  scene.add(rim);

  // ---- the model group ----
  const group = new THREE.Group();
  scene.add(group);
  let isFlatCard = false; // flat cards get a tilt animation instead of a full spin

  const loader = new GLTFLoader();
  loader.load(
    'assets/models/product.glb',
    (gltf) => {
      const model = gltf.scene;
      fitToGroup(model, group, 2.6);
      kickOffAnimations();
    },
    undefined,
    () => { buildImageCard(group); kickOffAnimations(); }  // onError -> real product photo card
  );

  // center + scale any loaded model to a target size, then add to group
  function fitToGroup(model, group, targetSize) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = targetSize / Math.max(size.x, size.y, size.z);
    model.scale.setScalar(scale);
    model.position.sub(center.multiplyScalar(scale));
    group.add(model);
  }

  let layerBackdrop = null;
  let layerFrontCard = null;
  let layerBackCard = null;
  let shadow = null;
  const ingredients = []; // array of { mesh, basePos, rotSpeed, swaySpeed, swayAmount }

  // ---- organic ingredient builders ----
  function createPeanutMesh() {
    const peanutGroup = new THREE.Group();
    const peanutMat = new THREE.MeshStandardMaterial({
      color: 0xb5783d,
      roughness: 0.85,
      metalness: 0.05
    });
    
    // Two overlapping squashed spheres to make a peanut body
    const lobe1Geo = new THREE.SphereGeometry(0.038, 12, 12);
    lobe1Geo.scale(1.3, 0.95, 0.95);
    const lobe1 = new THREE.Mesh(lobe1Geo, peanutMat);
    lobe1.position.x = -0.024;
    peanutGroup.add(lobe1);

    const lobe2Geo = new THREE.SphereGeometry(0.032, 12, 12);
    lobe2Geo.scale(1.2, 0.95, 0.95);
    const lobe2 = new THREE.Mesh(lobe2Geo, peanutMat);
    lobe2.position.x = 0.024;
    lobe2.position.y = 0.004;
    peanutGroup.add(lobe2);
    return peanutGroup;
  }

  function createLeafGeometry() {
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, -0.09);
    leafShape.quadraticCurveTo(0.05, -0.03, 0.01, 0.09);
    leafShape.quadraticCurveTo(-0.05, -0.03, 0, -0.09);
    
    const leafGeo = new THREE.ShapeGeometry(leafShape);
    const pos = leafGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = -Math.abs(x) * 0.6; // creased vein line
      pos.setZ(i, z);
    }
    leafGeo.computeVertexNormals();
    return leafGeo;
  }

  // Sev noodle
  function createSevGeometry() {
    const points = [];
    const segments = 6;
    const length = 0.12;
    for (let j = 0; j <= segments; j++) {
      const t = j / segments;
      const y = (t - 0.5) * length;
      const x = Math.sin(t * Math.PI * 2.5) * 0.012;
      const z = Math.cos(t * Math.PI * 2.0) * 0.012;
      points.push(new THREE.Vector3(x, y, z));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 10, 0.007, 6, false);
  }

  // Pouch geometry with sealed top/bottom crimps and side borders
  function createPouchGeometry(width, height, depth, boundaryX) {
    const geometry = new THREE.PlaneGeometry(width, height, 40, 40);
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const nx = x / (width / 2);
      const ny = y / (height / 2);
      
      // Taper the puffed boundary width near the top and bottom corners
      // to match the curved pouch silhouette and prevent side gaps where texture is transparent
      const localBoundaryX = boundaryX * Math.sqrt(1.0 - 0.75 * ny * ny);
      
      const nxNorm = nx / localBoundaryX;
      let puffX = 0;
      if (Math.abs(nxNorm) < 1.0) {
        puffX = Math.cos(nxNorm * Math.PI / 2);
      }
      
      // Smoothly flatten top and bottom seals (within 15% of edges)
      let puffY = 1.0;
      const sealThreshold = 0.85;
      if (Math.abs(ny) > sealThreshold) {
        puffY = (1.0 - Math.abs(ny)) / (1.0 - sealThreshold);
      } else {
        puffY = Math.cos(ny * Math.PI / 2.3);
      }
      
      const z = puffX * puffY * depth;
      pos.setZ(i, z);
    }
    geometry.computeVertexNormals();
    return geometry;
  }

  // ---- product photo mounted as a floating 3D card (silhouette, not a rectangle) ----
  function buildImageCard(group) {
    isFlatCard = false;
    const texLoader = new THREE.TextureLoader();
    
    // Load Front Pouch Texture
    texLoader.load(
      'assets/images/farsan-front-transparent.webp',
      (frontTexture) => {
        frontTexture.colorSpace = THREE.SRGBColorSpace;
        
        // Use the front artwork on both surfaces; the back package is not shown.
        texLoader.load(
          'assets/images/farsan-back-transparent.webp',
          (backTexture) => {
            backTexture.colorSpace = THREE.SRGBColorSpace;
            
            // Dimensions based on back layout aspect ratio (768/1024 = 0.75)
            const aspect = 0.75;
            const height = 3.2;
            const width = height * aspect;

            // Textures are pre-cropped and resized to 768x1024 (0.75 aspect)
            frontTexture.repeat.set(1.0, 1.0);
            frontTexture.offset.set(0.0, 0.0);

            backTexture.repeat.set(1.0, 1.0);
            backTexture.offset.set(0.0, 0.0);

            // 1. BACKDROP PLATE (Subtle circular light glow behind product)
            layerBackdrop = new THREE.Group();
            const ringGeo = new THREE.RingGeometry(width * 0.65, width * 0.9, 32);
            const ringMat = new THREE.MeshBasicMaterial({
              color: 0xf0a500,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.1
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            layerBackdrop.add(ring);
            layerBackdrop.position.z = -0.4;
            group.add(layerBackdrop);

            // 2. FRONT ARTWORK CURVED PLANE (Puffed volumetric pouch, sealed seams at boundaryX)
            const frontGeo = createPouchGeometry(width, height, 0.32, 0.78);
            const frontMat = new THREE.MeshStandardMaterial({
              map: frontTexture,
              transparent: true,
              alphaTest: 0.15,
              roughness: 0.24,
              metalness: 0.12,
              side: THREE.FrontSide
            });
            layerFrontCard = new THREE.Mesh(frontGeo, frontMat);
            layerFrontCard.position.z = 0.0;
            group.add(layerFrontCard);

            // 3. BACK ARTWORK CURVED PLANE (Puffed volumetric pouch, sealed seams at boundaryX)
            const backGeo = createPouchGeometry(width, height, 0.32, 0.78);
            const backMat = new THREE.MeshStandardMaterial({
              map: backTexture,
              transparent: true,
              alphaTest: 0.15,
              roughness: 0.26,
              metalness: 0.1,
              side: THREE.FrontSide
            });
            layerBackCard = new THREE.Mesh(backGeo, backMat);
            layerBackCard.rotation.y = Math.PI;
            layerBackCard.position.z = 0.0;
            group.add(layerBackCard);

            // 4. FLOATING INGREDIENTS (Appetizing, delicate, reduced size)
            const ingredientsGroup = new THREE.Group();
            group.add(ingredientsGroup);

            const leafGeo = createLeafGeometry();
            const leafMat = new THREE.MeshStandardMaterial({
              color: 0x3d6e27,
              roughness: 0.45,
              metalness: 0.1,
              side: THREE.DoubleSide
            });

            const sevGeo = createSevGeometry();
            const sevMat = new THREE.MeshStandardMaterial({
              color: 0xe0a010,
              roughness: 0.6,
              metalness: 0.05
            });

            const spiceGeo = new THREE.ConeGeometry(0.015, 0.035, 3);
            spiceGeo.scale(1.0, 0.2, 1.0);
            const spiceMat = new THREE.MeshStandardMaterial({
              color: 0x900d0d,
              roughness: 0.8
            });

            const sparkleGeo = new THREE.OctahedronGeometry(0.03);
            const sparkleMat = new THREE.MeshStandardMaterial({
              color: 0xfcc01e,
              metalness: 0.95,
              roughness: 0.1
            });

            const pTypes = [
              { isGroup: true, build: createPeanutMesh },
              { isGroup: false, geo: leafGeo, mat: leafMat },
              { isGroup: false, geo: sevGeo, mat: sevMat },
              { isGroup: false, geo: spiceGeo, mat: spiceMat },
              { isGroup: false, geo: sparkleGeo, mat: sparkleMat }
            ];

            for (let i = 0; i < 35; i++) {
              const pType = pTypes[i % pTypes.length];
              let mesh;
              if (pType.isGroup) {
                mesh = pType.build();
              } else {
                mesh = new THREE.Mesh(pType.geo.clone(), pType.mat);
              }
              
              const angle = Math.random() * Math.PI * 2;
              const radius = 0.8 + Math.random() * 1.5;
              const x = Math.cos(angle) * radius;
              const y = (Math.random() - 0.5) * 3.2;
              const z = (Math.random() - 0.5) * 1.2;

              mesh.position.set(x, y, z);
              mesh.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
              );

              ingredientsGroup.add(mesh);

              ingredients.push({
                mesh: mesh,
                basePos: new THREE.Vector3(x, y, z),
                rotSpeed: new THREE.Vector3(
                  (Math.random() - 0.5) * 2.0,
                  (Math.random() - 0.5) * 2.0,
                  (Math.random() - 0.5) * 2.0
                ),
                swaySpeed: 0.6 + Math.random() * 1.2,
                swayAmount: 0.04 + Math.random() * 0.06
              });
            }

            // 5. Soft shadow beneath (added to scene instead of group to prevent rotation overlay)
            const shadowGeo = new THREE.CircleGeometry(width * 0.55, 32);
            const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.12 });
            shadow = new THREE.Mesh(shadowGeo, shadowMat);
            shadow.rotation.x = -Math.PI / 2;
            scene.add(shadow);
          },
          undefined,
          () => buildPlaceholder(group)
        );
      },
      undefined,
      () => buildPlaceholder(group)
    );
  }

  // ---- placeholder: a stylized snack packet (used only if photo also fails) ----
  function buildPlaceholder(group) {
    const geo = new THREE.BoxGeometry(2.2, 3, 0.7, 4, 4, 4);
    const mat = new THREE.MeshStandardMaterial({ color: 0x9e1b1b, roughness: 0.45, metalness: 0.25 });
    const packet = new THREE.Mesh(geo, mat);

    const band = new THREE.Mesh(
      new THREE.BoxGeometry(2.25, 0.9, 0.72),
      new THREE.MeshStandardMaterial({ color: 0xf0a500, roughness: 0.5, metalness: 0.2 })
    );
    packet.add(band);

    const top = new THREE.Mesh(
      new THREE.BoxGeometry(2.3, 0.35, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x6e1212, roughness: 0.6 })
    );
    top.position.y = 1.6;
    packet.add(top);

    group.add(packet);
  }

  // ---- pointer parallax ----
  const pointer = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ---- 3D Scroll State Configuration ----
  const isDesktop = () => window.innerWidth > 992;
  const isTablet = () => window.innerWidth <= 992 && window.innerWidth > 600;
  const isMobile = () => window.innerWidth <= 600;

  const states = {
    desktop: [
      { pctX: 0.22, pctY: -0.02, scale: 0.85, rotX: 0.1, rotY: -0.4, rotZ: 0, explode: 0.0, scatter: 0.2, autoSpin: 0.0 },         // State 1: Hero
      { pctX: -0.22, pctY: 0.0, scale: 0.98, rotX: 0.15, rotY: 0.35, rotZ: -0.1, explode: 1.2, scatter: 1.0, autoSpin: 0.0 },      // State 2: Signature Product
      { pctX: 0.22, pctY: 0.02, scale: 0.88, rotX: 0.08, rotY: -0.3, rotZ: 0.05, explode: 0.4, scatter: 0.6, autoSpin: 0.0 },     // State 3: Taste the Tradition
      { pctX: -0.22, pctY: -0.05, scale: 0.82, rotX: 0.12, rotY: 0.4, rotZ: -0.05, explode: 1.8, scatter: 1.3, autoSpin: 0.05 },    // State 4: Ingredients
      { pctX: 0.0, pctY: -0.6, scale: 0.001, rotX: 0, rotY: 0, rotZ: 0, explode: 0.0, scatter: 0.0, autoSpin: 0.0 }               // State 5: Offscreen (Story/Stats)
    ],
    tablet: [
      { pctX: 0.2, pctY: -0.02, scale: 0.72, rotX: 0.1, rotY: -0.4, rotZ: 0, explode: 0.0, scatter: 0.2, autoSpin: 0.0 },         // State 1: Hero
      { pctX: -0.2, pctY: 0.0, scale: 0.82, rotX: 0.15, rotY: 0.35, rotZ: -0.1, explode: 1.0, scatter: 0.8, autoSpin: 0.0 },      // State 2: Signature Product
      { pctX: 0.2, pctY: 0.02, scale: 0.76, rotX: 0.08, rotY: -0.3, rotZ: 0.05, explode: 0.3, scatter: 0.5, autoSpin: 0.0 },     // State 3: Taste the Tradition
      { pctX: -0.2, pctY: -0.05, scale: 0.72, rotX: 0.12, rotY: 0.4, rotZ: -0.05, explode: 1.5, scatter: 1.1, autoSpin: 0.05 },    // State 4: Ingredients
      { pctX: 0.0, pctY: -0.6, scale: 0.001, rotX: 0, rotY: 0, rotZ: 0, explode: 0.0, scatter: 0.0, autoSpin: 0.0 }               // State 5: Offscreen (Story/Stats)
    ],
    mobile: [
      { pctX: 0.0, pctY: -0.31, scale: 0.50, rotX: 0.08, rotY: -0.25, rotZ: 0, explode: 0.0, scatter: 0.08, autoSpin: 0.0 },       // State 1: Hero — top at ~63vh, bottom at ~96vh, clears CTAs
      { pctX: 0.0, pctY: 0.22, scale: 0.76, rotX: 0.12, rotY: 0.3, rotZ: -0.08, explode: 0.8, scatter: 0.7, autoSpin: 0.0 },       // State 2: Signature Product
      { pctX: 0.0, pctY: -0.22, scale: 0.70, rotX: 0.08, rotY: -0.3, rotZ: 0.05, explode: 0.3, scatter: 0.4, autoSpin: 0.0 },      // State 3: Taste the Tradition
      { pctX: 0.0, pctY: 0.22, scale: 0.65, rotX: 0.1, rotY: 0.35, rotZ: -0.05, explode: 1.2, scatter: 0.9, autoSpin: 0.04 },       // State 4: Ingredients
      { pctX: 0.0, pctY: -0.6, scale: 0.001, rotX: 0, rotY: 0, rotZ: 0, explode: 0.0, scatter: 0.0, autoSpin: 0.0 }               // State 5: Offscreen (Story/Stats)
    ]
  };

  function getActiveStates() {
    if (isDesktop()) return states.desktop;
    if (isTablet()) return states.tablet;
    return states.mobile;
  }

  const getInitialState = () => {
    const activeStates = getActiveStates();
    return activeStates[0];
  };

  const activeConfig = {
    pctX: getInitialState().pctX,
    pctY: getInitialState().pctY,
    scale: getInitialState().scale,
    rotX: getInitialState().rotX,
    rotY: getInitialState().rotY,
    rotZ: getInitialState().rotZ,
    explode: getInitialState().explode !== undefined ? getInitialState().explode : 0.0,
    scatter: getInitialState().scatter !== undefined ? getInitialState().scatter : 0.0,
    autoSpin: getInitialState().autoSpin !== undefined ? getInitialState().autoSpin : 0.08
  };

  let scrollTweens = [];

  function setupScrollTriggers() {
    scrollTweens.forEach(t => { if (t.scrollTrigger) t.scrollTrigger.kill(); t.kill(); });
    scrollTweens = [];

    if (window.innerWidth <= 992) {
      Object.assign(activeConfig, getActiveStates()[0]);
      // Canvas is position:absolute on mobile — it scrolls away with the
      // hero section naturally, so no fade trigger is needed.
      return;
    }

    const s = getActiveStates();
    Object.assign(activeConfig, s[0]);

    const keys = ['pctX', 'pctY', 'scale', 'rotX', 'rotY', 'rotZ', 'explode', 'scatter', 'autoSpin'];
    const stateVars = (idx) => Object.fromEntries(keys.map(k => [k, s[idx][k]]));

    // fromTo is critical: each tween's FROM = previous section's final state so
    // scrubbing backwards smoothly returns to the correct prior position instead
    // of jumping to the hero state (what gsap.to() captures as implicit FROM).
    const plan = [
      { sel: '#sec-product',        from: 0, to: 1 },
      { sel: '#sec-tradition',      from: 1, to: 2 },
      { sel: '#sec-ingredients',    from: 2, to: 3 },
      { sel: '#sec-products-range', from: 3, to: 4 },
    ];

    plan.forEach(({ sel, from, to }) => {
      const el = document.querySelector(sel);
      if (!el) return;
      const tween = gsap.fromTo(activeConfig,
        stateVars(from),
        {
          ...stateVars(to),
          ease: 'none',
          immediateRender: false,
          scrollTrigger: {
            trigger: el,
            start: 'top 70%',
            end: 'top 20%',
            scrub: 1.2,
          }
        }
      );
      scrollTweens.push(tween);
    });
  }

  function kickOffAnimations() {
    document.body.classList.add('webgl-active');

    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      setupScrollTriggers();

      // Entrance animation
      const activeStates = getActiveStates();
      const targetScale = activeStates[0].scale;
      gsap.fromTo(activeConfig,
        { scale: 0.1, pctY: -0.4 },
        { scale: targetScale, pctY: activeStates[0].pctY, duration: 1.5, ease: 'power3.out' }
      );
    }
  }

  // ---- render loop ----
  const clock = new THREE.Clock();
  function animate() {
    const t = clock.getElapsedTime();

    // Calculate dimensions in 3D units at z = 0
    const vFOV = (camera.fov * Math.PI) / 180;
    const visibleHeight = 2 * Math.tan(vFOV / 2) * camera.position.z;
    const visibleWidth = visibleHeight * camera.aspect;

    const targetX = activeConfig.pctX * visibleWidth;
    const targetY = activeConfig.pctY * visibleHeight;

    // Apply floating idle sway
    const floatSway = Math.sin(t * 0.9) * 0.12 * activeConfig.scale;
    group.position.x = targetX;
    group.position.y = targetY + floatSway;

    // Scale group
    group.scale.setScalar(activeConfig.scale);

    // Update shadow position and scale (so it moves and scales with the bag but doesn't rotate)
    if (shadow) {
      shadow.position.x = targetX;
      shadow.position.y = targetY - (3.2 / 2) - 0.25;
      shadow.position.z = -0.4;
      shadow.scale.setScalar(activeConfig.scale);
    }

    // Apply explode distance to backdrop (keep front and back cards sealed at z = 0)
    const exp = activeConfig.explode;
    if (layerBackdrop) {
      layerBackdrop.position.z = -0.4 - exp * 0.8;
    }
    if (layerFrontCard) {
      layerFrontCard.position.z = 0.0;
    }
    if (layerBackCard) {
      layerBackCard.position.z = 0.0;
    }

    // Apply scatter and animate ingredients individually
    const scat = activeConfig.scatter;
    ingredients.forEach((item) => {
      // Rotate the individual ingredient
      item.mesh.rotation.x += item.rotSpeed.x * 0.01;
      item.mesh.rotation.y += item.rotSpeed.y * 0.01;
      item.mesh.rotation.z += item.rotSpeed.z * 0.01;

      // Calculate position with idle sway and scatter scale
      const swayX = Math.sin(t * item.swaySpeed) * item.swayAmount;
      const swayY = Math.cos(t * item.swaySpeed * 1.1) * item.swayAmount;

      item.mesh.position.x = item.basePos.x * (1.0 + scat * 0.8) + swayX;
      item.mesh.position.y = item.basePos.y * (1.0 + scat * 0.5) + swayY;
      item.mesh.position.z = item.basePos.z + (scat * 1.2);
    });

    // Apply rotation to the group
    const spinFactor = activeConfig.autoSpin;
    if (spinFactor > 0) {
      group.rotation.y = activeConfig.rotY + (t * spinFactor) + pointer.x * 0.25;
    } else {
      group.rotation.y = activeConfig.rotY + pointer.x * 0.25;
    }
    group.rotation.x = activeConfig.rotX + pointer.y * 0.15;
    group.rotation.z = activeConfig.rotZ;

    // camera pointer parallax
    camera.position.x += (pointer.x * 0.4 - camera.position.x) * 0.04;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  // ---- resize ----
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth <= 992 ? 1.5 : 2));

    // Reset canvas opacity in case scroll state changed breakpoint
    canvas.style.opacity = '';
    setupScrollTriggers();
  });
}
