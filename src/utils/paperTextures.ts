import * as THREE from 'three';

export type CardContentVariant = 'all_women' | 'mom';

export const CARD_IMAGES: Record<CardContentVariant, string> = {
  all_women: '/assets/aistudio/Untitled266_20261020202004_1a600624.png',
  mom: '/assets/aistudio/Untitled266_20261020201725_fa396c7b.png',
};

// Exact pixel bounds of the cream card inside the 3072x3072 PNGs
// Scanned and verified: minX: 224, maxX: 2836, minY: 516, maxY: 2476
export const CARD_BBOX = {
  x: 224,
  y: 516,
  w: 2612,
  h: 1960,
};

// Aspect ratio of the original card: 2612 / 1960 = 1.33265 (approx 4:3)
export const CARD_ASPECT_RATIO = CARD_BBOX.w / CARD_BBOX.h;

export const LETTER_TEXTS: Record<CardContentVariant, { title: string; lines: string[] }> = {
  all_women: {
    title: 'Chúc Mừng Phụ Nữ Việt Nam 20/10',
    lines: [
      'chúc tất cả phụ nữ 20/10 vui',
      'vẻ ạ, chúc phái đẹp mạnh',
      'khoẻ để làm những gì mình',
      'muốn, tiền thì cứ vào ví,',
      'thuận buồm thì xuôi gió.',
    ],
  },
  mom: {
    title: 'Chúc Mừng Mẹ Yêu 20/10',
    lines: [
      'chúc mẹ 20/10 vui vẻ ạ,',
      'chúc mẹ luôn mạnh khoẻ để',
      'làm những gì mình muốn,',
      'tiền thì cứ vào ví,',
      'thuận buồm thì xuôi gió.',
    ],
  },
};

export interface PaperStyleConfig {
  tone: 'parchment' | 'linen' | 'antique';
  variant: CardContentVariant;
}

/**
 * Creates flat paper geometry with subtle rounded corners and clean planar surface.
 * NO folds or creases as requested by user ("xoá nếp gấp đi bạn").
 */
export function createFlatPaperGeometry(width: number, height: number): THREE.BufferGeometry {
  // Use a pristine flat plane with high segment density for smooth shading
  return new THREE.PlaneGeometry(width, height, 16, 16);
}

/**
 * Loads the user's card image, precisely extracts the card bounding box (2612 x 1960),
 * and creates a high-resolution, uncompressed Three.js CanvasTexture.
 * This guarantees:
 * 1. ZERO text clipping (all 5 lines of text from left to right are 100% visible).
 * 2. Original crisp typography and deep red color without any washout or bleaching.
 * 3. Optional vintage paper tone blending that respects the original letters.
 */
export function createFrontTexture(config: PaperStyleConfig): Promise<THREE.CanvasTexture> {
  const url = CARD_IMAGES[config.variant] || CARD_IMAGES.all_women;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // High-res canvas matching card aspect ratio
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = Math.round(2048 / CARD_ASPECT_RATIO); // ~1537
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context not available'));
        return;
      }

      // Draw the exact card bounding box onto the canvas - 100% full view, zero clipping
      ctx.drawImage(
        img,
        CARD_BBOX.x,
        CARD_BBOX.y,
        CARD_BBOX.w,
        CARD_BBOX.h,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Apply subtle paper warmth tint depending on selected paper tone
      // Using 'multiply' mode so text stays dark and crisp while background gains warmth
      if (config.tone === 'antique') {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = 'rgba(240, 222, 195, 0.25)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      } else if (config.tone === 'parchment') {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = 'rgba(255, 245, 230, 0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.needsUpdate = true;
      resolve(texture);
    };

    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

/**
 * Generates the vintage postcard back texture with postage stamp,
 * postmark seal, authentic red wax seal, and handwritten dedication.
 */
export function createBackTexture(config: PaperStyleConfig): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = Math.round(2048 / CARD_ASPECT_RATIO); // ~1537
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context');

  // Background tone
  const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  if (config.tone === 'antique') {
    bgGrad.addColorStop(0, '#f5ecd9');
    bgGrad.addColorStop(0.5, '#eedfc4');
    bgGrad.addColorStop(1, '#f5ecd9');
  } else if (config.tone === 'linen') {
    bgGrad.addColorStop(0, '#faf7ee');
    bgGrad.addColorStop(0.5, '#eee8db');
    bgGrad.addColorStop(1, '#faf7ee');
  } else {
    // Parchment
    bgGrad.addColorStop(0, '#fbf7ee');
    bgGrad.addColorStop(0.5, '#f5eddc');
    bgGrad.addColorStop(1, '#fbf7ee');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle organic paper fibers
  ctx.save();
  ctx.strokeStyle = 'rgba(120, 95, 70, 0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 600; i++) {
    const fx = Math.random() * canvas.width;
    const fy = Math.random() * canvas.height;
    const len = 4 + Math.random() * 12;
    const angle = Math.random() * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + Math.cos(angle) * len, fy + Math.sin(angle) * len);
    ctx.stroke();
  }

  // Soft edge vignette
  const edgeGradient = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, canvas.width * 0.38,
    canvas.width / 2, canvas.height / 2, canvas.width * 0.72
  );
  edgeGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  edgeGradient.addColorStop(0.85, 'rgba(120, 85, 45, 0.05)');
  edgeGradient.addColorStop(1, 'rgba(90, 55, 25, 0.18)');
  ctx.fillStyle = edgeGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Postcard vertical dashed divider line
  ctx.strokeStyle = 'rgba(140, 100, 60, 0.3)';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.moveTo(canvas.width * 0.52, 120);
  ctx.lineTo(canvas.width * 0.52, canvas.height - 120);
  ctx.stroke();
  ctx.setLineDash([]);

  // Top Right: Vintage Postmark & Airmail stamp
  drawPostageStamp(ctx, canvas.width - 440, 140, 240, 290);
  drawPostmarkSeal(ctx, canvas.width - 320, 240, 100);

  // Left side: Heartfelt handwritten Vietnamese dedication
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(90, 40, 15, 0.95)';
  ctx.font = 'italic bold 44px "Playfair Display", Georgia, serif';
  
  const recipient = config.variant === 'mom' ? 'Thân gửi Mẹ yêu quý! ❤️' : 'Thân gửi người phụ nữ tuyệt vời! ❤️';
  ctx.fillText(recipient, 100, 240);

  ctx.fillStyle = 'rgba(75, 45, 25, 0.88)';
  ctx.font = 'italic 34px "Playfair Display", Georgia, serif';
  const lines = config.variant === 'mom'
    ? [
        'Nhân ngày Phụ nữ Việt Nam 20/10,',
        'con kính chúc Mẹ luôn tràn đầy sức khoẻ,',
        'luôn vui tươi và hạnh phúc trong từng phút giây.',
        '',
        'Cảm ơn Mẹ vì tất cả tình thương bao la,',
        'chúc Mẹ làm được mọi điều Mẹ muốn,',
        'tiền vào đầy ví, bình an và thuận buồm xuôi gió!',
      ]
    : [
        'Nhân ngày Phụ nữ Việt Nam 20/10,',
        'gửi trọn yêu thương và những lời chúc tốt đẹp nhất.',
        'Chúc bạn luôn rạng rỡ, xinh đẹp như đoá hoa nở rộ,',
        'luôn giữ nụ cười tươi tắn và an yên mỗi ngày.',
        '',
        'Công việc thuận buồm xuôi gió, tiền tài vào ví,',
        'và luôn được yêu thương, chở che trọn vẹn!',
      ];

  lines.forEach((l, i) => {
    ctx.fillText(l, 100, 330 + i * 56);
  });

  // Right side: Authentic red wax seal
  drawWaxSeal(ctx, canvas.width * 0.76, canvas.height * 0.65, 130);

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function drawPostageStamp(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.shadowColor = 'rgba(80, 50, 20, 0.2)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;

  ctx.fillStyle = '#fffdfa';
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = '#c49a6c';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(x + 10, y + 10, w - 20, h - 20);

  ctx.fillStyle = '#991b1b';
  ctx.font = 'bold 22px "Cinzel", serif';
  ctx.textAlign = 'center';
  ctx.fillText('VIỆT NAM', x + w / 2, y + 40);

  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  const cx = x + w / 2;
  const cy = y + h / 2 + 10;
  ctx.arc(cx, cy, 38, 0.2 * Math.PI, 0.8 * Math.PI, false);
  ctx.arc(cx, cy - 16, 28, 0.8 * Math.PI, 0.2 * Math.PI, true);
  ctx.fill();

  ctx.font = 'bold 32px "Cinzel", serif';
  ctx.fillStyle = '#7f1d1d';
  ctx.fillText('20•10', x + w / 2, y + h - 38);

  ctx.font = '500 16px sans-serif';
  ctx.fillStyle = '#a8815b';
  ctx.fillText('NGÀY PHỤ NỮ', x + w / 2, y + h - 16);

  ctx.restore();
}

function drawPostmarkSeal(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(40, 35, 30, 0.45)';
  ctx.lineWidth = 2.2;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r - 10, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(40, 35, 30, 0.55)';
  ctx.font = 'bold 16px "Cinzel", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('HÀ NỘI • ĐẶC BIỆT', cx, cy - 24);
  ctx.font = 'bold 20px "Cinzel", monospace';
  ctx.fillText('20 - 10', cx, cy + 6);
  ctx.font = 'bold 14px "Cinzel", monospace';
  ctx.fillText('VIETNAM POST', cx, cy + 32);

  ctx.beginPath();
  for (let i = -1; i <= 1; i++) {
    const ly = cy + i * 18;
    ctx.moveTo(cx + r, ly);
    ctx.bezierCurveTo(cx + r + 45, ly - 14, cx + r + 75, ly + 14, cx + r + 115, ly);
  }
  ctx.stroke();

  ctx.restore();
}

function drawWaxSeal(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.shadowColor = 'rgba(40, 10, 10, 0.35)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 6;

  const waxGrad = ctx.createRadialGradient(cx - 15, cy - 15, r * 0.2, cx, cy, r);
  waxGrad.addColorStop(0, '#dc2626');
  waxGrad.addColorStop(0.6, '#b91c1c');
  waxGrad.addColorStop(0.85, '#991b1b');
  waxGrad.addColorStop(1, '#6b1414');

  ctx.fillStyle = waxGrad;
  ctx.beginPath();
  const numLobes = 24;
  for (let i = 0; i < numLobes; i++) {
    const angle = (i / numLobes) * Math.PI * 2;
    const lobeR = r + Math.sin(angle * 7) * 4 + (Math.sin(angle * 13) * 3);
    const px = cx + Math.cos(angle) * lobeR;
    const py = cy + Math.sin(angle) * lobeR;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(254, 202, 202, 0.45)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(69, 10, 10, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.68, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#fee2e2';
  ctx.font = 'bold 34px "Cinzel", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('20•10', cx, cy - 10);

  ctx.font = '32px sans-serif';
  ctx.fillText('❤', cx, cy + 24);

  ctx.restore();
}
