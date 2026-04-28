// This is the Settings screen — accessible from the HomeScreen via the gear icon
// It has real working features (replay tutorial, reset progress) plus
// a mock "Classroom Mode" section that shows what it WOULD look like if a teacher used this
// The classroom stuff is non-functional but shows the vision for educational use
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from '../utils/safeHaptics';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen({ navigation }) {
  const { height: windowH } = useWindowDimensions();

  const [soundOn, setSoundOn] = useState(true);
  const [hapticsOn, setHapticsOn] = useState(true);
  const [hintsOn, setHintsOn] = useState(true);

  // Controls whether the Classroom Mode detail popup is showing
  const [showClassroom, setShowClassroom] = useState(false);

  // ─── REPLAY TUTORIAL: clears the AsyncStorage flag so the tutorial shows again ───
  const handleReplayTutorial = async () => {
    try {
      await AsyncStorage.removeItem('tutorialComplete');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Tutorial Reset!', 'The tutorial will show next time you play Level 1.');
    } catch (_) {
      Alert.alert('Oops', 'Something went wrong. Try again!');
    }
  };

  // ─── RESET PROGRESS: wipes ALL saved data (scores, badges, everything) ───
  // I added a confirmation alert so nobody accidentally hits this
  const handleResetProgress = () => {
    Alert.alert(
      'Reset All Progress?',
      'This will erase all your scores, stars, badges, and unlocked levels. This cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('playerProgress');
              await AsyncStorage.removeItem('tutorialComplete');
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Progress Reset', 'All data has been cleared. Start fresh!');
            } catch (_) {
              Alert.alert('Oops', 'Something went wrong. Try again!');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={[
          styles.pageBody,
          Platform.OS === 'web' && {
            height: windowH,
            minHeight: windowH,
            maxHeight: windowH,
            overflow: 'hidden',
          },
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          style={[styles.scrollView, Platform.OS === 'web' && styles.scrollViewWeb]}
          contentContainerStyle={[styles.scroll, Platform.OS === 'web' && styles.scrollContentWeb]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          bounces={Platform.OS !== 'web'}
        >

        {/* ─── GAME SETTINGS SECTION ─── */}
        <Text style={styles.sectionTitle}>Game</Text>
        <View style={styles.card}>
          {/* Sound toggle — just a visual toggle for now (no audio system yet) */}
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Sound Effects</Text>
              <Text style={styles.settingDesc}>Toggle game audio</Text>
            </View>
            <Switch
              value={soundOn}
              onValueChange={setSoundOn}
              trackColor={{ false: '#2A3A4A', true: '#00E676' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          {/* Haptics toggle */}
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Haptic Feedback</Text>
              <Text style={styles.settingDesc}>Vibration on tap & combo</Text>
            </View>
            <Switch
              value={hapticsOn}
              onValueChange={setHapticsOn}
              trackColor={{ false: '#2A3A4A', true: '#00E676' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          {/* Hints toggle */}
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Hint Glow</Text>
              <Text style={styles.settingDesc}>Show tile hints after idle</Text>
            </View>
            <Switch
              value={hintsOn}
              onValueChange={setHintsOn}
              trackColor={{ false: '#2A3A4A', true: '#00E676' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* ─── TUTORIAL & DATA SECTION ─── */}
        <Text style={styles.sectionTitle}>Tutorial & Data</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.actionRow} onPress={handleReplayTutorial}>
            <Text style={styles.actionIcon}>📖</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Replay Tutorial</Text>
              <Text style={styles.settingDesc}>See the how-to-play walkthrough again</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionRow} onPress={handleResetProgress}>
            <Text style={styles.actionIcon}>🗑️</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: '#FF6E7F' }]}>Reset All Progress</Text>
              <Text style={styles.settingDesc}>Erase scores, stars, badges — start over</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ─── CLASSROOM MODE (MOCK) ─── */}
        {/* This is the educational / teacher-facing feature concept */}
        {/* Everything here is non-functional but shows the vision */}
        <Text style={styles.sectionTitle}>Classroom Mode</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.actionRow} onPress={() => setShowClassroom(true)}>
            <Text style={styles.actionIcon}>🏫</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Teacher Dashboard</Text>
              <Text style={styles.settingDesc}>Manage your class, view student progress</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.actionRow}>
            <Text style={styles.actionIcon}>🔗</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Join a Class</Text>
              <Text style={styles.settingDesc}>Enter a class code from your teacher</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.actionRow}>
            <Text style={styles.actionIcon}>📊</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Class Leaderboard</Text>
              <Text style={styles.settingDesc}>See how your class ranks</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          </View>
        </View>

        {/* ─── UPCOMING FEATURES (COMING SOON) ─── */}
        {/* These are the educational features I'm planning to build out next */}
        <Text style={styles.sectionTitle}>Upcoming Features</Text>
        <View style={styles.card}>
          <View style={styles.actionRow}>
            <Text style={styles.actionIcon}>🧠</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Post-Level Quiz</Text>
              <Text style={styles.settingDesc}>Answer a quick eco-question after winning a level to test what you learned</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.actionRow}>
            <Text style={styles.actionIcon}>🌍</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Real-World Impact</Text>
              <Text style={styles.settingDesc}>See how your recycling stats translate to real-world equivalents using EPA data</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.actionRow}>
            <Text style={styles.actionIcon}>📚</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>EcoPedia</Text>
              <Text style={styles.settingDesc}>Unlock eco-facts for each material as you recycle more — collect them all!</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          </View>
        </View>

        {/* ─── ABOUT SECTION ─── */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <View style={styles.aboutRow}>
            <Text style={styles.settingLabel}>EcoPop</Text>
            <Text style={styles.aboutValue}>v1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.aboutRow}>
            <Text style={styles.settingLabel}>Made by</Text>
            <Text style={styles.aboutValue}>La'Joir Coppock</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.aboutRow}>
            <Text style={styles.settingLabel}>School</Text>
            <Text style={styles.aboutValue}>Xavier University of LA</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {/* ─── CLASSROOM MODE DETAIL MODAL (MOCK) ─── */}
      {/* This is what a teacher would see if Classroom Mode was fully built */}
      <Modal visible={showClassroom} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView contentContainerStyle={styles.modalScroll} bounces={false}>
              <Text style={styles.modalTitle}>Teacher Dashboard</Text>
              <Text style={styles.modalSubtitle}>Preview — Coming Soon</Text>

              {/* Mock class info */}
              <View style={styles.mockSection}>
                <Text style={styles.mockLabel}>My Class</Text>
                <View style={styles.mockInfoRow}>
                  <Text style={styles.mockInfoLabel}>Class Name</Text>
                  <Text style={styles.mockInfoValue}>Period 3 — Env. Science</Text>
                </View>
                <View style={styles.mockInfoRow}>
                  <Text style={styles.mockInfoLabel}>Class Code</Text>
                  <Text style={styles.mockClassCode}>ECO-7X4K</Text>
                </View>
                <View style={styles.mockInfoRow}>
                  <Text style={styles.mockInfoLabel}>Students</Text>
                  <Text style={styles.mockInfoValue}>28 enrolled</Text>
                </View>
              </View>

              {/* Mock assignment */}
              <View style={styles.mockSection}>
                <Text style={styles.mockLabel}>Current Assignment</Text>
                <View style={styles.mockAssignment}>
                  <Text style={styles.mockAssignTitle}>Week 3: Ocean Pollution</Text>
                  <Text style={styles.mockAssignDesc}>
                    Complete Missions 1-3 and earn at least 2 stars on each. 
                    Write a 1-paragraph reflection on what you learned from the eco-tips.
                  </Text>
                  <View style={styles.mockAssignMeta}>
                    <Text style={styles.mockMetaText}>Due: Apr 15, 2026</Text>
                    <Text style={styles.mockMetaText}>18 / 28 completed</Text>
                  </View>
                </View>
              </View>

              {/* Mock leaderboard */}
              <View style={styles.mockSection}>
                <Text style={styles.mockLabel}>Class Leaderboard (Top 5)</Text>
                {['Jayden M. — 9,260 lb', 'Aisha T. — 8,490 lb', 'Marcus R. — 7,940 lb', 'Sofia L. — 7,600 lb', 'Devon K. — 6,830 lb'].map((entry, i) => (
                  <View key={i} style={styles.mockLeaderRow}>
                    <Text style={styles.mockRank}>#{i + 1}</Text>
                    <Text style={styles.mockLeaderName}>{entry}</Text>
                    {i === 0 && <Text style={styles.mockTrophy}>🏆</Text>}
                  </View>
                ))}
              </View>

              {/* Mock progress overview */}
              <View style={styles.mockSection}>
                <Text style={styles.mockLabel}>Class Stats</Text>
                <View style={styles.mockStatsGrid}>
                  <View style={styles.mockStatBox}>
                    <Text style={styles.mockStatValue}>847</Text>
                    <Text style={styles.mockStatLabel}>Total Levels{'\n'}Completed</Text>
                  </View>
                  <View style={styles.mockStatBox}>
                    <Text style={styles.mockStatValue}>156k</Text>
                    <Text style={styles.mockStatLabel}>lb Recycled{'\n'}(Combined)</Text>
                  </View>
                  <View style={styles.mockStatBox}>
                    <Text style={styles.mockStatValue}>94%</Text>
                    <Text style={styles.mockStatLabel}>Assignment{'\n'}Completion</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowClassroom(false)}
              >
                <Text style={styles.modalCloseBtnText}>Close Preview</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── "Clean Future" palette ───
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1923' },

  pageBody: {
    flex: 1,
    width: '100%',
    minHeight: 0,
  },

  scrollView: {
    flex: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  scrollViewWeb: {
    minHeight: 0,
    flexShrink: 1,
    overflow: 'auto',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  backButton: { fontSize: 18, fontFamily: 'Quicksand_700Bold', color: '#40C4FF', fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontFamily: 'Quicksand_700Bold', fontWeight: '900', color: '#FFFFFF' },

  scroll: { paddingHorizontal: 20, paddingBottom: 28 },
  scrollContentWeb: { flexGrow: 0 },

  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Quicksand_700Bold',
    fontWeight: '800',
    color: '#8BA4B8',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 24,
    marginBottom: 10,
    marginLeft: 4,
  },

  card: {
    backgroundColor: '#1A2733',
    borderRadius: 16,
    overflow: 'hidden',
  },

  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingLabel: { fontSize: 16, fontFamily: 'Quicksand_400Regular', fontWeight: '700', color: '#FFFFFF' },
  settingDesc: { fontSize: 12, fontFamily: 'Quicksand_400Regular', color: '#8BA4B8', marginTop: 2 },

  divider: { height: 1, backgroundColor: '#2A3A4A', marginHorizontal: 16 },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionIcon: { fontSize: 24, fontFamily: 'Quicksand_700Bold', marginRight: 14 },
  chevron: { fontSize: 24, fontFamily: 'Quicksand_700Bold', color: '#8BA4B8', fontWeight: '300' },

  comingSoonBadge: {
    backgroundColor: 'rgba(255, 215, 64, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD740',
  },
  comingSoonText: {
    fontSize: 10,
    fontFamily: 'Quicksand_700Bold',
    fontWeight: '800',
    color: '#FFD740',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  aboutValue: { fontSize: 14, fontFamily: 'Quicksand_400Regular', color: '#8BA4B8', fontWeight: '600' },

  // ─── Classroom Mode Modal ───
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1A2733',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderTopWidth: 2,
    borderColor: '#FFD740',
  },
  modalScroll: { padding: 24 },
  modalTitle: { fontSize: 24, fontFamily: 'Quicksand_700Bold', fontWeight: '900', color: '#FFFFFF', textAlign: 'center' },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: 'Quicksand_400Regular',
    color: '#FFD740',
    textAlign: 'center',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 20,
    marginTop: 4,
  },

  mockSection: { marginBottom: 22 },
  mockLabel: {
    fontSize: 12,
    fontFamily: 'Quicksand_700Bold',
    fontWeight: '800',
    color: '#40C4FF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  mockInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3A4A',
  },
  mockInfoLabel: { fontSize: 14, fontFamily: 'Quicksand_400Regular', color: '#8BA4B8' },
  mockInfoValue: { fontSize: 14, fontFamily: 'Quicksand_400Regular', color: '#FFFFFF', fontWeight: '600' },
  mockClassCode: { fontSize: 14, fontFamily: 'Quicksand_700Bold', fontWeight: '900', color: '#00E676' },

  mockAssignment: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#FFD740',
  },
  mockAssignTitle: { fontSize: 16, fontFamily: 'Quicksand_700Bold', fontWeight: '800', color: '#FFFFFF', marginBottom: 6 },
  mockAssignDesc: { fontSize: 13, fontFamily: 'Quicksand_400Regular', color: '#8BA4B8', lineHeight: 19 },
  mockAssignMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  mockMetaText: { fontSize: 12, fontFamily: 'Quicksand_400Regular', color: '#FFD740', fontWeight: '700' },

  mockLeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3A4A',
  },
  mockRank: { fontSize: 14, fontFamily: 'Quicksand_700Bold', fontWeight: '900', color: '#FFD740', width: 30 },
  mockLeaderName: { fontSize: 14, fontFamily: 'Quicksand_400Regular', color: '#FFFFFF', flex: 1 },
  mockTrophy: { fontSize: 18, fontFamily: 'Quicksand_700Bold' },

  mockStatsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  mockStatBox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  mockStatValue: { fontSize: 22, fontFamily: 'Quicksand_700Bold', fontWeight: '900', color: '#00E676' },
  mockStatLabel: { fontSize: 10, fontFamily: 'Quicksand_400Regular', color: '#8BA4B8', textAlign: 'center', marginTop: 4, lineHeight: 14 },

  modalCloseBtn: {
    backgroundColor: '#FFD740',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  modalCloseBtnText: { color: '#0F1923', fontSize: 16, fontFamily: 'Quicksand_700Bold', fontWeight: '900' },
});
