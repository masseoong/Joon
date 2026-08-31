import React from 'react';
import {
  VehicleType,
  EnvironmentType,
  ChallengeMode,
  PricingConfig,
  VEHICLE_CONFIGS,
  ENVIRONMENT_CONFIGS,
} from '../types/game';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Layers,
  Settings2,
  BarChart3,
  BookOpen,
  MapPin,
  Car,
  DollarSign,
} from 'lucide-react';

interface HeaderProps {
  vehicleType: VehicleType;
  envType: EnvironmentType;
  challengeMode: ChallengeMode;
  pricing: PricingConfig;
  isMuted: boolean;
  onToggleMute: () => void;
  onReset: () => void;
  onOpenVehicleModal: () => void;
  onOpenEnvModal: () => void;
  onOpenAnalyticsModal: () => void;
  onOpenPriceModal: () => void;
  onOpenGuideModal: () => void;
  onOpenMatrixModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  vehicleType,
  envType,
  challengeMode,
  pricing,
  isMuted,
  onToggleMute,
  onReset,
  onOpenVehicleModal,
  onOpenEnvModal,
  onOpenAnalyticsModal,
  onOpenPriceModal,
  onOpenGuideModal,
  onOpenMatrixModal,
}) => {
  const currentVehicle = VEHICLE_CONFIGS[vehicleType];
  const currentEnv = ENVIRONMENT_CONFIGS[envType];

  return (
    <header
      id="app_header"
      className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 text-slate-100 select-none pointer-events-auto"
    >
      {/* Brand & Main Selectors */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
            <span className="text-cyan-400 font-black text-sm">⚡</span>
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
              Eco-Drive <span className="text-cyan-400 font-mono text-xs font-normal">3D</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">
              전기차 vs 하이브리드 vs 내연기관 실증 랩
            </p>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

        {/* Vehicle Selector Trigger */}
        <button
          id="btn_select_vehicle"
          onClick={onOpenVehicleModal}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs font-medium transition cursor-pointer"
        >
          <Car className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold text-slate-200">{currentVehicle.name.split(' ')[0]}</span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold"
            style={{ backgroundColor: `${currentVehicle.accentColor}25`, color: currentVehicle.accentColor }}
          >
            {vehicleType}
          </span>
        </button>

        {/* Environment Selector Trigger */}
        <button
          id="btn_select_environment"
          onClick={onOpenEnvModal}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs font-medium transition cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-300 truncate max-w-[120px]">{currentEnv.name.split(' ')[0]}</span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
            {challengeMode === 'FIXED_ENERGY' ? '에너지 챌린지' : challengeMode === 'FIXED_DISTANCE' ? '3km 벤치마크' : '자유 주행'}
          </span>
        </button>
      </div>

      {/* Action Buttons & Utilities */}
      <div className="flex items-center gap-2">
        {/* Economic Matrix */}
        <button
          id="btn_open_matrix"
          onClick={onOpenMatrixModal}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 transition cursor-pointer"
          title="차종×환경별 정량 비교 매트릭스"
        >
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>우위 매트릭스</span>
        </button>

        {/* Telemetry Analytics */}
        <button
          id="btn_open_analytics"
          onClick={onOpenAnalyticsModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-700/70 text-xs font-bold text-cyan-300 transition cursor-pointer shadow-sm"
        >
          <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
          <span>주행 분석 랩</span>
        </button>

        {/* Price Settings */}
        <button
          id="btn_open_pricing"
          onClick={onOpenPriceModal}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-amber-400 transition cursor-pointer"
          title="유가 / 전기요금 단가 설정"
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>₩{pricing.electricityPerKwh}/kWh</span>
        </button>

        {/* Guide / Manual */}
        <button
          id="btn_open_guide"
          onClick={onOpenGuideModal}
          className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          title="조작법 & 에코드라이빙 테크닉 가이드"
        >
          <BookOpen className="w-4 h-4" />
        </button>

        {/* Audio Toggle */}
        <button
          id="btn_toggle_audio"
          onClick={onToggleMute}
          className={`p-2 rounded-xl border transition cursor-pointer ${
            isMuted
              ? 'bg-slate-900 border-slate-800 text-slate-500'
              : 'bg-cyan-950/50 border-cyan-800 text-cyan-400'
          }`}
          title={isMuted ? '음소거 해제' : '오디오 끄기'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Reset / Restart */}
        <button
          id="btn_reset_simulation"
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
          title="처음 위치로 재시작"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">재시작</span>
        </button>
      </div>
    </header>
  );
};
