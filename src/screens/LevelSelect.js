// Level Select screen — shows all 5 missions as cards
// Phase 3+4 upgrade: levels are locked/unlocked based on progress,
// shows star ratings, high scores, lifetime EcoMeter banner, and earned badges
// Now using the "Clean Future" palette to match the rest of the app
import * as Haptics from 'expo-haptics';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
// I'm pulling the environment themes now too for the little icons on each level card
import { ENVIRONMENT_THEMES, LEVEL_CONFIG } from '../gameData';
import { isLevelUnlocked, loadProgress } from '../storage';
import { BADGE_DEFINITIONS } from '../badges';

// Grab all the level IDs from the config (1, 2, 3, 4, 5)
const LEVEL_IDS = Object.keys(LEVEL_CONFIG).map(Number);

export default function LevelSelect({ navigation }) {
  // Keeping track of which levels are completed and total eco score
  const [completedLevels, setCompletedLevels] = useState({});
  const [totalEco, setTotalEco] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState({});

  // useFocusEffect = runs every time the user comes BACK to this screen
  // So if they just beat a level, this reloads their progress from AsyncStorage
  // (learned this from the React Navigation docs)
  useFocusEffect(
    useCallback(() => {
      loadProgress().then(p => {
        setCompletedLevels(p.completedLevels);
        setTotalEco(p.totalEcoScore);
        setEarnedBadges(p.earnedBadges || {});
      });
    }, [])
  );

  const handlePress = async (levelId) => {
    // If the level is locked, give them a warning buzz and don't navigate
    if (!isLevelUnlocked(levelId, completedLevels)) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    // If unlocked, haptic feedback and go to the game
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Game', { levelId });
  };

  // Turn the earnedBadges object into an array for display
  const badgeList = Object.keys(earnedBadges)
    .filter(id => BADGE_DEFINITIONS[id])
    .map(id => BADGE_DEFINITIONS[id]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Select a Mission</Text>

      {/* Only show the eco banner if they have some progress saved */}
      {totalEco > 0 && (
        <View style={styles.ecoBanner}>
          <Text style={styles.ecoBannerLabel}>Lifetime Eco-Impact</Text>
          <Text style={styles.ecoBannerValue}>{totalEco}</Text>
        </View>
      )}

      <View style={styles.cardContainer}>
        {LEVEL_IDS.map((levelId) => {
          const config = LEVEL_CONFIG[levelId];
          // Check if this level is unlocked (Level 1 always is, others need previous level beaten)
          const unlocked = isLevelUnlocked(levelId, completedLevels);
          // If they've played this level before, pull their saved result
          const result = completedLevels[levelId];

          // Grab the theme for this level so I can show the environment icon on the card
          const theme = ENVIRONMENT_THEMES[levelId];

          return (
            <TouchableOpacity
              key={levelId}
              style={[styles.levelCard, !unlocked && styles.lockedCard]}
              onPress={() => handlePress(levelId)}
              activeOpacity={unlocked ? 0.7 : 1}
            >
              <View style={styles.cardHeader}>
                {/* I added the environment icon + title in a row so it looks cleaner */}
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardEnvIcon}>{theme?.icon}</Text>
                  <Text style={[styles.levelTitle, !unlocked && styles.lockedText]}>
                    {unlocked ? `Mission ${levelId}` : '🔒 Locked'}
                  </Text>
                </View>
                <Text style={styles.stars}>
                  {result
                    ? '★'.repeat(result.stars) + '☆'.repeat(3 - result.stars)
                    : '☆☆☆'}
                </Text>
              </View>

              <Text style={[styles.cardLabel, !unlocked && styles.lockedText]}>
                {config.label}
              </Text>

              {/* This is the educational mission text — shows the goal-oriented objective */}
              {/* Instead of "Target: 100 pts" its "Sort 100 kg to plant a Community Garden" */}
              <Text style={[styles.cardMission, !unlocked && styles.lockedText]}>
                {config.mission}
              </Text>

              {/* Quick stats so they know the difficulty before tapping GO */}
              <Text style={[styles.cardGoal, !unlocked && styles.lockedText]}>
                {config.targetScore} kg  ·  {config.maxMoves} moves
              </Text>

              {result && (
                <Text style={styles.highScore}>Best: {result.highScore} kg</Text>
              )}

              <View style={[styles.playTag, !unlocked && styles.lockedTag]}>
                <Text style={[styles.playTagText, !unlocked && styles.lockedTagText]}>
                  {unlocked ? 'GO →' : 'Complete Mission ' + (levelId - 1)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ─── Badges section — shows all earned achievements ─── */}
      {badgeList.length > 0 && (
        <View style={styles.badgesSection}>
          <Text style={styles.badgesTitle}>Achievements</Text>
          <View style={styles.badgesGrid}>
            {badgeList.map(badge => (
              <View key={badge.id} style={styles.badgeChip}>
                <Text style={styles.badgeChipIcon}>{badge.icon}</Text>
                <Text style={styles.badgeChipName}>{badge.name}</Text>
              </View>
            ))}
          </View>

          {/* Show how many badges are left to earn so they keep playing */}
          <Text style={styles.badgesProgress}>
            {badgeList.length} / {Object.keys(BADGE_DEFINITIONS).length} badges earned
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─── "Clean Future" palette ───
// Base:    #0F1923 (deep navy)
// Surface: #1A2733 (slate)
// Primary: #00E676 (vivid mint)
// Secondary: #40C4FF (sky blue)
// Accent:  #FFD740 (golden sun)
// Error:   #FF6E7F (soft coral)
// Text:    #FFFFFF / #8BA4B8

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0F1923',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },

  header: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Banner that shows total eco score across all levels
  ecoBanner: { alignItems: 'center', marginBottom: 20 },
  ecoBannerLabel: { fontSize: 12, color: '#8BA4B8', textTransform: 'uppercase', letterSpacing: 1 },
  ecoBannerValue: { fontSize: 28, fontWeight: '900', color: '#00E676' },

  cardContainer: { width: '100%', alignItems: 'center' },

  levelCard: {
    width: '85%',
    backgroundColor: '#1A2733',
    padding: 20,
    marginVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A3A4A',
  },

  // Locked cards are darker so the player knows they can't tap them yet
  lockedCard: { backgroundColor: '#131D27', borderColor: '#1A2733' },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },

  cardTitleRow: { flexDirection: 'row', alignItems: 'center' },
  cardEnvIcon: { fontSize: 22, marginRight: 8 },
  levelTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  lockedText: { color: '#4A5A6A' },

  stars: { fontSize: 20, color: '#FFD740' },

  cardLabel: { fontSize: 16, fontWeight: '600', color: '#40C4FF', marginBottom: 2 },
  cardMission: { fontSize: 13, color: '#8BA4B8', lineHeight: 18, marginBottom: 6 },
  cardGoal: { fontSize: 13, color: '#8BA4B8', opacity: 0.7 },

  highScore: { fontSize: 13, color: '#00E676', fontWeight: '700', marginTop: 4 },

  playTag: {
    alignSelf: 'flex-end',
    backgroundColor: '#00E676',
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },
  playTagText: { color: '#0F1923', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },

  lockedTag: { backgroundColor: '#1A2733', borderWidth: 1, borderColor: '#2A3A4A' },
  lockedTagText: { color: '#4A5A6A' },

  // ─── Badges / Achievements section at the bottom ───
  badgesSection: {
    width: '85%',
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#2A3A4A',
    alignItems: 'center',
  },
  badgesTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFD740',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2733',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2A3A4A',
  },
  badgeChipIcon: { fontSize: 18, marginRight: 6 },
  badgeChipName: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  badgesProgress: {
    marginTop: 12,
    fontSize: 13,
    color: '#8BA4B8',
    fontWeight: '600',
  },
});
