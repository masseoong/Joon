import { VehicleConfig, PricingConfig } from '../types/game';

export interface PhysicsState {
  posX: number;
  posY: number;
  posZ: number;
  speedMps: number;
  speedKmh: number;
  accelerationMps2: number;
  steeringAngleRad: number;
  yawRad: number;
  distanceTraveledM: number;
  elapsedTimeSec: number;
  altitudeM: number;
  gradePercent: number;

  // Energy & Fuel
  batteryKwhRemaining: number;
  batterySocPercent: number;
  fuelLitersRemaining: number;
  totalElectricityConsumedKwh: number;
  totalElectricityRegeneratedKwh: number;
  totalFuelConsumedLiters: number;
  totalFrictionLossKwh: number;
  fuelCutTimeSec: number;
  coastingDistanceM: number;

  // Instantaneous state
  instantMotorPowerKw: number;
  instantFuelRateLPerHr: number;
  instantRegenKw: number;
  instantFrictionLossKw: number;
  currentGear: number;
  engineRpm: number;
  isFuelCutActive: boolean;
  accumulatedCostKrw: number;
}

export function createInitialPhysicsState(vehicle: VehicleConfig): PhysicsState {
  const initialBat = vehicle.initialBatteryKwh ?? (vehicle.batteryCapacityKwh ?? 0);
  const initialFuel = vehicle.initialFuelLiters ?? (vehicle.fuelTankCapacityLiters ?? 0);

  return {
    posX: 0,
    posY: 0,
    posZ: 0,
    speedMps: 0,
    speedKmh: 0,
    accelerationMps2: 0,
    steeringAngleRad: 0,
    yawRad: 0,
    distanceTraveledM: 0,
    elapsedTimeSec: 0,
    altitudeM: 0,
    gradePercent: 0,

    batteryKwhRemaining: initialBat,
    batterySocPercent: vehicle.batteryCapacityKwh ? (initialBat / vehicle.batteryCapacityKwh) * 100 : 0,
    fuelLitersRemaining: initialFuel,
    totalElectricityConsumedKwh: 0,
    totalElectricityRegeneratedKwh: 0,
    totalFuelConsumedLiters: 0,
    totalFrictionLossKwh: 0,
    fuelCutTimeSec: 0,
    coastingDistanceM: 0,

    instantMotorPowerKw: 0,
    instantFuelRateLPerHr: 0,
    instantRegenKw: 0,
    instantFrictionLossKw: 0,
    currentGear: 1,
    engineRpm: vehicle.id === 'EV' ? 0 : 800,
    isFuelCutActive: false,
    accumulatedCostKrw: 0,
  };
}

export function calculateAltitudeAtDistance(distanceM: number, maxGradePercent: number): { altitudeM: number; gradePercent: number } {
  const wave1 = Math.sin(distanceM * 0.002) * (maxGradePercent * 8.0);
  const wave2 = Math.cos(distanceM * 0.0008) * (maxGradePercent * 4.0);
  const altitudeM = wave1 + wave2;

  // Grade is approximate derivative
  const dDist = 1.0;
  const nextWave1 = Math.sin((distanceM + dDist) * 0.002) * (maxGradePercent * 8.0);
  const nextWave2 = Math.cos((distanceM + dDist) * 0.0008) * (maxGradePercent * 4.0);
  const nextAlt = nextWave1 + nextWave2;
  const gradePercent = ((nextAlt - altitudeM) / dDist) * 100;

  return { altitudeM, gradePercent };
}

export function updatePhysics(
  prevState: PhysicsState,
  vehicle: VehicleConfig,
  pricing: PricingConfig,
  controls: {
    throttle: number; // 0 to 1
    brake: number; // 0 to 1
    steer: number; // -1 to 1
    regenLevel: number; // 0 to 4 (4 = i-Pedal)
  },
  dt: number,
  maxGradePercent: number
): PhysicsState {
  const dtClamped = Math.min(dt, 0.1);
  const mass = vehicle.curbWeightKg;
  const g = 9.81;
  const rho = 1.225; // Air density kg/m3

  const { altitudeM, gradePercent } = calculateAltitudeAtDistance(prevState.distanceTraveledM, maxGradePercent);
  const thetaRad = Math.atan(gradePercent / 100);

  // Resistance Forces
  // 1. Aerodynamic drag: 0.5 * rho * Cd * A * v^2
  const v = Math.max(0, prevState.speedMps);
  const fAero = 0.5 * rho * vehicle.dragCoefficient * vehicle.frontalAreaM2 * v * v;

  // 2. Rolling resistance: Crr * m * g * cos(theta)
  const fRoll = vehicle.rollingResistanceCoeff * mass * g * Math.cos(thetaRad);

  // 3. Slope resistance: m * g * sin(theta) (+ uphill, - downhill)
  const fSlope = mass * g * Math.sin(thetaRad);

  const totalPassiveResistance = fAero + fRoll + fSlope;

  let driveForce = 0;
  let regenBrakeForce = 0;
  let frictionBrakeForce = 0;
  let motorPowerKw = 0;
  let regenPowerKw = 0;
  let frictionWastedKw = 0;
  let fuelRateLPerHr = 0;
  let isFuelCut = false;

  // Check if energy available
  const hasBattery = (vehicle.batteryCapacityKwh ?? 0) > 0 && prevState.batteryKwhRemaining > 0;
  const hasFuel = (vehicle.fuelTankCapacityLiters ?? 0) > 0 && prevState.fuelLitersRemaining > 0;

  // 1. Acceleration / Drive Power
  if (controls.throttle > 0.01 && (hasBattery || hasFuel)) {
    const maxThrust = (vehicle.maxPowerKw * 1000) / Math.max(2.5, v);
    driveForce = Math.min(maxThrust, vehicle.maxTorqueNm * 12.0) * controls.throttle;

    // Power calculation
    const mechanicalPowerKw = (driveForce * v) / 1000;

    if (vehicle.id === 'EV') {
      motorPowerKw = mechanicalPowerKw / Math.max(0.5, vehicle.electricMotorEfficiency);
    } else if (vehicle.id === 'PHEV') {
      // In low speeds or high battery, prefer EV
      if (hasBattery && (v < 18 || controls.throttle < 0.6)) {
        motorPowerKw = mechanicalPowerKw / Math.max(0.5, vehicle.electricMotorEfficiency);
      } else {
        // Hybrid engine active
        const enginePower = mechanicalPowerKw * 0.7;
        const motorPower = mechanicalPowerKw * 0.3;
        motorPowerKw = motorPower / Math.max(0.5, vehicle.electricMotorEfficiency);
        fuelRateLPerHr = (enginePower / (vehicle.engineThermalEfficiency * 8.9)) + 0.3;
      }
    } else {
      // ICE
      fuelRateLPerHr = (mechanicalPowerKw / (vehicle.engineThermalEfficiency * 8.9)) + 0.6;
    }
  }

  // 2. Deceleration / Braking / Regen
  // Regenerative braking based on regenLevel & throttle release
  const regenLevelFactors = [0.0, 0.25, 0.55, 0.85, 1.3]; // 4 is i-Pedal (can bring to complete stop)
  const isOffThrottle = controls.throttle < 0.05;

  if (vehicle.id !== 'ICE') {
    // EV or PHEV regen
    let requestedRegenPercent = 0;
    if (isOffThrottle) {
      requestedRegenPercent = (regenLevelFactors[controls.regenLevel] ?? 0.5) * 0.45;
    }

    // Blended brake pedal regen
    if (controls.brake > 0.01) {
      const brakeRegenCapacity = 0.55; // First 55% of brake pedal is blended regen
      const regenFromBrake = Math.min(controls.brake, brakeRegenCapacity);
      requestedRegenPercent = Math.max(requestedRegenPercent, regenFromBrake * 1.4);

      // Remaining brake goes to friction brake
      if (controls.brake > brakeRegenCapacity) {
        const excessBrake = (controls.brake - brakeRegenCapacity) / (1.0 - brakeRegenCapacity);
        frictionBrakeForce = excessBrake * mass * 8.5; // up to 0.85G
      }
    }

    const maxRegenDecelForce = mass * 3.5; // Up to 0.35G via motor regen
    regenBrakeForce = Math.min(maxRegenDecelForce, maxRegenDecelForce * requestedRegenPercent);

    if (v > 0.3) {
      const grossRegenKw = (regenBrakeForce * v) / 1000;
      regenPowerKw = grossRegenKw * vehicle.regenEfficiency;
    }

    // i-Pedal stop hold
    if (controls.regenLevel === 4 && isOffThrottle && v < 1.0) {
      regenBrakeForce += mass * 1.5;
    }
  } else {
    // ICE vehicle braking & Deceleration Fuel-Cut
    if (controls.brake > 0.01) {
      frictionBrakeForce = controls.brake * mass * 8.5;
    }

    // Deceleration Fuel-Cut logic
    // When throttle is released and vehicle is in gear moving (> 15 km/h), fuel injection is completely 0.00 L/h!
    if (isOffThrottle && v > 4.2) {
      isFuelCut = true;
      fuelRateLPerHr = 0.0;
    } else if (isOffThrottle && v <= 4.2) {
      // Idle fuel consumption
      fuelRateLPerHr = vehicle.idleFuelRateLPerHr;
    }
  }

  // Calculate friction heat loss kW
  if (frictionBrakeForce > 0 && v > 0.1) {
    frictionWastedKw = (frictionBrakeForce * v) / 1000;
  }

  // Net Acceleration Force
  const totalDecelBrake = regenBrakeForce + frictionBrakeForce;
  let netForce = driveForce - totalPassiveResistance - totalDecelBrake;

  // Prevent reversing from brakes alone
  if (v <= 0.05 && netForce < 0) {
    netForce = 0;
  }

  const accelerationMps2 = netForce / mass;
  let nextSpeedMps = Math.max(0, v + accelerationMps2 * dtClamped);

  // If i-Pedal and speed very slow, snap to 0
  if (vehicle.id !== 'ICE' && controls.regenLevel === 4 && isOffThrottle && nextSpeedMps < 0.15) {
    nextSpeedMps = 0;
  }

  const avgSpeedMps = (v + nextSpeedMps) / 2;
  const distanceTraveledM = prevState.distanceTraveledM + avgSpeedMps * dtClamped;

  // Steering & Yaw
  const maxSteerSpeed = 0.45;
  const currentSteer = controls.steer * maxSteerSpeed;
  const turnRadius = 2.8 / Math.max(0.001, Math.tan(Math.abs(currentSteer)));
  const yawRate = (avgSpeedMps / turnRadius) * Math.sign(currentSteer);
  const yawRad = prevState.yawRad + yawRate * dtClamped;

  const posX = prevState.posX + Math.sin(yawRad) * (avgSpeedMps * dtClamped);
  const posZ = prevState.posZ + Math.cos(yawRad) * (avgSpeedMps * dtClamped);
  const posY = altitudeM;

  // Energy Accounting
  const dtHours = dtClamped / 3600;
  const dtSeconds = dtClamped;

  const electricityUsedKwh = (motorPowerKw * dtHours);
  const electricityRegenedKwh = (regenPowerKw * dtHours);
  const netElecKwh = electricityUsedKwh - electricityRegenedKwh;

  const fuelUsedL = (fuelRateLPerHr * dtHours);
  const frictionLossKwh = (frictionWastedKw * dtHours);

  const nextBatRemaining = Math.max(
    0,
    Math.min(vehicle.batteryCapacityKwh ?? 0, prevState.batteryKwhRemaining - netElecKwh)
  );

  const nextFuelRemaining = Math.max(
    0,
    prevState.fuelLitersRemaining - fuelUsedL
  );

  // Fuel Cut tracking
  const fuelCutTimeSec = prevState.fuelCutTimeSec + (isFuelCut ? dtSeconds : 0);

  // Coasting distance tracking (when off throttle and speed > 10 km/h)
  const isCoasting = isOffThrottle && nextSpeedMps > 2.8;
  const coastingDistanceM = prevState.coastingDistanceM + (isCoasting ? avgSpeedMps * dtClamped : 0);

  // RPM and Gear calculation for display
  let currentGear = 1;
  let engineRpm = 0;
  const speedKmh = nextSpeedMps * 3.6;

  if (vehicle.id === 'ICE') {
    if (speedKmh < 15) currentGear = 1;
    else if (speedKmh < 30) currentGear = 2;
    else if (speedKmh < 45) currentGear = 3;
    else if (speedKmh < 60) currentGear = 4;
    else if (speedKmh < 75) currentGear = 5;
    else if (speedKmh < 90) currentGear = 6;
    else if (speedKmh < 105) currentGear = 7;
    else currentGear = 8;

    const gearRatios = [0, 4.2, 2.8, 1.9, 1.4, 1.0, 0.8, 0.65, 0.55];
    const ratio = gearRatios[currentGear] || 1.0;
    const rawRpm = (nextSpeedMps * 60 * 3.5 * ratio) / (Math.PI * 0.65);
    engineRpm = Math.max(800, Math.min(6500, Math.round(rawRpm + (controls.throttle * 900))));
  } else {
    // EV motor RPM
    engineRpm = Math.round(nextSpeedMps * 125);
    currentGear = 1;
  }

  // Cost accumulation
  const totalElecUsedGross = prevState.totalElectricityConsumedKwh + Math.max(0, electricityUsedKwh);
  const totalElecRegenGross = prevState.totalElectricityRegeneratedKwh + electricityRegenedKwh;
  const netElecTotal = Math.max(0, totalElecUsedGross - totalElecRegenGross);
  const totalFuelTotal = prevState.totalFuelConsumedLiters + fuelUsedL;

  const costFromElec = netElecTotal * pricing.electricityPerKwh;
  const costFromFuel = totalFuelTotal * pricing.gasolinePerLiter;
  const accumulatedCostKrw = Math.round(costFromElec + costFromFuel);

  return {
    posX,
    posY,
    posZ,
    speedMps: nextSpeedMps,
    speedKmh,
    accelerationMps2,
    steeringAngleRad: currentSteer,
    yawRad,
    distanceTraveledM,
    elapsedTimeSec: prevState.elapsedTimeSec + dtClamped,
    altitudeM,
    gradePercent,

    batteryKwhRemaining: nextBatRemaining,
    batterySocPercent: vehicle.batteryCapacityKwh
      ? Math.max(0, Math.min(100, (nextBatRemaining / vehicle.batteryCapacityKwh) * 100))
      : 0,
    fuelLitersRemaining: nextFuelRemaining,
    totalElectricityConsumedKwh: totalElecUsedGross,
    totalElectricityRegeneratedKwh: totalElecRegenGross,
    totalFuelConsumedLiters: totalFuelTotal,
    totalFrictionLossKwh: prevState.totalFrictionLossKwh + frictionLossKwh,
    fuelCutTimeSec,
    coastingDistanceM,

    instantMotorPowerKw: motorPowerKw > 0 ? motorPowerKw : -regenPowerKw,
    instantFuelRateLPerHr: fuelRateLPerHr,
    instantRegenKw: regenPowerKw,
    instantFrictionLossKw: frictionWastedKw,
    currentGear,
    engineRpm,
    isFuelCutActive: isFuelCut,
    accumulatedCostKrw,
  };
}
