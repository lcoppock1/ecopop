import { Platform } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { registerRootComponent } from 'expo';

import App from './App';

// RN Web: native screen containers often render a blank white card; disabling fixes many Expo web apps
if (Platform.OS === 'web') {
  enableScreens(false);
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
