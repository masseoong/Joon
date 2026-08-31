import * as THREE from 'three';
import {
  VehicleType,
  EnvironmentType,
  ChallengeMode,
  CameraView,
  PricingConfig,
  TelemetryPoint,
  RunSummary,
  VEHICLE_CONFIGS,
  ENVIRONMENT_CONFIGS,
} from '../types/game';
import { PhysicsState, createInitialPhysicsState, updatePhysics } from '../utils/physics';
import { soundManager } from '../utils/audio';
import { createVehicleMesh, VehicleMeshBundle } from './vehicleModels';
import { buildEnvironmentWorld, WorldBuildResult } from './worldBuilder';
import { TrafficSystem } from './trafficSystem';

export interface GameSimulationCallbacks {
  onPhysicsUpdate: (state: PhysicsState, telemetry: TelemetryPoint) => void;
  onGoalReached: (summary: RunSummary) => void;
  onEnergyExhausted: (summary: RunSummary) => void;
  onCollision: () => void;
}

export class GameSimulation {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animFrameId: number | null = null;
  private lastTime: number = performance.now();

  private vehicleBundle: VehicleMeshBundle | null = null;
  private worldResult: WorldBuildResult | null = null;
  private trafficSystem: TrafficSystem | null = null;

  public physicsState: PhysicsState;
  public cameraView: CameraView = 'CHASE';
  public regenLevel: number = 3; // 0 to 4 (i-Pedal)
  public areHeadlightsOn: boolean = true;

  // Inputs
  public throttleInput: number = 0;
  public brakeInput: number = 0;
  public steerInput: number = 0;

  // Key tracking
  private keysPressed: Record<string, boolean> = {};

  // Telemetry Recording
  public telemetryHistory: TelemetryPoint[] = [];
  private lastTelemetryTimeSec: number = 0;

  private isFinished: boolean = false;
  private lastTrafficLightSwitch: number = 0;

  constructor(
    private container: HTMLElement,
    public vehicleType: VehicleType,
    public environmentType: EnvironmentType,
    public challengeMode: ChallengeMode,
    public pricing: PricingConfig,
    private callbacks: GameSimulationCallbacks
  ) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    this.physicsState = createInitialPhysicsState(VEHICLE_CONFIGS[vehicleType]);

    this.initWorld();
    this.initVehicle();
    this.initEventListeners();

    // Start engine procedural audio
    soundManager.startEngine(vehicleType);

    this.loop();
  }

  private initWorld() {
    const env = ENVIRONMENT_CONFIGS[this.environmentType];
    this.worldResult = buildEnvironmentWorld(this.scene, env);
    this.trafficSystem = new TrafficSystem(this.scene, env);
  }

  private initVehicle() {
    this.vehicleBundle = createVehicleMesh(this.vehicleType);
    this.scene.add(this.vehicleBundle.group);
  }

  private initEventListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('resize', this.handleResize);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keysPressed[e.code] = true;

    // Direct key shortcuts
    if (e.code === 'KeyQ') {
      this.setRegenLevel(Math.max(0, this.regenLevel - 1));
      soundManager.playPaddleClick();
    } else if (e.code === 'KeyE') {
      this.setRegenLevel(Math.min(4, this.regenLevel + 1));
      soundManager.playPaddleClick();
    } else if (e.code === 'KeyC') {
      this.cycleCamera();
    } else if (e.code === 'KeyL') {
      this.toggleHeadlights();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keysPressed[e.code] = false;
  };

  private handleResize = () => {
    if (!this.container || !this.renderer) return;
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  };

  public setRegenLevel(level: number) {
    this.regenLevel = Math.max(0, Math.min(4, level));
  }

  public cycleCamera() {
    const views: CameraView[] = ['CHASE', 'COCKPIT', 'HOOD', 'TOP_DOWN'];
    const currIdx = views.indexOf(this.cameraView);
    this.cameraView = views[(currIdx + 1) % views.length];
  }

  public toggleHeadlights() {
    this.areHeadlightsOn = !this.areHeadlightsOn;
    if (this.vehicleBundle) {
      for (const light of this.vehicleBundle.headlights) {
        light.intensity = this.areHeadlightsOn ? 15 : 0;
      }
    }
  }

  private processInputs(dt: number) {
    let throttle = 0;
    let brake = 0;
    let steer = 0;

    // Keyboard controls
    if (this.keysPressed['KeyW'] || this.keysPressed['ArrowUp']) throttle += 1;
    if (this.keysPressed['KeyS'] || this.keysPressed['ArrowDown'] || this.keysPressed['Space']) brake += 1;
    if (this.keysPressed['KeyA'] || this.keysPressed['ArrowLeft']) steer -= 1;
    if (this.keysPressed['KeyD'] || this.keysPressed['ArrowRight']) steer += 1;

    // Combine with on-screen / touch controls
    this.throttleInput = Math.max(throttle, this.throttleInput);
    this.brakeInput = Math.max(brake, this.brakeInput);
    if (steer !== 0) this.steerInput = steer;
  }

  private updateTrafficLights(now: number) {
    if (!this.worldResult) return;
    // Toggle traffic lights every 9 seconds
    if (now - this.lastTrafficLightSwitch > 9000) {
      this.lastTrafficLightSwitch = now;
      for (const tl of this.worldResult.trafficLights) {
        tl.isRed = !tl.isRed;
        (tl.lightBulb.material as THREE.MeshBasicMaterial).color.setHex(tl.isRed ? 0xff0000 : 0x00ff00);
      }
    }
  }

  private loop = () => {
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (!this.isFinished) {
      this.processInputs(dt);

      const vehicleConfig = VEHICLE_CONFIGS[this.vehicleType];
      const envConfig = ENVIRONMENT_CONFIGS[this.environmentType];

      // Update Physics Engine
      const nextPhysics = updatePhysics(
        this.physicsState,
        vehicleConfig,
        this.pricing,
        {
          throttle: this.throttleInput,
          brake: this.brakeInput,
          steer: this.steerInput,
          regenLevel: this.regenLevel,
        },
        dt,
        envConfig.maxGradePercent
      );

      this.physicsState = nextPhysics;

      // Update Traffic
      this.updateTrafficLights(now);
      if (this.trafficSystem && this.worldResult) {
        this.trafficSystem.update(dt, this.physicsState.posZ, this.worldResult.trafficLights);

        // Collision Check
        if (this.trafficSystem.checkCollision(this.physicsState.posX, this.physicsState.posZ)) {
          this.callbacks.onCollision();
          this.physicsState.speedMps = Math.max(0, this.physicsState.speedMps * 0.4);
          soundManager.playBrakeHiss();
        }
      }

      // Update Visual Meshes
      if (this.vehicleBundle) {
        const { group, wheels, brakeLights } = this.vehicleBundle;
        group.position.set(this.physicsState.posX, this.physicsState.posY, this.physicsState.posZ);
        group.rotation.y = this.physicsState.yawRad;

        // Roll wheels
        const wheelRotSpeed = this.physicsState.speedMps * 2.8;
        for (const w of wheels) {
          w.rotation.x += wheelRotSpeed * dt;
        }

        // Steer front wheels
        if (wheels[0] && wheels[1]) {
          wheels[0].parent!.rotation.y = this.physicsState.steeringAngleRad;
          wheels[1].parent!.rotation.y = this.physicsState.steeringAngleRad;
        }

        // Brake lights illumination
        const isBraking = this.brakeInput > 0.05 || (this.vehicleType !== 'ICE' && this.regenLevel === 4 && this.throttleInput < 0.05);
        for (const bl of brakeLights) {
          (bl.material as THREE.MeshStandardMaterial).emissiveIntensity = isBraking ? 2.5 : 0.4;
        }
      }

      // Update Audio SFX
      soundManager.updateEngineSound(
        this.vehicleType,
        this.physicsState.speedKmh,
        this.throttleInput,
        this.physicsState.instantRegenKw,
        this.physicsState.engineRpm
      );

      // Record Telemetry
      if (this.physicsState.elapsedTimeSec - this.lastTelemetryTimeSec >= 0.25) {
        this.lastTelemetryTimeSec = this.physicsState.elapsedTimeSec;
        const pt: TelemetryPoint = {
          timestampSec: Math.round(this.physicsState.elapsedTimeSec * 10) / 10,
          distanceM: Math.round(this.physicsState.distanceTraveledM),
          speedKmh: Math.round(this.physicsState.speedKmh * 10) / 10,
          altitudeM: Math.round(this.physicsState.altitudeM * 10) / 10,
          gradePercent: Math.round(this.physicsState.gradePercent * 10) / 10,
          instantPowerKw: Math.round(this.physicsState.instantMotorPowerKw * 10) / 10,
          instantFuelFlowLPerHr: Math.round(this.physicsState.instantFuelRateLPerHr * 100) / 100,
          instantEfficiency: this.calculateInstantEfficiency(),
          accumulatedCostKrw: this.physicsState.accumulatedCostKrw,
          regenPowerRecoveredKw: Math.round(this.physicsState.instantRegenKw * 10) / 10,
          frictionBrakeWastedKw: Math.round(this.physicsState.instantFrictionLossKw * 10) / 10,
          rpm: this.physicsState.engineRpm,
          gear: this.physicsState.currentGear,
          isFuelCut: this.physicsState.isFuelCutActive,
          batterySocPercent: Math.round(this.physicsState.batterySocPercent * 10) / 10,
          fuelLevelLiters: Math.round(this.physicsState.fuelLitersRemaining * 100) / 100,
        };

        this.telemetryHistory.push(pt);
        this.callbacks.onPhysicsUpdate(this.physicsState, pt);
      }

      // Check End Conditions
      if (this.challengeMode === 'FIXED_DISTANCE' && this.physicsState.distanceTraveledM >= envConfig.roadLengthM) {
        this.finishRun(true);
      } else if (this.challengeMode === 'FIXED_ENERGY') {
        const outOfBattery = vehicleConfig.batteryCapacityKwh && this.physicsState.batteryKwhRemaining <= 0.02;
        const outOfFuel = vehicleConfig.fuelTankCapacityLiters && this.physicsState.fuelLitersRemaining <= 0.01;

        if (this.vehicleType === 'EV' && outOfBattery && this.physicsState.speedKmh < 1.0) {
          this.finishRun(false);
        } else if (this.vehicleType === 'ICE' && outOfFuel && this.physicsState.speedKmh < 1.0) {
          this.finishRun(false);
        } else if (this.physicsState.distanceTraveledM >= envConfig.roadLengthM) {
          this.finishRun(true);
        }
      }
    }

    // Camera Positioning
    this.updateCamera();

    // Render Scene
    this.renderer.render(this.scene, this.camera);
    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private updateCamera() {
    const posX = this.physicsState.posX;
    const posY = this.physicsState.posY;
    const posZ = this.physicsState.posZ;
    const yaw = this.physicsState.yawRad;

    if (this.cameraView === 'CHASE') {
      const dist = 7.5;
      const height = 2.8;
      const camX = posX - Math.sin(yaw) * dist;
      const camZ = posZ - Math.cos(yaw) * dist;
      const camY = posY + height;
      this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.15);
      this.camera.lookAt(posX, posY + 1.2, posZ + 4);
    } else if (this.cameraView === 'COCKPIT') {
      const camX = posX + Math.sin(yaw) * 0.2;
      const camZ = posZ + Math.cos(yaw) * 0.1;
      const camY = posY + 1.05;
      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(posX + Math.sin(yaw) * 20, posY + 1.0, posZ + Math.cos(yaw) * 20);
    } else if (this.cameraView === 'HOOD') {
      const camX = posX + Math.sin(yaw) * 1.6;
      const camZ = posZ + Math.cos(yaw) * 1.6;
      const camY = posY + 0.8;
      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(posX + Math.sin(yaw) * 30, posY + 0.7, posZ + Math.cos(yaw) * 30);
    } else {
      // TOP_DOWN
      this.camera.position.set(posX, posY + 35, posZ - 5);
      this.camera.lookAt(posX, posY, posZ + 15);
    }
  }

  private calculateInstantEfficiency(): number {
    const vKmh = this.physicsState.speedKmh;
    if (this.vehicleType === 'EV') {
      const netKw = Math.max(0.1, this.physicsState.instantMotorPowerKw);
      return Math.min(15, Math.round((vKmh / netKw) * 10) / 10);
    } else {
      const lPerHr = Math.max(0.01, this.physicsState.instantFuelRateLPerHr);
      return Math.min(40, Math.round((vKmh / lPerHr) * 10) / 10);
    }
  }

  public generateSummary(): RunSummary {
    const totalDistKm = Math.round((this.physicsState.distanceTraveledM / 1000) * 100) / 100;
    const timeSec = Math.max(1, Math.round(this.physicsState.elapsedTimeSec));
    const avgSpeed = Math.round((totalDistKm / (timeSec / 3600)) * 10) / 10;

    const netElecKwh = Math.max(
      0,
      this.physicsState.totalElectricityConsumedKwh - this.physicsState.totalElectricityRegeneratedKwh
    );
    const totalFuelL = this.physicsState.totalFuelConsumedLiters;

    // Eco Score algorithm (0-100)
    let score = 85;
    if (this.vehicleType === 'EV') {
      const regenRatio = this.physicsState.totalElectricityConsumedKwh > 0
        ? this.physicsState.totalElectricityRegeneratedKwh / this.physicsState.totalElectricityConsumedKwh
        : 0;
      score += Math.min(15, regenRatio * 40);
    } else {
      const fuelCutRatio = this.physicsState.elapsedTimeSec > 0
        ? this.physicsState.fuelCutTimeSec / this.physicsState.elapsedTimeSec
        : 0;
      score += Math.min(15, fuelCutRatio * 50);
    }

    if (this.physicsState.totalFrictionLossKwh > 0.5) {
      score -= Math.min(20, this.physicsState.totalFrictionLossKwh * 10);
    }

    score = Math.max(20, Math.min(100, Math.round(score)));

    // Carbon emissions (ICE: ~2,320g/L, EV: ~110g/kWh grid average)
    const co2Grams = Math.round(totalFuelL * 2320 + netElecKwh * 110);

    const costPerKm = totalDistKm > 0 ? Math.round(this.physicsState.accumulatedCostKrw / totalDistKm) : 0;

    // Comparison against other powertrains for exact same distance & terrain
    const compCostEv = Math.round((totalDistKm / 6.2) * this.pricing.electricityPerKwh);
    const compCostPhev = Math.round((totalDistKm / 16.5) * this.pricing.gasolinePerLiter * 0.75);
    const compCostIce = Math.round((totalDistKm / 11.2) * this.pricing.gasolinePerLiter);

    const highlights: string[] = [];
    if (this.vehicleType !== 'ICE' && this.physicsState.totalElectricityRegeneratedKwh > 0.1) {
      highlights.push(`회생제동을 통해 총 ${this.physicsState.totalElectricityRegeneratedKwh.toFixed(2)} kWh를 배터리에 재충전하여 유류비를 방어했습니다.`);
    }
    if (this.physicsState.fuelCutTimeSec > 5) {
      highlights.push(`퓨얼컷(무연료 관성주행)을 총 ${Math.round(this.physicsState.fuelCutTimeSec)}초 동안 유지하여 공회전 손실을 줄였습니다.`);
    }
    if (this.physicsState.totalFrictionLossKwh < 0.1) {
      highlights.push('마찰 브레이크 사용을 최소화하고 원페달/회생제동으로 부드럽게 감속했습니다 (탁월한 패드 수명).');
    }

    const coastingRatio = this.physicsState.distanceTraveledM > 0
      ? Math.round((this.physicsState.coastingDistanceM / this.physicsState.distanceTraveledM) * 100)
      : 0;

    return {
      vehicleType: this.vehicleType,
      environmentType: this.environmentType,
      challengeMode: this.challengeMode,
      totalTimeSec: timeSec,
      totalDistanceKm: totalDistKm,
      averageSpeedKmh: avgSpeed,
      ecoScore: score,
      totalCostKrw: this.physicsState.accumulatedCostKrw,
      costPerKmKrw: costPerKm,
      co2EmissionsGram: co2Grams,
      totalElectricityUsedKwh: Math.round(this.physicsState.totalElectricityConsumedKwh * 100) / 100,
      totalElectricityRegeneratedKwh: Math.round(this.physicsState.totalElectricityRegeneratedKwh * 100) / 100,
      totalFuelUsedLiters: Math.round(totalFuelL * 100) / 100,
      fuelCutDurationSec: Math.round(this.physicsState.fuelCutTimeSec),
      frictionBrakeWastedKwh: Math.round(this.physicsState.totalFrictionLossKwh * 100) / 100,
      coastingDistancePercent: coastingRatio,
      efficiencyRating: {
        primaryValue: this.vehicleType === 'EV'
          ? (netElecKwh > 0 ? Math.round((totalDistKm / netElecKwh) * 10) / 10 : 6.5)
          : (totalFuelL > 0 ? Math.round((totalDistKm / totalFuelL) * 10) / 10 : 12.8),
        primaryUnit: this.vehicleType === 'EV' ? 'km/kWh' : 'km/L',
      },
      comparisonCostEv: compCostEv,
      comparisonCostPhev: compCostPhev,
      comparisonCostIce: compCostIce,
      drivingHighlights: highlights,
    };
  }

  private finishRun(isGoal: boolean) {
    if (this.isFinished) return;
    this.isFinished = true;
    const summary = this.generateSummary();
    if (isGoal) {
      this.callbacks.onGoalReached(summary);
    } else {
      this.callbacks.onEnergyExhausted(summary);
    }
  }

  public restart() {
    this.physicsState = createInitialPhysicsState(VEHICLE_CONFIGS[this.vehicleType]);
    this.telemetryHistory = [];
    this.lastTelemetryTimeSec = 0;
    this.isFinished = false;
    this.throttleInput = 0;
    this.brakeInput = 0;
    this.steerInput = 0;

    if (this.vehicleBundle) {
      this.vehicleBundle.group.position.set(0, 0, 0);
      this.vehicleBundle.group.rotation.set(0, 0, 0);
    }
  }

  public destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('resize', this.handleResize);

    soundManager.stopAll();

    if (this.trafficSystem) {
      this.trafficSystem.destroy();
    }

    if (this.renderer && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
  }
}
