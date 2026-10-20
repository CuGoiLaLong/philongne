import React, { useState } from 'react';
import {
  RotateCw,
  Sparkles,
  Volume2,
  VolumeX,
  Compass,
  ChevronDown,
  ChevronUp,
  Sliders,
  Layers,
  Heart,
  HelpCircle,
  ZoomIn,
  ZoomOut,
  BookOpen,
} from 'lucide-react';
import { CardContentVariant } from '../utils/paperTextures';
import { paperAudio } from '../utils/audio';

interface ControlDockProps {
  paperTone: 'parchment' | 'linen' | 'antique';
  onPaperToneChange: (tone: 'parchment' | 'linen' | 'antique') => void;
  cardScale: number;
  onCardScaleChange: (scale: number) => void;
  cardVariant: CardContentVariant;
  onCardVariantChange: (variant: CardContentVariant) => void;
  isFlipped: boolean;
  onFlipToggle: () => void;
  onSwing: () => void;
  gyroEnabled: boolean;
  onGyroToggle: () => void;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  onCelebrate: () => void;
  onOpenHelp: () => void;
  onOpenLetterReader: () => void;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  paperTone,
  onPaperToneChange,
  cardScale,
  onCardScaleChange,
  cardVariant,
  onCardVariantChange,
  isFlipped,
  onFlipToggle,
  onSwing,
  gyroEnabled,
  onGyroToggle,
  soundEnabled,
  onSoundToggle,
  onCelebrate,
  onOpenHelp,
  onOpenLetterReader,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'size' | 'style'>('content');

  const tones: { id: 'parchment' | 'linen' | 'antique'; name: string; color: string; desc: string }[] = [
    { id: 'parchment', name: 'Giấy Da', color: '#faf4eb', desc: 'Ngả vàng ấm' },
    { id: 'linen', name: 'Sợi Lanh', color: '#f6f3eb', desc: 'Trắng kem tự nhiên' },
    { id: 'antique', name: 'Cổ Điển', color: '#f5ebda', desc: 'Nhuốm màu thời gian' },
  ];

  return (
    <div className="fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 w-[96vw] max-w-xl px-1 sm:px-2">
      {/* Collapse Toggle Handle */}
      <div className="flex justify-center mb-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium text-amber-200/90 bg-stone-900/95 border border-stone-800 rounded-full shadow-lg hover:bg-stone-800 hover:text-amber-100 transition-colors"
          title={collapsed ? 'Mở thanh điều khiển' : 'Ẩn thanh điều khiển (Chế độ ngắm)'}
        >
          {collapsed ? (
            <>
              <ChevronUp className="w-3 h-3 text-amber-400" />
              <span>Hiện Bảng Điều Khiển</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3 text-amber-400" />
              <span>Thu Gọn (Chế Độ Ngắm)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Dock Container */}
      {!collapsed && (
        <div className="bg-stone-900/95 border border-stone-800 text-stone-200 rounded-2xl p-2.5 sm:p-3 shadow-2xl transition-all">
          {/* Primary Action Buttons Row */}
          <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-stone-800/80">
            {/* View Full Letter Content Button */}
            <button
              onClick={onOpenLetterReader}
              className="flex-1 py-1.5 px-2 bg-gradient-to-r from-amber-950/80 to-amber-900/70 hover:from-amber-900 hover:to-amber-800 text-amber-200 border border-amber-700/50 rounded-xl text-xs font-medium flex items-center justify-center gap-1 shadow-md transition-all active:scale-95"
              title="Đọc toàn văn nội dung thư"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Nội Dung Thư</span>
            </button>

            {/* Flip Card Button */}
            <button
              onClick={onFlipToggle}
              className="flex-1 py-1.5 px-2 bg-stone-800/90 hover:bg-stone-700 text-stone-200 border border-stone-700/60 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
              title={isFlipped ? 'Quay lại mặt trước' : 'Lật xem mặt sau'}
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{isFlipped ? 'Mặt Trước' : 'Lật Mặt Sau'}</span>
            </button>

            {/* Swing Nudge Button */}
            <button
              onClick={onSwing}
              className="py-1.5 px-2.5 bg-stone-800/80 hover:bg-stone-700 text-stone-300 border border-stone-700/50 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-all active:scale-95"
              title="Đong đưa nhẹ tờ giấy"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden xs:inline">Đong Đưa</span>
            </button>

            {/* Celebrate Rose Petals Button */}
            <button
              onClick={onCelebrate}
              className="py-1.5 px-2.5 sm:px-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1 shadow-lg shadow-rose-950/50 transition-all active:scale-95 shrink-0"
              title="Bắn pháo hoa hoa hồng mừng 20/10"
            >
              <Heart className="w-3.5 h-3.5 fill-white" />
              <span className="font-semibold">Mừng 20/10</span>
            </button>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('content')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors flex items-center gap-1 ${
                  activeTab === 'content'
                    ? 'bg-amber-950/70 text-amber-300 border border-amber-800/60'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>Lời Chúc</span>
              </button>

              <button
                onClick={() => setActiveTab('size')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors flex items-center gap-1 ${
                  activeTab === 'size'
                    ? 'bg-amber-950/70 text-amber-300 border border-amber-800/60'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>Kích Thước</span>
              </button>

              <button
                onClick={() => setActiveTab('style')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors flex items-center gap-1 ${
                  activeTab === 'style'
                    ? 'bg-amber-950/70 text-amber-300 border border-amber-800/60'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Màu Giấy</span>
              </button>
            </div>

            {/* Utility Icons */}
            <div className="flex items-center gap-1">
              {/* Sound Toggle */}
              <button
                onClick={onSoundToggle}
                className="p-1.5 text-stone-400 hover:text-amber-300 hover:bg-stone-800/60 rounded-lg transition-colors"
                title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh sột soạt'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {/* Gyro Toggle */}
              <button
                onClick={onGyroToggle}
                className={`p-1.5 rounded-lg transition-colors ${
                  gyroEnabled
                    ? 'text-amber-400 bg-amber-950/40'
                    : 'text-stone-500 hover:text-stone-300'
                }`}
                title={gyroEnabled ? 'Tắt cảm biến nghiêng điện thoại' : 'Bật cảm biến nghiêng điện thoại'}
              >
                <Compass className="w-3.5 h-3.5" />
              </button>

              {/* Help Modal Button */}
              <button
                onClick={onOpenHelp}
                className="p-1.5 text-stone-400 hover:text-amber-300 hover:bg-stone-800/60 rounded-lg transition-colors"
                title="Xem hướng dẫn tương tác"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tab Content Area */}
          <div className="mt-2 pt-2 border-t border-stone-800/50 text-xs">
            {activeTab === 'content' && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-stone-400 text-[11px] shrink-0">Phiên bản thư:</span>
                <div className="flex items-center gap-1.5 flex-1 justify-end">
                  <button
                    onClick={() => onCardVariantChange('all_women')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      cardVariant === 'all_women'
                        ? 'bg-rose-950/80 border border-rose-700/60 text-rose-200 shadow-sm'
                        : 'bg-stone-800/60 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Tất Cả Phụ Nữ
                  </button>
                  <button
                    onClick={() => onCardVariantChange('mom')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      cardVariant === 'mom'
                        ? 'bg-amber-950/80 border border-amber-700/60 text-amber-200 shadow-sm'
                        : 'bg-stone-800/60 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Dành Cho Mẹ
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'size' && (
              <div className="flex items-center gap-2">
                <ZoomOut className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="text-stone-400 text-[11px] shrink-0">Độ lớn giấy:</span>
                <input
                  type="range"
                  min="0.75"
                  max="1.25"
                  step="0.05"
                  value={cardScale}
                  onChange={(e) => onCardScaleChange(parseFloat(e.target.value))}
                  className="flex-1 accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
                />
                <ZoomIn className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="text-amber-300 font-mono text-[11px] min-w-[36px] text-right">
                  {Math.round(cardScale * 100)}%
                </span>
              </div>
            )}

            {activeTab === 'style' && (
              <div className="grid grid-cols-3 gap-1.5">
                {tones.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onPaperToneChange(t.id);
                      paperAudio.playRustle();
                    }}
                    className={`flex items-center gap-1.5 p-1.5 rounded-xl border text-left transition-all ${
                      paperTone === t.id
                        ? 'border-amber-500/80 bg-amber-950/40 text-amber-200'
                        : 'border-stone-800 bg-stone-850/60 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-stone-600 shrink-0"
                      style={{ backgroundColor: t.color }}
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium truncate">{t.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
