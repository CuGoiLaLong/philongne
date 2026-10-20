import confetti from 'canvas-confetti';
import { paperAudio } from './audio';

/**
 * Triggers romantic rose petal and golden sparkle celebration for 20/10
 */
export function triggerCelebration() {
  paperAudio.playChime();

  const count = 70;
  const defaults = {
    origin: { y: 0.75 },
    disableForReducedMotion: true,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  // Rose petals & warm gold confetti
  fire(0.25, {
    spread: 30,
    startVelocity: 50,
    colors: ['#e11d48', '#be123c', '#fda4af', '#fef08a', '#eab308'],
    scalar: 1.2,
  });

  fire(0.2, {
    spread: 60,
    colors: ['#f43f5e', '#fb7185', '#d97706', '#ca8a04'],
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.9,
    colors: ['#fda4af', '#fecdd3', '#fef08a'],
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    colors: ['#e11d48', '#f59e0b', '#fffbeb'],
    scalar: 1.3,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    colors: ['#fb7185', '#fde047'],
  });
}
