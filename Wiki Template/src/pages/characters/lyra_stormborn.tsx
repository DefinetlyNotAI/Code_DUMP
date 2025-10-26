import { CharacterPage } from '../../types/WikiTypes';

const character: CharacterPage = {
  title: "Lyra Stormborn",
  order: 2,
  tags: ["human", "wizard", "hero", "council member"],
  icon: "✨",
  rating: 5, // Legendary character

  text: {
    Biography: "Lyra Stormborn was born during the Great Tempest of 1192, a magical storm that only occurs once every century. The daughter of simple farmers from the coastal village of Saltwhisper, her natural affinity for elemental magic manifested early when she calmed a sudden squall threatening the fishing fleet at the age of six.",
    
    Appearance: "Lyra stands at average height with a slender build. Her most striking feature is her silver-white hair—a mark of those touched by the Great Tempest—which she typically wears in a practical braid. Her eyes shift color with her mood, from deep blue when calm to storm-gray when casting powerful spells.",
    
    Personality: "Despite her power and position, Lyra remains humble and approachable, never forgetting her simple origins. She is methodical and thoughtful in her approach to problems, preferring to find peaceful solutions when possible.",
    
    Quotes: "> \"Power isn't measured by the storms you can summon, but by the calm you can maintain when the winds rage against you.\"\n\n> \"I may serve in the towers of the mighty, but my heart remains in the fields of the humble.\""
  },

  md: true,

  stats: {
    strength: 10,
    dexterity: 14,
    constitution: 12,
    intelligence: 18,
    wisdom: 16,
    charisma: 15
  },

  ascension: {
    current: 20,
    levels: {
      20: {
        level: 20,
        experience: 10000,
        gold: 5000,
        items: [
          { name: "Storm Crystal", quantity: 2 },
          { name: "Mage's Tome", quantity: 1 }
        ],
        stats: {
          intelligence: 20,
          wisdom: 18,
          mana: 150
        },
        abilities: ["Wind Shield", "Lightning Bolt"]
      },
      40: {
        level: 40,
        experience: 50000,
        gold: 15000,
        items: [
          { name: "Greater Storm Crystal", quantity: 3 },
          { name: "Tempest Core", quantity: 1 }
        ],
        stats: {
          intelligence: 25,
          wisdom: 22,
          mana: 250
        },
        abilities: ["Chain Lightning", "Storm Walk"]
      },
      60: {
        level: 60,
        experience: 150000,
        gold: 35000,
        items: [
          { name: "Perfect Storm Crystal", quantity: 5 },
          { name: "Heart of the Tempest", quantity: 1 }
        ],
        stats: {
          intelligence: 30,
          wisdom: 26,
          mana: 400
        },
        abilities: ["Thunderstorm", "Eye of the Storm"]
      },
      80: {
        level: 80,
        experience: 400000,
        gold: 75000,
        items: [
          { name: "Storm Lord's Crystal", quantity: 7 },
          { name: "Crown of Thunder", quantity: 1 }
        ],
        stats: {
          intelligence: 35,
          wisdom: 30,
          mana: 600
        },
        abilities: ["Hurricane", "Storm Lord's Wrath"]
      },
      100: {
        level: 100,
        experience: 1000000,
        gold: 150000,
        items: [
          { name: "Primordial Storm Crystal", quantity: 10 },
          { name: "Essence of the Great Tempest", quantity: 1 }
        ],
        stats: {
          intelligence: 40,
          wisdom: 35,
          mana: 1000
        },
        abilities: ["Great Tempest", "Storm Ascension"]
      }
    }
  },

  affiliations: [
    "Royal Council of Mages",
    "Academy of Arcane Arts",
    "Saltwhisper Village"
  ],

  relationships: [
    {
      character: "King Aldric IV",
      relationship: "Advisor"
    },
    {
      character: "Morrigan the Crow",
      relationship: "Rival"
    }
  ],

  links: [
    {
      to: "/locations/academy_of_arcane_arts",
      label: "Academy of Arcane Arts",
      type: "related-location"
    },
    {
      to: "/items/staff_of_tempests",
      label: "Staff of Tempests",
      type: "related-item"
    }
  ],

  images: [
    {
      src: "https://images.pexels.com/photos/6942348/pexels-photo-6942348.jpeg",
      alt: "Lyra Stormborn",
      caption: "Lyra channeling elemental magic during the Battle of Westford"
    }
  ],

  meta: {
    created: "2025-01-05",
    updated: "2025-01-15",
  }
};

export default character;