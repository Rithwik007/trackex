import type { Variants, Transition } from 'framer-motion';
import { animate } from 'animejs';

// ─── Page transition ───
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.18, ease: 'easeIn' } },
};

// ─── Bottom sheet spring ───
export const sheetSpring: Transition = {
  type: 'spring',
  damping: 26,
  stiffness: 300,
};

export const sheetVariants: Variants = {
  hidden:  { y: '100%', opacity: 0 },
  visible: { y: 0, opacity: 1, transition: sheetSpring },
  exit:    { y: '100%', opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
};

// ─── List stagger ───
export const listContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
};

// ─── Tap scale (use as whileTap prop) ───
export const tapScale = { scale: 0.96 };

// ─── Count-up (anime.js v4) ───
export function countUp(
  target: HTMLElement | null,
  from: number,
  to: number,
  duration = 400
) {
  if (!target) return;
  const obj = { val: from };
  animate(obj, {
    val: to,
    duration,
    ease: 'outExpo',
    onRender() {
      target.textContent = obj.val.toFixed(2);
    },
  });
}

// ─── Fade in ───
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.3 } },
};

// ─── Slide up ───
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};
