import React, { useState } from 'react';
import {
  VehicleType,
  EnvironmentType,
  ChallengeMode,
  CameraView,
  PricingConfig,
  TelemetryPoint,
  VEHICLE_CONFIGS,
} from '../types/game';
import { PhysicsState } from '../utils/physics';
import {
  Zap,
  Flame,
  Camera,
  Lightbulb,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  TrendingDown,
  Activity,
  Award,
  Sparkles,
} from 'lucide-react';

interface DrivingHUDProps {
  vehicleType: VehicleType;
  envType: EnvironmentType;
  challengeMode: ChallengeMode;
  physicsState: PhysicsState;
  telemetry: TelemetryPoint | null;
  pricing: PricingConfig;
  cameraView: CameraView;
  regenLevel: number;
  areHeadlightsOn: boolean;
  onSetRegenLevel: (level: number) => void;
  onCycleCamera: () => void;
  onToggleHeadlights: () => void;
  onThrottleChange: (val: number) => void;
  onBrakeChange: (val: number) => void;
  onSteerChange: (val: number) => void;
}

export const DrivingHUD: React.FC<DrivingHUDProps> = ({
  vehicleType,
  envType,
  challengeMode,
  physicsState,
  telemetry,
  pricing,
  cameraView,
  regenLevel,
  areHeadlightsOn,
  onSetRegenLevel,
  onCycleCamera,
  onToggleHeadlights,
  onThrottleChange,
  onBrakeChange,
  onSteerChange,
}) => {
  const vehicle = VEHICLE_CONFIGS[vehicleType];
  const speed = Math.round(physicsState.speedKmh);
  const isEV = vehicleType === 'EV';
  const isPHEV = vehicleType === 'PHEV';
  const isICE = vehicleType === 'ICE';

  // Power or Regen meter calculation
  const powerKw = physicsState.instantMotorPowerKw;
  const isRegenerating = powerKw < 0 || physicsState.instantRegenKw > 0.1;
  const powerPct = Math.min(100, Math.abs(powerKw) / (vehicle.maxPowerKw * 0.8) * 100);

  return (
    <div
      id="driving_hud_overlay"
      className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 pt-16 select-none overflow-hidden"
    >
      {/* Top Telemetry & Real-Time Cost Ticker */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Real-time Economic Cost Ticker */}
        <div
          id="hud_cost_ticker"
          className="pointer-events-auto bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-2xl p-3.5 shadow-xl flex items-center gap-4 text-slate-100 min-w-[240px]"
        >
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              실시간 누적 주행 비용
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono text-amber-400">
                ₩{physicsState.accumulatedCostKrw.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">KRW</span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          {/* Efficiency Metric */}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              {isEV ? '순간 전비' : '순간 연비'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black font-mono text-cyan-400">
                {telemetry ? telemetry.instantEfficiency.toFixed(1) : '0.0'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {isEV ? 'km/kWh' : 'km/L'}
              </span>
            </div>
          </div>
        </div>

        {/* Challenge Goal & Distance Tracker */}
        <div
          id="hud_distance_tracker"
          className="pointer-events-auto bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-2xl p-3.5 shadow-xl flex items-center gap-4"
        >
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              주행 거리 & 경사도
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black font-mono text-white">
                {(physicsState.distanceTraveledM / 1000).toFixed(2)}{' '}
                <span className="text-xs font-normal text-slate-400">km</span>
              </span>
              <span
                className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                  physicsState.gradePercent > 1
                    ? 'bg-red-500/20 text-red-400'
                    : physicsState.gradePercent < -1
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {physicsState.gradePercent > 0 ? `+${physicsState.gradePercent.toFixed(1)}%` : `${physicsState.gradePercent.toFixed(1)}%`}
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          {/* Energy Remaining (Battery or Fuel) */}
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              {isEV ? '배터리 잔량' : isPHEV ? '배터리 / 연료' : '연료 잔량'}
            </span>
            <div className="flex items-center gap-2">
              {vehicle.batteryCapacityKwh && (
                <div className="flex items-baseline gap-1">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-base font-black font-mono text-cyan-300">
                    {physicsState.batterySocPercent.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({physicsState.batteryKwhRemaining.toFixed(1)}kWh)
                  </span>
                </div>
              )}

              {vehicle.fuelTankCapacityLiters && (
                <div className="flex items-baseline gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-base font-black font-mono text-amber-300">
                    {physicsState.fuelLitersRemaining.toFixed(2)}L
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View & Camera Utility Badges */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={onCycleCamera}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition shadow-lg cursor-pointer"
            title="시점 변경 (단축키: C)"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono">{cameraView}</span>
          </button>

          <button
            onClick={onToggleHeadlights}
            className={`p-2 rounded-xl border transition shadow-lg cursor-pointer ${
              areHeadlightsOn
                ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                : 'bg-slate-900/90 border-slate-700 text-slate-500'
            }`}
            title="전조등 On/Off (단축키: L)"
          >
            <Lightbulb className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Dynamic HUD Status Banners (Fuel-Cut or Regen Active) */}
      <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
        {/* ICE Deceleration Fuel-Cut Banner */}
        {isICE && physicsState.isFuelCutActive && (
          <div className="animate-pulse px-4 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs font-mono font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>⚡ 퓨얼컷 활성화 (Fuel-Cut Active: 0.00 L/h)</span>
          </div>
        )}

        {/* EV High Regeneration Banner */}
        {!isICE && physicsState.instantRegenKw > 2.0 && (
          <div className="animate-pulse px-4 py-1.5 rounded-full bg-cyan-950/90 border border-cyan-400 text-cyan-300 text-xs font-mono font-bold shadow-lg shadow-cyan-500/20 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>
              회생제동 배터리 충전 중 (+{physicsState.instantRegenKw.toFixed(1)} kW)
            </span>
          </div>
        )}

        {/* i-Pedal Complete Stop Indicator */}
        {!isICE && regenLevel === 4 && speed === 0 && (
          <div className="px-3 py-1 rounded-md bg-purple-950/80 border border-purple-500/50 text-purple-300 text-[11px] font-mono font-bold">
            i-Pedal 완전 정지 상태 (Hold)
          </div>
        )}
      </div>

      {/* Bottom Cockpit Instrument Cluster & Touch Controls */}
      <div className="flex flex-col lg:flex-row items-end justify-between gap-4 pb-2">
        {/* EV Regenerative Braking Paddle Selector */}
        {!isICE ? (
          <div
            id="hud_regen_controls"
            className="pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col gap-2 min-w-[280px]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-400" /> 회생제동 패들 감도 (Q / E)
              </span>
              <span className="text-xs font-mono font-black text-cyan-400">
                {regenLevel === 4 ? 'i-Pedal (원페달)' : `Lv ${regenLevel}`}
              </span>
            </div>

            {/* Level Step Selector */}
            <div className="grid grid-cols-5 gap-1.5">
              {[0, 1, 2, 3, 4].map((lvl) => {
                const isActive = regenLevel === lvl;
                return (
                  <button
                    key={lvl}
                    onClick={() => onSetRegenLevel(lvl)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer flex flex-col items-center ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/40'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{lvl === 4 ? 'MAX' : lvl}</span>
                  </button>
                );
              })}
            </div>

            <p className="text-[10px] text-slate-400 mt-0.5">
              {regenLevel === 0 && '0단: 저항 없는 무부하 관성 활주 (고속도로 타력 주행)'}
              {regenLevel === 1 && '1단: 완만한 감속 및 기초 배터리 충전'}
              {regenLevel === 2 && '2단: 도심 주행 표준 회생제동'}
              {regenLevel === 3 && '3단: 강한 감속 및 고효율 에너지 회수'}
              {regenLevel === 4 && 'i-Pedal: 페달 OFF 시 완전 정지까지 제어 (원페달 주행)'}
            </p>
          </div>
        ) : (
          <div
            id="hud_ice_cluster"
            className="pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col gap-1.5 min-w-[280px]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" /> 엔진 타코미터 & 변속단
              </span>
              <span className="text-xs font-mono font-black text-amber-400">
                {physicsState.currentGear}단 / {physicsState.engineRpm} RPM
              </span>
            </div>

            {/* RPM Progress Bar */}
            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full transition-all duration-75 bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500"
                style={{ width: `${Math.min(100, (physicsState.engineRpm / 6500) * 100)}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>순간 연료 소모량:</span>
              <span className="text-amber-300 font-bold">
                {physicsState.instantFuelRateLPerHr.toFixed(2)} L/h
              </span>
            </div>
          </div>
        )}

        {/* Center Digital Speedometer & Power/Regen Meter */}
        <div
          id="hud_main_speedometer"
          className="pointer-events-auto bg-slate-950/90 backdrop-blur-lg border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col items-center min-w-[260px]"
        >
          {/* Power / Charge Gauge Bar */}
          <div className="w-full mb-2">
            <div className="flex justify-between text-[10px] font-mono uppercase font-bold text-slate-400 mb-1">
              <span className="text-cyan-400">Charge (Regen)</span>
              <span className="text-rose-400">Power (Boost)</span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full border border-slate-800 relative overflow-hidden flex">
              {/* Regen Left Bar */}
              <div className="w-1/2 h-full flex justify-end bg-slate-900">
                {isRegenerating && (
                  <div
                    className="h-full bg-cyan-400 transition-all duration-75"
                    style={{ width: `${Math.min(100, (physicsState.instantRegenKw / 60) * 100)}%` }}
                  />
                )}
              </div>
              {/* Center Divider */}
              <div className="w-0.5 h-full bg-slate-700 z-10" />
              {/* Power Right Bar */}
              <div className="w-1/2 h-full bg-slate-900">
                {!isRegenerating && (
                  <div
                    className="h-full bg-rose-500 transition-all duration-75"
                    style={{ width: `${powerPct}%` }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Large Speed Display */}
          <div className="flex flex-col items-center">
            <span className="text-6xl font-black font-mono tracking-tighter text-white">
              {speed}
            </span>
            <span className="text-xs font-mono font-bold text-slate-400 tracking-widest uppercase">
              km / h
            </span>
          </div>

          {/* Motor / Engine Instant kW Power Output */}
          <div className="mt-2 pt-2 border-t border-slate-800 w-full flex justify-between text-xs font-mono">
            <span className="text-slate-400">순간 출력:</span>
            <span className={`font-bold ${isRegenerating ? 'text-cyan-400' : 'text-slate-200'}`}>
              {isRegenerating ? `-${physicsState.instantRegenKw.toFixed(1)} kW` : `+${powerKw.toFixed(1)} kW`}
            </span>
          </div>
        </div>

        {/* Touch & Click Driving Pedals for Mobile / Mouse Support */}
        <div
          id="hud_touch_controls"
          className="pointer-events-auto flex items-center gap-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 p-3 rounded-2xl shadow-2xl"
        >
          {/* Steer Left/Right */}
          <div className="flex gap-1.5">
            <button
              onMouseDown={() => onSteerChange(-1)}
              onMouseUp={() => onSteerChange(0)}
              onTouchStart={() => onSteerChange(-1)}
              onTouchEnd={() => onSteerChange(0)}
              className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 active:bg-slate-700 flex items-center justify-center text-slate-200 transition cursor-pointer"
              title="좌회전 (단축키: A / Left)"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onMouseDown={() => onSteerChange(1)}
              onMouseUp={() => onSteerChange(0)}
              onTouchStart={() => onSteerChange(1)}
              onTouchEnd={() => onSteerChange(0)}
              className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 active:bg-slate-700 flex items-center justify-center text-slate-200 transition cursor-pointer"
              title="우회전 (단축키: D / Right)"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Brake Pedal */}
          <button
            onMouseDown={() => onBrakeChange(1)}
            onMouseUp={() => onBrakeChange(0)}
            onTouchStart={() => onBrakeChange(1)}
            onTouchEnd={() => onBrakeChange(0)}
            className="w-14 h-14 rounded-2xl bg-red-950/70 border border-red-700/80 active:bg-red-800 text-red-300 flex flex-col items-center justify-center text-xs font-bold transition shadow-lg cursor-pointer"
            title="브레이크 (단축키: S / Space)"
          >
            <ArrowDown className="w-4 h-4 mb-0.5" />
            <span>BRAKE</span>
          </button>

          {/* Throttle Pedal */}
          <button
            onMouseDown={() => onThrottleChange(1)}
            onMouseUp={() => onThrottleChange(0)}
            onTouchStart={() => onThrottleChange(1)}
            onTouchEnd={() => onThrottleChange(0)}
            className="w-14 h-16 rounded-2xl bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-400 text-slate-950 flex flex-col items-center justify-center text-xs font-black transition shadow-lg shadow-cyan-500/30 cursor-pointer"
            title="가속 페달 (단축키: W / Up)"
          >
            <ArrowUp className="w-5 h-5 mb-0.5" />
            <span>GAS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
