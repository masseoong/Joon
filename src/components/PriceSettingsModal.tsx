import React, { useState } from 'react';
import { PricingConfig, DEFAULT_PRICING } from '../types/game';
import { DollarSign, RotateCcw, X, Check } from 'lucide-react';

interface PriceSettingsModalProps {
  pricing: PricingConfig;
  onUpdatePricing: (pricing: PricingConfig) => void;
  onClose: () => void;
}

export const PriceSettingsModal: React.FC<PriceSettingsModalProps> = ({
  pricing,
  onUpdatePricing,
  onClose,
}) => {
  const [gasoline, setGasoline] = useState(pricing.gasolinePerLiter);
  const [electricity, setElectricity] = useState(pricing.electricityPerKwh);

  const handleSave = () => {
    onUpdatePricing({
      ...pricing,
      gasolinePerLiter: gasoline,
      electricityPerKwh: electricity,
    });
    onClose();
  };

  const handleResetDefaults = () => {
    setGasoline(DEFAULT_PRICING.gasolinePerLiter);
    setElectricity(DEFAULT_PRICING.electricityPerKwh);
  };

  return (
    <div id="modal_price_backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div id="modal_price_content" className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-md text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">실시간 유가 및 전기요금 단가 설정</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Inputs */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              휘발유 (가솔린) 단가 (KRW / Liter)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 font-mono text-xs">₩</span>
              <input
                type="number"
                value={gasoline}
                onChange={(e) => setGasoline(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-4 py-2 text-sm font-mono text-amber-300 focus:outline-none focus:border-amber-500"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">한국 오피넷 전국 평균 약 1,650 ~ 1,750원</p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              전기차 충전 단가 (KRW / kWh)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 font-mono text-xs">₩</span>
              <input
                type="number"
                value={electricity}
                onChange={(e) => setElectricity(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-4 py-2 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">완속 약 200~280원 / 급속 약 320~380원</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>기본값 복원</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium transition cursor-pointer"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>적용</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
