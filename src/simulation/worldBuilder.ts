import * as THREE from 'three';
import { EnvironmentConfig } from '../types/game';
import { calculateAltitudeAtDistance } from '../utils/physics';

export interface WorldBuildResult {
  scene: THREE.Scene;
  roadMesh: THREE.Mesh;
  finishLineMesh: THREE.Mesh;
  trafficLights: Array<{
    distanceZ: number;
    mesh: THREE.Group;
    lightBulb: THREE.Mesh;
    isRed: boolean;
  }>;
}

export function buildEnvironmentWorld(scene: THREE.Scene, config: EnvironmentConfig): WorldBuildResult {
  // Clear previous meshes
  while (scene.children.length > 0) {
    scene.remove(scene.children[0]);
  }

  // 1. Lighting Setup
  const ambientLight = new THREE.AmbientLight(
    new THREE.Color(config.ambientLightColor),
    0.6
  );
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(40, 80, 50);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 300;
  dirLight.shadow.camera.left = -60;
  dirLight.shadow.camera.right = 60;
  dirLight.shadow.camera.top = 60;
  dirLight.shadow.camera.bottom = -60;
  scene.add(dirLight);

  // Fog
  scene.fog = new THREE.FogExp2(new THREE.Color(config.skyColor), config.fogDensity);
  scene.background = new THREE.Color(config.skyColor);

  // 2. Road Geometry with Slope & Curvature
  const roadLength = config.roadLengthM;
  const roadWidth = config.laneCount * 3.8;
  const segments = Math.floor(roadLength / 10);

  const roadGeom = new THREE.PlaneGeometry(roadWidth, roadLength, config.laneCount, segments);
  roadGeom.rotateX(-Math.PI / 2);

  // Apply terrain elevation along Z axis to vertices
  const posAttr = roadGeom.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const z = posAttr.getY(i) + roadLength / 2; // local z in meters
    const { altitudeM } = calculateAltitudeAtDistance(z, config.maxGradePercent);
    posAttr.setZ(i, altitudeM);
  }
  roadGeom.computeVertexNormals();

  const roadMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(config.roadColor),
    roughness: 0.8,
  });
  const roadMesh = new THREE.Mesh(roadGeom, roadMat);
  roadMesh.position.set(0, 0, roadLength / 2);
  roadMesh.receiveShadow = true;
  scene.add(roadMesh);

  // Lane dividers (Dashed lines)
  const laneDividerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const dashLength = 4;
  const gapLength = 6;
  const step = dashLength + gapLength;

  for (let lane = 1; lane < config.laneCount; lane++) {
    const laneX = -roadWidth / 2 + lane * 3.8;
    for (let z = 0; z < roadLength; z += step) {
      const { altitudeM } = calculateAltitudeAtDistance(z, config.maxGradePercent);
      const dashGeom = new THREE.PlaneGeometry(0.18, dashLength);
      dashGeom.rotateX(-Math.PI / 2);
      const dashMesh = new THREE.Mesh(dashGeom, laneDividerMat);
      dashMesh.position.set(laneX, altitudeM + 0.02, z + dashLength / 2);
      scene.add(dashMesh);
    }
  }

  // 3. Ground / Landscape Terrain
  const groundGeom = new THREE.PlaneGeometry(350, roadLength + 200, 30, segments);
  groundGeom.rotateX(-Math.PI / 2);
  const groundPos = groundGeom.attributes.position;
  for (let i = 0; i < groundPos.count; i++) {
    const x = groundPos.getX(i);
    const z = groundPos.getY(i) + roadLength / 2;
    const { altitudeM } = calculateAltitudeAtDistance(z, config.maxGradePercent);
    // Add side hills
    const distFromRoad = Math.abs(x) - roadWidth / 2;
    const sideElevation = distFromRoad > 0 ? Math.sin(distFromRoad * 0.05) * 8 : 0;
    groundPos.setZ(i, altitudeM - 0.2 + sideElevation);
  }
  groundGeom.computeVertexNormals();

  const groundMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(config.groundColor),
    roughness: 0.9,
  });
  const groundMesh = new THREE.Mesh(groundGeom, groundMat);
  groundMesh.position.set(0, -0.05, roadLength / 2);
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

  // 4. Scenery Props (City Buildings, Highway Guardrails, Mountain Trees)
  if (config.id === 'URBAN_CONGESTION') {
    // City Highrises
    const buildingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const windowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    for (let z = 50; z < roadLength - 50; z += 40) {
      [-1, 1].forEach((side) => {
        const h = 20 + Math.random() * 45;
        const bGeom = new THREE.BoxGeometry(16, h, 24);
        const bMesh = new THREE.Mesh(bGeom, buildingMat);
        const { altitudeM } = calculateAltitudeAtDistance(z, config.maxGradePercent);
        bMesh.position.set(side * (roadWidth / 2 + 16), altitudeM + h / 2, z);
        bMesh.castShadow = true;
        scene.add(bMesh);

        // Streetlamp
        const lampGeom = new THREE.CylinderGeometry(0.1, 0.1, 7);
        const lampMesh = new THREE.Mesh(lampGeom, buildingMat);
        lampMesh.position.set(side * (roadWidth / 2 + 1.5), altitudeM + 3.5, z);
        scene.add(lampMesh);
      });
    }
  } else if (config.id === 'HIGHWAY') {
    // Overhead Sign Gantries & Guardrails
    for (let z = 300; z < roadLength; z += 600) {
      const { altitudeM } = calculateAltitudeAtDistance(z, config.maxGradePercent);
      const gantryGeom = new THREE.BoxGeometry(roadWidth + 4, 1.2, 0.6);
      const gantryMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
      const gantry = new THREE.Mesh(gantryGeom, gantryMat);
      gantry.position.set(0, altitudeM + 7.5, z);
      scene.add(gantry);

      // Support pillars
      const pillarGeom = new THREE.CylinderGeometry(0.25, 0.25, 8);
      const pL = new THREE.Mesh(pillarGeom, gantryMat);
      pL.position.set(-roadWidth / 2 - 1.8, altitudeM + 4, z);
      const pR = new THREE.Mesh(pillarGeom, gantryMat);
      pR.position.set(roadWidth / 2 + 1.8, altitudeM + 4, z);
      scene.add(pL);
      scene.add(pR);
    }
  } else {
    // Mountain Trees & Rocks
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.8 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03 });

    for (let z = 20; z < roadLength; z += 25) {
      [-1, 1].forEach((side) => {
        const { altitudeM } = calculateAltitudeAtDistance(z, config.maxGradePercent);
        const treeGroup = new THREE.Group();

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 2), trunkMat);
        trunk.position.y = 1;
        treeGroup.add(trunk);

        const leaves = new THREE.Mesh(new THREE.ConeGeometry(2.2, 5, 6), treeMat);
        leaves.position.y = 4;
        treeGroup.add(leaves);

        treeGroup.position.set(side * (roadWidth / 2 + 5 + Math.random() * 20), altitudeM, z);
        scene.add(treeGroup);
      });
    }
  }

  // 5. Traffic Lights (for Urban)
  const trafficLights: WorldBuildResult['trafficLights'] = [];
  if (config.trafficLightCount > 0) {
    const spacing = roadLength / (config.trafficLightCount + 1);
    for (let i = 1; i <= config.trafficLightCount; i++) {
      const zPos = i * spacing;
      const { altitudeM } = calculateAltitudeAtDistance(zPos, config.maxGradePercent);

      const lightGroup = new THREE.Group();
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 6),
        new THREE.MeshStandardMaterial({ color: 0x334155 })
      );
      pole.position.set(roadWidth / 2 + 1.5, 3, 0);
      lightGroup.add(pole);

      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 1.6, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x0f172a })
      );
      box.position.set(roadWidth / 2 + 1.5, 5.2, 0);
      lightGroup.add(box);

      const bulbGeom = new THREE.SphereGeometry(0.2, 12, 12);
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const lightBulb = new THREE.Mesh(bulbGeom, bulbMat);
      lightBulb.position.set(roadWidth / 2 + 1.5, 5.6, -0.26);
      lightGroup.add(lightBulb);

      lightGroup.position.set(0, altitudeM, zPos);
      scene.add(lightGroup);

      trafficLights.push({
        distanceZ: zPos,
        mesh: lightGroup,
        lightBulb,
        isRed: true,
      });
    }
  }

  // 6. Finish / Goal Line Banner
  const { altitudeM: finishAlt } = calculateAltitudeAtDistance(roadLength, config.maxGradePercent);
  const finishGeom = new THREE.PlaneGeometry(roadWidth, 3);
  finishGeom.rotateX(-Math.PI / 2);
  const finishMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.6,
  });
  const finishLineMesh = new THREE.Mesh(finishGeom, finishMat);
  finishLineMesh.position.set(0, finishAlt + 0.05, roadLength);
  scene.add(finishLineMesh);

  // Goal Arch
  const archGeom = new THREE.BoxGeometry(roadWidth + 2, 1.5, 0.8);
  const archMat = new THREE.MeshStandardMaterial({ color: 0x0891b2, emissive: 0x06b6d4, emissiveIntensity: 0.4 });
  const arch = new THREE.Mesh(archGeom, archMat);
  arch.position.set(0, finishAlt + 6.5, roadLength);
  scene.add(arch);

  return {
    scene,
    roadMesh,
    finishLineMesh,
    trafficLights,
  };
}
