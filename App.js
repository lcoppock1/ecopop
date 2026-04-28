import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useFonts, Quicksand_400Regular, Quicksand_700Bold } from '@expo-google-fonts/quicksand';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
// I added this one line to help with the "safe area" on different phones
import { SafeAreaProvider } from 'react-native-safe-area-context';

// These are my four main pages
import GameScreen from './src/screens/GameScreen';
import HomeScreen from './src/screens/HomeScreen';
import LevelSelect from './src/screens/LevelSelect';
import SettingsScreen from './src/screens/SettingsScreen';
import ErrorBoundary from './src/ErrorBoundary';

//instance variable for navigation
const Stack = createStackNavigator();

/** Stack `component` prop (stable) + `key` remount per level — avoids render-prop quirks on web */
function GameRoute(props) {
  const lid = props.route.params?.levelId ?? 1;
  return <GameScreen {...props} key={`game-${lid}`} />;
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ Quicksand_400Regular, Quicksand_700Bold });

  // Creating a "state" variable to remember if this is the user's first time playing 
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);

  useEffect(() => {
    let cancelled = false;
    import('./src/prefetchAssets')
      .then((mod) => {
        if (!cancelled) return mod.prefetchGameTextures();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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

  const fontsReady = fontsLoaded || !!fontError;
  const bootReady = isFirstLaunch !== null && fontsReady;
  if (!bootReady) {
    return <View style={{ flex: 1, backgroundColor: '#0F1923', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#00E676" /></View>;
  }

  return (
    /* Wrapping everything in SafeAreaProvider so game doesn't hide behind the notch (youtube video) */
    <ErrorBoundary>
    <SafeAreaProvider
      style={
        Platform.OS === 'web'
          ? { flex: 1, minHeight: '100vh', width: '100%', alignSelf: 'stretch' }
          : undefined
      }
    >
      {/* the container that holds all navigation logic  */}
      <NavigationContainer
        theme={{
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            primary: '#00E676',
            background: '#0F1923',
            card: '#0F1923',
            text: '#FFFFFF',
            border: '#1A2733',
            notification: '#40C4FF',
          },
        }}
      >
        {/* hide the header so it looks cleaner  */}
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            // RN Web: stack cards need a real height + dark bg — default white card reads as "blank screen"
            cardStyle:
              Platform.OS === 'web'
                ? { flex: 1, minHeight: '100vh', width: '100%', backgroundColor: '#0F1923' }
                : { flex: 1 },
          }}
        >
          {/* Screens from user flow diagram + settings page */}
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="LevelSelect" component={LevelSelect} />
          <Stack.Screen name="Game" component={GameRoute} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
    </ErrorBoundary>
  );
}