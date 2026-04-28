// This is the main gameplay screen where all the matching happens
// Phase 3+4 upgrade: hint glow, moves, combos with escalating haptics,
// eco facts on win, badge checking, and the cumulative EcoMeter
import * as Haptics from '../utils/safeHaptics';
import { Image as ExpoImage } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image as RNImage,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  ECO_FACTS,
  ENVIRONMENT_THEMES,
  LEVEL1_CONFIG,
  LEVEL1_ENV,
  LEVEL_CONFIG,
  TILE_TYPES,
  generateRandomGrid,
  normalizeMaterialKey,
  pickRandomEcoFact,
} from '../gameData';
import GameEngine from '../logic/GameEngine';
import { getStarRating, loadProgress, saveLevelResult } from '../storage';
import { checkAndAwardBadges } from '../badges';
// My custom components for the different overlays that show up during gameplay
import LevelIntro from '../components/FactModal';       // the "loading screen" before the game starts
import GlowTile from '../components/GlowTile';          // breathing glow effect on hint tiles
import TutorialOverlay, { shouldShowTutorial } from '../components/TutorialOverlay'; // first-time walkthrough

// If the player gets a cascade chain (matches after matches), they get 1.5x bonus
const COMBO_BONUS_MULTIPLIER = 1.5;

// Hint glow after idle (10s) — gives time to plan the next move
const HINT_DELAY = 10000;

const LEAVE_TITLE = 'Leave mission?';
const LEAVE_MESSAGE =
  'Your progress on this run will be lost. You can start this mission again anytime.';

/** Web: Alert.alert is a no-op in react-native-web — use confirm (must be synchronous in beforeRemove) */
function webConfirmLeave() {
  return (
    typeof window !== 'undefined' &&
    window.confirm(`${LEAVE_TITLE}\n\n${LEAVE_MESSAGE}`)
  );
}

function computeBoardSize(windowW, windowH, topInset, bottomInset) {
  const w = Number(windowW);
  const h = Number(windowH);
  const wi = Number.isFinite(w) && w > 0 ? w : 390;
  const hi = Number.isFinite(h) && h > 0 ? h : 844;
  const ti = Number(topInset);
  const bi = Number(bottomInset);
  const top = Number.isFinite(ti) ? ti : 0;
  const bot = Number.isFinite(bi) ? bi : 0;
  const pad = 20;
  const reservedY = 200 + top + bot;
  const side = Math.min(wi - pad * 2, hi - reservedY);
  const floorSide = Math.floor(side);
  const clamped = Number.isFinite(floorSide) ? floorSide : 320;
  return Math.max(220, Math.min(480, clamped));
}

/** hint must be [{ row, col }, …] — RN Web has tripped on malformed hints */
function normalizeHintTiles(hint) {
  if (!hint || !Array.isArray(hint)) return [];
  return hint.filter(h => h && typeof h.row === 'number' && typeof h.col === 'number').slice(0, 2);
}

function webTilePixelSize(cellPx) {
  const n = Number(cellPx);
  const side = Number.isFinite(n) && n > 0 ? n : 48;
  return Math.min(512, Math.max(8, side));
}

/** RN Web Image sometimes crashes if resolveAssetSource is missing — skip bitmap */
function webTileImageResolvable(source) {
  if (source == null) return false;
  try {
    const r = RNImage.resolveAssetSource(source);
    return !!(r && r.uri);
  } catch (_) {
    return false;
  }
}

/** GameEngine assumes a dense 6×6 — partial grids throw (e.g. undefined[row][4]). */
function isBoardReady(grid) {
  return (
    Array.isArray(grid) &&
    grid.length === 6 &&
    grid.every(row => Array.isArray(row) && row.length === 6)
  );
}

export default function GameScreen({ navigation, route }) {
  const { width: windowW, height: windowH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const boardSize = useMemo(
    () => computeBoardSize(windowW, windowH, insets.top, insets.bottom),
    [windowW, windowH, insets.top, insets.bottom]
  );

  // Web: flex:1 tiles + Metro URLs with spaces/parens often yield invisible cells on web — use explicit cell size
  const webCellSize = useMemo(() => {
    if (Platform.OS !== 'web') return 0;
    const bs = Number(boardSize);
    const safeBoard = Number.isFinite(bs) && bs > 0 ? bs : 320;
    const boardPad = 16; // styles.board padding 8+8
    const gutter = 36; // six columns/rows × (3px margin each side)
    const raw = (safeBoard - boardPad - gutter) / 6;
    const px = Number.isFinite(raw) ? raw : 48;
    return Math.max(4, px);
  }, [boardSize]);

  const webTilePx = useMemo(
    () => (Platform.OS === 'web' ? webTilePixelSize(webCellSize) : 0),
    [webCellSize]
  );

  // Grabbing the levelId that was passed from LevelSelect (defaults to 1 just in case)
  const rawLevelId = route.params?.levelId;
  const numericLevel = Number(rawLevelId);
  const levelId =
    Number.isFinite(numericLevel) && numericLevel >= 1 && numericLevel <= 5 ? numericLevel : 1;
  // Pull the config for this specific level (moves, target score, etc.)
  const config = LEVEL_CONFIG?.[levelId] ?? LEVEL_CONFIG?.[1] ?? LEVEL1_CONFIG;
  const envTheme = ENVIRONMENT_THEMES?.[levelId] ?? ENVIRONMENT_THEMES?.[1] ?? LEVEL1_ENV;

  // All my state variables for tracking the game
  const [grid, setGrid] = useState([]);
  const [selectedTile, setSelectedTile] = useState(null);
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(config.maxMoves);
  const [itemsCleaned, setItemsCleaned] = useState(0);
  const [comboChain, setComboChain] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [cumulativeEco, setCumulativeEco] = useState(0);
  const [gameState, setGameState] = useState('playing');
  const [resultStars, setResultStars] = useState(0);

  // Material tracking — counts how many of each type cleared this round (for badges)
  const [materialCounts, setMaterialCounts] = useState({ 1: 0, 2: 0, 3: 0, 4: 0 });

  // Hint system — which tiles to glow (was gonna use Skia but switched to Animated API)
  const [hintTiles, setHintTiles] = useState([]);
  const hintTimer = useRef(null);

  // Eco fact & badge results for the end-of-level popup
  const [ecoFact, setEcoFact] = useState('');
  const [topMaterialName, setTopMaterialName] = useState('');
  const [newBadges, setNewBadges] = useState([]);

  // Level intro "loading screen" — I show the mission + a random eco-tip before gameplay starts
  // Got the idea from how Assassin's Creed uses loading screens for historical trivia
  const [showIntro, setShowIntro] = useState(true);
  const [introTip, setIntroTip] = useState('');

  // First-time tutorial overlay (only shown once, tracked via AsyncStorage)
  const [showTutorial, setShowTutorial] = useState(false);

  // Animated value for the "polluted → clean" background shift on win
  const cleanupAnim = useRef(new Animated.Value(0)).current;

  // Using a ref so the cascade check doesn't trigger extra re-renders
  const isCascading = useRef(false);
  const materialCountsRef = useRef({ 1: 0, 2: 0, 3: 0, 4: 0 });
  const maxComboRef = useRef(0);
  const skipExitConfirmRef = useRef(false);
  /** False while this screen is blurred / unmounted — blocks timers & async endLevel from updating after navigate away */
  const screenActiveRef = useRef(true);
  const cascadeTimerRef = useRef(null);
  const deadBoardTimerRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      screenActiveRef.current = true;
      return () => {
        screenActiveRef.current = false;
        if (hintTimer.current) {
          clearTimeout(hintTimer.current);
          hintTimer.current = null;
        }
        if (cascadeTimerRef.current) {
          clearTimeout(cascadeTimerRef.current);
          cascadeTimerRef.current = null;
        }
        if (deadBoardTimerRef.current) {
          clearTimeout(deadBoardTimerRef.current);
          deadBoardTimerRef.current = null;
        }
        isCascading.current = false;
      };
    }, [])
  );

  // ─── FRESH START: no mid-level save — new board every time you enter (no resume)
  useFocusEffect(
    useCallback(() => {
      setGrid(generateRandomGrid());
      setSelectedTile(null);
      setScore(0);
      setMovesLeft(config.maxMoves);
      setItemsCleaned(0);
      setComboChain(0);
      setMaxCombo(0);
      setGameState('playing');
      setResultStars(0);
      setMaterialCounts({ 1: 0, 2: 0, 3: 0, 4: 0 });
      materialCountsRef.current = { 1: 0, 2: 0, 3: 0, 4: 0 };
      maxComboRef.current = 0;
      setEcoFact('');
      setTopMaterialName('');
      setNewBadges([]);
      setHintTiles([]);
      isCascading.current = false;
      cleanupAnim.setValue(0);
      loadProgress().then(p => {
        const te = Number(p.totalEcoScore);
        setCumulativeEco(Number.isFinite(te) ? te : 0);
      });

      // Pick a random eco-tip from ALL my facts to show on the level intro screen
      // Using .flat() to combine all the material-specific arrays into one big array
      const allFacts = Object.values(ECO_FACTS).flat();
      setIntroTip(allFacts[Math.floor(Math.random() * allFacts.length)]);
      setShowIntro(true); // show the intro loading screen before gameplay starts

      if (levelId === 1) {
        shouldShowTutorial().then(show => { if (show) setShowTutorial(true); });
      } else {
        setShowTutorial(false);
      }
    }, [levelId, config.maxMoves, config.targetScore])
  );

  useEffect(() => {
    const sub = navigation.addListener('beforeRemove', (e) => {
      if (skipExitConfirmRef.current) {
        skipExitConfirmRef.current = false;
        return;
      }
      if (gameState !== 'playing') return;

      // Synchronous confirm only — async .then() after preventDefault breaks navigation on web
      if (Platform.OS === 'web') {
        if (!webConfirmLeave()) {
          e.preventDefault();
        }
        return;
      }

      e.preventDefault();
      Alert.alert(LEAVE_TITLE, LEAVE_MESSAGE, [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            skipExitConfirmRef.current = true;
            navigation.dispatch(e.data.action);
          },
        },
      ]);
    });
    return sub;
  }, [navigation, gameState]);

  const confirmLeaveLevel = useCallback(() => {
    if (gameState !== 'playing') {
      skipExitConfirmRef.current = true;
      navigation.goBack();
      return;
    }
    if (Platform.OS === 'web') {
      if (webConfirmLeave()) {
        skipExitConfirmRef.current = true;
        navigation.goBack();
      }
      return;
    }
    Alert.alert(LEAVE_TITLE, LEAVE_MESSAGE, [
      { text: 'Stay', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () => {
          skipExitConfirmRef.current = true;
          navigation.goBack();
        },
      },
    ]);
  }, [gameState, navigation]);

  useEffect(() => {
    materialCountsRef.current = materialCounts;
  }, [materialCounts]);

  useEffect(() => {
    maxComboRef.current = maxCombo;
  }, [maxCombo]);

  // ─── HINT TIMER: resets every time the player taps something ───
  const resetHintTimer = useCallback(() => {
    setHintTiles([]);
    if (hintTimer.current) clearTimeout(hintTimer.current);

    hintTimer.current = setTimeout(() => {
      if (!screenActiveRef.current) return;
      // After HINT_DELAY ms of inactivity, find a valid move and glow those tiles
      if (gameState === 'playing' && isBoardReady(grid)) {
        const hint = GameEngine.findHint(grid);
        if (hint) setHintTiles(normalizeHintTiles(hint));
      }
    }, HINT_DELAY);
  }, [grid, gameState]);

  // Start the hint timer when the grid changes (new board, after cascade, etc.)
  useEffect(() => {
    if (isBoardReady(grid) && gameState === 'playing') resetHintTimer();
    return () => { if (hintTimer.current) clearTimeout(hintTimer.current); };
  }, [grid, gameState]);

  // ─── CASCADE LOOP: automatically clear matches until the board is stable ───
  useEffect(() => {
    // Don't resolve matches during intro/tutorial — cascades would add score and can trip the win modal before gameplay
    if (!isBoardReady(grid) || gameState !== 'playing' || showIntro || showTutorial) return;

    if (GameEngine.checkForMatches(grid)) {
      // Lock input while cascading so the player can't mess up the chain
      isCascading.current = true;
      if (cascadeTimerRef.current) clearTimeout(cascadeTimerRef.current);
      cascadeTimerRef.current = setTimeout(() => {
        cascadeTimerRef.current = null;
        if (!screenActiveRef.current) return;

        const matches = GameEngine.findAllMatches(grid);

        // Track which material types were cleared (for eco facts & badges)
        const counts = { ...materialCounts };
        matches.forEach(m => {
          const tileType = grid[m.r]?.[m.c];
          if (tileType > 0) counts[tileType] = (counts[tileType] || 0) + 1;
        });
        setMaterialCounts(counts);
        materialCountsRef.current = counts;

        // Combo logic: each cascade step bumps the chain counter
        // After the first cascade, they get a 1.5x multiplier (reward for good setups)
        const chain = comboChain + 1;
        const bonus = chain > 1 ? COMBO_BONUS_MULTIPLIER : 1;
        const pointsEarned = Math.round(matches.length * 10 * bonus);

        const processedGrid = GameEngine.processMatches(grid);
        setGrid(processedGrid);
        setScore(prev => prev + pointsEarned);
        setItemsCleaned(prev => prev + matches.length);
        setComboChain(chain);
        setMaxCombo(prev => {
          const next = Math.max(prev, chain);
          maxComboRef.current = next;
          return next;
        });

        // ESCALATING HAPTICS — gets stronger with each combo step
        triggerComboHaptic(chain);
      }, 450);

      return () => {
        if (cascadeTimerRef.current) {
          clearTimeout(cascadeTimerRef.current);
          cascadeTimerRef.current = null;
        }
      };
    }

    // Board is stable (no more matches) — end the cascade
    isCascading.current = false;
    if (comboChain > 0) setComboChain(0);

    // DEAD BOARD CHECK: if no valid moves exist on the board, reshuffle automatically
    // This is industry standard — Candy Crush, Bejeweled, etc. all do this
    // Without this the player would be stuck with no moves and have to restart manually
    if (!GameEngine.findHint(grid)) {
      if (deadBoardTimerRef.current) clearTimeout(deadBoardTimerRef.current);
      deadBoardTimerRef.current = setTimeout(() => {
        deadBoardTimerRef.current = null;
        if (!screenActiveRef.current) return;
        setGrid(generateRandomGrid());
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }, 300);
      return () => {
        if (deadBoardTimerRef.current) {
          clearTimeout(deadBoardTimerRef.current);
          deadBoardTimerRef.current = null;
        }
      };
    }
  }, [grid, showIntro, showTutorial, gameState]);

  // ─── WIN/LOSS CHECK — runs every time the score or moves change ───
  useEffect(() => {
    if (gameState !== 'playing' || showIntro || showTutorial) return;
    if (score >= config.targetScore) {
      endLevel('won');
    } else if (movesLeft <= 0) {
      endLevel('lost');
    }
  }, [score, movesLeft, showIntro, showTutorial, gameState]);

  // ─── END OF LEVEL: save progress, check badges, pick eco fact ───
  const endLevel = useCallback(async (outcome) => {
    // Clear hints so they're not stuck glowing
    setHintTiles([]);
    if (hintTimer.current) clearTimeout(hintTimer.current);

    const stars = outcome === 'won' ? getStarRating(levelId, score) : 0;
    setResultStars(stars);
    setGameState(outcome);

    const sessionCounts = materialCountsRef.current;
    const sessionMaxCombo = maxComboRef.current;

    // If counts are empty or all tied at 0, [0] is undefined — guard (web ErrorBoundary caught this)
    const ranked = Object.entries(sessionCounts ?? {})
      .filter(([, n]) => typeof n === 'number')
      .sort((a, b) => b[1] - a[1]);
    const topMaterial =
      ranked.length > 0 && ranked[0]?.[0] != null ? normalizeMaterialKey(ranked[0][0]) : 1;
    setTopMaterialName(TILE_TYPES?.[topMaterial]?.name ?? 'Glass');

    if (outcome === 'won') {
      // Save their score to AsyncStorage so it persists when they close the app !!
      const updated = await saveLevelResult(levelId, score, itemsCleaned);
      if (!screenActiveRef.current) return;
      setCumulativeEco(updated.totalEcoScore);

      // Pick an eco fact from their top material type
      setEcoFact(pickRandomEcoFact(topMaterial));

      // Check if they earned any new badges
      const earned = await checkAndAwardBadges(
        {
          materialCounts: sessionCounts,
          maxCombo: sessionMaxCombo,
        },
        updated
      );
      if (!screenActiveRef.current) return;
      setNewBadges(earned);

      // Animate the modal background from "polluted" to "clean" (the Impact Layer)
      cleanupAnim.setValue(0);
      Animated.timing(cleanupAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      }).start();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      // Still show an eco fact on loss — turns failure into a teaching moment
      setEcoFact(pickRandomEcoFact(topMaterial));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [levelId, score, itemsCleaned]);

  // ─── HAPTIC HELPERS ───

  // Escalating combo haptics — gets heavier with each chain step
  const triggerComboHaptic = async (chain) => {
    if (chain <= 1) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (chain === 2) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      // Chain 3+ = heavy impact (the player is on fire)
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  // Invalid swap = heavy "double-tap" haptic so the player knows it didn't work
  const triggerInvalidSwapHaptic = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 100);
  };

  // ─── TILE TAP HANDLER ───
  const handleTilePress = async (row, col) => {
    // Block all input during cascades, game over, tutorial, or the intro screen
    if (gameState !== 'playing' || isCascading.current || showTutorial || showIntro) return;
    if (!isBoardReady(grid)) return;

    // Any tap resets the hint timer (they're active, no need for hints right now)
    resetHintTimer();

    const tappedTile = { row, col };

    // First tap — just select the tile
    if (!selectedTile) {
      await Haptics.selectionAsync();
      setSelectedTile(tappedTile);
      return;
    }

    // Tapped the same tile again — deselect it
    if (selectedTile.row === row && selectedTile.col === col) {
      setSelectedTile(null);
      return;
    }

    // Check if the two tiles are next to each other (adjacent)
    if (GameEngine.isAdjacent(selectedTile, tappedTile)) {
      const swappedGrid = GameEngine.swapTiles(grid, selectedTile, tappedTile);

      if (GameEngine.checkForMatches(swappedGrid)) {
        // Valid swap that creates a match — do it and subtract a move
        setGrid(swappedGrid);
        setMovesLeft(prev => prev - 1);
      } else {
        // No match — heavy double-tap buzz
        await triggerInvalidSwapHaptic();
      }
      setSelectedTile(null);
    } else {
      // Not adjacent — just switch selection to the new tile
      await Haptics.selectionAsync();
      setSelectedTile(tappedTile);
    }
  };

  // ─── RETRY: reset everything for this level ───
  const handleRetry = () => {
    setGrid(generateRandomGrid());
    setScore(0);
    setMovesLeft(config.maxMoves);
    setItemsCleaned(0);
    setComboChain(0);
    setMaxCombo(0);
    setSelectedTile(null);
    setGameState('playing');
    setResultStars(0);
    setMaterialCounts({ 1: 0, 2: 0, 3: 0, 4: 0 });
    materialCountsRef.current = { 1: 0, 2: 0, 3: 0, 4: 0 };
    maxComboRef.current = 0;
    setEcoFact('');
    setNewBadges([]);
  };

  // Progress bar math — how close they are to the target (0-100%)
  const progressPercent = Math.min((score / config.targetScore) * 100, 100);

  // The EcoMeter now shows their LIFETIME total + current session score
  const displayEco = cumulativeEco + score;

  // Animated background color for the win modal (polluted → clean transition)
  const modalBg = cleanupAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [envTheme.pollutedColor, envTheme.cleanColor],
  });

  const mainBody = (
    <View style={Platform.OS === 'web' ? styles.webMainColumn : styles.nativeMainColumn}>
      <View style={styles.header}>
        <TouchableOpacity onPress={confirmLeaveLevel}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>

        {/* Shows WHICH environment you're cleaning — makes it obvious where you are */}
        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeIcon}>{envTheme.icon}</Text>
          <Text style={styles.levelBadgeText}>{config.label}</Text>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Eco-Score</Text>
          <Text style={styles.scoreValue}>{score.toString().padStart(4, '0')}</Text>
        </View>
      </View>

      {/* Moves remaining + target + combo indicator (if active) */}
      <View style={styles.statsRow}>
        <Text style={styles.statText}>Moves: {movesLeft}</Text>
        <Text style={styles.statText}>{config.targetScore} lb goal</Text>
        {comboChain > 1 && <Text style={styles.comboText}>Combo x{comboChain}!</Text>}
      </View>

      {/* Progress bar toward the level goal — fills up as they score */}
      <View style={styles.meterContainer}>
        <View style={styles.meterBackground}>
          <View style={[styles.meterFill, { width: `${progressPercent}%`, backgroundColor: envTheme.meterColor }]} />
        </View>
        <Text style={styles.meterText}>{score} / {config.targetScore} lb sorted</Text>
      </View>

      <View
        style={[
          styles.board,
          Platform.OS === 'web' && styles.boardWeb,
          { backgroundColor: envTheme.boardColor, width: boardSize, height: boardSize, alignSelf: 'center' },
        ]}
      >
        {isBoardReady(grid)
          ? grid.map((row, rowIndex) => (
          <View
            key={rowIndex}
            style={[
              Platform.OS === 'web' && webTilePx > 0 ? styles.boardRowWeb : styles.row,
              Platform.OS === 'web' && webTilePx > 0
                ? { height: webTilePx + 6, minHeight: webTilePx + 6 }
                : null,
            ]}
          >
            {row.map((tileId, colIndex) => {
              const tile =
                TILE_TYPES?.[normalizeMaterialKey(tileId)] ?? TILE_TYPES?.[1] ?? {
                  name: 'Glass',
                  color: '#66DE93',
                  icon: '🪟',
                };
              const isSelected = selectedTile?.row === rowIndex && selectedTile?.col === colIndex;
              const isHinted =
                Array.isArray(hintTiles) &&
                hintTiles.some(h => h && h.row === rowIndex && h.col === colIndex);

              return (
                <Pressable
                  key={colIndex}
                  delayPressIn={0}
                  onPress={() => handleTilePress(rowIndex, colIndex)}
                  style={({ pressed }) => [
                    styles.tilePlaceholder,
                    { backgroundColor: tile.image ? 'transparent' : tile.color },
                    isSelected && styles.tileSelected,
                    Platform.OS === 'web' &&
                      webTilePx > 0 && {
                        flex: 0,
                        width: webTilePx,
                        height: webTilePx,
                        minWidth: webTilePx,
                        minHeight: webTilePx,
                        position: 'relative',
                      },
                    Platform.OS === 'web' && { cursor: 'pointer' },
                    Platform.OS === 'web' && pressed && { opacity: 0.9 },
                  ]}
                >
                  {tile.image &&
                  (Platform.OS !== 'web' || webTileImageResolvable(tile.image)) ? (
                    Platform.OS === 'web' ? (
                      <RNImage
                        source={tile.image}
                        style={{
                          width: webTilePx,
                          height: webTilePx,
                          pointerEvents: 'none',
                        }}
                        resizeMode="cover"
                      />
                    ) : (
                      <ExpoImage
                        source={tile.image}
                        style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        recyclingKey={`tile-${tileId}`}
                      />
                    )
                  ) : (
                    <Text style={styles.tileIcon}>{tile.icon}</Text>
                  )}
                  {isHinted && <GlowTile />}
                </Pressable>
              );
            })}
          </View>
        ))
          : null}
      </View>

      <View style={[styles.footer, Platform.OS === 'web' && styles.footerWeb]}>
        <Text style={styles.ecoTotalLabel}>Cleaning: {envTheme.name}</Text>
        <Text style={styles.ecoTotalValue}>{displayEco} lb</Text>
        <Text style={styles.footerText}>Match materials to sort recyclables!</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: envTheme.screenBg },
        Platform.OS === 'web' && styles.containerWeb,
      ]}
    >
      {Platform.OS === 'web' ? (
        <View style={styles.webMainWrap}>
          <View style={styles.webScrollContent}>{mainBody}</View>
        </View>
      ) : (
        mainBody
      )}

      {/* ─── Level Intro "loading screen" ─── */}
      {/* This shows the mission objective + a random eco-tip BEFORE the game starts */}
      {/* When the player taps START MISSION, it disappears and they can play */}
      <LevelIntro
        key={`intro-${levelId}`}
        visible={showIntro}
        config={config}
        envTheme={envTheme}
        ecoTip={introTip}
        onStart={() => setShowIntro(false)}
      />

      {/* ─── First-time tutorial overlay (only shows once ever, tracked in AsyncStorage) ─── */}
      <TutorialOverlay
        visible={showTutorial}
        onFinish={() => setShowTutorial(false)}
      />

      {/* ─── End-of-level popup — only mount when needed (RN Web keeps invisible Modals in the DOM and can block the game) ─── */}
      {gameState !== 'playing' && (
      <Modal
        key={`results-${levelId}`}
        visible
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          {/* The card background animates from polluted → clean color on win */}
          <Animated.View style={[
            styles.modalCard,
            gameState === 'won' && { backgroundColor: modalBg },
          ]}>
            <ScrollView contentContainerStyle={styles.modalScroll} bounces={false}>
              <Text style={styles.modalTitle}>
                {gameState === 'won' ? 'Mission Complete!' : 'Out of Moves'}
              </Text>

              {/* Educational reward — shows what they "built" by completing the mission */}
              {/* Like "Community Garden Planted!" or "Solar Farm Online!" */}
              {gameState === 'won' && (
                <Text style={styles.modalEnvText}>{config.reward}</Text>
              )}

              {/* Star rating display — like Angry Birds / Candy Crush */}
              <Text style={styles.modalStars}>
                {gameState === 'won'
                  ? '★'.repeat(resultStars) + '☆'.repeat(3 - resultStars)
                  : '☆☆☆'}
              </Text>

              <Text style={styles.modalScore}>{score} lb sorted</Text>
              <Text style={styles.modalDetail}>{itemsCleaned} items recycled</Text>
              {maxCombo > 1 && (
                <Text style={styles.modalDetail}>Best combo: x{maxCombo}</Text>
              )}

              {/* Win: labeled eco fact showing which material they sorted most */}
              {gameState === 'won' && ecoFact !== '' && (
                <View style={styles.factCard}>
                  <Text style={styles.factTopMaterial}>You sorted the most {topMaterialName}!</Text>
                  <Text style={styles.factLabel}>{topMaterialName} Fact</Text>
                  <Text style={styles.factText}>{ecoFact}</Text>
                </View>
              )}

              {/* Loss: "Why This Matters" — turns failure into a learning moment */}
              {gameState === 'lost' && ecoFact !== '' && (
                <View style={styles.whyCard}>
                  <Text style={styles.whyLabel}>Why This Matters</Text>
                  <Text style={styles.whyEnv}>The {envTheme.name} still needs your help.</Text>
                  <Text style={styles.whyFact}>{ecoFact}</Text>
                  <Text style={styles.whyMotivate}>Try again — every match counts!</Text>
                </View>
              )}

              {/* New badges earned this round */}
              {newBadges.length > 0 && (
                <View style={styles.badgeSection}>
                  <Text style={styles.badgeTitle}>New Badge{newBadges.length > 1 ? 's' : ''} Earned!</Text>
                  {newBadges.map(badge => (
                    <View key={badge.id} style={styles.badgeRow}>
                      <Text style={styles.badgeIcon}>{badge.icon}</Text>
                      <View>
                        <Text style={styles.badgeName}>{badge.name}</Text>
                        <Text style={styles.badgeDesc}>{badge.description}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Two buttons: try again or go back to level select */}
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalBtn} onPress={handleRetry}>
                  <Text style={styles.modalBtnText}>RETRY</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnPrimary]}
                  onPress={() => {
                    // Never set gameState to 'playing' here while score >= target — the win effect
                    // would fire again (new eco fact, modal fight) before unmount. Pop Game off the stack.
                    if (navigation.canGoBack()) {
                      navigation.goBack();
                    } else {
                      navigation.navigate('LevelSelect');
                    }
                  }}
                >
                  <Text style={[styles.modalBtnText, styles.modalBtnPrimaryText]}>LEVELS</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
      )}
    </SafeAreaView>
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
  container: { flex: 1, backgroundColor: '#0F1923' },
  // Web: fill the viewport so ScrollView / intro overlay get a real height (avoids all-white screen)
  containerWeb: {
    flex: 1,
    minHeight: '100vh',
    width: '100%',
    alignSelf: 'stretch',
  },

  // Do not use minHeight: 0 here — on RN Web it lets this flex child collapse to 0 height (blank game).
  webMainWrap: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
  },
  webScrollContent: {
    flex: 1,
    paddingBottom: 24,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  // Web: keep the board from flex-shrinking when footer uses marginTop: 'auto'
  webMainColumn: { width: '100%', maxWidth: 560, alignSelf: 'center', flexShrink: 0 },
  nativeMainColumn: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  backButton: { fontSize: 18, fontFamily: 'Quicksand_700Bold', color: '#40C4FF', fontWeight: 'bold' },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2733',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  levelBadgeIcon: { fontSize: 14, fontFamily: 'Quicksand_400Regular' },
  levelBadgeText: { color: '#8BA4B8', fontSize: 12, fontFamily: 'Quicksand_400Regular', fontWeight: '700', textTransform: 'uppercase' },
  scoreContainer: { alignItems: 'flex-end' },
  scoreLabel: { fontSize: 12, fontFamily: 'Quicksand_400Regular', color: '#8BA4B8', textTransform: 'uppercase' },
  scoreValue: { fontSize: 28, fontFamily: 'Quicksand_700Bold', fontWeight: '900', color: '#FFD740' },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  statText: { color: '#8BA4B8', fontSize: 14, fontFamily: 'Quicksand_400Regular', fontWeight: '600' },
  comboText: { color: '#FFD740', fontSize: 16, fontFamily: 'Quicksand_700Bold', fontWeight: '900' },

  meterContainer: { paddingHorizontal: 20, marginBottom: 10 },
  meterBackground: { height: 14, backgroundColor: '#1A2733', borderRadius: 7, overflow: 'hidden' },
  meterFill: { height: '100%', backgroundColor: '#00E676' },
  meterText: { textAlign: 'center', fontSize: 12, fontFamily: 'Quicksand_700Bold', color: '#FFD740', marginTop: 5, fontWeight: 'bold' },

  board: {
    padding: 8,
    backgroundColor: '#1A2733',
    borderRadius: 16,
    marginVertical: 10,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  // Web: column stack + no shrink — avoids rows 2–6 collapsing to 0 height (flex:1 on rows fights fixed heights in CSS)
  boardWeb: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    flexShrink: 0,
    overflow: 'visible',
  },
  // Web-only row: do NOT use flex:1 (see styles.row) — that steals vertical space and collapses sibling rows
  boardRowWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    flexGrow: 0,
    flexShrink: 0,
  },
  row: { flex: 1, flexDirection: 'row' },
  tilePlaceholder: {
    flex: 1,
    margin: 3,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  tileIcon: { fontSize: 22, fontFamily: 'Quicksand_700Bold' },
  tileSelected: {
    borderColor: '#FFD740',
    borderWidth: 3,
    transform: [{ scale: 1.05 }],
  },

  footer: { padding: 20, alignItems: 'center', marginTop: 'auto' },
  footerWeb: { marginTop: 12 },
  ecoTotalLabel: { fontSize: 12, fontFamily: 'Quicksand_400Regular', color: '#8BA4B8', textTransform: 'uppercase', letterSpacing: 1 },
  ecoTotalValue: { fontSize: 32, fontFamily: 'Quicksand_700Bold', color: '#00E676', marginVertical: 4 },
  footerText: { fontSize: 14, fontFamily: 'Quicksand_400Regular', color: '#40C4FF', fontWeight: '600' },

  // The popup that appears when the level ends
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    maxHeight: '80%',
    backgroundColor: '#1A2733',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#00E676',
    overflow: 'hidden',
  },
  modalScroll: {
    padding: 28,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 26, fontFamily: 'Quicksand_700Bold', color: '#FFFFFF', marginBottom: 4 },
  modalEnvText: { fontSize: 14, fontFamily: 'Quicksand_400Regular', color: '#40C4FF', marginBottom: 8, fontWeight: '600' },
  modalStars: { fontSize: 40, fontFamily: 'Quicksand_700Bold', color: '#FFD740', marginBottom: 8 },
  modalScore: { fontSize: 20, fontFamily: 'Quicksand_700Bold', color: '#FFD740' },
  modalDetail: { fontSize: 14, fontFamily: 'Quicksand_400Regular', color: '#8BA4B8', marginBottom: 2 },

  // Eco fact card inside the win popup
  factCard: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 16,
    marginTop: 14,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#40C4FF',
  },
  factTopMaterial: { fontSize: 13, fontFamily: 'Quicksand_700Bold', color: '#00E676', marginBottom: 8 },
  factLabel: { fontSize: 12, fontFamily: 'Quicksand_700Bold', color: '#FFD740', marginBottom: 6, textTransform: 'uppercase' },
  factText: { fontSize: 14, fontFamily: 'Quicksand_400Regular', color: '#FFFFFF', lineHeight: 20 },

  // "Why This Matters" card on the loss popup — turns failure into a teaching moment
  whyCard: {
    backgroundColor: 'rgba(255,110,127,0.15)',
    borderRadius: 12,
    padding: 16,
    marginTop: 14,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#FF6E7F',
    alignItems: 'center',
  },
  whyLabel: { fontSize: 14, fontFamily: 'Quicksand_700Bold', color: '#FF6E7F', marginBottom: 6, textTransform: 'uppercase' },
  whyEnv: { fontSize: 15, fontFamily: 'Quicksand_400Regular', color: '#FFFFFF', fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  whyFact: { fontSize: 13, fontFamily: 'Quicksand_400Regular', color: '#8BA4B8', lineHeight: 19, textAlign: 'center', marginBottom: 10 },
  whyMotivate: { fontSize: 14, fontFamily: 'Quicksand_700Bold', color: '#00E676' },

  // Badge section in the win popup
  badgeSection: { marginTop: 14, width: '100%', alignItems: 'center' },
  badgeTitle: { fontSize: 16, fontFamily: 'Quicksand_700Bold', color: '#FFD740', marginBottom: 8 },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    width: '100%',
  },
  badgeIcon: { fontSize: 28, fontFamily: 'Quicksand_700Bold', marginRight: 12 },
  badgeName: { fontSize: 14, fontFamily: 'Quicksand_700Bold', color: '#FFFFFF' },
  badgeDesc: { fontSize: 12, fontFamily: 'Quicksand_400Regular', color: '#8BA4B8' },

  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 18 },
  modalBtn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#00E676',
  },
  modalBtnText: { color: '#00E676', fontSize: 16, fontFamily: 'Quicksand_700Bold' },
  modalBtnPrimary: { backgroundColor: '#00E676' },
  modalBtnPrimaryText: { color: '#0F1923' },
});
