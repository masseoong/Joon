export type VehicleType = 'EV' | 'PHEV' | 'ICE';

export type EnvironmentType = 'URBAN_CONGESTION' | 'HIGHWAY' | 'MOUNTAIN_WINDING';

export type ChallengeMode = 'FIXED_ENERGY' | 'FIXED_DISTANCE' | 'FREE_DRIVE';

export type CameraView = 'CHASE' | 'COCKPIT' | 'HOOD' | 'TOP_DOWN';

export interface VehicleConfig {
  id: VehicleType;
  name: string;
  category: string;
  description: string;
  curbWeightKg: number; // kg
  dragCoefficient: number; // Cd
  frontalAreaM2: number; // m^2
  rollingResistanceCoeff: number; // Crr
  maxPowerKw: number; // kW
  maxTorqueNm: number;
  batteryCapacityKwh?: number;
  fuelTankCapacityLiters?: number;
  initialBatteryKwh?: number;
  initialFuelLiters?: number;
  electricMotorEfficiency: number; // e.g. 0.92
  engineThermalEfficiency: number; // e.g. 0.36
  regenEfficiency: number; // e.g. 0.85
  idleFuelRateLPerHr: number; // For ICE (e.g. 0.85 L/h)
  accentColor: string;
}

export interface EnvironmentConfig {
  id: EnvironmentType;
  name: string;
  description: string;
  roadLengthM: number;
  laneCount: number;
  speedLimitKmh: number;
  trafficDensity: 'LOW' | 'MEDIUM' | 'HIGH';
  trafficCount: number;
  trafficLightCount: number;
  maxGradePercent: number; // +/- %
  skyColor: string;
  fogDensity: number;
  ambientLightColor: string;
  roadColor: string;
  groundColor: string;
}

export interface PricingConfig {
  gasolinePerLiter: number; // KRW
  dieselPerLiter: number; // KRW
  electricityPerKwh: number; // KRW
}

export const DEFAULT_PRICING: PricingConfig = {
  gasolinePerLiter: 1680,
  dieselPerLiter: 1550,
  electricityPerKwh: 320,
};

export const VEHICLE_CONFIGS: Record<VehicleType, VehicleConfig> = {
  EV: {
    id: 'EV',
    name: '아이오닉 에코 EV (Pure BEV)',
    category: '순수 전기차 (BEV)',
    description:
      '영구자석 동기모터(PMSM)와 대용량 77.4kWh 배터리 탑재. 0~4단계 패들 쉬프터 및 i-Pedal 원페달 감속 제어로 에너지 회수를 극대화합니다.',
    curbWeightKg: 1980,
    dragCoefficient: 0.24,
    frontalAreaM2: 2.35,
    rollingResistanceCoeff: 0.009,
    maxPowerKw: 168,
    maxTorqueNm: 350,
    batteryCapacityKwh: 77.4,
    initialBatteryKwh: 5.0, // Fixed energy mode initial
    electricMotorEfficiency: 0.94,
    engineThermalEfficiency: 0.0,
    regenEfficiency: 0.88,
    idleFuelRateLPerHr: 0.0,
    accentColor: '#06b6d4', // Cyan
  },
  PHEV: {
    id: 'PHEV',
    name: '스마트 하이브리드 PHEV (Dual)',
    category: '플러그인 하이브리드 (PHEV)',
    description:
      '1.6T GDi 가솔린 엔진(180ps)과 66.9kW 고출력 전기모터의 조화. 도심은 EV 모드로 무연료 주행, 고속은 하이브리드 최적 연소로 장거리 항속합니다.',
    curbWeightKg: 1820,
    dragCoefficient: 0.27,
    frontalAreaM2: 2.38,
    rollingResistanceCoeff: 0.01,
    maxPowerKw: 195,
    maxTorqueNm: 350,
    batteryCapacityKwh: 13.8,
    fuelTankCapacityLiters: 42.0,
    initialBatteryKwh: 3.0,
    initialFuelLiters: 0.7,
    electricMotorEfficiency: 0.91,
    engineThermalEfficiency: 0.38,
    regenEfficiency: 0.78,
    idleFuelRateLPerHr: 0.65,
    accentColor: '#10b981', // Emerald
  },
  ICE: {
    id: 'ICE',
    name: '스마트스트림 1.6T 가솔린 (ICE)',
    category: '내연기관 (ICE)',
    description:
      '고효율 터보 직분사 가솔린 엔진 및 8단 자동변속기. 감속 시 퓨얼컷(Fuel-Cut: 0.00 L/h)과 펄스 앤 글라이드 관성 탄력 주행 테크닉이 핵심입니다.',
    curbWeightKg: 1380,
    dragCoefficient: 0.28,
    frontalAreaM2: 2.32,
    rollingResistanceCoeff: 0.011,
    maxPowerKw: 147,
    maxTorqueNm: 265,
    fuelTankCapacityLiters: 50.0,
    initialFuelLiters: 1.0, // Fixed energy mode initial
    electricMotorEfficiency: 0.0,
    engineThermalEfficiency: 0.36,
    regenEfficiency: 0.0,
    idleFuelRateLPerHr: 0.85,
    accentColor: '#f59e0b', // Amber
  },
};

export const ENVIRONMENT_CONFIGS: Record<EnvironmentType, EnvironmentConfig> = {
  URBAN_CONGESTION: {
    id: 'URBAN_CONGESTION',
    name: '도심 극심 정체구간 (러시아워)',
    description:
      '잦은 신호 대기, 앞차의 급감속/정차, 교차로 병목 구간. 공회전 손실 0와 i-Pedal 회생제동을 가진 전기차의 비용 절감 효과가 가장 극대화되는 도로입니다.',
    roadLengthM: 3000,
    laneCount: 3,
    speedLimitKmh: 50,
    trafficDensity: 'HIGH',
    trafficCount: 16,
    trafficLightCount: 5,
    maxGradePercent: 1.5,
    skyColor: '#1e293b',
    fogDensity: 0.002,
    ambientLightColor: '#cbd5e1',
    roadColor: '#334155',
    groundColor: '#0f172a',
  },
  HIGHWAY: {
    id: 'HIGHWAY',
    name: '초고속 고속도로 (110km/h 항속)',
    description:
      '원활한 직선 고속 주행. 시속 100km/h 이상에서는 공기저항(v²)이 급증하여 EV 전비가 낮아지며, 내연기관은 8단 록업 기어로 최고 연비를 겨룹니다.',
    roadLengthM: 4000,
    laneCount: 4,
    speedLimitKmh: 110,
    trafficDensity: 'MEDIUM',
    trafficCount: 12,
    trafficLightCount: 0,
    maxGradePercent: 2.0,
    skyColor: '#0f172a',
    fogDensity: 0.0012,
    ambientLightColor: '#e2e8f0',
    roadColor: '#1e293b',
    groundColor: '#090d16',
  },
  MOUNTAIN_WINDING: {
    id: 'MOUNTAIN_WINDING',
    name: '비포장 산악 와인딩 (급경사/내리막)',
    description:
      '최대 ±12%의 급경사 오르막과 굴곡진 내리막 헤어핀. 오르막의 막대한 에너지 소모를 내리막 패들 회생제동(EV) 또는 엔진브레이크 퓨얼컷(ICE)으로 방어해야 합니다.',
    roadLengthM: 3200,
    laneCount: 2,
    speedLimitKmh: 60,
    trafficDensity: 'LOW',
    trafficCount: 6,
    trafficLightCount: 0,
    maxGradePercent: 12.0,
    skyColor: '#020617',
    fogDensity: 0.003,
    ambientLightColor: '#94a3b8',
    roadColor: '#475569',
    groundColor: '#1c1917',
  },
};

export interface TelemetryPoint {
  timestampSec: number;
  distanceM: number;
  speedKmh: number;
  altitudeM: number;
  gradePercent: number;
  instantPowerKw: number;
  instantFuelFlowLPerHr: number;
  instantEfficiency: number; // km/kWh or km/L
  accumulatedCostKrw: number;
  regenPowerRecoveredKw: number;
  frictionBrakeWastedKw: number;
  rpm: number;
  gear: number;
  isFuelCut: boolean;
  batterySocPercent: number;
  fuelLevelLiters: number;
}

export interface RunSummary {
  vehicleType: VehicleType;
  environmentType: EnvironmentType;
  challengeMode: ChallengeMode;
  totalTimeSec: number;
  totalDistanceKm: number;
  averageSpeedKmh: number;
  ecoScore: number; // 0 to 100
  totalCostKrw: number;
  costPerKmKrw: number;
  co2EmissionsGram: number;
  totalElectricityUsedKwh: number;
  totalElectricityRegeneratedKwh: number;
  totalFuelUsedLiters: number;
  fuelCutDurationSec: number;
  frictionBrakeWastedKwh: number;
  coastingDistancePercent: number;
  efficiencyRating: {
    primaryValue: number;
    primaryUnit: string; // 'km/kWh' or 'km/L'
  };
  comparisonCostEv: number;
  comparisonCostPhev: number;
  comparisonCostIce: number;
  drivingHighlights: string[];
}
