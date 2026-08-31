import React, { useState } from 'react';
import {
  RunSummary,
  TelemetryPoint,
  VEHICLE_CONFIGS,
  ENVIRONMENT_CONFIGS,
  PricingConfig,
} from '../types/game';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import {
  X,
  Zap,
  Flame,
  Award,
  TrendingDown,
  Activity,
  Layers,
  Leaf,
  Gauge,
} from 'lucide-react';

interface AnalyticsModalProps {
  summary: RunSummary | null;
  telemetryHistory: TelemetryPoint[];
  pricing: PricingConfig;
  onClose: () => void;
  onRestart: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  summary,
  telemetryHistory,
  pricing,
  onClose,
  onRestart,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CHARTS' | 'COMPARISON'>('OVERVIEW');

  if (!summary && telemetryHistory.length === 0) return null;

  const env = summary ? ENVIRONMENT_CONFIGS[summary.environmentType] : null;

  // Downsample telemetry history if too large for recharts performance
  const chartData = React.useMemo(() => {
    const step = Math.max(1, Math.floor(telemetryHistory.length / 80));
    return telemetryHistory.filter((_, idx) => idx % step === 0).map((pt) => ({
      distKm: (pt.distanceM / 1000).toFixed(2),
      speedKmh: pt.speedKmh,
      altitudeM: pt.altitudeM,
      instantPowerKw: pt.instantPowerKw,
      instantFuelRate: pt.instantFuelFlowLPerHr,
      costKrw: pt.accumulatedCostKrw,
      regenRecoveredKw: pt.regenPowerRecoveredKw,
      frictionLossKw: pt.frictionBrakeWastedKw,
    }));
  }, [telemetryHistory]);

  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: 'S+', color: 'text-emerald-400', label: '완벽한 에코 마스터' };
    if (score >= 80) return { grade: 'A', color: 'text-cyan-400', label: '우수한 고효율 운전' };
    if (score >= 70) return { grade: 'B', color: 'text-blue-400', label: '평균적인 경제 운전' };
    return { grade: 'C', color: 'text-amber-400', label: '가감속 과다 / 개선 필요' };
  };

  const scoreInfo = summary ? getScoreGrade(summary.ecoScore) : { grade: 'A', color: 'text-cyan-400', label: '주행 분석' };

  return (
    <div id="modal_analytics_backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div
        id="modal_analytics_content"
        className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col text-slate-100 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                정량적 에코드라이빙 텔레메트리 랩
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {summary?.vehicleType} • {summary?.environmentType}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                실제 물리 데이터 기반 주행 전비, 유가 비용, 회생제동 및 퓨얼컷 정밀 분석
              </p>
            </div>
          </div>

          <button
            id="btn_close_analytics"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/30">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'OVERVIEW'
                ? 'bg-slate-900 border-t border-x border-slate-700 text-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>종합 성과 & 에코 스코어</span>
          </button>

          <button
            onClick={() => setActiveTab('CHARTS')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'CHARTS'
                ? 'bg-slate-900 border-t border-x border-slate-700 text-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>텔레메트리 시계열 차트</span>
          </button>

          <button
            onClick={() => setActiveTab('COMPARISON')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'COMPARISON'
                ? 'bg-slate-900 border-t border-x border-slate-700 text-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>차종별 3자 비용 대조</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'OVERVIEW' && summary && (
            <div className="space-y-6">
              {/* Eco Score & Key Metrics Banner */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Score Card */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-semibold text-slate-400">에코드라이빙 등급</span>
                  <div className={`text-4xl font-black font-mono my-1 ${scoreInfo.color}`}>
                    {scoreInfo.grade}
                  </div>
                  <span className="text-xs font-bold text-slate-300">{scoreInfo.label}</span>
                  <span className="text-[11px] text-slate-500 font-mono mt-0.5">
                    종합 점수: {summary.ecoScore} / 100
                  </span>
                </div>

                {/* Primary Efficiency */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-cyan-400" /> 종합 실측 전비/연비
                  </span>
                  <div className="text-2xl font-black font-mono text-cyan-300 my-1">
                    {summary.efficiencyRating.primaryValue}{' '}
                    <span className="text-xs font-normal text-slate-400">{summary.efficiencyRating.primaryUnit}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    주행거리: {summary.totalDistanceKm} km
                  </span>
                </div>

                {/* Total Cost */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> 총 유류비 / 전기요금
                  </span>
                  <div className="text-2xl font-black font-mono text-amber-400 my-1">
                    ₩{summary.totalCostKrw.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    km당 비용: ₩{summary.costPerKmKrw} / km
                  </span>
                </div>

                {/* CO2 Emissions */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Leaf className="w-3.5 h-3.5 text-emerald-400" /> 탄소 배출량
                  </span>
                  <div className="text-2xl font-black font-mono text-emerald-400 my-1">
                    {summary.co2EmissionsGram} <span className="text-xs font-normal text-slate-400">g CO₂</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    소요시간: {Math.floor(summary.totalTimeSec / 60)}분 {summary.totalTimeSec % 60}초
                  </span>
                </div>
              </div>

              {/* Energy Recovery & Loss Deep-Dive */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-cyan-400" /> 에너지 회수 vs 마찰 브레이크 손실 분석
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                  {summary.vehicleType !== 'ICE' ? (
                    <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/60">
                      <div className="text-slate-400 mb-1">회생제동 회수 에너지</div>
                      <div className="text-lg font-bold text-cyan-300">
                        +{summary.totalElectricityRegeneratedKwh} kWh
                      </div>
                      <div className="text-[11px] text-emerald-400 mt-1">
                        절감 환산: 약 ₩{Math.round(summary.totalElectricityRegeneratedKwh * pricing.electricityPerKwh)}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60">
                      <div className="text-slate-400 mb-1">퓨얼컷(Fuel Cut) 무연료 시간</div>
                      <div className="text-lg font-bold text-emerald-300">
                        {summary.fuelCutDurationSec} 초
                      </div>
                      <div className="text-[11px] text-emerald-400 mt-1">
                        가속페달 OFF 관성주행 시간
                      </div>
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 mb-1">마찰 브레이크 열손실</div>
                    <div className="text-lg font-bold text-red-400">
                      {summary.frictionBrakeWastedKwh} kWh
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      원페달/회생제동 활용 시 회수 가능한 손실
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 mb-1">관성 주행 비율</div>
                    <div className="text-lg font-bold text-blue-300">
                      {summary.coastingDistancePercent}%
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      총 거리 중 탄력 주행 거리 비중
                    </div>
                  </div>
                </div>
              </div>

              {/* Driving Highlights and Advice */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" /> 주행 평가 및 에코 코칭
                </h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  {summary.drivingHighlights.map((hl, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                      <span>{hl}</span>
                    </li>
                  ))}
                  {summary.environmentType === 'URBAN_CONGESTION' && summary.vehicleType === 'ICE' && (
                    <li className="flex items-start gap-2 text-amber-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span>
                        도심 정체구간에서는 전기차(EV)가 회생제동과 공회전 제로(Zero Idle) 덕분에 약 60% 이상의 비용 우위를 점합니다.
                      </span>
                    </li>
                  )}
                  {summary.environmentType === 'HIGHWAY' && summary.vehicleType === 'EV' && (
                    <li className="flex items-start gap-2 text-cyan-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                      <span>
                        고속도로에서는 공기저항(v²) 증가로 전비가 하락하므로 정속 주행(100km/h 이하)과 적절한 차간거리 유지가 전비를 방어합니다.
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'CHARTS' && (
            <div className="space-y-6">
              {/* Speed & Altitude Chart */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-bold text-slate-300 mb-3">속도 (km/h) 및 고도 (m) vs 거리</h3>
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="distKm" stroke="#94a3b8" tick={{ fontSize: 10 }} unit="km" />
                      <YAxis yAxisId="left" stroke="#38bdf8" tick={{ fontSize: 10 }} unit="km/h" />
                      <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{ fontSize: 10 }} unit="m" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line yAxisId="left" type="monotone" dataKey="speedKmh" name="속도 (km/h)" stroke="#38bdf8" strokeWidth={2} dot={false} />
                      <Line yAxisId="right" type="monotone" dataKey="altitudeM" name="고도 (m)" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Instant Power / Regen Chart */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-bold text-slate-300 mb-3">순간 모터 출력 (+) vs 회생 충전 (-) (kW)</h3>
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="distKm" stroke="#94a3b8" tick={{ fontSize: 10 }} unit="km" />
                      <YAxis stroke="#f43f5e" tick={{ fontSize: 10 }} unit="kW" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Area type="monotone" dataKey="instantPowerKw" name="모터/엔진 파워 (kW)" stroke="#06b6d4" fill="#0891b2" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Cumulative Cost Chart */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-bold text-slate-300 mb-3">누적 주행 비용 증가 곡선 (₩)</h3>
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="distKm" stroke="#94a3b8" tick={{ fontSize: 10 }} unit="km" />
                      <YAxis stroke="#fbbf24" tick={{ fontSize: 10 }} unit="₩" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line type="monotone" dataKey="costKrw" name="실제 누적 비용 (₩)" stroke="#fbbf24" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'COMPARISON' && summary && (
            <div className="space-y-6">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-2">동일 주행 조건 하 3대 파워트레인 정량 비교</h3>
                <p className="text-xs text-slate-400 mb-4">
                  이번 주행 경로({summary.totalDistanceKm}km, {env?.name})를 다른 차종으로 완주했을 때의 실제 유가/전기료 시뮬레이션 대조값입니다.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* EV Card */}
                  <div className={`p-4 rounded-xl border ${summary.vehicleType === 'EV' ? 'bg-cyan-950/40 border-cyan-500' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-cyan-300 flex items-center gap-1">
                        <Zap className="w-4 h-4 text-cyan-400" /> 순수 전기차 (EV)
                      </span>
                      {summary.vehicleType === 'EV' && (
                        <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-semibold">내 기록</span>
                      )}
                    </div>
                    <div className="text-2xl font-black font-mono text-cyan-400 my-2">
                      ₩{(summary.vehicleType === 'EV' ? summary.totalCostKrw : summary.comparisonCostEv).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-400 space-y-1 font-mono">
                      <div>예상 전비: 5.8 ~ 6.5 km/kWh</div>
                      <div>kWh 단가: ₩{pricing.electricityPerKwh}</div>
                    </div>
                  </div>

                  {/* PHEV Card */}
                  <div className={`p-4 rounded-xl border ${summary.vehicleType === 'PHEV' ? 'bg-emerald-950/40 border-emerald-500' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-emerald-300 flex items-center gap-1">
                        <Zap className="w-4 h-4 text-emerald-400" /> PHEV (하이브리드)
                      </span>
                      {summary.vehicleType === 'PHEV' && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-semibold">내 기록</span>
                      )}
                    </div>
                    <div className="text-2xl font-black font-mono text-emerald-400 my-2">
                      ₩{(summary.vehicleType === 'PHEV' ? summary.totalCostKrw : summary.comparisonCostPhev).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-400 space-y-1 font-mono">
                      <div>복합 연비: 14.5 ~ 17.0 km/L</div>
                      <div>가솔린 + 전기 듀얼</div>
                    </div>
                  </div>

                  {/* ICE Card */}
                  <div className={`p-4 rounded-xl border ${summary.vehicleType === 'ICE' ? 'bg-amber-950/40 border-amber-500' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-amber-300 flex items-center gap-1">
                        <Flame className="w-4 h-4 text-amber-400" /> 가솔린 내연기관 (ICE)
                      </span>
                      {summary.vehicleType === 'ICE' && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-semibold">내 기록</span>
                      )}
                    </div>
                    <div className="text-2xl font-black font-mono text-amber-400 my-2">
                      ₩{(summary.vehicleType === 'ICE' ? summary.totalCostKrw : summary.comparisonCostIce).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-400 space-y-1 font-mono">
                      <div>예상 연비: 7.5 ~ 15.5 km/L</div>
                      <div>휘발유 단가: ₩{pricing.gasolinePerLiter}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Economic Verdict */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 text-xs text-slate-300">
                <h4 className="font-bold text-white mb-2 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-yellow-400" /> 정량적 경제성 종합 판정
                </h4>
                <p className="leading-relaxed text-slate-300">
                  {summary.environmentType === 'URBAN_CONGESTION' ? (
                    <span>
                      도심 정체 환경에서는 <strong>전기차(EV)가 내연기관 대비 약 55~68%의 비용 절감 효과</strong>를 달성했습니다.
                      전기차의 0 공회전 손실과 회생제동 에너지 회수 덕분입니다.
                    </span>
                  ) : summary.environmentType === 'HIGHWAY' ? (
                    <span>
                      고속도로 정속 항속 환경에서는 <strong>내연기관이 8단 록업 기어비와 가벼운 공차중량</strong>으로 연비를 극대화하여 전기차와의 비용 격차를 30% 수준으로 크게 좁혔습니다.
                    </span>
                  ) : (
                    <span>
                      산악 비포장 와인딩에서는 <strong>오르막의 높은 전력 소모를 내리막 롱 패들 회생제동으로 최대 45%까지 재충전</strong>하여 전기차의 스마트 회생제동 테크닉이 빛을 발했습니다.
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <button
            id="btn_restart_from_analytics"
            onClick={onRestart}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition shadow-lg shadow-cyan-600/30 cursor-pointer"
          >
            새로 주행하기 (Restart)
          </button>

          <button
            id="btn_close_analytics_footer"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
