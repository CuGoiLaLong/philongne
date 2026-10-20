import { useState, useCallback, useEffect } from 'react';
import { ThreePaperScene } from './components/ThreePaperScene';
import { ControlDock } from './components/ControlDock';
import { HelpModal } from './components/HelpModal';
import { LetterReaderModal } from './components/LetterReaderModal';
import { triggerCelebration } from './utils/confetti';
import { paperAudio } from './utils/audio';
import { CardContentVariant } from './utils/paperTextures';
import { Maximize2, Minimize2, Info, Heart, BookOpen } from 'lucide-react';

export default function App() {
  const [paperTone, setPaperTone] = useState<'parchment' | 'linen' | 'antique'>('parchment');
  const [cardScale, setCardScale] = useState<number>(0.95);
  const [cardVariant, setCardVariant] = useState<CardContentVariant>('all_women'); // Default to user's uploaded 20/10 card
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [gyroEnabled, setGyroEnabled] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isReaderOpen, setIsReaderOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [swingTrigger, setSwingTrigger] = useState<number>(0);
  const [hintVisible, setHintVisible] = useState<boolean>(true);

  // Sync sound setting with audio service
  useEffect(() => {
    paperAudio.enabled = soundEnabled;
  }, [soundEnabled]);

  // Request Device Orientation permission if needed on iOS (iPhone 12 Pro Max)
  const handleGyroToggle = useCallback(async () => {
    if (!gyroEnabled) {
      if (
        typeof window !== 'undefined' &&
        'DeviceOrientationEvent' in window &&
        typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function'
      ) {
        try {
          const resp = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
          if (resp === 'granted') {
            setGyroEnabled(true);
          }
        } catch {
          setGyroEnabled(true);
        }
      } else {
        setGyroEnabled(true);
      }
    } else {
      setGyroEnabled(false);
    }
  }, [gyroEnabled]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  const handleCelebrate = useCallback(() => {
    triggerCelebration();
    setSwingTrigger((prev) => prev + 1);
  }, []);

  const handleFirstInteraction = useCallback(() => {
    setHintVisible(false);
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-stone-950 font-sans select-none text-stone-100">
      {/* Top Header Badge */}
      <header className="absolute top-2.5 sm:top-4 left-3 sm:left-6 right-3 sm:right-6 z-20 flex items-center justify-between pointer-events-none">
        {/* Title badge */}
        <div className="pointer-events-auto bg-stone-900/95 border border-stone-800/90 rounded-2xl px-3 py-1.5 sm:py-2 shadow-xl flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-rose-900 to-amber-900 border border-rose-700/40 flex items-center justify-center text-rose-300 shadow-inner">
            <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-rose-400" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-serif font-bold text-amber-200 tracking-wide">
              {cardVariant === 'all_women' ? '20/10 • Chúc Mừng Phụ Nữ Việt Nam' : '20/10 • Dành Tặng Mẹ Yêu Thương'}
            </h1>
            <p className="text-[10px] text-stone-400">
              {isFlipped ? 'Mặt sau: Dấu sáp & Lời nhắn' : 'Mặt trước: Lời chúc 20/10'}
            </p>
          </div>
        </div>

        {/* Top-Right Quick Action Buttons */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            onClick={() => setIsReaderOpen(true)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 rounded-xl text-amber-200 text-xs flex items-center gap-1 shadow-lg transition-colors"
            title="Đọc toàn văn nội dung thư"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Nội Dung Thư</span>
          </button>

          <button
            onClick={() => setIsHelpOpen(true)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 bg-stone-900/95 hover:bg-stone-800 border border-stone-800 rounded-xl text-stone-300 hover:text-amber-200 text-xs flex items-center gap-1 shadow-lg transition-colors"
            title="Hướng dẫn"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hướng dẫn</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 bg-stone-900/95 hover:bg-stone-800 border border-stone-800 rounded-xl text-stone-300 hover:text-amber-200 shadow-lg transition-colors"
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Interactive 3D WebGL Flat Paper Experience (Zero creases, 100% visible text) */}
      <ThreePaperScene
        paperTone={paperTone}
        cardScale={cardScale}
        cardVariant={cardVariant}
        isFlipped={isFlipped}
        onFlipChange={setIsFlipped}
        gyroEnabled={gyroEnabled}
        onInteraction={handleFirstInteraction}
        triggerSwingCount={swingTrigger}
      />

      {/* Floating Gentle Interactive Hint for First-time Viewers */}
      {hintVisible && (
        <aside
          aria-label="Interactive guide"
          className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-opacity duration-500 animate-fade-in"
        >
          <div className="px-3.5 py-1 bg-stone-900/85 border border-stone-800/90 rounded-full shadow-xl text-amber-200/90 text-[10px] sm:text-xs flex items-center gap-1.5">
            <span>✨ Chạm kéo tờ giấy để đong đưa • Chạm nhanh để lật mặt sau</span>
          </div>
        </aside>
      )}

      {/* Collapsible Bottom Control Dock */}
      <ControlDock
        paperTone={paperTone}
        onPaperToneChange={setPaperTone}
        cardScale={cardScale}
        onCardScaleChange={setCardScale}
        cardVariant={cardVariant}
        onCardVariantChange={setCardVariant}
        isFlipped={isFlipped}
        onFlipToggle={() => setIsFlipped(!isFlipped)}
        onSwing={() => setSwingTrigger((prev) => prev + 1)}
        gyroEnabled={gyroEnabled}
        onGyroToggle={handleGyroToggle}
        soundEnabled={soundEnabled}
        onSoundToggle={() => setSoundEnabled(!soundEnabled)}
        onCelebrate={handleCelebrate}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenLetterReader={() => setIsReaderOpen(true)}
      />

      {/* Full Letter Reader Modal */}
      <LetterReaderModal
        isOpen={isReaderOpen}
        onClose={() => setIsReaderOpen(false)}
        variant={cardVariant}
        onVariantChange={setCardVariant}
        onCelebrate={handleCelebrate}
      />

      {/* Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </main>
  );
}
