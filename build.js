import { rmSync, cpSync, existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

// Clean dist directory
console.log('Cleaning dist directory...');
if (existsSync('dist')) {
  rmSync('dist', { recursive: true, force: true });
}

// Run the build
console.log('Running build...');
execSync('tsc && vite build', { stdio: 'inherit' });

// Copy icons to dist
console.log('Copying icons to dist...');
const iconsSource = 'icons';
const iconsDest = join('dist', 'icons');

if (existsSync(iconsSource)) {
  mkdirSync(iconsDest, { recursive: true });
  cpSync(iconsSource, iconsDest, { recursive: true });
  console.log('Icons copied successfully');
}

console.log('Build complete!');
