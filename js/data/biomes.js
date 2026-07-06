// Biome tiles for "Плато ветров" (Wind Plateau).
export const BIOME_TILES = {
  grass:  { type: 'grass', walkable: true,  collision: false, sprite: '', color: '#4a7c59' },
  rock:   { type: 'rock',  walkable: false, collision: true,  sprite: '🪨', color: '#6b6b6b' },
  water:  { type: 'water', walkable: false, collision: true,  sprite: '🌊', color: '#3a5f8a' },
  road:   { type: 'road',  walkable: true,  collision: false, sprite: '', color: '#8b7d5e' },
};

export const BIOMES = {
  wind_plateau: {
    id: 'wind_plateau',
    nameEn: 'Wind Plateau',
    nameRu: 'Плато ветров',
    descEn: 'A vast open plateau where the wind howls through ancient ruins.',
    descRu: 'Огромное открытое плато, где ветер воет среди древних руин.',
    tiles: ['grass', 'rock', 'water', 'road'],
  },
};
