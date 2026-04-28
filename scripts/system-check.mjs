/**
 * Lightweight checks that don't need Metro/Jest — run: npm test
 */
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const TILE_ASSETS = [
  'glass-tile.png',
  'plastic-tile.png',
  'paper-tile.png',
  'metal-tile.png',
  'neighborhood-tile.png',
  'park-tile.png',
  'river-tile.png',
  'ocean-tile.png',
  'global-tile.png',
];

const OTHER_ASSETS = ['logo.png'];

function fail(msg) {
  console.error('[system-check]', msg);
  process.exit(1);
}

for (const name of [...TILE_ASSETS, ...OTHER_ASSETS]) {
  const p = join(root, 'assets', name);
  if (!existsSync(p)) fail(`missing asset: ${name}`);
}

const gameDataPath = join(root, 'src', 'gameData.js');
if (!existsSync(gameDataPath)) fail('missing src/gameData.js');
const gd = readFileSync(gameDataPath, 'utf8');
for (const name of TILE_ASSETS) {
  if (!gd.includes(name)) fail(`gameData.js does not reference ${name}`);
}

const homePath = join(root, 'src', 'screens', 'HomeScreen.js');
if (!existsSync(homePath)) fail('missing HomeScreen.js');
const home = readFileSync(homePath, 'utf8');
if (!home.includes('logo.png')) fail('HomeScreen.js does not reference logo.png');

console.log(
  '[system-check] OK —',
  TILE_ASSETS.length,
  'tiles + logo on disk; gameData + HomeScreen references look sane'
);
