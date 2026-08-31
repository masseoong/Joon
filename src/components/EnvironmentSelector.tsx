import React from 'react';
import { EnvironmentType, ChallengeMode, ENVIRONMENT_CONFIGS } from '../types/game';
import { MapPin, Building2, Route, Mountain, Check, X } from 'lucide-react';

interface EnvironmentSelectorProps {
  currentEnv: EnvironmentType;
  currentMode: ChallengeMode;
  onSelectEnv: (env: EnvironmentType) => void;
  onSelectMode: (mode: ChallengeMode) => void;
  onClose: () => void;
}

export const EnvironmentSelector: React.FC<EnvironmentSelectorProps> = ({
  currentEnv,
  currentMode,
  onSelectEnv,
  onSelectMode,
  onClose,
}) => {
  const envs: EnvironmentType[] = ['URBAN_CONGESTION', 'HIGHWAY', 'MOUNTAIN_WINDING'];

  const getEnvIcon = (type: EnvironmentType) => {
    switch (type) {
      case 'URBAN_CONGESTION':
        return <Building2 className="w-5 h-5 text-amber-400" />;
      case 'HIGHWAY':
        return <Route className="w-5 h-5 text-sky-400" />;
      case 'MOUNTAIN_WINDING':
        return <Mountain className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div id="modal_env_backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div id="modal_env_content" className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h2 className="text-base font-bold text-white">주행 환경 및 챌린지 모드 선택</h2>
            <p className="text-xs text-slate-400">
              도심 정체, 고속도로, 산악 와인딩 중 테스트할 도로 환경을 선택하세요
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Environment Cards */}
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 block">
              1. 도로 환경 조건
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {envs.map((eKey) => {
                const env = ENVIRONMENT_CONFIGS[eKey];
                const isSelected = currentEnv === eKey;

                return (
                  <div
                    key={eKey}
                    onClick={() => onSelectEnv(eKey)}
                    className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-500 ring-2 ring-cyan-500/30'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        {getEnvIcon(eKey)}
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-xs text-white">{env.name}</h3>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{env.description}</p>
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-800/60 flex justify-between text-[10px] font-mono text-slate-400">
                      <span>최대 경사: ±{env.maxGradePercent}%</span>
                      <span>교통량: {env.trafficDensity}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Challenge Mode Selection */}
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 block">
              2. 챌린지 룰 & 모드
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div
                onClick={() => onSelectMode('FIXED_ENERGY')}
                className={`p-3.5 rounded-xl border transition cursor-pointer ${
                  currentMode === 'FIXED_ENERGY'
                    ? 'bg-slate-800/90 border-cyan-500 ring-2 ring-cyan-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-900/60'
                }`}
              >
                <div className="font-bold text-xs text-cyan-300">일정 연료/에너지 챌린지</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  제한된 초기 에너지(EV: 5kWh, ICE: 1.0L) 하에서 최대한 멀리 가는 기록 대조
                </div>
              </div>

              <div
                onClick={() => onSelectMode('FIXED_DISTANCE')}
                className={`p-3.5 rounded-xl border transition cursor-pointer ${
                  currentMode === 'FIXED_DISTANCE'
                    ? 'bg-slate-800/90 border-cyan-500 ring-2 ring-cyan-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-900/60'
                }`}
              >
                <div className="font-bold text-xs text-emerald-300">고정 거리(3km) 벤치마크</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  동일한 3km 코스를 완주했을 때의 최종 유류비 및 전기요금 비교
                </div>
              </div>

              <div
                onClick={() => onSelectMode('FREE_DRIVE')}
                className={`p-3.5 rounded-xl border transition cursor-pointer ${
                  currentMode === 'FREE_DRIVE'
                    ? 'bg-slate-800/90 border-cyan-500 ring-2 ring-cyan-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-900/60'
                }`}
              >
                <div className="font-bold text-xs text-amber-300">자유 연습 주행 (Free)</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  무제한 에너지로 패들 회생제동 및 관성 퓨얼컷 발컨트롤 테크닉 연습
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition cursor-pointer"
          >
            적용 및 시작
          </button>
        </div>
      </div>
    </div>
  );
};
