import { Easing } from 'react-native-reanimated';

/** Duraciones del web (`--m-*`), sin rebote. */
export const motion = {
  press: 90,
  out: 120,
  in: 150,
  panel: 200,
  slide: 240,
} as const;

/** `cubic-bezier(.2,.8,.2,1)` del web. */
export const easeUi = Easing.bezier(0.2, 0.8, 0.2, 1);
