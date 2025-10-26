import { EnemyPage } from '../../types/WikiTypes';

const enemy: EnemyPage = {
  title: "Storm Titan",
  order: 1,
  tags: ["boss", "elemental", "titan"],
  icon: "🌩️",
  rating: 5, // Legendary enemy
  level: 80,
  type: "Elemental Titan",
  
  text: {
    "Description": "A colossal being of pure storm energy, the Storm Titan towers over the landscape at heights reaching 100 feet. Its body is formed from dark storm clouds, crackling with constant lightning, and its eyes glow with the intensity of a tempest.",
    
    "Behavior": "The Storm Titan is territorial and extremely aggressive, attacking anything that enters its domain with devastating lightning strikes and powerful wind attacks. It becomes more dangerous during natural storms, drawing power from the weather itself.",
    
    "Strategy": "The Storm Titan is vulnerable to earth-based magic and can be temporarily stunned by redirecting its own lightning attacks. Its movements can be predicted by watching the pattern of lightning within its body.",
    
    "Lore": "Ancient texts speak of the Storm Titans as children of the primordial storm that shaped the world. They serve as both guardians of nature's fury and harbingers of catastrophic weather events."
  },
  
  md: true,
  
  difficulty: {
    current: 80,
    levels: {
      20: {
        level: 20,
        stats: {
          health: 25000,
          attack: 250,
          defense: 200,
          lightning_resistance: 80,
          earth_weakness: 30,
          speed: 20
        },
        drops: [
          {
            item: "Storm Crystal",
            chance: 0.15,
            quantity: { min: 1, max: 2 }
          },
          {
            item: "Lightning Essence",
            chance: 0.3,
            quantity: { min: 1, max: 3 }
          }
        ],
        abilities: ["Chain Lightning", "Thunderclap"]
      },
      40: {
        level: 40,
        stats: {
          health: 50000,
          attack: 450,
          defense: 350,
          lightning_resistance: 90,
          earth_weakness: 35,
          speed: 25
        },
        drops: [
          {
            item: "Storm Crystal",
            chance: 0.2,
            quantity: { min: 2, max: 3 }
          },
          {
            item: "Lightning Essence",
            chance: 0.4,
            quantity: { min: 2, max: 4 }
          },
          {
            item: "Storm Titan's Scale",
            chance: 0.05,
            quantity: { min: 1, max: 1 }
          }
        ],
        abilities: ["Chain Lightning", "Thunderclap", "Storm Vortex"]
      },
      60: {
        level: 60,
        stats: {
          health: 75000,
          attack: 650,
          defense: 450,
          lightning_resistance: 95,
          earth_weakness: 40,
          speed: 30
        },
        drops: [
          {
            item: "Storm Crystal",
            chance: 0.25,
            quantity: { min: 2, max: 4 }
          },
          {
            item: "Lightning Essence",
            chance: 0.5,
            quantity: { min: 3, max: 5 }
          },
          {
            item: "Storm Titan's Scale",
            chance: 0.1,
            quantity: { min: 1, max: 2 }
          }
        ],
        abilities: ["Chain Lightning", "Thunderclap", "Storm Vortex", "Lightning Storm"]
      },
      80: {
        level: 80,
        stats: {
          health: 100000,
          attack: 850,
          defense: 600,
          lightning_resistance: 100,
          earth_weakness: 45,
          speed: 35
        },
        drops: [
          {
            item: "Storm Crystal",
            chance: 0.3,
            quantity: { min: 3, max: 5 }
          },
          {
            item: "Lightning Essence",
            chance: 0.6,
            quantity: { min: 4, max: 6 }
          },
          {
            item: "Storm Titan's Scale",
            chance: 0.15,
            quantity: { min: 1, max: 3 }
          },
          {
            item: "Storm Titan's Heart",
            chance: 0.01,
            quantity: { min: 1, max: 1 }
          }
        ],
        abilities: ["Chain Lightning", "Thunderclap", "Storm Vortex", "Lightning Storm", "Wind Wall"]
      },
      100: {
        level: 100,
        stats: {
          health: 150000,
          attack: 1200,
          defense: 800,
          lightning_resistance: 100,
          earth_weakness: 50,
          speed: 40
        },
        drops: [
          {
            item: "Storm Crystal",
            chance: 0.4,
            quantity: { min: 4, max: 6 }
          },
          {
            item: "Lightning Essence",
            chance: 0.7,
            quantity: { min: 5, max: 7 }
          },
          {
            item: "Storm Titan's Scale",
            chance: 0.2,
            quantity: { min: 2, max: 4 }
          },
          {
            item: "Storm Titan's Heart",
            chance: 0.05,
            quantity: { min: 1, max: 1 }
          },
          {
            item: "Essence of the Tempest",
            chance: 0.01,
            quantity: { min: 1, max: 1 }
          }
        ],
        abilities: ["Chain Lightning", "Thunderclap", "Storm Vortex", "Lightning Storm", "Wind Wall", "Tempest Form"]
      }
    }
  },
  
  weaknesses: [
    "Earth Magic",
    "Grounding Attacks",
    "Crystal Weapons"
  ],
  
  resistances: [
    "Lightning",
    "Wind",
    "Physical Attacks",
    "Cold"
  ],
  
  locations: [
    "Storm Peak",
    "Thunder Plains",
    "Tempest Islands"
  ],
  
  spawnConditions: [
    "Only appears during severe thunderstorms",
    "Requires level 35+ to encounter",
    "More likely to spawn after extended periods of stormy weather"
  ],
  
  links: [
    {
      to: "/locations/storm_peak",
      label: "Storm Peak",
      type: "spawn-location"
    },
    {
      to: "/items/storm_titans_heart",
      label: "Storm Titan's Heart",
      type: "drops"
    }
  ],
  
  images: [
    {
      src: "https://images.pexels.com/photos/2531709/pexels-photo-2531709.jpeg",
      alt: "Storm Titan",
      caption: "A Storm Titan manifesting during a thunderstorm"
    }
  ],
  
  meta: {
    created: "2025-01-15",
    updated: "2025-01-15",
    status: "wip"
  }
};

export default enemy;