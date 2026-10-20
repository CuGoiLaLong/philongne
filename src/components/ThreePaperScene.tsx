import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  PaperStyleConfig,
  createFrontTexture,
  createBackTexture,
  createFlatPaperGeometry,
  CARD_ASPECT_RATIO,
  CardContentVariant,
} from '../utils/paperTextures';
import { paperAudio } from '../utils/audio';

interface ThreePaperSceneProps {
  paperTone: 'parchment' | 'linen' | 'antique';
  cardScale?: number; // 0.75 to 1.25, default 1.0
  cardVariant: CardContentVariant;
  isFlipped: boolean;
  onFlipChange: (flipped: boolean) => void;
  gyroEnabled: boolean;
  onInteraction?: () => void;
  triggerSwingCount?: number;
}

// Pre-allocated reusable math helpers (Zero GC in animation loop)
const _pointerPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const _raycaster = new THREE.Raycaster();
const _planeIntersect = new THREE.Vector3();
const _tmpVec3A = new THREE.Vector3();
const _tmpVec3B = new THREE.Vector3();

// Paper dimensions accurately matching card aspect ratio (2612 / 1960 ≈ 1.3327)
// Scaled nicely so on iPhone 12 Pro Max and all screens, it sits comfortably centered with clean margins
const BASE_PAPER_W = 1.36;
const BASE_PAPER_H = BASE_PAPER_W / CARD_ASPECT_RATIO; // ~1.0205
const CARD_REST_Y = 0.38; // Positioned comfortably in the upper-mid screen

export const ThreePaperScene: React.FC<ThreePaperSceneProps> = ({
  paperTone,
  cardScale = 1.0,
  cardVariant,
  isFlipped,
  onFlipChange,
  gyroEnabled,
  onInteraction,
  triggerSwingCount = 0,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Scene references for updates without remounting
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    paperMeshFront: THREE.Mesh;
    paperMeshBack: THREE.Mesh;
    frontMaterial: THREE.MeshStandardMaterial;
    backMaterial: THREE.MeshStandardMaterial;
    cardGroup: THREE.Group;
    clipGroup: THREE.Group;
    ropeMesh: THREE.Mesh;
    ropeCurve: THREE.CatmullRomCurve3;
    ropeNodes: { pos: THREE.Vector3; oldPos: THREE.Vector3 }[];
    cardPhysics: {
      pos: THREE.Vector3;
      vel: THREE.Vector3;
      rot: THREE.Euler;
      angVel: THREE.Vector3;
      targetRotY: number;
    };
    isDragging: boolean;
    dragOffset: THREE.Vector3;
    aspectRatio: number;
    scaleMultiplier: number;
  } | null>(null);

  // Sync scale multiplier
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.scaleMultiplier = cardScale;
      sceneRef.current.cardGroup.scale.setScalar(cardScale);
    }
  }, [cardScale]);

  // Sync flip prop to physics targetRotY
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.cardPhysics.targetRotY = isFlipped ? Math.PI : 0;
      paperAudio.playFlip();
    }
  }, [isFlipped]);

  // Sync swing impulse on triggerSwingCount change
  useEffect(() => {
    if (triggerSwingCount > 0 && sceneRef.current) {
      const p = sceneRef.current.cardPhysics;
      p.vel.x += (Math.random() - 0.5) * 2.2;
      p.vel.z += (Math.random() - 0.5) * 1.8;
      p.angVel.x += (Math.random() - 0.5) * 1.0;
      p.angVel.y += (Math.random() - 0.5) * 1.8;
      p.angVel.z += (Math.random() - 0.5) * 0.9;
      paperAudio.playSwing();
    }
  }, [triggerSwingCount]);

  // Regenerate textures when paperTone or cardVariant changes
  useEffect(() => {
    let active = true;
    const updateTextures = async () => {
      if (!sceneRef.current) return;
      const config: PaperStyleConfig = {
        tone: paperTone,
        variant: cardVariant,
      };
      const [frontTex, backTex] = await Promise.all([
        createFrontTexture(config),
        Promise.resolve(createBackTexture(config)),
      ]);
      if (!active || !sceneRef.current) {
        frontTex.dispose();
        backTex.dispose();
        return;
      }
      sceneRef.current.frontMaterial.map?.dispose();
      sceneRef.current.backMaterial.map?.dispose();

      sceneRef.current.frontMaterial.map = frontTex;
      sceneRef.current.backMaterial.map = backTex;
      sceneRef.current.frontMaterial.needsUpdate = true;
      sceneRef.current.backMaterial.needsUpdate = true;
    };
    updateTextures();
    return () => {
      active = false;
    };
  }, [paperTone, cardVariant]);

  // Helper to calculate camera distance
  const computeCameraZ = (aspect: number, fov: number) => {
    // Mobile phones (iPhone 12 Pro Max aspect ~0.46)
    const targetWidthRatio = aspect < 0.6 ? 0.68 : aspect < 1.0 ? 0.54 : 0.40;
    const visibleWidth = BASE_PAPER_W / targetWidthRatio;
    const visibleHeight = visibleWidth / aspect;
    const halfFovRad = (fov * 0.5 * Math.PI) / 180;
    return (visibleHeight * 0.5) / Math.tan(halfFovRad);
  };

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animFrameId: number;
    let isDisposed = false;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const aspect = width / height;

    // 1. Scene & Camera setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x12100e);
    scene.fog = new THREE.FogExp2(0x12100e, 0.04);

    const fov = 28;
    const cameraZ = computeCameraZ(aspect, fov);
    const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 100);
    camera.position.set(0, CARD_REST_Y * 0.6, cameraZ);
    camera.lookAt(0, CARD_REST_Y * 0.6, 0);

    // 2. Modern Renderer Pipeline
    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.LinearToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 3. Gentle Studio Lighting - Soft, balanced, non-bleaching (Preserves full text clarity)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.015).texture;
    pmremGenerator.dispose();

    // Ambient Hemisphere Fill (Natural, even illumination)
    const ambientLight = new THREE.AmbientLight(0xfffbf5, 0.85);
    scene.add(ambientLight);

    // Soft Key Light
    const keyLight = new THREE.DirectionalLight(0xfffaee, 0.55);
    keyLight.position.set(1.5, 3.8, 3.0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Subtle Rim Light for 3D depth
    const rimLight = new THREE.DirectionalLight(0xfef08a, 0.35);
    rimLight.position.set(-2.0, 1.5, -2.5);
    scene.add(rimLight);

    // Soft ground contact shadow
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d')!;
    const grad = sCtx.createRadialGradient(128, 128, 0, 128, 128, 120);
    grad.addColorStop(0, 'rgba(0,0,0,0.3)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.1)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 256, 256);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 3.2),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.45,
      })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = -1.6;
    scene.add(contactShadow);

    // Floating Golden Dust Particles
    const particleCount = 28;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 6;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 3;
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xfde047,
      size: 0.026,
      transparent: true,
      opacity: 0.35,
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    // 4. Build Suspended Lanyard Ribbon and Flat Paper Model
    const anchorY = 3.2;
    const ropeNodes = [
      { pos: new THREE.Vector3(0, anchorY, 0), oldPos: new THREE.Vector3(0, anchorY, 0) },
      { pos: new THREE.Vector3(0, anchorY - 0.6, 0), oldPos: new THREE.Vector3(0, anchorY - 0.6, 0) },
      { pos: new THREE.Vector3(0, anchorY - 1.2, 0), oldPos: new THREE.Vector3(0, anchorY - 1.2, 0) },
      { pos: new THREE.Vector3(0, anchorY - 1.8, 0), oldPos: new THREE.Vector3(0, anchorY - 1.8, 0) },
    ];

    const ropeCurve = new THREE.CatmullRomCurve3(
      ropeNodes.map((n) => n.pos),
      false,
      'chordal'
    );
    const ropeGeom = new THREE.TubeGeometry(ropeCurve, 32, 0.015, 8, false);
    const ropeMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.7,
      metalness: 0.1,
    });
    const ropeMesh = new THREE.Mesh(ropeGeom, ropeMat);
    scene.add(ropeMesh);

    // Ceiling Anchor Ring
    const ringMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.055, 0.012, 12, 24),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.25 })
    );
    ringMesh.position.set(0, anchorY, 0);
    scene.add(ringMesh);

    // Group for the Card and Clip
    const cardGroup = new THREE.Group();
    cardGroup.position.set(0, CARD_REST_Y, 0);
    cardGroup.scale.setScalar(cardScale);
    scene.add(cardGroup);

    // Antique Brass Clamp
    const clipGroup = new THREE.Group();
    const brassMat = new THREE.MeshPhysicalMaterial({
      color: 0xd97706,
      metalness: 0.88,
      roughness: 0.28,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2,
    });

    const clampWidth = 0.38;
    const clampBar = new THREE.Mesh(
      new THREE.BoxGeometry(clampWidth, 0.046, 0.036),
      brassMat
    );
    clampBar.castShadow = true;
    clipGroup.add(clampBar);

    const tabLeft = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.1, 0.035), brassMat);
    tabLeft.position.set(-clampWidth * 0.48, -0.035, 0);
    const tabRight = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.1, 0.035), brassMat);
    tabRight.position.set(clampWidth * 0.48, -0.035, 0);
    clipGroup.add(tabLeft);
    clipGroup.add(tabRight);

    const clampRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.046, 0.01, 12, 24),
      brassMat
    );
    clampRing.position.set(0, 0.046, 0);
    clampRing.rotation.y = Math.PI / 2;
    clipGroup.add(clampRing);

    const topOfPaperY = BASE_PAPER_H * 0.5;
    clipGroup.position.set(0, topOfPaperY, 0);
    cardGroup.add(clipGroup);

    // Flat Paper Geometry (Zero creases as requested!)
    const frontGeom = createFlatPaperGeometry(BASE_PAPER_W, BASE_PAPER_H);
    const backGeom = createFlatPaperGeometry(BASE_PAPER_W, BASE_PAPER_H);

    // Materials configured for crisp text readability (no glare / bleaching)
    const frontMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
      metalness: 0.0,
      side: THREE.FrontSide,
    });

    const backMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
      metalness: 0.0,
      side: THREE.FrontSide,
    });

    // Front Paper Mesh (Pristine flat surface, zero z-fighting)
    const paperMeshFront = new THREE.Mesh(frontGeom, frontMaterial);
    paperMeshFront.castShadow = true;
    paperMeshFront.receiveShadow = false;
    paperMeshFront.position.set(0, 0, 0.002);
    cardGroup.add(paperMeshFront);

    // Back Paper Mesh
    const paperMeshBack = new THREE.Mesh(backGeom, backMaterial);
    paperMeshBack.castShadow = true;
    paperMeshBack.receiveShadow = false;
    paperMeshBack.rotation.y = Math.PI;
    paperMeshBack.position.set(0, 0, -0.002);
    cardGroup.add(paperMeshBack);

    // Card Physics State
    const cardPhysics = {
      pos: new THREE.Vector3(0, CARD_REST_Y, 0),
      vel: new THREE.Vector3(0, 0, 0),
      rot: new THREE.Euler(0, 0, 0, 'YXZ'),
      angVel: new THREE.Vector3(0, 0, 0),
      targetRotY: isFlipped ? Math.PI : 0,
    };

    sceneRef.current = {
      renderer,
      scene,
      camera,
      paperMeshFront,
      paperMeshBack,
      frontMaterial,
      backMaterial,
      cardGroup,
      clipGroup,
      ropeMesh,
      ropeCurve,
      ropeNodes,
      cardPhysics,
      isDragging: false,
      dragOffset: new THREE.Vector3(),
      aspectRatio: aspect,
      scaleMultiplier: cardScale,
    };

    // Load initial high-res textures
    (async () => {
      try {
        const config: PaperStyleConfig = {
          tone: paperTone,
          variant: cardVariant,
        };
        const [frontTex, backTex] = await Promise.all([
          createFrontTexture(config),
          Promise.resolve(createBackTexture(config)),
        ]);
        if (!isDisposed && sceneRef.current) {
          frontMaterial.map = frontTex;
          backMaterial.map = backTex;
          frontMaterial.needsUpdate = true;
          backMaterial.needsUpdate = true;
          setIsLoading(false);
          // Initial greeting swing
          cardPhysics.angVel.y = 0.35;
          cardPhysics.vel.x = 0.2;
        }
      } catch (e) {
        console.error('Failed to load initial textures', e);
        setIsLoading(false);
      }
    })();

    // 5. Interaction Listeners
    const dom = renderer.domElement;
    dom.style.touchAction = 'none';

    let lastPointerX = 0;
    let lastPointerY = 0;
    let pointerMoveCount = 0;

    const getNDCCoords = (e: PointerEvent) => {
      const rect = dom.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      return { x, y };
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!sceneRef.current) return;
      onInteraction?.();

      const { x, y } = getNDCCoords(e);
      _raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const intersects = _raycaster.intersectObjects([paperMeshFront, paperMeshBack, clipGroup], true);

      if (intersects.length > 0) {
        sceneRef.current.isDragging = true;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        pointerMoveCount = 0;

        _pointerPlane.setFromNormalAndCoplanarPoint(
          camera.getWorldDirection(_tmpVec3A).negate(),
          cardPhysics.pos
        );
        _raycaster.ray.intersectPlane(_pointerPlane, _planeIntersect);
        sceneRef.current.dragOffset.copy(cardPhysics.pos).sub(_planeIntersect);

        dom.setPointerCapture(e.pointerId);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!sceneRef.current || !sceneRef.current.isDragging) return;

      pointerMoveCount++;
      const { x, y } = getNDCCoords(e);
      _raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

      if (_raycaster.ray.intersectPlane(_pointerPlane, _planeIntersect)) {
        const targetPos = _planeIntersect.add(sceneRef.current.dragOffset);
        
        // Physics drag impulse
        const dx = (e.clientX - lastPointerX) * 0.007;
        const dy = -(e.clientY - lastPointerY) * 0.007;

        cardPhysics.vel.x += dx * 1.5;
        cardPhysics.vel.y += dy * 1.5;
        cardPhysics.angVel.y += dx * 2.2;
        cardPhysics.angVel.x -= dy * 1.8;

        // Smooth position follow with damping
        cardPhysics.pos.x += (targetPos.x - cardPhysics.pos.x) * 0.35;
        cardPhysics.pos.y += (targetPos.y - cardPhysics.pos.y) * 0.35;

        // Sound rustle on movement
        if (pointerMoveCount % 12 === 0) {
          paperAudio.playRustle();
        }
      }

      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!sceneRef.current) return;
      if (sceneRef.current.isDragging) {
        sceneRef.current.isDragging = false;
        try {
          dom.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }

        // Tap detected: flip card!
        if (pointerMoveCount < 5) {
          onFlipChange(!isFlipped);
        } else {
          paperAudio.playSwing();
        }
      }
    };

    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointermove', onPointerMove);
    dom.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('pointercancel', onPointerUp);

    // 6. Gyroscope listener for mobile parallax
    let gyroAlpha = 0;
    let gyroBeta = 0;
    let gyroGamma = 0;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (!gyroEnabled) return;
      gyroAlpha = (e.alpha || 0) * (Math.PI / 180);
      gyroBeta = ((e.beta || 0) - 45) * (Math.PI / 180) * 0.25; // Compensate for natural holding tilt
      gyroGamma = (e.gamma || 0) * (Math.PI / 180) * 0.25;
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    // 7. Resize handler
    const handleResize = () => {
      if (!container || !sceneRef.current) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      const newAspect = w / h;
      sceneRef.current.aspectRatio = newAspect;

      camera.aspect = newAspect;
      const newZ = computeCameraZ(newAspect, fov);
      camera.position.z = newZ;
      camera.position.y = CARD_REST_Y * 0.6;
      camera.lookAt(0, CARD_REST_Y * 0.6, 0);
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 8. Animation & Physics Loop (Verlet rope + damped spring pendulum)
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      animFrameId = requestAnimationFrame(animate);

      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      // Particle floating drift
      const pAttr = particleGeom.getAttribute('position') as THREE.BufferAttribute;
      const posArr = pAttr.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        posArr[i * 3 + 1] += Math.sin(currentTime * 0.001 + i) * 0.0015;
        if (posArr[i * 3 + 1] > 3.5) posArr[i * 3 + 1] = -2.5;
      }
      pAttr.needsUpdate = true;

      // Physics: Pendulum spring towards rest position
      const restPos = _tmpVec3A.set(0, CARD_REST_Y, 0);
      const disp = _tmpVec3B.copy(cardPhysics.pos).sub(restPos);

      // Spring force
      const springK = 38.0;
      const damping = 4.8;
      cardPhysics.vel.x += (-springK * disp.x - damping * cardPhysics.vel.x) * dt;
      cardPhysics.vel.y += (-springK * disp.y - damping * cardPhysics.vel.y) * dt;
      cardPhysics.vel.z += (-springK * disp.z - damping * cardPhysics.vel.z) * dt;

      // Subtle natural breeze
      cardPhysics.vel.x += Math.sin(currentTime * 0.0015) * 0.015;
      cardPhysics.vel.z += Math.cos(currentTime * 0.0018) * 0.012;

      cardPhysics.pos.addScaledVector(cardPhysics.vel, dt);

      // Angular rotational physics
      // Y rotation tracks targetRotY (0 or PI)
      const rotYDiff = cardPhysics.targetRotY - cardPhysics.rot.y;
      const rotSpring = 24.0;
      const rotDamp = 5.2;

      cardPhysics.angVel.y += (rotSpring * rotYDiff - rotDamp * cardPhysics.angVel.y) * dt;
      cardPhysics.angVel.x += (-springK * 0.5 * cardPhysics.rot.x - rotDamp * cardPhysics.angVel.x) * dt;
      cardPhysics.angVel.z += (-springK * 0.5 * cardPhysics.rot.z - rotDamp * cardPhysics.angVel.z) * dt;

      // Card tilts based on lateral velocity (inertial lean)
      const targetRoll = -cardPhysics.vel.x * 0.45;
      const targetPitch = cardPhysics.vel.z * 0.4;
      cardPhysics.angVel.z += (targetRoll - cardPhysics.rot.z) * 12.0 * dt;
      cardPhysics.angVel.x += (targetPitch - cardPhysics.rot.x) * 12.0 * dt;

      // Incorporate gyroscope parallax tilt if available
      if (gyroEnabled) {
        cardPhysics.rot.x += (gyroBeta * 0.3 - cardPhysics.rot.x) * 0.05;
        cardPhysics.rot.z += (gyroGamma * 0.3 - cardPhysics.rot.z) * 0.05;
      }

      cardPhysics.rot.y += cardPhysics.angVel.y * dt;
      cardPhysics.rot.x += cardPhysics.angVel.x * dt;
      cardPhysics.rot.z += cardPhysics.angVel.z * dt;

      // Apply to card group
      cardGroup.position.copy(cardPhysics.pos);
      cardGroup.rotation.copy(cardPhysics.rot);

      // Update lanyard ribbon physics
      const topClampPos = _tmpVec3A
        .set(0, topOfPaperY, 0)
        .applyMatrix4(cardGroup.matrixWorld);

      // Node 0 fixed at ceiling anchor
      ropeNodes[0].pos.set(0, anchorY, 0);
      // Last node pinned to clamp ring
      ropeNodes[3].pos.copy(topClampPos);

      // Middle nodes simulate gentle suspension curve
      ropeNodes[1].pos.lerp(
        new THREE.Vector3(topClampPos.x * 0.25, anchorY - (anchorY - topClampPos.y) * 0.35, topClampPos.z * 0.25),
        0.3
      );
      ropeNodes[2].pos.lerp(
        new THREE.Vector3(topClampPos.x * 0.65, anchorY - (anchorY - topClampPos.y) * 0.70, topClampPos.z * 0.65),
        0.3
      );

      // Update tube geometry
      ropeMesh.geometry.dispose();
      ropeMesh.geometry = new THREE.TubeGeometry(ropeCurve, 32, 0.015, 8, false);

      renderer.render(scene, camera);
    };

    animFrameId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      isDisposed = true;
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleOrientation, true);
      }
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('pointercancel', onPointerUp);

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full select-none">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-stone-950/80 backdrop-blur-sm transition-opacity">
          <div className="w-9 h-9 border-3 border-amber-600/30 border-t-amber-400 rounded-full animate-spin mb-3" />
          <p className="text-xs font-serif text-amber-200/90 tracking-wide">
            Đang tải bức thư 20/10...
          </p>
        </div>
      )}
    </div>
  );
};
