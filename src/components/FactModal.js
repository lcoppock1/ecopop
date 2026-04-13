// This is the Level Intro "loading screen" that shows up BEFORE the game starts
// I got this idea from how Assassin's Creed and Candy Crush use loading screens for trivia
// Instead of just dumping the player into the grid, I show them their mission + a random eco-tip
// It fills that "dead time" while the board sets up with actual learning !!
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Getting screen width so the card looks good on both phones and tablets
const { width: SCREEN_W } = Dimensions.get('window');

// Props explained:
// visible = whether to show the intro or not
// config = the level config from gameData.js (has mission text, target score, etc.)
// envTheme = the environment theme (icon, colors) from gameData.js
// ecoTip = a random sustainability fact to display
// onStart = callback when the player hits "START MISSION"
export default function LevelIntro({ visible, config, envTheme, ecoTip, onStart }) {
  // Animation values for the card entrance (fade + slide up)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  // This one makes the START button pulse so it catches the player's eye
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;
    // Reset animations every time the intro becomes visible
    fadeAnim.setValue(0);
    slideAnim.setValue(40);

    // Fade in + spring slide for a bouncy entrance (looks nice)
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 7, useNativeDriver: true }),
    ]).start();

    // The START button gently pulses so the player knows to tap it
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [visible]);

  // Don't render anything if the intro isn't supposed to show
  if (!visible || !config) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.card,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Big environment emoji — shows what environment they're cleaning */}
        <Text style={styles.envIcon}>{envTheme?.icon || '🌍'}</Text>

        {/* Level name in a mint badge (like "Neighborhood Cleanup") */}
        <View style={styles.labelBadge}>
          <Text style={styles.labelText}>{config.label}</Text>
        </View>

        {/* The educational mission objective — this is the goal-oriented design part !! */}
        {/* Instead of "reach 100 pts" its "Sort 100 kg of waste to plant a Community Garden" */}
        <Text style={styles.missionText}>{config.mission}</Text>

        {/* Quick stats so the player knows what they're getting into */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{config.targetScore}</Text>
            <Text style={styles.statLabel}>kg target</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxMiddle]}>
            <Text style={styles.statValue}>{config.maxMoves}</Text>
            <Text style={styles.statLabel}>moves</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>★★★</Text>
            <Text style={styles.statLabel}>{config.threeStarScore} kg</Text>
          </View>
        </View>

        {/* Random eco-tip from my ECO_FACTS array in gameData.js */}
        {/* This is the "loading screen strategy" — fill dead time with learning */}
        {ecoTip ? (
          <View style={styles.tipCard}>
            <Text style={styles.tipLabel}>Eco-Tip</Text>
            <Text style={styles.tipText}>{ecoTip}</Text>
          </View>
        ) : null}

        {/* The pulsing START button — wrapping it in Animated.View for the scale effect */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity style={styles.startBtn} onPress={onStart}>
            <Text style={styles.startText}>START MISSION</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// ─── Styles: "Clean Future" palette ───
const styles = StyleSheet.create({
  // Nearly opaque dark overlay so the board behind is barely visible
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 25, 35, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 998,
  },
  // The main card — mint green border with a subtle green glow shadow
  card: {
    width: SCREEN_W * 0.85,
    backgroundColor: '#1A2733',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00E676',
    shadowColor: '#00E676',
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 12,
  },
  envIcon: {
    fontSize: 56,
    marginBottom: 8,
  },
  // The mission name badge — semi-transparent green background
  labelBadge: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00E676',
    marginBottom: 16,
  },
  labelText: {
    color: '#00E676',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // The main mission text — big and centered so its easy to read
  missionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 20,
  },
  // Three stats in a row: kg target | moves | 3-star threshold
  statsRow: {
    flexDirection: 'row',
    marginBottom: 18,
    width: '100%',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  // The middle stat box gets subtle divider lines on both sides
  statBoxMiddle: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(139, 164, 184, 0.2)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFD740',
  },
  statLabel: {
    fontSize: 11,
    color: '#8BA4B8',
    textTransform: 'uppercase',
    marginTop: 2,
    fontWeight: '600',
  },
  // The eco-tip card — sky blue left border to stand out from the rest
  tipCard: {
    backgroundColor: 'rgba(64, 196, 255, 0.08)',
    borderRadius: 14,
    padding: 14,
    width: '100%',
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#40C4FF',
  },
  tipLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#40C4FF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  // START MISSION button — bright green with a green glow shadow
  startBtn: {
    backgroundColor: '#00E676',
    paddingVertical: 14,
    paddingHorizontal: 44,
    borderRadius: 30,
    shadowColor: '#00E676',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  startText: {
    color: '#0F1923',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
