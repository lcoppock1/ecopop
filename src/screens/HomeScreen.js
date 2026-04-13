import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen({ navigation }) {
  
  const handleStart = async () => {
    // 1. Trigger haptic feedback 
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // 2. Navigate to Level Select
    navigation.navigate('LevelSelect');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Title with the golden accent color to feel warm and inviting */}
        <Text style={styles.title}>EcoPop!</Text>
        <Text style={styles.subtitle}>
          Clean the world, one match at a time.
        </Text>
        
        {/* Big mint green PLAY button — the main call to action */}
        <TouchableOpacity style={styles.button} onPress={handleStart}>
          <Text style={styles.buttonText}>PLAY</Text>
        </TouchableOpacity>
      </View>

      {/* Footer text */}
      <Text style={styles.footerBrand}>Built for the City</Text>
    </View>
  );
}

// ─── "Clean Future" palette ───
// Base:    #0F1923 (deep navy)
// Surface: #1A2733 (slate)
// Primary: #00E676 (vivid mint)
// Accent:  #FFD740 (golden sun)
// Text:    #FFFFFF / #8BA4B8

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0F1923',
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  content: {
    alignItems: 'center',
    zIndex: 2,
  },

  title: { 
    fontSize: 56, 
    fontWeight: '900', 
    color: '#FFD740',
    letterSpacing: -1,
  },

  subtitle: { 
    fontSize: 18, 
    color: '#8BA4B8',
    marginBottom: 50, 
    textAlign: 'center', 
    paddingHorizontal: 40,
    lineHeight: 24,
  },

  button: { 
    backgroundColor: '#00E676',
    paddingVertical: 18, 
    paddingHorizontal: 80, 
    borderRadius: 30,
  },

  buttonText: { 
    color: '#0F1923',
    fontSize: 22, 
    fontWeight: 'bold',
    letterSpacing: 2,
  },

  footerBrand: {
    position: 'absolute',
    bottom: 40,
    fontSize: 12,
    color: '#8BA4B8',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '600',
  },
});
