import React from 'react';
import { X, Hand, RotateCw, Smartphone, Sparkles, Heart } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl text-stone-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-950/60 border border-amber-800/40 text-amber-400 mb-3 shadow-inner">
            <Heart className="w-6 h-6 fill-amber-400/20" />
          </div>
          <h2 className="text-xl font-serif font-bold text-amber-200">Trang Thư 3D Chúc Mừng 20/10</h2>
          <p className="text-xs text-stone-400 mt-1">Lấy cảm hứng từ 3D Card của Fattah Maulana</p>
        </div>

        {/* Tips list */}
        <div className="space-y-3.5 text-sm">
          <div className="flex items-start gap-3 p-3 bg-stone-950/50 rounded-2xl border border-stone-800/60">
            <div className="p-2 bg-stone-900 rounded-xl text-amber-400 shrink-0 mt-0.5">
              <Hand className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-stone-200">Kéo & Thả (Touch / Chuột)</p>
              <p className="text-xs text-stone-400 mt-0.5">
                Chạm hoặc click giữ để kéo tờ giấy đong đưa trong không gian 3D với vật lý dây đeo sống động.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-stone-950/50 rounded-2xl border border-stone-800/60">
            <div className="p-2 bg-stone-900 rounded-xl text-amber-400 shrink-0 mt-0.5">
              <RotateCw className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-stone-200">Chạm Nhanh Để Lật Mặt</p>
              <p className="text-xs text-stone-400 mt-0.5">
                Chạm nhanh vào giấy để lật sang mặt sau xem dấu sáp niêm phong đỏ, tem thư Việt Nam và lời đề tặng.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-stone-950/50 rounded-2xl border border-stone-800/60">
            <div className="p-2 bg-stone-900 rounded-xl text-amber-400 shrink-0 mt-0.5">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-stone-200">Tối Ưu iPhone 12 Pro Max</p>
              <p className="text-xs text-stone-400 mt-0.5">
                Khổ giấy chuẩn đứng theo chiều mắt nhìn, góc nhìn tự cân chỉnh vừa vặn màn hình điện thoại và hỗ trợ cảm biến con quay hồi chuyển khi nghiêng máy.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-stone-950/50 rounded-2xl border border-stone-800/60">
            <div className="p-2 bg-stone-900 rounded-xl text-amber-400 shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-stone-200">Đọc Toàn Văn & Chất Giấy Cũ</p>
              <p className="text-xs text-stone-400 mt-0.5">
                Bấm nút "Nội Dung Thư" để phóng to toàn văn bức thư rõ nét từng từ, hoặc đổi chất liệu giấy da, lanh cổ xưa ở thanh điều khiển.
              </p>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-stone-900 font-semibold text-sm rounded-xl transition-all shadow-lg active:scale-98"
          >
            Đã Hiểu & Khám Phá Ngay
          </button>
        </div>
      </div>
    </div>
  );
};
