import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Check where the camera hole is and move the game down so it doesn't get blocked (youtube video)
import { SafeAreaView } from 'react-native-safe-area-context';

// This is the mock data and random grid logic
import { generateRandomGrid, TILE_TYPES } from '../gameData';

export default function GameScreen({ navigation }) {
    // Creating a "state" to hold grid of icons
    const [grid, setGrid] = useState([]);
  
    useEffect(() => {
      // When the screen opens, generate the random board
      setGrid(generateRandomGrid());
    }, []);
  
    return (
      <SafeAreaView style={styles.container}>
        {/*  Header Section  */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>⬅ Back</Text>
          </TouchableOpacity>
          
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Eco-Score</Text>
            <Text style={styles.scoreValue}>0000</Text>
          </View>
        </View>
        
        {/*  EcoMeter Section  */}
        <View style={styles.meterContainer}>
          <View style={styles.meterBackground}>
            {/* The width: '40%' is a placeholder for your progress logic */}
            <View style={[styles.meterFill, { width: '40%' }]} /> 
          </View>
          <Text style={styles.meterText}>EcoMeter: 40% Clean</Text>
        </View>

        {/*  The Game Board  */}
        <View style={styles.board}>
          {grid.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((tileId, colIndex) => (
                <View 
                  key={colIndex} 
                  style={[
                    styles.tilePlaceholder, 
                    { backgroundColor: TILE_TYPES[tileId]?.color }
                  ]}
                >
                  {/* For now just show the first letter */}
                  <Text style={styles.tileText}>
                    {TILE_TYPES[tileId]?.name[0]}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
  
        {/*  Footer Section   */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>RECYCLE COMBO</Text>
          </TouchableOpacity>
          <Text style={styles.footerText}>
            Match 3 recyclables to fill the EcoMeter!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: '#f0f4f7' 
    },
  
    header: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: 20 
    },
  
    backButton: { 
      fontSize: 18, 
      color: '#00796b', 
      fontWeight: 'bold' 
    },
  
    scoreContainer: { 
      alignItems: 'flex-end' 
    },
  
    scoreLabel: { 
      fontSize: 14, 
      color: '#666' 
    },
  
    scoreValue: { 
      fontSize: 28, 
      fontWeight: 'bold', 
      color: '#333' 
    },
  
    board: { 
      padding: 10, 
      backgroundColor: '#fff', 
      borderRadius: 10, 
      margin: 10,
      aspectRatio: 1 
    },
  
    row: { 
      flex: 1, 
      flexDirection: 'row' 
    },
  
    tilePlaceholder: { 
      flex: 1, 
      margin: 2, 
      borderRadius: 5,
      justifyContent: 'center',
      alignItems: 'center'
    },
  
    tileText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 18
    },
  
    footer: { 
      padding: 20, 
      alignItems: 'center' 
    },
  
    footerText: { 
      fontSize: 16, 
      color: '#4caf50', 
      textAlign: 'center', 
      fontWeight: '500' 
    },

    meterContainer: { 
        paddingHorizontal: 20, 
        marginBottom: 10 
      },
      meterBackground: { 
        height: 20, 
        backgroundColor: '#cfd8dc', 
        borderRadius: 10, 
        overflow: 'hidden' 
      },
      meterFill: { 
        height: '100%', 
        backgroundColor: '#4caf50' 
      },
      meterText: { 
        textAlign: 'center', 
        fontSize: 12, 
        color: '#00796b', 
        marginTop: 5, 
        fontWeight: 'bold' 
      },
      actionButton: { 
        backgroundColor: '#00796b', 
        paddingVertical: 12, 
        paddingHorizontal: 30, 
        borderRadius: 25,
        marginBottom: 10,
        elevation: 3
      },
      actionButtonText: { 
        color: 'white', 
        fontWeight: 'bold', 
        fontSize: 16 
      },
  });