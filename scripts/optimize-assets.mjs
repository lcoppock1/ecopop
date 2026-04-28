/**
 * One-shot: shrink tile PNGs for on-screen size (~70px cells @2x ≈ 140px; we use 192px).
 * Run: npm run optimize-assets  (requires devDependency sharp)
 */
import { rename, unlink } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '..', 'assets');

const TILES = [
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

const TILE_MAX = 192;

async function resizeInPlace(filename, maxSide) {
  const p = join(assetsDir, filename);
  const tmp = join(assetsDir, `${filename}.opt.tmp`);
  const meta = await sharp(p).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (w <= maxSide && h <= maxSide) {
    console.log('skip (already small enough)', filename, `${w}x${h}`);
    return;
  }
  await sharp(p)
    .resize(maxSide, maxSide, { fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(tmp);
  await unlink(p);
  await rename(tmp, p);
  console.log('optimized', filename);
}

async function main() {
  for (const f of TILES) {
    await resizeInPlace(f, TILE_MAX);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
