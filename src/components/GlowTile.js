// This is the "breathing glow" overlay that shows up on hint tiles
// When the player hasn't tapped for a few seconds, the game highlights a valid move
// I originally tried to use Skia for this but it had dependency issues with reanimated
// so I switched to React Native's built-in Animated API instead (works just as well honestly)
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export default function GlowTile() {
  // This animated value goes 0 → 1 → 0 on loop (the "breathing" effect)
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Loop forever: ramp up to 1 then back down to 0 (800ms each way feels smooth)
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    // Stop the loop when the component unmounts so it doesn't leak memory
    return () => loop.stop();
  }, []);

  // I'm using a WHITE overlay instead of the tile's own color
  // because the old version was basically invisible (green on green, blue on blue etc.)
  const overlayOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.05, 0.35],
  });

  // The mint green border pulses too — makes it super obvious which tiles to swap
  const borderOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  // Subtle scale pulse so the tile looks like its "breathing"
  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.05],
  });

  return (
    // pointerEvents="none" so tapping goes through to the actual tile underneath
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { transform: [{ scale }] },
      ]}
    >
      {/* White flash — this is what actually makes it visible on ANY tile color */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: '#FFFFFF', borderRadius: 8, opacity: overlayOpacity },
        ]}
      />
      {/* Mint green border ring — matches my "Clean Future" palette */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: 8,
            borderWidth: 3,
            borderColor: '#00E676',
            opacity: borderOpacity,
          },
        ]}
      />
    </Animated.View>
  );
}
