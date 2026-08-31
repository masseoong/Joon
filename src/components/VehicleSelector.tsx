import React from 'react';
import { VehicleType, VEHICLE_CONFIGS } from '../types/game';
import { Zap, Flame, Shield, Check, X } from 'lucide-react';

interface VehicleSelectorProps {
  currentVehicle: VehicleType;
  onSelectVehicle: (type: VehicleType) => void;
  onClose: () => void;
}

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  currentVehicle,
  onSelectVehicle,
  onClose,
}) => {
  const vehicles: VehicleType[] = ['EV', 'PHEV', 'ICE'];

  return (
    <div id="modal_vehicle_backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div id="modal_vehicle_content" className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h2 className="text-base font-bold text-white">차량 파워트레인 선택</h2>
            <p className="text-xs text-slate-400">
              전기차(EV), 플러그인 하이브리드(PHEV), 가솔린 내연기관(ICE)의 고유 물리 특성
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vehicle Cards Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {vehicles.map((vKey) => {
            const v = VEHICLE_CONFIGS[vKey];
            const isSelected = currentVehicle === vKey;

            return (
              <div
                key={vKey}
                onClick={() => {
                  onSelectVehicle(vKey);
                  onClose();
                }}
                className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500 ring-2 ring-cyan-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded font-mono font-bold"
                      style={{ backgroundColor: `${v.accentColor}25`, color: v.accentColor }}
                    >
                      {vKey}
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-white">{v.name.split(' ')[0]}</h3>
                  <p className="text-[11px] text-slate-400 mb-3 mt-1 leading-relaxed">{v.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-[10px] font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span>공차중량:</span>
                    <span className="text-slate-200">{v.curbWeightKg} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>최고출력:</span>
                    <span className="text-slate-200">{v.maxPowerKw} kW ({Math.round(v.maxPowerKw * 1.36)} ps)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>에코 핵심:</span>
                    <span className="text-cyan-400 font-sans">
                      {vKey === 'EV' ? 'i-Pedal 회생' : vKey === 'PHEV' ? 'EV/하이브리드 모드' : '퓨얼컷 관성주행'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
