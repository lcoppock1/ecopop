import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TILE_TYPES, generateRandomGrid } from '../gameData';
import GameEngine from '../logic/GameEngine';

export default function GameScreen({ navigation }) {
    const [grid, setGrid] = useState([]);
    const [selectedTile, setSelectedTile] = useState(null);
    const [score, setScore] = useState(0);
    const [ecoProgress, setEcoProgress] = useState(0);

    useEffect(() => {
      setGrid(generateRandomGrid());
    }, []);

    // Passive Scan: Automatically clear matches (cascades)
    useEffect(() => {
      if (grid.length > 0 && GameEngine.checkForMatches(grid)) {
        const timer = setTimeout(() => {
          const matches = GameEngine.findAllMatches(grid);
          const pointsEarned = matches.length * 10;
          
          const processedGrid = GameEngine.processMatches(grid);
          setGrid(processedGrid);

          setScore(prev => prev + pointsEarned);
          setEcoProgress(prev => Math.min(prev + (matches.length * 2), 100));

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 600);

        return () => clearTimeout(timer);
      }
    }, [grid]);

    const handleTilePress = async (row, col) => {
      const tappedTile = { row, col };

      if (!selectedTile) {
        await Haptics.selectionAsync();
        setSelectedTile(tappedTile);
        return;
      }

      if (selectedTile.row === row && selectedTile.col === col) {
        setSelectedTile(null);
        return;
      }

      if (GameEngine.isAdjacent(selectedTile, tappedTile)) {
        const swappedGrid = GameEngine.swapTiles(grid, selectedTile, tappedTile);

        if (GameEngine.checkForMatches(swappedGrid)) {
          setGrid(swappedGrid);
          // The passive useEffect will handle the clearing/scoring
        } else {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        setSelectedTile(null);
      } else {
        await Haptics.selectionAsync();
        setSelectedTile(tappedTile);
      }
    };
  
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>⬅ Back</Text>
          </TouchableOpacity>
          
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Eco-Score</Text>
            <Text style={styles.scoreValue}>{score.toString().padStart(4, '0')}</Text>
          </View>
        </View>
        
        <View style={styles.meterContainer}>
          <View style={styles.meterBackground}>
            <View style={[styles.meterFill, { width: `${ecoProgress}%` }]} /> 
          </View>
          <Text style={styles.meterText}>EcoMeter: {ecoProgress}% Cleaned</Text>
        </View>

        <View style={styles.board}>
          {grid.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((tileId, colIndex) => {
                const isSelected = selectedTile?.row === rowIndex && selectedTile?.col === colIndex;
                return (
                  <TouchableOpacity 
                    key={colIndex} 
                    onPress={() => handleTilePress(rowIndex, colIndex)}
                    style={[
                      styles.tilePlaceholder, 
                      { backgroundColor: TILE_TYPES[tileId]?.color },
                      isSelected && styles.tileSelected 
                    ]}
                  >
                    {/* <Text style={styles.tileText}>{TILE_TYPES[tileId]?.name[0]}</Text> */}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
  
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={async () => await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
          >
            <Text style={styles.actionButtonText}>RECYCLE COMBO</Text>
          </TouchableOpacity>
          <Text style={styles.footerText}>Tap a material to begin sorting!</Text>
        </View>
      </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  // 60% - Deep Dark Green
  container: { 
    flex: 1, 
    backgroundColor: '#0B1A12' 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20 
  },
  backButton: { 
    fontSize: 18, 
    color: '#1DB954', 
    fontWeight: 'bold' 
  },
  scoreContainer: { 
    alignItems: 'flex-end' 
  },
  scoreLabel: { 
    fontSize: 12, 
    color: '#4CAF50',
    textTransform: 'uppercase'
  },
  scoreValue: { 
    fontSize: 28, 
    fontWeight: '900', 
    color: '#CCFF00' // Neon Accent
  },
  board: { 
    padding: 8, 
    backgroundColor: '#12261B', 
    borderRadius: 15, 
    margin: 15,
    aspectRatio: 1,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  row: { flex: 1, flexDirection: 'row' },
  tilePlaceholder: { 
    flex: 1, 
    margin: 3, 
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  tileSelected: {
    borderColor: '#CCFF00', // Neon Glow
    borderWidth: 4,
    transform: [{ scale: 1.05 }]
  },
  tileText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowRadius: 4
  },
  footer: { 
    padding: 20, 
    alignItems: 'center',
    marginTop: 'auto'
  },
  footerText: { 
    fontSize: 14, 
    color: '#1DB954', 
    fontWeight: '600' 
  },
  meterContainer: { paddingHorizontal: 20, marginBottom: 10 },
  meterBackground: { 
    height: 14, 
    backgroundColor: '#1A3326', 
    borderRadius: 7, 
    overflow: 'hidden' 
  },
  meterFill: { 
    height: '100%', 
    backgroundColor: '#1DB954' // Spotify Green
  },
  meterText: { 
    textAlign: 'center', 
    fontSize: 12, 
    color: '#CCFF00', 
    marginTop: 5, 
    fontWeight: 'bold' 
  },
  actionButton: { 
    backgroundColor: '#1DB954', 
    paddingVertical: 15, 
    paddingHorizontal: 40, 
    borderRadius: 30,
    marginBottom: 15,
  },
  actionButtonText: { 
    color: '#0B1A12', 
    fontWeight: 'bold', 
    fontSize: 18,
    letterSpacing: 1
  },
});