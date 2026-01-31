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
        <Text style={styles.title}>EcoPop!</Text>
        <Text style={styles.subtitle}>
          Clean the world, one match at a time.
        </Text>
        
        <TouchableOpacity style={styles.button} onPress={handleStart}>
          <Text style={styles.buttonText}>PLAY</Text>
        </TouchableOpacity>
      </View>

      {/* Footer text */}
      <Text style={styles.footerBrand}>Built for the City</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF', //
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
    color: '#000000', 
    letterSpacing: -1
  },

  subtitle: { 
    fontSize: 18, 
    color: '#000000', 
    marginBottom: 50, 
    textAlign: 'center', 
    paddingHorizontal: 40,
    lineHeight: 24,
    opacity: 0.8 
  },

  button: { 
    backgroundColor: '#000000', 
    paddingVertical: 18, 
    paddingHorizontal: 80, 
    borderRadius: 0, 
    borderWidth: 1,
    borderColor: '#000000'
  },

  buttonText: { 
    color: '#FFFFFF', 
    fontSize: 22, 
    letterSpacing: 2
  },

  footerBrand: {
    position: 'absolute',
    bottom: 40,
    fontSize: 12,
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '600'
  }
});