import React, { useState } from 'react';
import { X, Heart, Sparkles, BookOpen, Copy, Check } from 'lucide-react';
import { CardContentVariant, CARD_IMAGES, LETTER_TEXTS } from '../utils/paperTextures';

interface LetterReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant: CardContentVariant;
  onVariantChange: (v: CardContentVariant) => void;
  onCelebrate: () => void;
}

export const LetterReaderModal: React.FC<LetterReaderModalProps> = ({
  isOpen,
  onClose,
  variant,
  onVariantChange,
  onCelebrate,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentImageSrc = CARD_IMAGES[variant];
  const letter = LETTER_TEXTS[variant];

  const handleCopy = () => {
    const textToCopy = `${letter.title}\n\n${letter.lines.join(' ')}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl p-4 sm:p-6 shadow-2xl text-stone-200 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-full transition-colors z-10"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-3 sm:mb-4">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-900 to-amber-900 border border-rose-700/40 text-rose-300 mb-2 shadow-inner">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="text-lg sm:text-xl font-serif font-bold text-amber-200">
            Nội Dung Thư Chúc Mừng 20/10
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Nguyên bản chất lượng cao, rõ nét từng câu chữ
          </p>
        </div>

        {/* Variant Switcher Pills */}
        <div className="flex justify-center gap-2 mb-3">
          <button
            onClick={() => onVariantChange('all_women')}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
              variant === 'all_women'
                ? 'bg-rose-950/80 border-rose-700/60 text-rose-200 shadow-sm'
                : 'bg-stone-800/80 border-stone-700/50 text-stone-400 hover:text-stone-200'
            }`}
          >
            Bản Chúc Tất Cả Phụ Nữ
          </button>
          <button
            onClick={() => onVariantChange('mom')}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
              variant === 'mom'
                ? 'bg-amber-950/80 border-amber-700/60 text-amber-200 shadow-sm'
                : 'bg-stone-800/80 border-stone-700/50 text-stone-400 hover:text-stone-200'
            }`}
          >
            Bản Chúc Mẹ Yêu Thương
          </button>
        </div>

        {/* Full Ultra-Sharp Original Image Preview */}
        <div className="relative rounded-2xl overflow-hidden bg-stone-950 border border-stone-800/80 p-2 sm:p-3 mb-3.5 shadow-inner">
          <img
            src={currentImageSrc}
            alt={letter.title}
            className="w-full h-auto object-contain rounded-xl max-h-56 sm:max-h-72 mx-auto drop-shadow-md"
          />
        </div>

        {/* Formatted Text Box for effortless reading on small mobile screens */}
        <div className="bg-[#faf5eb] text-stone-900 rounded-2xl p-4 border border-amber-300/40 shadow-md mb-4 font-serif">
          <h3 className="text-sm sm:text-base font-bold text-rose-800 mb-2.5 text-center flex items-center justify-center gap-1.5">
            <Heart className="w-4 h-4 fill-rose-600 text-rose-600" />
            <span>{letter.title}</span>
          </h3>
          <div className="space-y-1.5 text-center text-sm sm:text-base leading-relaxed text-rose-900 font-medium">
            {letter.lines.map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center gap-2 pt-1 border-t border-stone-800/80">
          <button
            onClick={handleCopy}
            className="flex-1 py-2 px-3 bg-stone-800 hover:bg-stone-750 text-stone-200 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-stone-700/60"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Đã sao chép!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-400" />
                <span>Sao Chép Lời Chúc</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              onCelebrate();
              onClose();
            }}
            className="flex-1 py-2 px-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/40 transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>Bắn Pháo Hoa 20/10</span>
          </button>
        </div>
      </div>
    </div>
  );
};
