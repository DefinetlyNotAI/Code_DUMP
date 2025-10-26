export default {
  title: "Soul Drain",
  order: 3,
  tags: ["spell", "necromancy", "damage", "healing"],
  icon: "💀",
  
  text: {
    "Description": "A forbidden necromantic spell that drains the life force from a target, transferring it to the caster. The air grows cold around the target as tendrils of dark energy connect them to the caster.",
    
    "Casting": "Casting Time: 1 action\nRange: 30 feet\nComponents: Somatic\nDuration: Instantaneous",
    
    "Effects": "Target a creature within range. They must make a Constitution saving throw or take 3d6 necrotic damage, with the caster healing for half the damage dealt. On a successful save, the target takes half damage and the caster doesn't heal. Undead and constructs are immune to this spell.",
    
    "Enhanced Casting": "When cast using the Staff of Whispers, the spell's range increases to 60 feet and the caster heals for the full amount of damage dealt. Additionally, the caster gains temporary hit points equal to their spellcasting modifier."
  },
  
  md: true,
  
  damage: "3d6 necrotic",
  manaCost: 35,
  cooldown: 6,
  range: "30 feet",
  
  upgrades: [
    {
      name: "Improved Drain",
      description: "Increase damage to 4d6",
      level: 5
    },
    {
      name: "Mass Drain",
      description: "Can target up to 3 creatures",
      level: 10
    },
    {
      name: "Soul Rend",
      description: "Damaged targets cannot heal until the start of your next turn",
      level: 15
    }
  ],
  
  links: [
    {
      to: "/characters/morrigan",
      label: "Morrigan the Crow",
      type: "known-by"
    },
    {
      to: "/items/staff_of_whispers",
      label: "Staff of Whispers",
      type: "enhanced-by"
    }
  ],
  
  images: [
    {
      src: "https://images.pexels.com/photos/3214944/pexels-photo-3214944.jpeg",
      alt: "Soul Drain",
      caption: "The dark energies of Soul Drain being channeled"
    }
  ],
  
  meta: {
    created: "2025-01-15",
    updated: "2025-01-15",
  }
};