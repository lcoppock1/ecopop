import { Asset } from 'expo-asset';
import { ENVIRONMENT_THEMES, TILE_TYPES } from './gameData';

/** All gameplay / level-select textures — load once at boot so web decode isn’t mid-demo */
export function prefetchGameTextures() {
  const modules = [
    ...Object.values(TILE_TYPES).map(t => t.image),
    ...Object.values(ENVIRONMENT_THEMES).map(e => e.image),
    require('../assets/logo.png'),
  ];
  const unique = [...new Set(modules)];
  return Asset.loadAsync(unique);
}
