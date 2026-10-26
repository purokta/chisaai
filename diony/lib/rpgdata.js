/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// DATA GAME RPG — Dionysus (dunia isekai ala anime)

// Rank berdasarkan level (gaya Guild Petualang)
const RANKS = [
  { min: 1,   tier: 'F',   name: 'Novice Adventurer', color: '#9ca3af' },
  { min: 5,   tier: 'E',   name: 'Apprentice',        color: '#a3e635' },
  { min: 10,  tier: 'D',   name: 'Adventurer',        color: '#34d399' },
  { min: 20,  tier: 'C',   name: 'Veteran Knight',    color: '#38bdf8' },
  { min: 35,  tier: 'B',   name: 'Elite Slayer',      color: '#818cf8' },
  { min: 50,  tier: 'A',   name: 'Hero',              color: '#c084fc' },
  { min: 70,  tier: 'S',   name: 'Legendary Hero',    color: '#f472b6' },
  { min: 90,  tier: 'SS',  name: 'Calamity Slayer',   color: '#fb923c' },
  { min: 120, tier: 'SSS', name: 'Demon Lord Slayer', color: '#f87171' },
  { min: 150, tier: 'EX',  name: 'Mythic Sovereign',  color: '#fde047' },
]

// Class (hp/mp dasar + pertumbuhan per level, stat awal)
const CLASSES = {
  swordsman: { name: 'Swordsman', emoji: '⚔️', desc: 'Seimbang, serangan tebas kuat', hp: 120, mp: 30, hpg: 18, mpg: 3, str: 9, def: 7, agi: 6, int: 3, skill: 'Iaido Slash', mult: 2.3 },
  mage:      { name: 'Archmage',  emoji: '🔮', desc: 'Sihir besar, tubuh rapuh',     hp: 80,  mp: 90, hpg: 11, mpg: 9, str: 3, def: 3, agi: 5, int: 12, skill: 'Explosion Magic', mult: 2.8 },
  archer:    { name: 'Ranger',    emoji: '🏹', desc: 'Kritikal tinggi dari jauh',    hp: 95,  mp: 45, hpg: 13, mpg: 4, str: 7, def: 4, agi: 11, int: 5, skill: 'Piercing Arrow', mult: 2.4 },
  assassin:  { name: 'Shadow Assassin', emoji: '🗡️', desc: 'Cepat, kritikal mematikan', hp: 90, mp: 40, hpg: 12, mpg: 4, str: 8, def: 3, agi: 13, int: 4, skill: 'Shadow Execution', mult: 2.6 },
  priest:    { name: 'Holy Priest', emoji: '✨', desc: 'Menyembuhkan diri saat bertarung', hp: 100, mp: 70, hpg: 14, mpg: 7, str: 4, def: 6, agi: 5, int: 10, skill: 'Divine Light', mult: 2.0 },
  berserker: { name: 'Berserker', emoji: '🪓', desc: 'HP raksasa, nekat menyerang',  hp: 150, mp: 20, hpg: 22, mpg: 2, str: 12, def: 5, agi: 4, int: 2, skill: 'Rage Smash', mult: 2.5 },
}

// Zona berburu / dungeon (min level) + monster
const ZONES = [
  { id: 'forest',  name: 'Hutan Pemula',     emoji: '🌲', min: 1,  mobs: [
      { n: 'Slime', e: '🟢', hp: 30, atk: 6, def: 1, exp: 14, gold: 12, drop: 'slime_gel' },
      { n: 'Horned Rabbit', e: '🐇', hp: 36, atk: 8, def: 2, exp: 18, gold: 15, drop: 'rabbit_horn' },
      { n: 'Goblin Scout', e: '👺', hp: 48, atk: 10, def: 3, exp: 24, gold: 20, drop: 'goblin_ear' } ],
    boss: { n: 'Goblin King', e: '👑', hp: 260, atk: 22, def: 8, exp: 160, gold: 220, drop: 'goblin_crown' } },
  { id: 'cave',    name: 'Gua Kristal',      emoji: '🕳️', min: 8,  mobs: [
      { n: 'Giant Bat', e: '🦇', hp: 90, atk: 17, def: 6, exp: 40, gold: 34, drop: 'bat_wing' },
      { n: 'Stone Golem', e: '🗿', hp: 160, atk: 20, def: 14, exp: 62, gold: 50, drop: 'iron_ore' },
      { n: 'Crystal Spider', e: '🕷️', hp: 120, atk: 24, def: 9, exp: 56, gold: 46, drop: 'crystal' } ],
    boss: { n: 'Crystal Queen', e: '💎', hp: 700, atk: 40, def: 18, exp: 420, gold: 560, drop: 'crystal' } },
  { id: 'fortress',name: 'Benteng Orc',      emoji: '🏰', min: 18, mobs: [
      { n: 'Orc Warrior', e: '👹', hp: 260, atk: 34, def: 15, exp: 100, gold: 85, drop: 'orc_tusk' },
      { n: 'Dark Elf', e: '🧝', hp: 220, atk: 42, def: 12, exp: 118, gold: 100, drop: 'dark_essence' },
      { n: 'Ogre', e: '🧌', hp: 420, atk: 38, def: 22, exp: 140, gold: 120, drop: 'iron_ore' } ],
    boss: { n: 'Orc Warlord', e: '🪓', hp: 1500, atk: 66, def: 30, exp: 900, gold: 1100, drop: 'warlord_axe_shard' } },
  { id: 'frost',   name: 'Puncak Beku',      emoji: '🏔️', min: 30, mobs: [
      { n: 'Frost Wolf', e: '🐺', hp: 480, atk: 58, def: 24, exp: 210, gold: 170, drop: 'frost_fang' },
      { n: 'Ice Maiden', e: '❄️', hp: 420, atk: 70, def: 20, exp: 240, gold: 195, drop: 'ice_core' },
      { n: 'Yeti', e: '🦍', hp: 720, atk: 62, def: 34, exp: 270, gold: 220, drop: 'frost_fang' } ],
    boss: { n: 'Frost Dragon', e: '🐲', hp: 3400, atk: 105, def: 48, exp: 2000, gold: 2400, drop: 'dragon_scale' } },
  { id: 'dragon',  name: 'Sarang Naga',      emoji: '🌋', min: 45, mobs: [
      { n: 'Wyvern', e: '🦎', hp: 900, atk: 98, def: 42, exp: 400, gold: 320, drop: 'dragon_scale' },
      { n: 'Fire Drake', e: '🔥', hp: 1100, atk: 112, def: 46, exp: 470, gold: 380, drop: 'fire_core' },
      { n: 'Lava Golem', e: '🌋', hp: 1600, atk: 100, def: 62, exp: 520, gold: 420, drop: 'fire_core' } ],
    boss: { n: 'Ancient Dragon', e: '🐉', hp: 7500, atk: 165, def: 75, exp: 4500, gold: 5200, drop: 'dragon_heart' } },
  { id: 'demon',   name: 'Kastil Raja Iblis',emoji: '🏯', min: 65, mobs: [
      { n: 'Succubus', e: '😈', hp: 1700, atk: 160, def: 66, exp: 800, gold: 640, drop: 'dark_essence' },
      { n: 'Death Knight', e: '💀', hp: 2400, atk: 175, def: 85, exp: 950, gold: 760, drop: 'dark_essence' },
      { n: 'Archdemon', e: '👿', hp: 3000, atk: 190, def: 90, exp: 1100, gold: 880, drop: 'demon_core' } ],
    boss: { n: 'Demon Lord', e: '🩸', hp: 16000, atk: 260, def: 120, exp: 9500, gold: 11000, drop: 'demon_core' } },
  { id: 'abyss',   name: 'Jurang Abyss',     emoji: '🌌', min: 90, mobs: [
      { n: 'Void Reaper', e: '☠️', hp: 4200, atk: 260, def: 110, exp: 1800, gold: 1500, drop: 'void_shard' },
      { n: 'Eldritch Eye', e: '👁️', hp: 5000, atk: 280, def: 120, exp: 2100, gold: 1700, drop: 'void_shard' },
      { n: 'Abyss Walker', e: '🌑', hp: 6000, atk: 300, def: 135, exp: 2400, gold: 1900, drop: 'void_shard' } ],
    boss: { n: 'God of Destruction', e: '🌠', hp: 40000, atk: 420, def: 180, exp: 24000, gold: 28000, drop: 'void_shard' } },
]

// Item. type: potion | mat | weapon | armor | acc
const ITEMS = {
  hp_potion:   { n: 'HP Potion',        e: '🧪', type: 'potion', heal: 80,  price: 60 },
  hp_potion2:  { n: 'High HP Potion',   e: '🧴', type: 'potion', heal: 300, price: 220 },
  hp_potion3:  { n: 'Elixir of Life',   e: '💖', type: 'potion', heal: 1500,price: 1200 },
  mp_potion:   { n: 'MP Potion',        e: '💧', type: 'potion', mp: 60,    price: 70 },
  mp_potion2:  { n: 'High MP Potion',   e: '🔷', type: 'potion', mp: 250,   price: 260 },
  // bahan
  slime_gel:   { n: 'Slime Gel', e: '🟢', type: 'mat', price: 6 },  rabbit_horn: { n: 'Rabbit Horn', e: '🦴', type: 'mat', price: 8 },
  goblin_ear:  { n: 'Goblin Ear', e: '👂', type: 'mat', price: 10 }, goblin_crown: { n: 'Goblin Crown', e: '👑', type: 'mat', price: 150 },
  bat_wing:    { n: 'Bat Wing', e: '🦇', type: 'mat', price: 22 },  iron_ore: { n: 'Iron Ore', e: '⛏️', type: 'mat', price: 30 },
  crystal:     { n: 'Crystal', e: '💎', type: 'mat', price: 60 },   orc_tusk: { n: 'Orc Tusk', e: '🦷', type: 'mat', price: 55 },
  warlord_axe_shard: { n: 'Warlord Axe Shard', e: '🪓', type: 'mat', price: 300 },
  dark_essence:{ n: 'Dark Essence', e: '🌑', type: 'mat', price: 110 }, frost_fang: { n: 'Frost Fang', e: '🧊', type: 'mat', price: 140 },
  ice_core:    { n: 'Ice Core', e: '❄️', type: 'mat', price: 170 },  dragon_scale: { n: 'Dragon Scale', e: '🐉', type: 'mat', price: 420 },
  fire_core:   { n: 'Fire Core', e: '🔥', type: 'mat', price: 380 }, dragon_heart: { n: 'Dragon Heart', e: '❤️‍🔥', type: 'mat', price: 1800 },
  demon_core:  { n: 'Demon Core', e: '🔮', type: 'mat', price: 1500 }, void_shard: { n: 'Void Shard', e: '🌌', type: 'mat', price: 3000 },
  wood:        { n: 'Kayu', e: '🪵', type: 'mat', price: 8 },       fish: { n: 'Ikan', e: '🐟', type: 'mat', price: 14 },
  rare_fish:   { n: 'Ikan Langka', e: '🐠', type: 'mat', price: 120 }, herb: { n: 'Herba', e: '🌿', type: 'mat', price: 18 },
  gold_ore:    { n: 'Gold Ore', e: '🟡', type: 'mat', price: 90 },   mythril: { n: 'Mythril', e: '🔹', type: 'mat', price: 400 },
  summon_ticket:{ n: 'Summon Ticket', e: '🎟️', type: 'ticket', price: 800 },
  // senjata
  wood_sword:  { n: 'Wooden Sword',   e: '🗡️', type: 'weapon', atk: 6,   price: 120 },
  iron_sword:  { n: 'Iron Sword',     e: '⚔️', type: 'weapon', atk: 20,  price: 700 },
  steel_blade: { n: 'Steel Blade',    e: '🔪', type: 'weapon', atk: 48,  price: 2600 },
  frost_edge:  { n: 'Frostbite Edge', e: '🧊', type: 'weapon', atk: 90,  price: 0 },
  dragon_slayer:{ n: 'Dragon Slayer', e: '🐉', type: 'weapon', atk: 170, price: 0 },
  demon_blade: { n: 'Demon Blade',    e: '😈', type: 'weapon', atk: 300, price: 0 },
  excalibur:   { n: 'Excalibur',      e: '🌟', type: 'weapon', atk: 520, price: 0 },
  // armor
  cloth_armor: { n: 'Cloth Armor',    e: '👕', type: 'armor', def: 5,   hp: 20,  price: 100 },
  iron_armor:  { n: 'Iron Armor',     e: '🛡️', type: 'armor', def: 16,  hp: 80,  price: 750 },
  knight_armor:{ n: 'Knight Armor',   e: '🪖', type: 'armor', def: 38,  hp: 250, price: 2800 },
  dragon_armor:{ n: 'Dragon Scale Armor', e: '🐲', type: 'armor', def: 85, hp: 700, price: 0 },
  demon_armor: { n: 'Demon Plate',    e: '👹', type: 'armor', def: 150, hp: 1500,price: 0 },
  // aksesori
  lucky_ring:  { n: 'Lucky Ring',     e: '💍', type: 'acc', luck: 10, price: 1500 },
  power_amulet:{ n: 'Power Amulet',   e: '📿', type: 'acc', atk: 25, price: 2200 },
  hero_cape:   { n: 'Hero Cape',      e: '🧣', type: 'acc', def: 20, hp: 300, price: 0 },
}

// Resep craft: hasil -> bahan
const RECIPES = {
  iron_sword:   { gold: 150, mats: { iron_ore: 6, wood: 4 } },
  steel_blade:  { gold: 600, mats: { iron_ore: 15, crystal: 4, orc_tusk: 4 } },
  frost_edge:   { gold: 1800, mats: { frost_fang: 8, ice_core: 5, steel_blade: 1 } },
  dragon_slayer:{ gold: 5000, mats: { dragon_scale: 8, fire_core: 4, frost_edge: 1 } },
  demon_blade:  { gold: 14000, mats: { demon_core: 5, dark_essence: 12, dragon_slayer: 1 } },
  excalibur:    { gold: 60000, mats: { void_shard: 10, mythril: 15, dragon_heart: 3, demon_blade: 1 } },
  iron_armor:   { gold: 120, mats: { iron_ore: 8, slime_gel: 6 } },
  knight_armor: { gold: 700, mats: { iron_ore: 18, crystal: 5, goblin_crown: 1 } },
  dragon_armor: { gold: 6000, mats: { dragon_scale: 12, fire_core: 3, knight_armor: 1 } },
  demon_armor:  { gold: 18000, mats: { demon_core: 6, dark_essence: 15, dragon_armor: 1 } },
  hp_potion2:   { gold: 40, mats: { hp_potion: 3, herb: 2 } },
  hp_potion3:   { gold: 300, mats: { hp_potion2: 4, dragon_heart: 1 } },
  mp_potion2:   { gold: 50, mats: { mp_potion: 3, crystal: 1 } },
  power_amulet: { gold: 800, mats: { gold_ore: 6, crystal: 3 } },
  hero_cape:    { gold: 9000, mats: { mythril: 6, dragon_scale: 5, dark_essence: 8 } },
}

// Companion gacha (karakter anime orisinal)
const RARITY = {
  N:   { rate: 50,  color: '#9ca3af', star: '★',     bonus: 1 },
  R:   { rate: 30,  color: '#38bdf8', star: '★★',    bonus: 2 },
  SR:  { rate: 14,  color: '#c084fc', star: '★★★',   bonus: 4 },
  SSR: { rate: 5,   color: '#fbbf24', star: '★★★★',  bonus: 8 },
  UR:  { rate: 1,   color: '#f472b6', star: '★★★★★', bonus: 16 },
}
const COMPANIONS = [
  { id: 'neko_maid',   n: 'Neko Maid Mimi',       e: '🐱', r: 'N',   perk: 'gold' },
  { id: 'slime_girl',  n: 'Slime Girl Puru',      e: '🟢', r: 'N',   perk: 'hp' },
  { id: 'fox_miko',    n: 'Fox Miko Tamaki',      e: '🦊', r: 'R',   perk: 'exp' },
  { id: 'elf_archer',  n: 'Elf Archer Lyra',      e: '🧝', r: 'R',   perk: 'atk' },
  { id: 'oni_girl',    n: 'Oni Princess Shuki',   e: '👹', r: 'R',   perk: 'def' },
  { id: 'valkyrie',    n: 'Valkyrie Brunhild',    e: '🪽', r: 'SR',  perk: 'atk' },
  { id: 'lich_witch',  n: 'Lich Witch Veyra',     e: '💀', r: 'SR',  perk: 'exp' },
  { id: 'dragon_loli', n: 'Dragon Girl Ignis',    e: '🐲', r: 'SR',  perk: 'hp' },
  { id: 'angel_seraph',n: 'Seraph Celestia',      e: '👼', r: 'SSR', perk: 'def' },
  { id: 'demon_queen', n: 'Demon Queen Lilith',   e: '😈', r: 'SSR', perk: 'atk' },
  { id: 'moon_goddess',n: 'Moon Goddess Selene',  e: '🌙', r: 'SSR', perk: 'exp' },
  { id: 'time_witch',  n: 'Chrono Witch Kurumi',  e: '⏳', r: 'UR',  perk: 'exp' },
  { id: 'void_empress',n: 'Void Empress Nyx',     e: '🌌', r: 'UR',  perk: 'atk' },
]

// Job /work ala guild
const JOBS = [
  'mengantar surat untuk Guild', 'membasmi tikus di gudang bar', 'menjaga gerbang kota', 'mengawal pedagang keliling',
  'memasak di kedai Maid Cafe', 'mengumpulkan herba untuk apoteker', 'membersihkan dungeon level 1', 'jadi model patung pahlawan',
]

// Event explore
const EVENTS = [
  { t: 'treasure', msg: '📦 Kamu menemukan peti harta karun tersembunyi!' },
  { t: 'spring',   msg: '⛲ Mata air suci memulihkan tubuhmu!' },
  { t: 'trap',     msg: '🪤 Kamu terjebak perangkap kuno!' },
  { t: 'merchant', msg: '🧙 Pedagang misterius memberimu hadiah karena kamu baik hati.' },
  { t: 'herb',     msg: '🌿 Kamu menemukan tanaman herba langka.' },
  { t: 'ambush',   msg: '⚔️ Bandit menyergapmu! Kamu menang tipis dan merampas dompetnya.' },
]

// Template quest harian
const QUESTS = [
  { id: 'hunt',  txt: 'Kalahkan %n monster',      type: 'kill',  min: 3,  max: 8,  g: 120, x: 80 },
  { id: 'mine',  txt: 'Menambang %n kali',        type: 'mine',  min: 2,  max: 5,  g: 100, x: 60 },
  { id: 'fish',  txt: 'Memancing %n kali',        type: 'fish',  min: 2,  max: 5,  g: 90,  x: 55 },
  { id: 'dung',  txt: 'Selesaikan %n lantai dungeon', type: 'floor', min: 2, max: 5, g: 160, x: 120 },
  { id: 'duel',  txt: 'Menangkan %n duel',        type: 'duel',  min: 1,  max: 3,  g: 200, x: 150 },
  { id: 'gacha', txt: 'Summon companion %n kali', type: 'gacha', min: 1,  max: 2,  g: 150, x: 90 },
]

// ── ITEM TAMBAHAN: hasil kebun (rpgfarm) & hadiah raid/party ──
Object.assign(ITEMS, {
  wheat:          { n: 'Gandum',        e: '🌾', type: 'mat', price: 10 },
  carrot:         { n: 'Wortel',        e: '🥕', type: 'mat', price: 28 },
  pumpkin:        { n: 'Labu Emas',     e: '🎃', type: 'mat', price: 90 },
  magic_mushroom: { n: 'Jamur Sihir',   e: '🍄', type: 'mat', price: 260 },
  moon_flower:    { n: 'Bunga Bulan',   e: '🌸', type: 'mat', price: 750 },
  golden_apple:   { n: 'Apel Emas',     e: '🍎', type: 'mat', price: 3600 },
  raid_trophy:    { n: 'Trofi Raid',    e: '🏆', type: 'mat', price: 2500 },
})

module.exports = { RANKS, CLASSES, ZONES, ITEMS, RECIPES, RARITY, COMPANIONS, JOBS, EVENTS, QUESTS }
