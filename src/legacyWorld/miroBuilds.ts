export const MIRO_BUILDS=[
  {
    "id": "scout",
    "name": "Scout X1",
    "rarity": "common",
    "description": "Компактный разведчик в стальном корпусе.",
    "items": [
      "skin-vector",
      "acc-none",
      "paint-steel",
      "visor-none",
      "optics-cyan",
      "armor-none",
      "trim-default"
    ]
  },
  {
    "id": "ranger",
    "name": "Ranger R7",
    "rarity": "common",
    "description": "Лесной разведчик с защитными панелями.",
    "items": [
      "skin-vector",
      "acc-beacon",
      "paint-forest",
      "visor-none",
      "optics-green",
      "armor-ranger",
      "trim-black"
    ]
  },
  {
    "id": "engineer",
    "name": "Titan T8",
    "rarity": "rare",
    "description": "Инженер с медными панелями и инструментальным блоком.",
    "items": [
      "skin-titan",
      "acc-toolkit",
      "paint-graphite",
      "visor-pilot",
      "optics-amber",
      "armor-tech",
      "trim-orange"
    ]
  },
  {
    "id": "arctic",
    "name": "Polar V9",
    "rarity": "rare",
    "description": "Снежный разведчик с двойным сенсором и радаром.",
    "items": [
      "skin-vector",
      "acc-radar",
      "paint-white",
      "visor-hex",
      "optics-dual",
      "armor-shoulder",
      "trim-cyan"
    ]
  },
  {
    "id": "nebula",
    "name": "Nebula A12",
    "rarity": "epic",
    "description": "Космический мех с турбоблоком и тройной оптикой.",
    "items": [
      "skin-atlas",
      "acc-jet",
      "paint-navy",
      "visor-scanner",
      "optics-tri",
      "armor-tech",
      "trim-cyan"
    ]
  },
  {
    "id": "phantom",
    "name": "Phantom S9",
    "rarity": "epic",
    "description": "Чёрный корпус, стелс-маска и усиленные панели.",
    "items": [
      "skin-sentinel",
      "acc-radar",
      "paint-black",
      "visor-stealth",
      "optics-red",
      "armor-heavy",
      "trim-steel"
    ]
  },
  {
    "id": "aurum",
    "name": "Aurum Prime",
    "rarity": "legendary",
    "description": "Золотые вставки, нагрудный щит и тройной сенсор.",
    "items": [
      "skin-sentinel",
      "acc-jet",
      "paint-graphite",
      "visor-hex",
      "optics-tri",
      "armor-shield",
      "trim-gold"
    ]
  },
  {
    "id": "nova",
    "name": "Nova Omega",
    "rarity": "legendary",
    "description": "Серебристый тяжёлый мех с усиленной бронёй.",
    "items": [
      "skin-atlas",
      "acc-jet",
      "paint-silver",
      "visor-scanner",
      "optics-dual",
      "armor-heavy",
      "trim-gold"
    ]
  }
] as const;
export type MiroBuild=typeof MIRO_BUILDS[number];
export const RARITIES={common:{label:'Обычный',color:'#a8c8dd'},rare:{label:'Редкий',color:'#69c6ff'},epic:{label:'Эпический',color:'#c7a1ff'},legendary:{label:'Легендарный',color:'#ffd07b'}} as const;
