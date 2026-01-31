import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
// I added this one line to help with the "safe area" on different phones
import { SafeAreaProvider } from 'react-native-safe-area-context';

// These are the three main pages I planned out
import GameScreen from './src/screens/GameScreen';
import HomeScreen from './src/screens/HomeScreen';
import LevelSelect from './src/screens/LevelSelect';

//instance variable for navigation
const Stack = createStackNavigator();

export default function App() {
  // Creating a "state" variable to remember if this is the user's first time playing 
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);

  useEffect(() => {
    // This function runs right when the app starts up 
    const checkLaunchStatus = async () => {
      try {
        // Checking local "database" to see if value is already saved a 'true' aka returning user
        const value = await AsyncStorage.getItem('alreadyLaunched');
        
        if (value === null) {
          // If null, then its a new user s save (true) 
          await AsyncStorage.setItem('alreadyLaunched', 'true');
          setIsFirstLaunch(true);
        } else {
          // If found then they're returning
          setIsFirstLaunch(false);
        }
      } catch (e) {
        // If something breaks assume they aren't new so the app doesn't crash
        setIsFirstLaunch(false);
      }
    };
    
    checkLaunchStatus();
  }, []);

  // If the app is still checking the database, just show a blank screen ( add in logo later !!!)
  if (isFirstLaunch === null) return null;

  return (
    /* Wrapping everything in SafeAreaProvider so game doesn't hide behind the notch (youtube video) */
    <SafeAreaProvider>
      {/* the container that holds all navigation logic  */}
      <NavigationContainer>
        {/* hide the header so it looks cleaner  */}
        <Stack.Navigator 
          initialRouteName="Home"
          screenOptions={{ headerShown: false }}
        >
          {/* Screens from user flow diagram  */}
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="LevelSelect" component={LevelSelect} />
          <Stack.Screen name="Game" component={GameScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}