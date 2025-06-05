export default {
  title: "Staff of Whispers",
  order: 3,
  tags: ["weapon", "artifact", "necromancy"],
  icon: "🔮",
  
  text: {
    "Description": "An ancient staff carved from shadowwood, eternally cold to the touch. Spirits seem to swirl within its dark crystal head, their whispers barely audible to those who listen closely. The staff feeds on the essence of nearby souls, growing stronger in the presence of death.",
    
    "History": "Created during the Age of Silence by the necromancer Vess the Quiet, the Staff of Whispers was designed to communicate with and command the dead. It was lost for centuries in the Crypts of Eternal Silence before being recovered by Morrigan the Crow.",
    
    "Powers": "The staff allows its wielder to speak with spirits, command lesser undead, and channel necrotic energy. It enhances all necromantic spells and can store the essence of defeated enemies to power greater magical effects.",
    
    "Warning": "Extended use of the Staff of Whispers may cause the wielder to begin hearing the whispers of the dead even when not holding the staff. Some users have reported becoming obsessed with death magic after prolonged exposure."
  },
  
  md: true,
  
  rarity: "legendary",
  
  stats: {
    "damage": "1d8+3 necrotic",
    "type": "magical staff",
    "weight": "4 lbs",
    "properties": ["magical", "requires attunement by a spellcaster"]
  },
  
  craftable: true,
  craftingMaterials: [
    {
      item: "Shadowwood Branch",
      quantity: 1
    },
    {
      item: "Spirit Essence",
      quantity: 3
    },
    {
      item: "Dark Crystal",
      quantity: 1
    }
  ],
  
  links: [
    {
      to: "/characters/morrigan",
      label: "Morrigan the Crow",
      type: "current-wielder"
    },
    {
      to: "/abilities/soul_drain",
      label: "Soul Drain",
      type: "granted-ability"
    }
  ],
  
  images: [
    {
      src: "https://images.pexels.com/photos/5755161/pexels-photo-5755161.jpeg",
      alt: "Staff of Whispers",
      caption: "The Staff of Whispers with spirits visible in its crystal head"
    }
  ],
  
  meta: {
    created: "2025-01-12",
    updated: "2025-01-15",
  }
};