import * as THREE from 'three';
import { VehicleType } from '../types/game';

export interface VehicleMeshBundle {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  brakeLights: THREE.Mesh[];
  headlights: THREE.SpotLight[];
  cabinMesh?: THREE.Mesh;
}

export function createVehicleMesh(type: VehicleType): VehicleMeshBundle {
  const group = new THREE.Group();
  const wheels: THREE.Mesh[] = [];
  const brakeLights: THREE.Mesh[] = [];
  const headlights: THREE.SpotLight[] = [];

  // Colors based on powertrain
  let bodyColor = 0x06b6d4; // EV Cyan
  let accentColor = 0x38bdf8;
  if (type === 'PHEV') {
    bodyColor = 0x10b981; // Emerald
    accentColor = 0x34d399;
  } else if (type === 'ICE') {
    bodyColor = 0xf59e0b; // Amber
    accentColor = 0xfbbf24;
  }

  // 1. Car Body Lower Chassis
  const chassisGeom = new THREE.BoxGeometry(1.85, 0.55, 4.3);
  const chassisMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    metalness: 0.8,
    roughness: 0.25,
  });
  const chassis = new THREE.Mesh(chassisGeom, chassisMat);
  chassis.position.y = 0.5;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  group.add(chassis);

  // 2. Aerodynamic Cabin / Glass Greenhouse
  const cabinGeom = new THREE.BoxGeometry(1.5, 0.45, 2.3);
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.85,
  });
  const cabin = new THREE.Mesh(cabinGeom, glassMat);
  cabin.position.set(0, 0.95, -0.2);
  cabin.castShadow = true;
  group.add(cabin);

  // 3. Roof Panel
  const roofGeom = new THREE.BoxGeometry(1.48, 0.05, 2.1);
  const roofMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    metalness: 0.7,
    roughness: 0.3,
  });
  const roof = new THREE.Mesh(roofGeom, roofMat);
  roof.position.set(0, 1.2, -0.2);
  group.add(roof);

  // 4. Front Hood Slope
  const hoodGeom = new THREE.BoxGeometry(1.7, 0.15, 1.1);
  const hood = new THREE.Mesh(hoodGeom, chassisMat);
  hood.position.set(0, 0.7, 1.5);
  hood.rotation.x = -0.12;
  group.add(hood);

  // 5. LED Headlights & Beam
  const headGeom = new THREE.BoxGeometry(0.35, 0.12, 0.05);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 1.5,
  });

  const leftHead = new THREE.Mesh(headGeom, headMat);
  leftHead.position.set(-0.65, 0.55, 2.15);
  group.add(leftHead);

  const rightHead = new THREE.Mesh(headGeom, headMat);
  rightHead.position.set(0.65, 0.55, 2.15);
  group.add(rightHead);

  // Spotlights for night / tunnel lighting
  const leftSpot = new THREE.SpotLight(0xffffff, 15, 45, Math.PI / 6, 0.4);
  leftSpot.position.set(-0.65, 0.55, 2.2);
  leftSpot.target.position.set(-0.65, 0, 20);
  group.add(leftSpot);
  group.add(leftSpot.target);
  headlights.push(leftSpot);

  const rightSpot = new THREE.SpotLight(0xffffff, 15, 45, Math.PI / 6, 0.4);
  rightSpot.position.set(0.65, 0.55, 2.2);
  rightSpot.target.position.set(0.65, 0, 20);
  group.add(rightSpot);
  group.add(rightSpot.target);
  headlights.push(rightSpot);

  // 6. LED Brake Light Bar
  const brakeGeom = new THREE.BoxGeometry(1.6, 0.1, 0.05);
  const brakeMat = new THREE.MeshStandardMaterial({
    color: 0xff1111,
    emissive: 0xff0000,
    emissiveIntensity: 0.8,
  });
  const brakeBar = new THREE.Mesh(brakeGeom, brakeMat);
  brakeBar.position.set(0, 0.6, -2.15);
  group.add(brakeBar);
  brakeLights.push(brakeBar);

  // 7. Wheels & Rims
  const wheelGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.24, 16);
  wheelGeom.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.8,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8,
    metalness: 0.9,
    roughness: 0.2,
  });

  const wheelPositions = [
    [-0.92, 0.35, 1.35],  // Front Left
    [0.92, 0.35, 1.35],   // Front Right
    [-0.92, 0.35, -1.35], // Rear Left
    [0.92, 0.35, -1.35],  // Rear Right
  ];

  wheelPositions.forEach(([x, y, z]) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(x, y, z);

    const tire = new THREE.Mesh(wheelGeom, tireMat);
    tire.castShadow = true;
    wheelGroup.add(tire);

    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.25, 8).rotateZ(Math.PI / 2),
      rimMat
    );
    wheelGroup.add(rim);

    group.add(wheelGroup);
    wheels.push(tire);
  });

  // 8. Vehicle Specific Badges / Grille
  if (type === 'EV') {
    // Closed Grille & Aero diffuser
    const diffuserGeom = new THREE.BoxGeometry(1.4, 0.1, 0.4);
    const diffuserMat = new THREE.MeshStandardMaterial({ color: 0x09090b });
    const diffuser = new THREE.Mesh(diffuserGeom, diffuserMat);
    diffuser.position.set(0, 0.25, -2.1);
    group.add(diffuser);
  } else if (type === 'ICE') {
    // Twin Exhaust Pipes
    const exhaustGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 12).rotateX(Math.PI / 2);
    const exhaustMat = new THREE.MeshStandardMaterial({ color: 0xa1a1aa, metalness: 0.9 });
    const exL = new THREE.Mesh(exhaustGeom, exhaustMat);
    exL.position.set(-0.45, 0.25, -2.15);
    const exR = new THREE.Mesh(exhaustGeom, exhaustMat);
    exR.position.set(-0.6, 0.25, -2.15);
    group.add(exL);
    group.add(exR);
  }

  return {
    group,
    wheels,
    brakeLights,
    headlights,
    cabinMesh: cabin,
  };
}

export function createTrafficVehicleMesh(variant: 'SEDAN' | 'SUV' | 'BUS'): { group: THREE.Group; brakeLight: THREE.Mesh } {
  const group = new THREE.Group();

  let color = 0x475569;
  let size = { w: 1.8, h: 0.6, l: 4.2 };

  if (variant === 'SUV') {
    color = 0x334155;
    size = { w: 1.9, h: 0.8, l: 4.5 };
  } else if (variant === 'BUS') {
    color = 0x2563eb;
    size = { w: 2.3, h: 1.6, l: 8.5 };
  }

  const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: 0.4 });
  const geom = new THREE.BoxGeometry(size.w, size.h, size.l);
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.y = size.h / 2 + 0.3;
  mesh.castShadow = true;
  group.add(mesh);

  // Cabin
  const cabinGeom = new THREE.BoxGeometry(size.w * 0.9, size.h * 0.7, size.l * 0.55);
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
  const cabin = new THREE.Mesh(cabinGeom, cabinMat);
  cabin.position.set(0, size.h + 0.3, -size.l * 0.05);
  group.add(cabin);

  // Brake Light
  const blGeom = new THREE.BoxGeometry(size.w * 0.8, 0.1, 0.05);
  const blMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x880000 });
  const brakeLight = new THREE.Mesh(blGeom, blMat);
  brakeLight.position.set(0, size.h * 0.6 + 0.3, -size.l / 2 - 0.02);
  group.add(brakeLight);

  return { group, brakeLight };
}
