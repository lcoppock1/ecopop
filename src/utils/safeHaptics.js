// Wraps expo-haptics so web and environments without haptics never throw or reject.
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const skip = Platform.OS === 'web';

async function run(fn) {
  if (skip) return;
  try {
    await fn();
  } catch (_) {
    // Simulator, older browsers, permission issues, etc.
  }
}

export const ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle;
export const NotificationFeedbackType = Haptics.NotificationFeedbackType;

export function impactAsync(style) {
  return run(() => Haptics.impactAsync(style));
}

export function selectionAsync() {
  return run(() => Haptics.selectionAsync());
}

export function notificationAsync(type) {
  return run(() => Haptics.notificationAsync(type));
}
