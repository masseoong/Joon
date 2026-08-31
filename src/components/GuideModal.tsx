import React from 'react';
import { BookOpen, Zap, Flame, Key, Compass, X } from 'lucide-react';

interface GuideModalProps {
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ onClose }) => {
  return (
    <div id="modal_guide_backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div id="modal_guide_content" className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-2xl text-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">조작법 & 실전 에코드라이빙 테크닉</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-300 leading-relaxed overflow-y-auto max-h-[70vh]">
          {/* Controls */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <h3 className="font-bold text-white mb-2 flex items-center gap-1.5 text-xs">
              <Key className="w-4 h-4 text-cyan-400" /> 키보드 & 터치 조작 단축키
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400">가속 (Throttle):</span>
                <span className="text-cyan-400 font-bold">W / ↑ 방향키</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400">브레이크 (Brake):</span>
                <span className="text-red-400 font-bold">S / ↓ / Space</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400">조향 (Steering):</span>
                <span className="text-slate-200 font-bold">A / D (← / →)</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400">회생제동 패들 (EV):</span>
                <span className="text-emerald-400 font-bold">Q (감소) / E (증가)</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400">시점 변경 (Camera):</span>
                <span className="text-sky-400 font-bold">C 키</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400">전조등 토글 (Lights):</span>
                <span className="text-amber-400 font-bold">L 키</span>
              </div>
            </div>
          </div>

          {/* EV Techniques */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <h3 className="font-bold text-cyan-300 mb-2 flex items-center gap-1.5 text-xs">
              <Zap className="w-4 h-4 text-cyan-400" /> 전기차 (EV) 전비 극대화 비법
            </h3>
            <ul className="space-y-1.5 text-[11px] list-disc list-inside text-slate-300">
              <li>
                <strong>i-Pedal 원페달 주행:</strong> 패들을 4단(MAX)으로 올려 감속 시 브레이크 페달을 밟지 않고 가속페달 조절만으로 정지까지 유도하면 마찰 열손실 0%로 배터리를 대폭 회수합니다.
              </li>
              <li>
                <strong>고속도로 0단 글라이딩:</strong> 고속 항속 시에는 회생제동을 0단으로 두어 모터 저항 없이 무부하 관성 탄력 주행을 활용하세요.
              </li>
            </ul>
          </div>

          {/* ICE Techniques */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <h3 className="font-bold text-amber-300 mb-2 flex items-center gap-1.5 text-xs">
              <Flame className="w-4 h-4 text-amber-400" /> 내연기관 (ICE) 퓨얼컷 연비 테크닉
            </h3>
            <ul className="space-y-1.5 text-[11px] list-disc list-inside text-slate-300">
              <li>
                <strong>감속 시 퓨얼컷(Fuel-Cut) 활용:</strong> 주행 중 가속페달에서 발을 완전히 떼면 ECU가 연료 분사를 <strong>0.00 L/h</strong>로 완전 차단합니다. 신호 대기 전 미리 발을 떼는 관성운전이 핵심입니다.
              </li>
              <li>
                <strong>펄스 앤 글라이드 (Pulse & Glide):</strong> 완만한 오르막 전에 속도를 얹고(Pulse), 탄력으로 활주(Glide)하여 급가속을 방지하세요.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
