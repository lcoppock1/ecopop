import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Haptics aren't available on web (and some simulators/devices), and a rejected
// promise there shows a red error screen. These wrappers just ignore failures.
const run = (fn) => {
  if (Platform.OS === 'web') return;
  try {
    fn().catch(() => {});
  } catch (e) {}
};

export const selection = () => run(() => Haptics.selectionAsync());
export const success = () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
export const error = () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
export const impactLight = () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
export const impactMedium = () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
