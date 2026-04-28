// This is the very first screen the player sees — the EcoPop title screen
import * as Haptics from '../utils/safeHaptics';
import React, { useMemo, useState } from 'react';
import { Image } from 'expo-image';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TutorialOverlay from '../components/TutorialOverlay';

export default function HomeScreen({ navigation }) {
  const [showTutorial, setShowTutorial] = useState(false);
  const { width: windowW, height: windowH } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const logoSize = useMemo(() => {
    const horizontalCap = windowW - 32;
    const verticalRoom = Math.max(280, windowH - insets.top - insets.bottom - 220);
    return Math.max(
      140,
      Math.min(520, horizontalCap * 0.92, verticalRoom * 0.55, windowW * 0.88)
    );
  }, [windowW, windowH, insets.top, insets.bottom]);

  const topBar = Math.max(insets.top, 8) + 4;
  const bottomPad = Math.max(insets.bottom, 16) + 8;

  const handleStart = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('LevelSelect');
  };

  const handleSettings = async () => {
    await Haptics.selectionAsync();
    navigation.navigate('Settings');
  };

  const handleHowToPlay = async () => {
    await Haptics.selectionAsync();
    setShowTutorial(true);
  };

  const handleEcoPedia = async () => {
    await Haptics.selectionAsync();
    Alert.alert('EcoPedia — Coming Soon!', 'Unlock eco-facts for every material as you play. The more you recycle, the more you learn!');
  };

  const Body = Platform.OS === 'web' ? ScrollView : View;
  const bodyProps =
    Platform.OS === 'web'
      ? {
          style: styles.scrollRoot,
          contentContainerStyle: [
            styles.scrollInner,
            {
              paddingTop: topBar + 8,
              paddingBottom: bottomPad + 24,
              minHeight: windowH,
            },
          ],
          keyboardShouldPersistTaps: 'always',
          showsVerticalScrollIndicator: true,
        }
      : { style: styles.nativeWrap };

  const mainColumn = (
    <View
      style={[
        styles.mainColumn,
        Platform.OS === 'web' && {
          minHeight: Math.max(380, windowH - topBar - bottomPad - 16),
        },
      ]}
    >
      <TouchableOpacity style={[styles.settingsBtn, { top: topBar }]} onPress={handleSettings}>
        <Text style={styles.settingsIcon}>⚙️</Text>
      </TouchableOpacity>

      <View style={styles.contentBlock}>
        <Image
          source={require('../../assets/logo.png')}
          style={[styles.logo, { width: logoSize, height: logoSize }]}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
        <Text style={[styles.subtitle, windowW < 380 && styles.subtitleNarrow]}>
          Become an Eco-Agent.{'\n'}Clean the world, one match at a time.
        </Text>

        <TouchableOpacity style={[styles.button, windowW < 400 && styles.buttonCompact]} onPress={handleStart}>
          <Text style={styles.buttonText}>PLAY</Text>
        </TouchableOpacity>

        <View style={[styles.secondaryRow, windowW < 420 && styles.secondaryRowStack]}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleHowToPlay}>
            <Text style={styles.secondaryIcon}>📖</Text>
            <Text style={styles.secondaryText}>How to Play</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleEcoPedia}>
            <Text style={styles.secondaryIcon}>📚</Text>
            <Text style={styles.secondaryText}>EcoPedia</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.footerBrand, styles.footerBrandFlow]}>Built for the City</Text>
    </View>
  );

  return (
    <View style={styles.outer}>
      <Body {...bodyProps}>
        {Platform.OS === 'web' ? mainColumn : <View style={styles.container}>{mainColumn}</View>}
      </Body>

      <TutorialOverlay visible={showTutorial} onFinish={() => setShowTutorial(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#0F1923' },
  nativeWrap: { flex: 1 },
  scrollRoot: { flex: 1 },
  scrollInner: {
    flexGrow: 1,
    alignItems: 'center',
    width: '100%',
  },

  container: {
    flex: 1,
    backgroundColor: '#0F1923',
    width: '100%',
    minHeight: '100%',
  },

  mainColumn: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    position: 'relative',
    flex: 1,
    justifyContent: 'space-between',
  },

  contentBlock: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingTop: 44,
    paddingHorizontal: 8,
  },

  settingsBtn: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  settingsIcon: { fontSize: 26 },

  logo: {
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 20,
    fontFamily: 'Quicksand_700Bold',
    color: '#FFFFFF',
    marginBottom: 40,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 30,
    textShadowColor: '#00E676',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitleNarrow: {
    fontSize: 17,
    paddingHorizontal: 20,
    lineHeight: 24,
    marginBottom: 28,
  },

  button: {
    backgroundColor: '#00E676',
    paddingVertical: 18,
    paddingHorizontal: 80,
    borderRadius: 30,
    shadowColor: '#00E676',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonCompact: {
    paddingHorizontal: 48,
  },

  buttonText: {
    color: '#0F1923',
    fontSize: 28,
    fontFamily: 'Quicksand_700Bold',
    letterSpacing: 3,
    textShadowColor: 'rgba(255,255,255,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  secondaryRow: {
    flexDirection: 'row',
    marginTop: 28,
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  secondaryRowStack: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2733',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A3A4A',
  },
  secondaryIcon: { fontSize: 16, marginRight: 6 },
  secondaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Quicksand_400Regular',
    textShadowColor: '#40C4FF',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  footerBrand: {
    fontSize: 13,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 3,
    fontFamily: 'Quicksand_400Regular',
    textShadowColor: '#00E676',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  footerBrandFlow: {
    textAlign: 'center',
    width: '100%',
    marginTop: 20,
    paddingBottom: 4,
  },
});
