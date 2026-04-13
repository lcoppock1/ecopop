// This is the first-time tutorial that shows up when a new player opens Level 1
// I'm using AsyncStorage to track if they've already seen it (so it only shows once)
// Got the idea from how Candy Crush does their first-level walkthrough
// It has 5 steps: welcome, select, swap, match, and a "let's go!" sendoff
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// This is the key I save in AsyncStorage so I know they finished the tutorial
const TUTORIAL_KEY = 'tutorialComplete';
// Getting screen width so the card scales nicely on different devices (iPad, phone, etc.)
const { width: SCREEN_W } = Dimensions.get('window');

// Each step in the tutorial — title, body text, and an icon
// I kept the text short because nobody wants to read a novel before playing lol
const STEPS = [
  {
    title: 'Welcome to EcoPop!',
    body: 'Sort recycling materials by matching tiles. Swipe to swap adjacent tiles and create matches of 3 or more!',
    icon: '♻️',
  },
  {
    title: 'Step 1: Select',
    body: 'Tap any tile on the board to select it. A golden border will appear around your selection.',
    icon: '👆',
  },
  {
    title: 'Step 2: Swap',
    body: 'Tap an adjacent tile (up, down, left, or right) to swap them. If the swap creates a match, it goes through!',
    icon: '↔️',
  },
  {
    title: 'Step 3: Match & Score',
    body: 'Line up 3 or more of the same material to clear them. Cascading combos earn bonus points!',
    icon: '✨',
  },
  {
    title: 'Ready to Clean Up?',
    body: 'Reach the target score before running out of moves. Earn stars, unlock new levels, and learn real eco facts along the way!',
    icon: '🌍',
  },
];

export default function TutorialOverlay({ visible, onFinish }) {
  // Which step the player is on (0-4)
  const [step, setStep] = useState(0);
  // Fade and slide animations for smooth transitions between steps
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // When the overlay becomes visible (or the step changes), animate it in
  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, step]);

  // This handles the slide-out then slide-in transition between steps
  // It fades out the current step, swaps the content, then fades in the next one
  const animateStep = (nextStep) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    });
  };

  // "Next" button — go to next step, or finish if we're on the last one
  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      animateStep(step + 1);
    } else {
      await markComplete();
    }
  };

  // "Skip" button — for impatient players who just want to play already haha
  const handleSkip = async () => {
    await markComplete();
  };

  // Save to AsyncStorage so we never show this tutorial again
  const markComplete = async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_KEY, 'true');
    } catch (_) {}
    setStep(0);
    onFinish();
  };

  // Don't render anything if the tutorial isn't supposed to be showing
  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.card,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={styles.icon}>{current.icon}</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.body}>{current.body}</Text>

        {/* These little dots show which step you're on (like a carousel indicator) */}
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === step && styles.dotActive]}
            />
          ))}
        </View>

        {/* Skip only shows on steps 1-4, not the last step */}
        <View style={styles.buttons}>
          {!isLast && (
            <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextText}>{isLast ? "Let's Go!" : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

// This function checks if the tutorial has been completed before
// I call it in GameScreen when Level 1 loads to decide whether to show the tutorial
export async function shouldShowTutorial() {
  try {
    const val = await AsyncStorage.getItem(TUTORIAL_KEY);
    // If null = they've never seen it, so return true to show it
    return val === null;
  } catch (_) {
    return false;
  }
}

// ─── Styles: matching my "Clean Future" palette ───
const styles = StyleSheet.create({
  // Dark overlay that covers the whole screen behind the tutorial card
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  // The actual tutorial card — mint green border to match the game's theme
  card: {
    width: SCREEN_W * 0.82,
    backgroundColor: '#1A2733',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00E676',
    shadowColor: '#00E676',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  icon: {
    fontSize: 52,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    color: '#8BA4B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  // The step indicator dots at the bottom
  dots: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2A3A4A',
    marginHorizontal: 4,
  },
  // Active dot is wider and mint green — looks really clean
  dotActive: {
    backgroundColor: '#00E676',
    width: 20,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  skipBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipText: {
    color: '#8BA4B8',
    fontSize: 15,
    fontWeight: '600',
  },
  nextBtn: {
    backgroundColor: '#00E676',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  nextText: {
    color: '#0F1923',
    fontSize: 16,
    fontWeight: '800',
  },
});
