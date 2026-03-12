function initHeroThree() {
  const container = document.getElementById('three-container');
  if (!container || typeof THREE === 'undefined') return;

  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(
    55,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);
  renderer.domElement.style.pointerEvents = 'auto';

  scene.add(new THREE.AmbientLight(0x814DE5, 0.6));

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(3, 5, 4);
  scene.add(dirLight);

  const rimLight = new THREE.PointLight(0xa47ef0, 3, 12);
  rimLight.position.set(-3, -2, 2);
  scene.add(rimLight);

  const group = new THREE.Group();
  scene.add(group);

  const icoGeo = new THREE.IcosahedronGeometry(1.1, 1);
  const icoMat = new THREE.MeshPhongMaterial({
    color:       0x814DE5,
    shininess:   40,
    transparent: true,
    opacity:     0.85,
    flatShading: true,
  });
  const ico = new THREE.Mesh(icoGeo, icoMat);
  group.add(ico);

  const wireMat = new THREE.MeshBasicMaterial({
    color:       0xa47ef0,
    wireframe:   true,
    transparent: true,
    opacity:     0.18,
  });
  const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 1), wireMat);
  group.add(wire);

  // Outer ring toruses
  const torusMat = new THREE.MeshPhongMaterial({
    color:       0x6E30E3,
    shininess:   60,
    transparent: true,
    opacity:     0.65,
  });

  const torus1 = new THREE.Mesh(
    new THREE.TorusGeometry(1.7, 0.06, 16, 80),
    torusMat
  );
  torus1.rotation.x = Math.PI / 2;
  group.add(torus1);

  const torus2 = new THREE.Mesh(
    new THREE.TorusGeometry(1.9, 0.04, 16, 80),
    torusMat.clone()
  );
  torus2.rotation.x = Math.PI / 3;
  torus2.rotation.y = Math.PI / 5;
  group.add(torus2);

  const PARTICLE_COUNT = 160;
  const positions      = new Float32Array(PARTICLE_COUNT * 3);
  const pColors        = new Float32Array(PARTICLE_COUNT * 3);
  const color          = new THREE.Color();

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const r     = 2.2 + Math.random() * 1.4;
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.random() * Math.PI;
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    color.setHSL(
      0.74 + Math.random() * 0.08,
      0.85,
      0.55 + Math.random() * 0.25
    );
    pColors[i * 3]     = color.r;
    pColors[i * 3 + 1] = color.g;
    pColors[i * 3 + 2] = color.b;
  }

  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute('color',    new THREE.BufferAttribute(pColors, 3));

  const pMat = new THREE.PointsMaterial({
    size:         0.048,
    vertexColors: true,
    transparent:  true,
    opacity:      0.85,
  });
  const particles = new THREE.Points(pGeo, pMat);
  group.add(particles);

  const mouse     = { x: 0, y: 0 };
  const target    = { x: 0, y: 0 };
  let   dragging  = false;
  let   prevMouse = { x: 0, y: 0 };

  renderer.domElement.addEventListener('mousedown', e => {
    dragging  = true;
    prevMouse = { x: e.clientX, y: e.clientY };
    renderer.domElement.style.cursor = 'grabbing';
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    target.y += (e.clientX - prevMouse.x) * 0.008;
    target.x += (e.clientY - prevMouse.y) * 0.008;
    target.x  = Math.max(-1.1, Math.min(1.1, target.x));
    prevMouse = { x: e.clientX, y: e.clientY };
  });
  document.addEventListener('mouseup', () => {
    dragging = false;
    renderer.domElement.style.cursor = 'grab';
  });
  renderer.domElement.style.cursor = 'grab';

  container.closest('.hero')?.addEventListener(
    'mousemove',
    e => {
      if (dragging) return;
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width  - 0.5) * 0.6;
      mouse.y = ((e.clientY - rect.top)  / rect.height - 0.5) * 0.6;
    },
    { passive: true }
  );

  let prevTouch = null;
  renderer.domElement.addEventListener(
    'touchstart',
    e => { prevTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY }; },
    { passive: true }
  );
  renderer.domElement.addEventListener(
    'touchmove',
    e => {
      if (!prevTouch) return;
      target.y += (e.touches[0].clientX - prevTouch.x) * 0.006;
      target.x += (e.touches[0].clientY - prevTouch.y) * 0.006;
      prevTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    },
    { passive: true }
  );
  renderer.domElement.addEventListener('touchend', () => { prevTouch = null; });

  window.addEventListener(
    'resize',
    () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    },
    { passive: true }
  );

  let currentX = 0;
  let currentY = 0;
  const clock  = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    if (!dragging) {
      target.y += 0.0012;
      target.x += Math.sin(t * 0.3) * 0.0003;
    }

    currentX += (target.x + mouse.y * 0.4 - currentX) * 0.06;
    currentY += (target.y + mouse.x * 0.4 - currentY) * 0.06;

    group.rotation.x = currentX;
    group.rotation.y = currentY;

    const pulse = 1 + Math.sin(t * 1.8) * 0.018;
    ico.scale.setScalar(pulse);

    torus1.rotation.z += 0.004;
    torus2.rotation.z -= 0.003;
    torus2.rotation.y += 0.002;

    particles.rotation.y -= 0.0015;
    particles.rotation.x += 0.0008;

    renderer.render(scene, camera);
  }

  animate();
}