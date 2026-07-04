import { readFileSync, writeFileSync } from 'fs';

const v = readFileSync('VERSION', 'utf-8').trim();
const [major, minor, patch] = v.split('.').map(Number);
const next = `${major}.${minor}.${patch + 1}`;
writeFileSync('VERSION', next + '\n');
console.log(`VERSION: ${v} -> ${next}`);