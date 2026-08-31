import React from 'react';
import { PricingConfig } from '../types/game';
import { Layers, Zap, Flame, Award, X, ArrowUpRight } from 'lucide-react';

interface ComparisonMatrixModalProps {
  pricing: PricingConfig;
  onClose: () => void;
}

export const ComparisonMatrixModal: React.FC<ComparisonMatrixModalProps> = ({
  pricing,
  onClose,
}) => {
  // Quantitative Simulation Matrix Data
  const matrixData = [
    {
      envName: '도심 극심 정체 (러시아워)',
      envDesc: '잦은 가감속, 신호대기, 병목',
      winner: 'EV (순수 전기차)',
      winnerColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/50',
      ev: { eff: '6.8 km/kWh', costPer100Km: `₩${Math.round((100 / 6.8) * pricing.electricityPerKwh).toLocaleString()}`, note: '공회전 0 + 회생제동 극대화' },
      phev: { eff: '18.5 km/L (환산)', costPer100Km: `₩${Math.round((100 / 18.5) * pricing.gasolinePerLiter * 0.7).toLocaleString()}`, note: '도심 순수 EV 모드 주행' },
      ice: { eff: '7.2 km/L', costPer100Km: `₩${Math.round((100 / 7.2) * pricing.gasolinePerLiter).toLocaleString()}`, note: '공회전 연료 낭비 극심' },
      deltaText: `EV가 내연기관 대비 약 ${Math.round((1 - ((100 / 6.8) * pricing.electricityPerKwh) / ((100 / 7.2) * pricing.gasolinePerLiter)) * 100)}% 비용 절감`,
    },
    {
      envName: '초고속 고속도로 (110km/h)',
      envDesc: '직선 고속 항속, 공기저항 증가',
      winner: 'ICE / PHEV 접전',
      winnerColor: 'text-amber-400 bg-amber-950/60 border-amber-500/50',
      ev: { eff: '4.8 km/kWh', costPer100Km: `₩${Math.round((100 / 4.8) * pricing.electricityPerKwh).toLocaleString()}`, note: '고속 풍손(Cd)으로 전비 저하' },
      phev: { eff: '15.8 km/L', costPer100Km: `₩${Math.round((100 / 15.8) * pricing.gasolinePerLiter).toLocaleString()}`, note: '하이브리드 병렬 구동' },
      ice: { eff: '14.5 km/L', costPer100Km: `₩${Math.round((100 / 14.5) * pricing.gasolinePerLiter).toLocaleString()}`, note: '8단 록업 고단 기어 최적 연소' },
      deltaText: '항속 주행 시 내연기관이 가벼운 차체로 연비 격차를 최소화',
    },
    {
      envName: '비포장 산악 와인딩 (급경사)',
      envDesc: '오르막 +12%, 급커브 내리막',
      winner: 'EV (스마트 패들 회생)',
      winnerColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/50',
      ev: { eff: '5.2 km/kWh', costPer100Km: `₩${Math.round((100 / 5.2) * pricing.electricityPerKwh).toLocaleString()}`, note: '내리막에서 위치에너지 40% 회수' },
      phev: { eff: '13.2 km/L', costPer100Km: `₩${Math.round((100 / 13.2) * pricing.gasolinePerLiter * 0.85).toLocaleString()}`, note: '엔진+모터 등판 및 회생' },
      ice: { eff: '8.5 km/L', costPer100Km: `₩${Math.round((100 / 8.5) * pricing.gasolinePerLiter).toLocaleString()}`, note: '내리막 퓨얼컷 엔진브레이크' },
      deltaText: '내리막 패들 회생제동 시 배터리 충전으로 오르막 손실을 대폭 보상',
    },
  ];

  return (
    <div id="modal_matrix_backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div id="modal_matrix_content" className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-4xl text-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="text-base font-bold text-white">차종 × 환경별 정량 비교 매트릭스 (Benchmark)</h2>
              <p className="text-xs text-slate-400">
                실시간 단가(휘발유 ₩{pricing.gasolinePerLiter}/L, 전기 ₩{pricing.electricityPerKwh}/kWh) 기준 100km 주행 비용 정밀 대조
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Matrix Table */}
        <div className="p-6 overflow-x-auto space-y-4">
          {matrixData.map((row, idx) => (
            <div key={idx} className="bg-slate-950/80 border border-slate-800 rounded-xl p-4.5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-sm text-white">{row.envName}</h3>
                  <p className="text-[11px] text-slate-400">{row.envDesc}</p>
                </div>
                <div className={`px-3 py-1 rounded-lg border text-xs font-bold font-mono flex items-center gap-1.5 ${row.winnerColor}`}>
                  <Award className="w-3.5 h-3.5" />
                  <span>우위: {row.winner}</span>
                </div>
              </div>

              {/* 3 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                {/* EV */}
                <div className="p-3 rounded-lg bg-slate-900/90 border border-cyan-900/50">
                  <div className="flex items-center justify-between text-cyan-400 font-bold mb-1">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> EV 전기차
                    </span>
                    <span>100km당 {row.ev.costPer100Km}</span>
                  </div>
                  <div className="text-slate-300 font-bold">전비: {row.ev.eff}</div>
                  <div className="text-[10px] text-slate-400 font-sans mt-0.5">{row.ev.note}</div>
                </div>

                {/* PHEV */}
                <div className="p-3 rounded-lg bg-slate-900/90 border border-emerald-900/50">
                  <div className="flex items-center justify-between text-emerald-400 font-bold mb-1">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> PHEV
                    </span>
                    <span>100km당 {row.phev.costPer100Km}</span>
                  </div>
                  <div className="text-slate-300 font-bold">연비: {row.phev.eff}</div>
                  <div className="text-[10px] text-slate-400 font-sans mt-0.5">{row.phev.note}</div>
                </div>

                {/* ICE */}
                <div className="p-3 rounded-lg bg-slate-900/90 border border-amber-900/50">
                  <div className="flex items-center justify-between text-amber-400 font-bold mb-1">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" /> ICE 가솔린
                    </span>
                    <span>100km당 {row.ice.costPer100Km}</span>
                  </div>
                  <div className="text-slate-300 font-bold">연비: {row.ice.eff}</div>
                  <div className="text-[10px] text-slate-400 font-sans mt-0.5">{row.ice.note}</div>
                </div>
              </div>

              <div className="mt-3 text-[11px] text-slate-300 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
                <span>{row.deltaText}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
