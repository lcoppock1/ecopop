import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LevelSelect({ navigation }) {
  // 5 levels for the project
  const levels = [1, 2, 3, 4, 5];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Select a Mission</Text>
      
      <View style={styles.cardContainer}>
        {levels.map((level) => (
          /* Actual game grid */
          <TouchableOpacity 
            key={level} 
            style={styles.levelCard} 
            onPress={() => navigation.navigate('Game', { levelId: level })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.levelTitle}>Mission {level}</Text>
              {/* Add in art/ai/icons later */}
              <Text style={styles.sproutIcons}>● ● ○</Text>
            </View>
            <Text style={styles.cardGoal}>Goal: Clean {level * 10} items!</Text>
            <View style={styles.playTag}>
              <Text style={styles.playTagText}>GO ➔</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
    container: { 
      flexGrow: 1, 
      backgroundColor: '#FFFFFF', // 
      alignItems: 'center', 
      paddingTop: 60,
      paddingBottom: 40
    },
  
    header: { 
      fontSize: 32, 
      fontWeight: '900', 
      color: '#000000', 
      marginBottom: 30,
      textTransform: 'uppercase',
      letterSpacing: 1
    },
  
    cardContainer: {
      width: '100%',
      alignItems: 'center'
    },
  
    levelCard: {
      width: '85%',
      backgroundColor: '#FFFFFF',
      borderRadius: 0, // corners
      padding: 20,
      marginVertical: 12,
      borderWidth: 2, // 
      borderColor: '#000000',
      // Change this later (conceptual colors)
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 0,
      shadowOffset: { width: 4, height: 4 },
      elevation: 0
    },
  
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10
    },
  
    levelTitle: { 
      fontSize: 22, 
      fontWeight: 'bold', 
      color: '#000000' 
    },
  
    sproutIcons: { 
      fontSize: 18,
      color: '#000000'
    },
  
    cardGoal: { 
      fontSize: 14, 
      color: '#000000',
      fontStyle: 'italic',
      opacity: 0.7
    },
  
    playTag: {
      alignSelf: 'flex-end',
      backgroundColor: '#000000', // Black button
      paddingHorizontal: 15,
      paddingVertical: 5,
      borderRadius: 0, 
      marginTop: 10
    },
  
    playTagText: {
      color: '#FFFFFF',  //
      fontWeight: 'bold',
      fontSize: 14,
      letterSpacing: 1
    }
  });