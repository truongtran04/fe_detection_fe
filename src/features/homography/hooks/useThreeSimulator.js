import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { PARTICLE_COUNT } from '../constants.js';
import { createTiltArcGeometry, createTextSprite } from '../utils/threeHelpers.js';

export function useThreeSimulator({
  roomW,
  roomL,
  roomH,
  camZ,
  nozZ,
  ceilingNozzle,
  ceilingCctv,
  simulatedFire,
  targets,
  isDemoImage
}) {
  const threeContainerRef = useRef(null);
  const sceneRef = useRef(null);
  const controlsRef = useRef(null);
  const waterParticlesRef = useRef(null);

  const meshRefs = useRef({
    roomWireframe: null,
    nozzleMarker: null,
    nozzlePillar: null,
    cameraMarker: null,
    cameraPillar: null,
    laserBeam: null,
    distanceLine: null,
    fireMarker: null,
    panRefLine: null,
    panDirLine: null,
    tiltArc: null,
    tiltRefLine: null,
    tiltLabelSprite: null,
    panArc: null,
    panLabelSprite: null,
    cornerLabels: []
  });

  const animateWater = () => {
    const pts = waterParticlesRef.current;
    if (!pts?.userData) return;
    const pos = pts.geometry.attributes.position.array;
    const { start, end, progress, speeds } = pts.userData;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      progress[i] += speeds[i];
      if (progress[i] > 1.0) progress[i] = 0.0;
      const t = progress[i];
      pos[i * 3] = (1 - t) * start.x + t * end.x;
      pos[i * 3 + 2] = (1 - t) * start.z + t * end.z;
      const fall = 0.4 * Math.sin(t * Math.PI);
      pos[i * 3 + 1] = (1 - t) * start.y + t * end.y - fall;
    }
    pts.geometry.attributes.position.needsUpdate = true;
  };

  const initSprayParticles = (scene, start, end) => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = start.x;
      positions[i * 3 + 1] = start.y;
      positions[i * 3 + 2] = start.z;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pts = new THREE.Points(
      geom,
      new THREE.PointsMaterial({
        color: 0x38bdf8,
        size: 0.04,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending
      })
    );
    scene.add(pts);
    waterParticlesRef.current = pts;
    pts.userData = {
      start: start.clone(),
      end: end.clone(),
      progress: Array.from({ length: PARTICLE_COUNT }, () => Math.random()),
      speeds: Array.from({ length: PARTICLE_COUNT }, () => 0.012 + Math.random() * 0.018)
    };
  };

  useEffect(() => {
    const container = threeContainerRef.current;
    if (!container) return;
    const w = container.clientWidth || 320;
    const h = container.clientHeight || 480;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0c10);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 6.0, 5.0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controlsRef.current = controls;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 5);
    scene.add(dir);

    const grids = new THREE.GridHelper(12, 12, 0x6366f1, 0x1e293b);
    grids.position.y = -0.005;
    scene.add(grids);

    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      animateWater();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const wBox = container.clientWidth;
      const hBox = container.clientHeight;
      if (wBox > 0 && hBox > 0) {
        camera.aspect = wBox / hBox;
        camera.updateProjectionMatrix();
        renderer.setSize(wBox, hBox);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (controlsRef.current) {
      controlsRef.current.target.set(0, roomH / 2, 0);
      controlsRef.current.update();
    }

    const refs = meshRefs.current;
    [
      refs.roomWireframe, refs.nozzleMarker, refs.nozzlePillar,
      refs.cameraMarker, refs.cameraPillar, refs.distanceLine,
      refs.laserBeam, refs.fireMarker, waterParticlesRef.current,
      refs.panRefLine, refs.panDirLine, refs.tiltArc, refs.tiltRefLine,
      refs.tiltLabelSprite, refs.panArc, refs.panLabelSprite,
      ...refs.cornerLabels
    ].forEach(obj => { if (obj) scene.remove(obj); });
    refs.cornerLabels = [];
    waterParticlesRef.current = null;

    const w = roomL, l = roomW, h = roomH;
    const nx = ceilingNozzle.x, ny = -ceilingNozzle.y;
    const cx = ceilingCctv.x, cy = -ceilingCctv.y;

    const roomGeom = new THREE.BoxGeometry(w, h, l);
    const edges = new THREE.EdgesGeometry(roomGeom);
    const wireframe = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x27273a }));
    wireframe.position.set(0, h / 2, 0);
    scene.add(wireframe);
    refs.roomWireframe = wireframe;

    const nozMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.1, 16),
      new THREE.MeshPhongMaterial({ color: 0xd946ef, emissive: 0xd946ef, emissiveIntensity: 0.15 })
    );
    nozMesh.position.set(nx, nozZ - 0.05, ny);
    scene.add(nozMesh);
    refs.nozzleMarker = nozMesh;

    const nozPill = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, nozZ, 8),
      new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.15 })
    );
    nozPill.position.set(nx, nozZ / 2, ny);
    scene.add(nozPill);
    refs.nozzlePillar = nozPill;

    const camMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.1, 0.2),
      new THREE.MeshPhongMaterial({ color: 0xeab308, emissive: 0xeab308, emissiveIntensity: 0.15 })
    );
    camMesh.position.set(cx, camZ - 0.05, cy);
    camMesh.lookAt(new THREE.Vector3(nx, nozZ, ny));
    scene.add(camMesh);
    refs.cameraMarker = camMesh;

    const camPill = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, camZ, 8),
      new THREE.MeshBasicMaterial({ color: 0xeab308, transparent: true, opacity: 0.15 })
    );
    camPill.position.set(cx, camZ / 2, cy);
    scene.add(camPill);
    refs.cameraPillar = camPill;

    const connGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(cx, camZ, cy),
      new THREE.Vector3(nx, nozZ, ny)
    ]);
    const connLine = new THREE.Line(
      connGeom,
      new THREE.LineDashedMaterial({ color: 0x0ea5e9, dashSize: 0.15, gapSize: 0.08 })
    );
    connLine.computeLineDistances();
    scene.add(connLine);
    refs.distanceLine = connLine;

    let tx = null, ty = null;
    if (targets.length > 0) {
      tx = targets[0].real[0];
      ty = -targets[0].real[1];
    } else if (isDemoImage) {
      tx = simulatedFire.x;
      ty = -simulatedFire.y;
    }

    if (tx !== null && ty !== null) {
      const fCone = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 0.4, 8),
        new THREE.MeshPhongMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.5 })
      );
      fCone.position.set(tx, 0.2, ty);
      scene.add(fCone);
      refs.fireMarker = fCone;

      const startVec = new THREE.Vector3(nx, nozZ, ny);
      const endVec = new THREE.Vector3(tx, 0.05, ty);
      const path = new THREE.LineCurve3(startVec, endVec);
      const laser = new THREE.Mesh(
        new THREE.TubeGeometry(path, 1, 0.01, 6, false),
        new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.8 })
      );
      scene.add(laser);
      refs.laserBeam = laser;

      const dx = tx - nx;
      const dz = ty - ny;
      const D = Math.hypot(dx, dz);
      const panRad = Math.atan2(dz, dx);

      const pRef = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(nx, roomH, ny),
        new THREE.Vector3(nx + 0.4, roomH, ny)
      ]);
      const pRefLine = new THREE.Line(pRef, new THREE.LineDashedMaterial({ color: 0x64748b, dashSize: 0.03, gapSize: 0.015 }));
      pRefLine.computeLineDistances();
      scene.add(pRefLine);
      refs.panRefLine = pRefLine;

      const pDir = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(nx, roomH, ny),
        new THREE.Vector3(nx + 0.4 * Math.cos(panRad), roomH, ny + 0.4 * Math.sin(panRad))
      ]);
      const pDirLine = new THREE.Line(pDir, new THREE.LineBasicMaterial({ color: 0x0ea5e9 }));
      scene.add(pDirLine);
      refs.panDirLine = pDirLine;

      const tiltArcRadius = 0.3;
      const tiltArcGeom = createTiltArcGeometry(nx, ny, roomH, tx, ty, 0.05, tiltArcRadius);
      if (tiltArcGeom) {
        const tiltArcMesh = new THREE.Mesh(tiltArcGeom, new THREE.MeshBasicMaterial({ color: 0xf97316 }));
        scene.add(tiltArcMesh);
        refs.tiltArc = tiltArcMesh;
      }

      const horizDir = new THREE.Vector3(tx - nx, 0, ty - ny);
      const arcEndVec = new THREE.Vector3(tx - nx, 0.05 - roomH, ty - ny).normalize();

      let labelX = nx, labelY = roomH - 0.5, labelZ = ny;
      if (horizDir.lengthSq() > 1e-6) {
        const arcStartVec = horizDir.normalize();

        // Vẽ đoạn thẳng ngang ngắn từ nozzle (tâm trần) cho góc tilt chạm vào (Nét liền, dài 0.6m)
        const tRefGeom = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(nx, roomH, ny),
          new THREE.Vector3(nx + arcStartVec.x * 0.6, roomH, ny + arcStartVec.z * 0.6)
        ]);
        const tRefLine = new THREE.Line(
          tRefGeom,
          new THREE.LineBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.8 })
        );
        scene.add(tRefLine);
        refs.tiltRefLine = tRefLine;

        const arcAngle = arcStartVec.angleTo(arcEndVec);
        const arcAxis = new THREE.Vector3().crossVectors(arcStartVec, arcEndVec).normalize();

        if (arcAxis.lengthSq() > 1e-6) {
          const midPt = arcStartVec.clone().applyAxisAngle(arcAxis, arcAngle / 2).multiplyScalar(0.36);
          labelX = nx + midPt.x;
          labelY = roomH + midPt.y;
          labelZ = ny + midPt.z;
        }
      }

      const labelSprite = createTextSprite('α', '#f97316');
      labelSprite.position.set(labelX, labelY, labelZ);
      scene.add(labelSprite);
      refs.tiltLabelSprite = labelSprite;

      const panArcPoints = [];
      const panArcRadius = 0.45;
      const panArcSteps = 32;
      const panArcStart = 0;
      for (let i = 0; i <= panArcSteps; i++) {
        const theta = panArcStart + (panRad - panArcStart) * (i / panArcSteps);
        panArcPoints.push(new THREE.Vector3(
          nx + panArcRadius * Math.cos(theta),
          roomH,
          ny + panArcRadius * Math.sin(theta)
        ));
      }
      if (panArcPoints.length >= 2) {
        const panArcCurve = new THREE.CatmullRomCurve3(panArcPoints);
        const panArcGeom = new THREE.TubeGeometry(panArcCurve, 32, 0.012, 8, false);
        const panArcMesh = new THREE.Mesh(panArcGeom, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        scene.add(panArcMesh);
        refs.panArc = panArcMesh;
      }

      const panMidAngle = panRad / 2;
      const panLabelSprite = createTextSprite('θ', '#38bdf8');
      panLabelSprite.position.set(
        nx + (panArcRadius + 0.18) * Math.cos(panMidAngle),
        roomH,
        ny + (panArcRadius + 0.18) * Math.sin(panMidAngle)
      );
      scene.add(panLabelSprite);
      refs.panLabelSprite = panLabelSprite;

      initSprayParticles(scene, startVec, endVec);
    }

    const cornerDefs = [
      { label: 'TL', x: -roomL / 2, z: -roomW / 2 },
      { label: 'TR', x: roomL / 2, z: -roomW / 2 },
      { label: 'BR', x: roomL / 2, z: roomW / 2 },
      { label: 'BL', x: -roomL / 2, z: roomW / 2 },
    ];
    refs.cornerLabels = cornerDefs.map(({ label, x, z }) => {
      const s = createTextSprite(label, '#6366f1');
      s.scale.set(0.5, 0.5, 1);
      s.position.set(x, 0.05, z);
      scene.add(s);
      return s;
    });
  }, [roomW, roomL, roomH, ceilingNozzle, ceilingCctv, simulatedFire, targets, isDemoImage, camZ, nozZ]);

  return { threeContainerRef };
}
