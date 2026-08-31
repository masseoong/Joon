import React, { useState, useEffect, useRef } from 'react';
import {
  VehicleType,
  EnvironmentType,
  ChallengeMode,
  PricingConfig,
  DEFAULT_PRICING,
  TelemetryPoint,
  RunSummary,
  VEHICLE_CONFIGS,
} from './types/game';
import { PhysicsState, createInitialPhysicsState } from './utils/physics';
import { soundManager } from './utils/audio';
import { GameSimulation } from './simulation/GameSimulation';
import { Header } from './components/Header';
import { DrivingHUD } from './components/DrivingHUD';
import { AnalyticsModal } from './components/AnalyticsModal';
import { VehicleSelector } from './components/VehicleSelector';
import { EnvironmentSelector } from './components/EnvironmentSelector';
import { PriceSettingsModal } from './components/PriceSettingsModal';
import { ComparisonMatrixModal } from './components/ComparisonMatrixModal';
import { GuideModal } from './components/GuideModal';
import confetti from 'canvas-confetti';

export const App: React.FC = () => {
  // Game Setup State
  const [vehicleType, setVehicleType] = useState<VehicleType>('EV');
  const [envType, setEnvType] = useState<EnvironmentType>('URBAN_CONGESTION');
  const [challengeMode, setChallengeMode] = useState<ChallengeMode>('FIXED_DISTANCE');
  const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING);

  // Simulation State
  const containerRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<GameSimulation | null>(null);

  const [physicsState, setPhysicsState] = useState<PhysicsState>(() =>
    createInitialPhysicsState(VEHICLE_CONFIGS['EV'])
  );
  const [telemetry, setTelemetry] = useState<TelemetryPoint | null>(null);
  const [cameraView, setCameraView] = useState<'CHASE' | 'COCKPIT' | 'HOOD' | 'TOP_DOWN'>('CHASE');
  const [regenLevel, setRegenLevel] = useState<number>(3);
  const [areHeadlightsOn, setAreHeadlightsOn] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Modals
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState<boolean>(false);
  const [isEnvModalOpen, setIsEnvModalOpen] = useState<boolean>(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState<boolean>(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState<boolean>(false);
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);

  // Result Summary
  const [lastSummary, setLastSummary] = useState<RunSummary | null>(null);
  const [collisionWarning, setCollisionWarning] = useState<boolean>(false);

  // Initialize or Reinitialize 3D Simulation
  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy existing simulation
    if (simRef.current) {
      simRef.current.destroy();
    }

    const sim = new GameSimulation(
      containerRef.current,
      vehicleType,
      envType,
      challengeMode,
      pricing,
      {
        onPhysicsUpdate: (state, tel) => {
          setPhysicsState(state);
          setTelemetry(tel);
        },
        onGoalReached: (summary) => {
          setLastSummary(summary);
          setIsAnalyticsModalOpen(true);
          try {
            confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
          } catch {
            // ignore confetti failure
          }
        },
        onEnergyExhausted: (summary) => {
          setLastSummary(summary);
          setIsAnalyticsModalOpen(true);
        },
        onCollision: () => {
          setCollisionWarning(true);
          setTimeout(() => setCollisionWarning(false), 1200);
        },
      }
    );

    simRef.current = sim;
    setRegenLevel(sim.regenLevel);

    return () => {
      sim.destroy();
    };
  }, [vehicleType, envType, challengeMode, pricing]);

  const handleReset = () => {
    if (simRef.current) {
      simRef.current.restart();
      setPhysicsState(simRef.current.physicsState);
      setLastSummary(null);
    }
  };

  const handleSetRegenLevel = (lvl: number) => {
    setRegenLevel(lvl);
    if (simRef.current) {
      simRef.current.setRegenLevel(lvl);
    }
  };

  const handleCycleCamera = () => {
    if (simRef.current) {
      simRef.current.cycleCamera();
      setCameraView(simRef.current.cameraView);
    }
  };

  const handleToggleHeadlights = () => {
    if (simRef.current) {
      simRef.current.toggleHeadlights();
      setAreHeadlightsOn(simRef.current.areHeadlightsOn);
    }
  };

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans select-none">
      {/* Top Header */}
      <Header
        vehicleType={vehicleType}
        envType={envType}
        challengeMode={challengeMode}
        pricing={pricing}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onReset={handleReset}
        onOpenVehicleModal={() => setIsVehicleModalOpen(true)}
        onOpenEnvModal={() => setIsEnvModalOpen(true)}
        onOpenAnalyticsModal={() => {
          if (simRef.current) {
            setLastSummary(simRef.current.generateSummary());
          }
          setIsAnalyticsModalOpen(true);
        }}
        onOpenPriceModal={() => setIsPriceModalOpen(true)}
        onOpenGuideModal={() => setIsGuideModalOpen(true)}
        onOpenMatrixModal={() => setIsMatrixModalOpen(true)}
      />

      {/* 3D WebGL Canvas Viewport */}
      <div
        id="canvas_3d_viewport"
        ref={containerRef}
        className="w-full h-full absolute inset-0 z-0 cursor-grab active:cursor-grabbing"
      />

      {/* Collision Warning Flash */}
      {collisionWarning && (
        <div className="absolute inset-0 bg-red-600/30 z-30 pointer-events-none flex items-center justify-center animate-pulse">
          <div className="bg-red-950/90 border border-red-500 text-red-200 px-6 py-3 rounded-2xl text-base font-bold shadow-2xl">
            ⚠️ 전방 차량과의 안전거리 미확보 (충돌 감속 발생)
          </div>
        </div>
      )}

      {/* Real-Time Driving HUD */}
      <DrivingHUD
        vehicleType={vehicleType}
        envType={envType}
        challengeMode={challengeMode}
        physicsState={physicsState}
        telemetry={telemetry}
        pricing={pricing}
        cameraView={cameraView}
        regenLevel={regenLevel}
        areHeadlightsOn={areHeadlightsOn}
        onSetRegenLevel={handleSetRegenLevel}
        onCycleCamera={handleCycleCamera}
        onToggleHeadlights={handleToggleHeadlights}
        onThrottleChange={(val) => {
          if (simRef.current) simRef.current.throttleInput = val;
        }}
        onBrakeChange={(val) => {
          if (simRef.current) simRef.current.brakeInput = val;
        }}
        onSteerChange={(val) => {
          if (simRef.current) simRef.current.steerInput = val;
        }}
      />

      {/* Modals */}
      {isVehicleModalOpen && (
        <VehicleSelector
          currentVehicle={vehicleType}
          onSelectVehicle={setVehicleType}
          onClose={() => setIsVehicleModalOpen(false)}
        />
      )}

      {isEnvModalOpen && (
        <EnvironmentSelector
          currentEnv={envType}
          currentMode={challengeMode}
          onSelectEnv={setEnvType}
          onSelectMode={setChallengeMode}
          onClose={() => setIsEnvModalOpen(false)}
        />
      )}

      {isAnalyticsModalOpen && (
        <AnalyticsModal
          summary={lastSummary}
          telemetryHistory={simRef.current ? simRef.current.telemetryHistory : []}
          pricing={pricing}
          onClose={() => setIsAnalyticsModalOpen(false)}
          onRestart={() => {
            setIsAnalyticsModalOpen(false);
            handleReset();
          }}
        />
      )}

      {isPriceModalOpen && (
        <PriceSettingsModal
          pricing={pricing}
          onUpdatePricing={setPricing}
          onClose={() => setIsPriceModalOpen(false)}
        />
      )}

      {isMatrixModalOpen && (
        <ComparisonMatrixModal
          pricing={pricing}
          onClose={() => setIsMatrixModalOpen(false)}
        />
      )}

      {isGuideModalOpen && (
        <GuideModal onClose={() => setIsGuideModalOpen(false)} />
      )}
    </main>
  );
};

export default App;
