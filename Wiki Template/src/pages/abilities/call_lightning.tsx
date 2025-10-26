export default {
  title: "Call Lightning",
  order: 2,
  tags: ["spell", "weather magic", "damage"],
  icon: "⚡",
  
  text: {
    "Description": "A powerful weather manipulation spell that allows the caster to summon and direct lightning strikes. The air crackles with electrical energy as storm clouds gather overhead, responding to the caster's will.",
    
    "Casting": "Casting Time: 1 action\nRange: 120 feet\nComponents: Verbal, Somatic\nDuration: Concentration, up to 10 minutes",
    
    "Effects": "When cast, dark storm clouds form in a 60-foot radius centered on a point you choose within range. When you cast the spell, and as a bonus action on each of your turns until the spell ends, you can call down lightning in a 5-foot-radius, 40-foot-high cylinder centered on a point you choose beneath the cloud. Each creature in that area must make a Dexterity saving throw, taking 3d10 lightning damage on a failed save, or half as much damage on a successful one.",
    
    "Enhanced Casting": "When cast using the Staff of Tempests, the spell's damage increases to 4d10 and the radius of the lightning strike increases to 10 feet. Additionally, creatures that fail their saving throw are stunned until the end of their next turn."
  },
  
  md: true,
  
  damage: "3d10 lightning",
  manaCost: 45,
  cooldown: 0,
  range: "120 feet",
  
  upgrades: [
    {
      name: "Forked Lightning",
      description: "Can target two points with each lightning strike",
      level: 5
    },
    {
      name: "Thunderous Impact",
      description: "Lightning strikes create thunderous booms, dealing additional thunder damage",
      level: 10
    },
    {
      name: "Storm Master",
      description: "Can maintain the spell without concentration",
      level: 15
    }
  ],
  
  links: [
    {
      to: "/characters/lyra_stormborn",
      label: "Lyra Stormborn",
      type: "known-by"
    },
    {
      to: "/items/staff_of_tempests",
      label: "Staff of Tempests",
      type: "enhanced-by"
    }
  ],
  
  images: [
    {
      src: "https://images.pexels.com/photos/1162251/pexels-photo-1162251.jpeg",
      alt: "Lightning Strike",
      caption: "A powerful lightning strike called down during a battle"
    }
  ],
  
  meta: {
    created: "2025-01-05",
    updated: "2025-01-12",
  }
};