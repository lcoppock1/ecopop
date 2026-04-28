// Level Select screen — shows all 5 missions as cards
// Phase 3+4 upgrade: levels are locked/unlocked based on progress,
// shows star ratings, high scores, lifetime EcoMeter banner, and earned badges
// Now using the "Clean Future" palette to match the rest of the app
import * as Haptics from '../utils/safeHaptics';
import React, { useCallback, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
// I'm pulling the environment themes now too for the little icons on each level card
import { ENVIRONMENT_THEMES, LEVEL_CONFIG } from '../gameData';
import { isLevelUnlocked, loadProgress } from '../storage';
import { BADGE_DEFINITIONS } from '../badges';

// Grab all the level IDs from the config (1, 2, 3, 4, 5)
const LEVEL_IDS = Object.keys(LEVEL_CONFIG).map(Number);

export default function LevelSelect({ navigation }) {
  const { height: windowH } = useWindowDimensions();

  const [completedLevels, setCompletedLevels] = useState({});
  const [totalEco, setTotalEco] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState({});

  // useFocusEffect = runs every time the user comes BACK to this screen
  // So if they just beat a level, this reloads their progress from AsyncStorage
  // (learned this from the React Navigation docs)
  useFocusEffect(
    useCallback(() => {
      loadProgress().then(p => {
        setCompletedLevels(
          p.completedLevels != null && typeof p.completedLevels === 'object' && !Array.isArray(p.completedLevels)
            ? p.completedLevels
            : {}
        );
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
    <View
      style={[
        styles.pageRoot,
        Platform.OS === 'web' && {
          height: windowH,
          minHeight: windowH,
          maxHeight: windowH,
          overflow: 'hidden',
        },
      ]}
    >
      <ScrollView
        style={[styles.scroll, Platform.OS === 'web' && styles.scrollWeb]}
        contentContainerStyle={[styles.container, Platform.OS === 'web' && styles.containerWeb]}
        keyboardShouldPersistTaps={Platform.OS === 'web' ? 'always' : 'handled'}
        showsVerticalScrollIndicator
        bounces={Platform.OS !== 'web'}
        scrollEventThrottle={16}
      >
      {/* Back to home button so the player can always get back to the title screen */}
      <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.homeBtnText}>← Home</Text>
      </TouchableOpacity>

      {/* The player is an Eco-Agent — this header reinforces that identity */}
      <Text style={styles.header}>Eco-Agent HQ</Text>
      <Text style={styles.headerSub}>Choose a polluted place to clean up</Text>

      {/* ─── WORLD CLEANUP MAP ─── */}
      {/* Shows each environment as a tile — polluted (dim) or cleaned (bright) */}
      {/* This is the "world getting cleaner" visual from my MVP */}
      {(() => {
        const completed = Object.keys(completedLevels).length;
        const total = LEVEL_IDS.length;
        return (
          <View style={styles.worldProgress}>
            <Text style={styles.worldTitle}>
              {completed === 0 ? 'These places need your help!' :
               completed < total ? `${completed} of ${total} places restored` :
               'Every place is clean! You did it!'}
            </Text>
            <View style={styles.worldMap}>
              {LEVEL_IDS.map((id) => {
                const done = !!completedLevels[id];
                const theme = ENVIRONMENT_THEMES?.[id];
                return (
                  <View key={id} style={styles.worldTile}>
                    <View style={[
                      styles.worldTileIcon,
                      done && theme && { backgroundColor: theme.cleanColor, borderColor: theme.cleanColor },
                    ]}>
                      <Text style={{ fontSize: 20 }}>{theme?.icon}</Text>
                    </View>
                    <Text style={[styles.worldTileName, done && styles.worldTileNameDone]}>
                      {theme?.name}
                    </Text>
                    <Text style={[styles.worldTileStatus, done && styles.worldTileStatusDone]}>
                      {done ? 'Cleaned!' : 'Polluted'}
                    </Text>
                  </View>
                );
              })}
            </View>
            {totalEco > 0 && (
              <Text style={styles.worldEcoTotal}>{totalEco} lb recycled so far</Text>
            )}
          </View>
        );
      })()}

      <View style={styles.cardContainer}>
        {LEVEL_IDS.map((levelId) => {
          const config = LEVEL_CONFIG?.[levelId];
          // Check if this level is unlocked (Level 1 always is, others need previous level beaten)
          const unlocked = isLevelUnlocked(levelId, completedLevels);
          // If they've played this level before, pull their saved result
          const result = completedLevels[levelId];

          // Grab the theme for this level so I can show the environment icon on the card
          const theme = ENVIRONMENT_THEMES?.[levelId];
          const starsEarned = Math.min(3, Math.max(0, Math.round(Number(result?.stars) || 0)));

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
                    ? '★'.repeat(starsEarned) + '☆'.repeat(3 - starsEarned)
                    : '☆☆☆'}
                </Text>
              </View>

              <Text style={[styles.cardLabel, !unlocked && styles.lockedText]}>
                {config?.label}
              </Text>

              {/* This is the educational mission text — shows the goal-oriented objective */}
              {/* Instead of "Target: 100 pts" its "Sort 100 lb to plant a Community Garden" */}
              <Text style={[styles.cardMission, !unlocked && styles.lockedText]}>
                {config?.mission}
              </Text>

              {/* Quick stats so they know the difficulty before tapping GO */}
              <Text style={[styles.cardGoal, !unlocked && styles.lockedText]}>
                {config?.targetScore} lb  ·  {config?.maxMoves} moves
              </Text>

              {result && (
                <Text style={styles.highScore}>Best: {result.highScore} lb</Text>
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

      {/* ─── Eco-Agent Badges ─── */}
      {/* Always visible so the player knows badges exist and wants to earn them */}
      <View style={styles.badgesSection}>
        <Text style={styles.badgesTitle}>Your Eco-Agent Badges</Text>
        <Text style={styles.badgesExplain}>
          {badgeList.length === 0
            ? 'Complete missions and hit milestones to earn badges!'
            : 'Keep playing to unlock more badges.'}
        </Text>

        {badgeList.length > 0 ? (
          <View style={styles.badgesGrid}>
            {badgeList.map(badge => (
              <View key={badge.id} style={styles.badgeChip}>
                <Text style={styles.badgeChipIcon}>{badge.icon}</Text>
                <Text style={styles.badgeChipName}>{badge.name}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.badgesEmpty}>
            <Text style={styles.badgesEmptyIcon}>🏅</Text>
            <Text style={styles.badgesEmptyText}>No badges yet — go clean some places!</Text>
          </View>
        )}

        <Text style={styles.badgesProgress}>
          {badgeList.length} / {Object.keys(BADGE_DEFINITIONS).length} badges
        </Text>
      </View>
      </ScrollView>
    </View>
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
  pageRoot: {
    flex: 1,
    width: '100%',
    backgroundColor: '#0F1923',
  },
  scroll: {
    flex: 1,
    width: '100%',
    backgroundColor: '#0F1923',
  },
  scrollWeb: {
    minHeight: 0,
    flexShrink: 1,
    overflow: 'auto',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#0F1923',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 48,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingHorizontal: 12,
  },
  containerWeb: {
    flexGrow: 0,
  },

  // Back to home button at the top left
  homeBtn: { alignSelf: 'flex-start', paddingHorizontal: 24, marginBottom: 4 },
  homeBtnText: { fontSize: 16, fontFamily: 'Quicksand_700Bold', color: '#40C4FF', fontWeight: 'bold' },

  header: {
    fontSize: 28,
    fontFamily: 'Quicksand_700Bold',
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  headerSub: {
    fontSize: 14,
    fontFamily: 'Quicksand_400Regular',
    color: '#8BA4B8',
    marginBottom: 16,
    fontWeight: '600',
  },

  // ─── World Cleanup Map (the "world getting cleaner" visual from my MVP) ───
  worldProgress: {
    width: '92%',
    backgroundColor: '#1A2733',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  worldTitle: { fontSize: 14, fontFamily: 'Quicksand_700Bold', fontWeight: '800', color: '#8BA4B8', marginBottom: 12 },
  worldMap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'center',
    gap: 8,
    rowGap: 12,
  },
  worldTile: { alignItems: 'center', minWidth: 56, flexGrow: 1, maxWidth: 72 },
  worldTileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2A3A4A',
    borderWidth: 2,
    borderColor: '#2A3A4A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  worldTileName: { fontSize: 9, fontFamily: 'Quicksand_700Bold', color: '#4A5A6A', textTransform: 'uppercase' },
  worldTileNameDone: { color: '#FFFFFF' },
  worldTileStatus: { fontSize: 8, fontFamily: 'Quicksand_700Bold', color: '#FF6E7F' },
  worldTileStatusDone: { color: '#00E676' },
  worldEcoTotal: {
    fontSize: 13,
    fontFamily: 'Quicksand_700Bold',
    color: '#00E676',
    marginTop: 12,
  },

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
  cardEnvIcon: { fontSize: 22, fontFamily: 'Quicksand_400Regular', marginRight: 8 },
  levelTitle: { fontSize: 22, fontFamily: 'Quicksand_700Bold', fontWeight: 'bold', color: '#FFFFFF' },
  lockedText: { color: '#4A5A6A' },

  stars: { fontSize: 20, fontFamily: 'Quicksand_700Bold', color: '#FFD740' },

  cardLabel: { fontSize: 16, fontFamily: 'Quicksand_400Regular', fontWeight: '600', color: '#40C4FF', marginBottom: 2 },
  cardMission: { fontSize: 13, fontFamily: 'Quicksand_400Regular', color: '#8BA4B8', lineHeight: 18, marginBottom: 6 },
  cardGoal: { fontSize: 13, fontFamily: 'Quicksand_400Regular', color: '#8BA4B8', opacity: 0.7 },

  highScore: { fontSize: 13, fontFamily: 'Quicksand_400Regular', color: '#00E676', fontWeight: '700', marginTop: 4 },

  playTag: {
    alignSelf: 'flex-end',
    backgroundColor: '#00E676',
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },
  playTagText: { color: '#0F1923', fontSize: 14, fontFamily: 'Quicksand_700Bold', letterSpacing: 1 },

  lockedTag: { backgroundColor: '#1A2733', borderWidth: 1, borderColor: '#2A3A4A' },
  lockedTagText: { color: '#4A5A6A' },

  // ─── Eco-Agent Badges section ───
  badgesSection: {
    width: '85%',
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#2A3A4A',
    alignItems: 'center',
  },
  badgesTitle: {
    fontSize: 18,
    fontFamily: 'Quicksand_700Bold',
    color: '#FFD740',
    marginBottom: 4,
  },
  badgesExplain: {
    fontSize: 12,
    fontFamily: 'Quicksand_400Regular',
    color: '#8BA4B8',
    marginBottom: 14,
    textAlign: 'center',
  },
  badgesEmpty: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  badgesEmptyIcon: { fontSize: 32, fontFamily: 'Quicksand_700Bold', marginBottom: 6, opacity: 0.4 },
  badgesEmptyText: { fontSize: 13, fontFamily: 'Quicksand_400Regular', color: '#4A5A6A', fontWeight: '600' },
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
  badgeChipIcon: { fontSize: 18, fontFamily: 'Quicksand_700Bold', marginRight: 6 },
  badgeChipName: { fontSize: 13, fontFamily: 'Quicksand_400Regular', fontWeight: '600', color: '#FFFFFF' },
  badgesProgress: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: 'Quicksand_400Regular',
    color: '#8BA4B8',
    fontWeight: '600',
  },
});
