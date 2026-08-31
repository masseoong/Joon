import * as THREE from 'three';
import { EnvironmentConfig } from '../types/game';
import { calculateAltitudeAtDistance } from '../utils/physics';
import { createTrafficVehicleMesh } from './vehicleModels';

export interface TrafficCar {
  group: THREE.Group;
  brakeLight: THREE.Mesh;
  lane: number;
  posX: number;
  posZ: number;
  speedMps: number;
  targetSpeedMps: number;
  variant: 'SEDAN' | 'SUV' | 'BUS';
  lengthM: number;
  widthM: number;
}

export class TrafficSystem {
  public trafficCars: TrafficCar[] = [];

  constructor(private scene: THREE.Scene, private config: EnvironmentConfig) {
    this.spawnTraffic();
  }

  private spawnTraffic() {
    const laneWidth = 3.8;
    const roadWidth = this.config.laneCount * laneWidth;
    const variants: Array<'SEDAN' | 'SUV' | 'BUS'> = ['SEDAN', 'SUV', 'BUS', 'SEDAN'];

    for (let i = 0; i < this.config.trafficCount; i++) {
      const lane = Math.floor(Math.random() * this.config.laneCount);
      const laneX = -roadWidth / 2 + laneWidth / 2 + lane * laneWidth;
      const initialZ = 50 + (i * (this.config.roadLengthM - 150)) / this.config.trafficCount + (Math.random() * 30 - 15);
      const variant = variants[i % variants.length];

      const { group, brakeLight } = createTrafficVehicleMesh(variant);
      const { altitudeM } = calculateAltitudeAtDistance(initialZ, this.config.maxGradePercent);

      group.position.set(laneX, altitudeM, initialZ);
      this.scene.add(group);

      let targetSpeed = 10 + Math.random() * 8; // m/s (~36-65 km/h)
      if (this.config.id === 'HIGHWAY') {
        targetSpeed = 22 + Math.random() * 8; // m/s (~80-110 km/h)
      } else if (this.config.id === 'URBAN_CONGESTION') {
        targetSpeed = 4 + Math.random() * 7; // m/s (~15-40 km/h)
      }

      this.trafficCars.push({
        group,
        brakeLight,
        lane,
        posX: laneX,
        posZ: initialZ,
        speedMps: targetSpeed * 0.7,
        targetSpeedMps: targetSpeed,
        variant,
        lengthM: variant === 'BUS' ? 8.5 : 4.5,
        widthM: variant === 'BUS' ? 2.3 : 1.9,
      });
    }
  }

  public update(dt: number, playerZ: number, trafficLights: Array<{ distanceZ: number; isRed: boolean }>) {
    const roadLen = this.config.roadLengthM;

    for (let i = 0; i < this.trafficCars.length; i++) {
      const car = this.trafficCars[i];

      // Check if near a red traffic light
      let mustStopForLight = false;
      for (const tl of trafficLights) {
        if (tl.isRed && car.posZ < tl.distanceZ && tl.distanceZ - car.posZ < 25) {
          mustStopForLight = true;
          break;
        }
      }

      // Check distance to preceding traffic car in same lane
      let distToFrontCar = 999;
      for (let j = 0; j < this.trafficCars.length; j++) {
        if (i !== j && this.trafficCars[j].lane === car.lane) {
          const gap = this.trafficCars[j].posZ - car.posZ;
          if (gap > 0 && gap < distToFrontCar) {
            distToFrontCar = gap;
          }
        }
      }

      // Adjust speed
      if (mustStopForLight || distToFrontCar < 15) {
        car.speedMps = Math.max(0, car.speedMps - 8.0 * dt);
        (car.brakeLight.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.0;
      } else if (distToFrontCar < 30) {
        car.speedMps = Math.max(2, car.speedMps - 3.0 * dt);
        (car.brakeLight.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.0;
      } else {
        car.speedMps = Math.min(car.targetSpeedMps, car.speedMps + 2.5 * dt);
        (car.brakeLight.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.1;
      }

      car.posZ += car.speedMps * dt;

      // Wrap around if reaches end of road
      if (car.posZ > roadLen) {
        car.posZ = Math.max(0, playerZ - 80);
      }

      const { altitudeM } = calculateAltitudeAtDistance(car.posZ, this.config.maxGradePercent);
      car.group.position.set(car.posX, altitudeM, car.posZ);
    }
  }

  public checkCollision(playerX: number, playerZ: number): boolean {
    const playerLength = 4.3;
    const playerWidth = 1.85;

    for (const car of this.trafficCars) {
      const dz = Math.abs(car.posZ - playerZ);
      const dx = Math.abs(car.posX - playerX);

      if (dz < (car.lengthM + playerLength) / 2 && dx < (car.widthM + playerWidth) / 2) {
        return true;
      }
    }
    return false;
  }

  public destroy() {
    for (const car of this.trafficCars) {
      this.scene.remove(car.group);
    }
    this.trafficCars = [];
  }
}
